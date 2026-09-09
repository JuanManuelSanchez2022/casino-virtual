import prisma from '../config/database';
import { DiceEngine } from '../games/dice/dice.engine';
import { DICE_CONFIG } from '../games/dice/dice.config';
import { DiceChoice, DicePlayResult, DiceRoll } from '../games/dice/dice.types';

const VALID_CHOICES: DiceChoice[] = ['LOW', 'SEVEN', 'HIGH'];

export const playDice = async (
  userId: string,
  bet: number,
  choice: DiceChoice
): Promise<DicePlayResult> => {
  if (!VALID_CHOICES.includes(choice)) {
    throw new Error('Selección inválida. Usá LOW, SEVEN o HIGH.');
  }

  if (!Number.isInteger(bet) || bet <= 0) {
    throw new Error('La apuesta debe ser un número entero mayor a 0.');
  }

  if (bet < DICE_CONFIG.minBet || bet > DICE_CONFIG.maxBet) {
    throw new Error(
      `La apuesta debe estar entre ${DICE_CONFIG.minBet} y ${DICE_CONFIG.maxBet}.`
    );
  }

  const game = await prisma.game.findUnique({
    where: { slug: 'dice' },
  });

  if (!game || !game.isActive) {
    throw new Error('Juego no disponible.');
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error('Billetera no encontrada.');
  }

  if (wallet.balance < bet) {
    throw new Error('Saldo insuficiente.');
  }

  const engine = new DiceEngine(DICE_CONFIG);
  const roll = engine.roll();
  const multiplier = engine.getMultiplier(choice, roll.result);
  const win = multiplier > 0 ? bet * multiplier : 0;

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
        balance: { decrement: bet },
        totalLost: { increment: bet },
      },
    });

    const spin = await tx.spin.create({
      data: {
        sessionId: session!.id,
        userId,
        gameId: game.id,
        bet,
        win,
        symbols: [roll.die1, roll.die2],
        winningLines: {
          choice,
          result: roll.result,
          total: roll.total,
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
        amount: -bet,
        balanceBefore: wallet.balance,
        balanceAfter: updatedWallet.balance,
        gameId: game.id,
        spinId: spin.id,
        description: 'Apuesta en dados',
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
          description: 'Premio en dados',
        },
      });

      finalBalance = winWallet.balance;

      await tx.gameSession.update({
        where: { id: session!.id },
        data: {
          totalBet: { increment: bet },
          totalWin: { increment: win },
        },
      });
    } else {
      await tx.gameSession.update({
        where: { id: session!.id },
        data: {
          totalBet: { increment: bet },
        },
      });
    }

    return { spin, finalBalance };
  });

  return {
    dice: {
      die1: roll.die1,
      die2: roll.die2,
      total: roll.total,
      result: roll.result,
    },
    choice,
    bet,
    multiplier,
    win,
    balance: record.finalBalance,
    spinId: record.spin.id,
  };
};