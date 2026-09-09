import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getGames, getGameBySlug, spinSlots, getGameHistory } from '../services/gameService';

export const listGames = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const games = await getGames();
    res.status(200).json({ games });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const game = await getGameBySlug(slug);

    if (!game) {
      res.status(404).json({ error: 'Juego no encontrado.' });
      return;
    }

    res.status(200).json({ game });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const spin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const { bet } = req.body;

    if (!bet || bet <= 0) {
      res.status(400).json({ error: 'Apuesta inválida.' });
      return;
    }

    const result = await spinSlots(req.userId, bet);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const history = await getGameHistory(req.userId, page, limit);
    res.status(200).json(history);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
