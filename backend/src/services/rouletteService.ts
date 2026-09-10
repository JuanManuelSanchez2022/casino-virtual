import prisma from '../config/database';
import { RouletteEngine } from '../games/roulette/roulette.engine';
import { ROULETTE_CONFIG } from '../games/roulette/roulette.config';
import { RouletteBet, RouletteBetResult, RouletteRoundResult } from '../games/roulette/roulette.types';

const VALID_BET_TYPES = [
  'NUMBER', 'RED', 'BLACK', 'EVEN', 'ODD',
  'LOW', 'HIGH',
  'DOZEN_1', 'DOZEN_2', 'DOZEN_3',
  'COLUMN_1', 'COLUMN_2', 'COLUMN_3',
];

const validateBet = (bet: RouletteBet): void => {
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
};

export const playRoulette = async (
  userId: string,
  bets: RouletteBet[]
): Promise<RouletteRoundResult> => {
  if (!Array.isArray(bets) || bets.length === 0) {
    throw new Error('Debe enviar al menos una apuesta.');
  }

  for (const bet of bets) {
    validateBet(bet);
  }

  const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);

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

  if (wallet.balance < totalBet) {
    throw new Error('Saldo insuficiente.');
  }

  const engine = new RouletteEngine(ROULETTE_CONFIG);
  const result = engine.spin();

  const betResults: RouletteBetResult[] = bets.map((bet) => {
    const multiplier = engine.evaluateBet(bet.type, bet.value, result);
    const win = multiplier > 0 ? bet.amount * multiplier : 0;
    return {
      type: bet.type,
      value: bet.value,
      amount: bet.amount,
      multiplier,
      win,
      won: win > 0,
    };
  });

  const totalWin = betResults.reduce((sum, b) => sum + b.win, 0);

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
        balance: { decrement: totalBet },
        totalLost: { increment: totalBet },
      },
    });

    const betTransactions = await Promise.all(
      bets.map((bet) =>
        tx.transaction.create({
          data: {
            userId,
            walletId: updatedWallet.id,
            type: 'BET',
            amount: -bet.amount,
            balanceBefore: wallet.balance,
            balanceAfter: updatedWallet.balance,
            gameId: game.id,
            description: `Apuesta en ruleta (${bet.type}${bet.value !== undefined ? ` ${bet.value}` : ''})`,
          },
        })
      )
    );

    const winningLines = betResults.map((br) => ({
      type: br.type,
      value: br.value ?? null,
      amount: br.amount,
      multiplier: br.multiplier,
      win: br.win,
      won: br.won,
    }));

    const spin = await tx.spin.create({
      data: {
        sessionId: session!.id,
        userId,
        gameId: game.id,
        bet: totalBet,
        win: totalWin,
        symbols: [result.number],
        winningLines: {
          result: {
            number: result.number,
            color: result.color,
            parity: result.parity,
            range: result.range,
            dozen: result.dozen,
            column: result.column,
          },
          bets: winningLines,
        },
        paytableVersion: engine.getPaytableVersion(),
      },
    });

    await Promise.all(
      betTransactions.map((t) =>
        tx.transaction.update({
          where: { id: t.id },
          data: { spinId: spin.id },
        })
      )
    );

    let finalBalance = updatedWallet.balance;

    if (totalWin > 0) {
      const winWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: { increment: totalWin },
          totalWon: { increment: totalWin },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          walletId: winWallet.id,
          type: 'WIN',
          amount: totalWin,
          balanceBefore: finalBalance,
          balanceAfter: winWallet.balance,
          gameId: game.id,
          spinId: spin.id,
          description: 'Premio en ruleta',
        },
      });

      finalBalance = winWallet.balance;

      await tx.gameSession.update({
        where: { id: session!.id },
        data: {
          totalBet: { increment: totalBet },
          totalWin: { increment: totalWin },
        },
      });
    } else {
      await tx.gameSession.update({
        where: { id: session!.id },
        data: {
          totalBet: { increment: totalBet },
        },
      });
    }

    return { spin, finalBalance };
  });

  return {
    result,
    bets: betResults,
    totalBet,
    totalWin,
    netResult: totalWin - totalBet,
    balance: record.finalBalance,
    spinId: record.spin.id,
  };
};
