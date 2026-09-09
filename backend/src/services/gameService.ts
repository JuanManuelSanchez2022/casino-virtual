import prisma from '../config/database';
import { SlotsEngine } from '../games/slots/slots.engine';
import { SLOT_CONFIG } from '../games/slots/slots.paytable';
import { SpinResult } from '../types';

export const getGames = async () => {
  return prisma.game.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      type: true,
    },
  });
};

export const getGameBySlug = async (slug: string) => {
  return prisma.game.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      type: true,
      config: true,
    },
  });
};

export const createGameSession = async (userId: string, gameId: string) => {
  const session = await prisma.gameSession.create({
    data: { userId, gameId },
  });
  return session;
};

export const endGameSession = async (sessionId: string) => {
  return prisma.gameSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });
};

export const spinSlots = async (userId: string, bet: number): Promise<SpinResult> => {
  if (bet <= 0) {
    throw new Error('La apuesta debe ser mayor a 0.');
  }

  const game = await prisma.game.findUnique({
    where: { slug: 'slots' },
  });

  if (!game || !game.isActive) {
    throw new Error('Juego no disponible.');
  }

  let session = await prisma.gameSession.findFirst({
    where: { userId, gameId: game.id, endedAt: null },
    orderBy: { startedAt: 'desc' },
  });

  if (!session) {
    session = await createGameSession(userId, game.id);
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error('Billetera no encontrada.');
  }

  if (wallet.balance < bet) {
    throw new Error('Saldo insuficiente.');
  }

  const engine = new SlotsEngine(SLOT_CONFIG);
  const { symbols, winningLines, totalWin } = engine.spin(bet);

  const spinRecord = await prisma.$transaction(async (tx) => {
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
        win: totalWin,
        symbols,
        winningLines,
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
        description: `Apuesta en slots`,
      },
    });

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
          description: `Premio en slots`,
        },
      });

      finalBalance = winWallet.balance;

      await tx.gameSession.update({
        where: { id: session!.id },
        data: {
          totalBet: { increment: bet },
          totalWin: { increment: totalWin },
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
    spinId: spinRecord.spin.id,
    symbols,
    bet,
    win: totalWin,
    balance: spinRecord.finalBalance,
    winningLines,
  };
};

export const getTransactionHistory = async (userId: string, page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getGameHistory = async (userId: string, page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [spins, total] = await Promise.all([
    prisma.spin.findMany({
      where: { userId },
      include: { gameSession: { include: { game: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.spin.count({ where: { userId } }),
  ]);

  return {
    spins: spins.map(s => ({
      id: s.id,
      gameName: s.gameSession.game.name,
      bet: s.bet,
      win: s.win,
      createdAt: s.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
