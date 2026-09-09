import prisma from '../config/database';

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      createdAt: true,
      wallet: true,
    },
  });

  if (!user) {
    throw new Error('Usuario no encontrado.');
  }

  return user;
};

export const updateProfile = async (userId: string, fullName?: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { fullName },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      createdAt: true,
    },
  });
};
