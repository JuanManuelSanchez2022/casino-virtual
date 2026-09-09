import prisma from '../config/database';

export const getTransactions = async (userId: string, page: number, limit: number) => {
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
