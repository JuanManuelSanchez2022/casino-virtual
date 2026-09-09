import bcrypt from 'bcrypt';
import { generateToken } from '../config/auth';
import prisma from '../config/database';

export const register = async (
  email: string,
  username: string,
  password: string,
  fullName: string | undefined,
  phone: string
) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    throw new Error('El email o username ya está registrado.');
  }

  if (!phone || !phone.trim()) {
    throw new Error('El número de teléfono es obligatorio.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const initialBonus = parseInt(
    process.env.INITIAL_BONUS_CREDITS || '10000',
    10
  );

  const result = await prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: {
        email,
        username,
        passwordHash,
        fullName,
        phone: phone.trim(),
      },
    });

    const wallet = await tx.wallet.create({
      data: {
        userId: user.id,
        balance: initialBonus,
        totalDeposited: initialBonus,
      },
    });

    await tx.transaction.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        type: 'INITIAL_BONUS',
        amount: initialBonus,
        balanceBefore: 0,
        balanceAfter: initialBonus,
        description: 'Bono de créditos virtuales inicial',
      },
    });

    return { user, wallet };
  });

  const token = generateToken(result.user.id);

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      username: result.user.username,
      fullName: result.user.fullName,
      phone: result.user.phone,
    },
    token,
  };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Credenciales inválidas.');
  }

  const isValidPassword = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isValidPassword) {
    throw new Error('Credenciales inválidas.');
  }

  const token = generateToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
    },
    token,
  };
};
