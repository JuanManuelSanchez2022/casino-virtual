import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  startBlackjack,
  hitBlackjack,
  standBlackjack,
  getBlackjackState,
} from '../games/blackjack/blackjack.service';
import { BlackjackBet } from '../games/blackjack/blackjack.types';

export const start = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const bet = req.body?.amount;

    if (bet === undefined || bet === null || !Number.isInteger(bet) || bet <= 0) {
      res.status(400).json({ error: 'La apuesta debe ser un número entero mayor a 0.' });
      return;
    }

    const result = await startBlackjack(req.userId, { amount: bet });
    res.status(200).json({
      gameId: result.gameId,
      playerCards: result.playerCards,
      dealerCards: result.dealerCards,
      playerValue: result.playerValue,
      dealerVisibleValue: result.dealerVisibleValue,
      state: result.state,
      bet: result.bet,
      balance: result.balance,
      result: result.result,
      payout: result.payout,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const hit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID de partida requerido.' });
      return;
    }

    const result = await hitBlackjack(req.userId, id);
    res.status(200).json({
      gameId: result.gameId,
      playerCards: result.playerCards,
      dealerCards: result.dealerCards,
      playerValue: result.playerValue,
      dealerVisibleValue: result.dealerVisibleValue,
      dealerValue: result.dealerValue,
      state: result.state,
      bet: result.bet,
      balance: result.balance,
      result: result.result,
      payout: result.payout,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const stand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID de partida requerido.' });
      return;
    }

    const result = await standBlackjack(req.userId, id);
    res.status(200).json({
      gameId: result.gameId,
      playerCards: result.playerCards,
      dealerCards: result.dealerCards,
      playerValue: result.playerValue,
      dealerValue: result.dealerValue,
      state: result.state,
      result: result.result,
      payout: result.payout,
      balance: result.balance,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getState = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'No autorizado.' });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'ID de partida requerido.' });
      return;
    }

    const result = await getBlackjackState(req.userId, id);
    res.status(200).json({
      gameId: result.gameId,
      playerCards: result.playerCards,
      dealerCards: result.dealerCards,
      playerValue: result.playerValue,
      dealerVisibleValue: result.dealerVisibleValue,
      dealerValue: result.dealerValue,
      state: result.state,
      bet: result.bet,
      balance: result.balance,
      result: result.result,
      payout: result.payout,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};