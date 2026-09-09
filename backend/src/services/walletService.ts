import prisma from '../config/database';
import { TransactionType } from '../types';

export const getWallet = async (userId: string) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    throw new Error('Billetera no encontrada.');
  }

  return wallet;
};

export const virtualTopup = async (userId: string, amount: number) => {
  if (amount <= 0) {
    throw new Error('El monto debe ser mayor a 0.');
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error('Billetera no encontrada.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        totalDeposited: { increment: amount },
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        walletId: updatedWallet.id,
        type: 'VIRTUAL_TOPUP',
        amount,
        balanceBefore: wallet.balance,
        balanceAfter: updatedWallet.balance,
        description: 'Créditos virtuales agregados',
      },
    });

    return updatedWallet;
  });

  return result;
};

export const deductBet = async (userId: string, bet: number, gameId: string, sessionId: string, spinId: string) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error('Billetera no encontrada.');
  }

  if (wallet.balance < bet) {
    throw new Error('Saldo insuficiente.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        balance: { decrement: bet },
        totalLost: { increment: bet },
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
        gameId,
        spinId,
        description: `Apuesta en slots`,
      },
    });

    return updatedWallet;
  });

  return result;
};

export const addWin = async (userId: string, win: number, gameId: string, sessionId: string, spinId: string, balanceBefore: number) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new Error('Billetera no encontrada.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        balance: { increment: win },
        totalWon: { increment: win },
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        walletId: updatedWallet.id,
        type: 'WIN',
        amount: win,
        balanceBefore: balanceBefore,
        balanceAfter: updatedWallet.balance,
        gameId,
        spinId,
        description: `Premio en slots`,
      },
    });

    return updatedWallet;
  });

  return result;
};
