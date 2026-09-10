import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { playRoulette } from '../services/rouletteService';
import { RouletteBet } from '../games/roulette/roulette.types';

export const play = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const { bets } = req.body as { bets: RouletteBet[] };

    if (!Array.isArray(bets) || bets.length === 0) {
      res.status(400).json({ error: 'Debe enviar al menos una apuesta (array "bets").' });
      return;
    }

    const result = await playRoulette(req.userId, bets);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
