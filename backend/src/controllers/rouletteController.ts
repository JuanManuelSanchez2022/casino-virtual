import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { playRoulette } from '../services/rouletteService';

export const play = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const { type, value, amount } = req.body;

    if (!type) {
      res.status(400).json({ error: 'El tipo de apuesta es obligatorio.' });
      return;
    }

    if (amount === undefined || amount === null) {
      res.status(400).json({ error: 'El monto de la apuesta es obligatorio.' });
      return;
    }

    const result = await playRoulette(req.userId, { type, value, amount });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};