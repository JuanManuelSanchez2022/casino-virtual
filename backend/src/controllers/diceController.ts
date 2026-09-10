import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { playDice } from '../services/diceService';

export const play = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const { bet, choice } = req.body;

    if (bet === undefined || bet === null) {
      res.status(400).json({ error: 'La apuesta es obligatoria.' });
      return;
    }

    if (!choice || typeof choice !== 'string') {
      res.status(400).json({ error: 'La selección es obligatoria.' });
      return;
    }

    const result = await playDice(req.userId, bet, choice as any);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};