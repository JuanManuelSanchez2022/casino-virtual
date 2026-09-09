import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getTransactions } from '../services/transactionService';

export const listTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const transactions = await getTransactions(req.userId, page, limit);
    res.status(200).json(transactions);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
