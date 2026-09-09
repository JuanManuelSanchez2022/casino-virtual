import prisma from '../config/database';
import { RouletteEngine } from '../games/roulette/roulette.engine';
import { ROULETTE_CONFIG } from '../games/roulette/roulette.config';
import { RouletteBet, RouletteBetType, RoulettePlayResult } from '../games/roulette/roulette.types';

const VALID_BET_TYPES: RouletteBetType[] = [
  'NUMBER', 'RED', 'BLACK', 'EVEN', 'ODD',
  'LOW', 'HIGH',
  'DOZEN_1', 'DOZEN_2', 'DOZEN_3',
  'COLUMN_1', 'COLUMN_2', 'COLUMN_3',
];

export const playRoulette = async (
  userId: string,
  bet: RouletteBet
): Promise<RoulettePlayResult> => {
  if (!VALID_BET_TYPES.includes(bet.type)) {
    throw new Error('Tipo de apuesta inválido.');
  }

  if (bet.type === 'NUMBER') {
    if (bet.value === undefined || !Number.isInteger(bet.value) || bet.value < 0 || bet.value > 36) {
      throw new Error('El número debe estar entre 0 y 36.');
    }
  }

  if (!Number.isInteger(bet.amount) || bet.amount <= 0) {
    throw new Error('La apuesta debe ser un número entero mayor a 0.');
  }

  if (bet.amount < ROULETTE_CONFIG.minBet || bet.amount > ROULETTE_CONFIG.maxBet) {
    throw new Error(
      `La apuesta debe estar entre ${ROULETTE_CONFIG.minBet} y ${ROULETTE_CONFIG.maxBet}.`
    );
  }

  const game = await prisma.game.findUnique({
    where: { slug: 'roulette' },
  });

  if (!game || !game.isActive) {
    throw new Error('Juego no disponible.');
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error('Billetera no encontrada.');
  }

  if (wallet.balance < bet.amount) {
    throw new Error('Saldo insuficiente.');
  }

  const engine = new RouletteEngine(ROULETTE_CONFIG);
  const result = engine.spin();
  const multiplier = engine.evaluateBet(bet.type, bet.value, result);
  const win = multiplier > 0 ? bet.amount * multiplier : 0;

  let session = await prisma.gameSession.findFirst({
    where: { userId, gameId: game.id, endedAt: null },
    orderBy: { startedAt: 'desc' },
  });

  if (!session) {
    session = await prisma.gameSession.create({
      data: { userId, gameId: game.id },
    });
  }

  const record = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: bet.amount },
        totalLost: { increment: bet.amount },
      },
    });

    const spin = await tx.spin.create({
      data: {
        sessionId: session!.id,
        userId,
        gameId: game.id,
        bet: bet.amount,
        win,
        symbols: [result.number],
        winningLines: {
          betType: bet.type,
          betValue: bet.value ?? null,
          result,
          multiplier,
        },
        paytableVersion: engine.getPaytableVersion(),
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        walletId: updatedWallet.id,
        type: 'BET',
        amount: -bet.amount,
        balanceBefore: wallet.balance,
        balanceAfter: updatedWallet.balance,
        gameId: game.id,
        spinId: spin.id,
        description: `Apuesta en ruleta`,
      },
    });

    let finalBalance = updatedWallet.balance;

    if (win > 0) {
      const winWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: { increment: win },
          totalWon: { increment: win },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          walletId: winWallet.id,
          type: 'WIN',
          amount: win,
          balanceBefore: finalBalance,
          balanceAfter: winWallet.balance,
          gameId: game.id,
          spinId: spin.id,
          description: `Premio en ruleta`,
        },
      });

      finalBalance = winWallet.balance;

      await tx.gameSession.update({
        where: { id: session!.id },
        data: {
          totalBet: { increment: bet.amount },
          totalWin: { increment: win },
        },
      });
    } else {
      await tx.gameSession.update({
        where: { id: session!.id },
        data: {
          totalBet: { increment: bet.amount },
        },
      });
    }

    return { spin, finalBalance };
  });

  return {
    result,
    bet,
    multiplier,
    win,
    balance: record.finalBalance,
    spinId: record.spin.id,
  };
};