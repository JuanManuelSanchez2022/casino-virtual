import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getWallet as getWalletService,
  virtualTopup as virtualTopupService,
} from '../services/walletService';

export const getWallet = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const wallet = await getWalletService(req.userId);

    res.status(200).json({ wallet });
  } catch (error: any) {
    console.error('GET WALLET ERROR:', error);

    res.status(400).json({
      error: error.message || 'Error al obtener la billetera.',
    });
  }
};

export const addVirtualCredits = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Monto inválido.' });
      return;
    }

    const wallet = await virtualTopupService(req.userId, amount);

    res.status(200).json({
      message: 'Créditos virtuales agregados exitosamente.',
      wallet,
    });
  } catch (error: any) {
    console.error('VIRTUAL TOPUP ERROR:', error);

    res.status(400).json({
      error: error.message || 'Error al agregar créditos.',
    });
  }
};
