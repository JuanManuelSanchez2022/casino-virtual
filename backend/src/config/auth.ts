import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret, { expiresIn });
};

export const verifyToken = (token: string): { userId: string } | null => {

  try {

    const secret = process.env.JWT_SECRET || 'fallback_secret';

    return jwt.verify(token, secret) as { userId: string };

  } catch (error) {

    console.error('JWT VERIFY ERROR:', error);

    return null;

  }

};
