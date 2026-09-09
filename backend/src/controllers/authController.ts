import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  register as registerService,
  login as loginService,
} from '../services/authService';

export const register = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      username,
      password,
      fullName,
      phone,
    } = req.body;

    if (!email || !username || !password || !phone) {
      res.status(400).json({
        error: 'Email, username, password y teléfono son requeridos.',
      });
      return;
    }

    const result = await registerService(
      email,
      username,
      password,
      fullName,
      phone
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const login = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: 'Email y password son requeridos.',
      });
      return;
    }

    const result = await loginService(email, password);

    res.status(200).json({
      message: 'Login exitoso.',
      user: result.user,
      token: result.token,
    });
  } catch (error: any) {
    res.status(401).json({
      error: error.message,
    });
  }
};
