import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/auth';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {

  const authHeader = req.headers.authorization;

  console.log(
    'AUTH HEADER:',
    authHeader ? 'Bearer recibido' : 'NO RECIBIDO'
  );

  if (!authHeader || !authHeader.startsWith('Bearer ')) {

    res.status(401).json({ error: 'No autorizado. Token no proporcionado.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  const payload = verifyToken(token);

  if (!payload) {

    res.status(401).json({ error: 'Token inválido o expirado.' });
    return;
  }

  req.userId = payload.userId;

  next();
};
