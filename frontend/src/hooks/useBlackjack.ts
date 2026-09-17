import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { BlackjackGameState, BlackjackGameStateResponse } from '../types/blackjack';

export function useBlackjack() {
  const [gameState, setGameState] = useState<BlackjackGameStateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const start = useCallback(async (bet: number) => {
    setLoading(true);
    setError('');

    try {
      const result = await api.post<{
        gameId: string;
        playerCards: any[];
        dealerCards: any[];
        playerValue: number;
        dealerVisibleValue: number;
        state: BlackjackGameState;
        bet: number;
        balance: number;
      }>('/games/blackjack/start', { bet });

      setGameState({
        gameId: result.gameId,
        playerCards: result.playerCards,
        dealerCards: result.dealerCards,
        playerValue: result.playerValue,
        dealerVisibleValue: result.dealerVisibleValue,
        state: result.state,
        bet: result.bet,
        balance: result.balance,
      });

      return result;
    } catch (e: any) {
      setError(e?.message || 'No se pudo iniciar la partida.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const hit = useCallback(async () => {
    if (!gameState) return;

    setLoading(true);
    setError('');

    try {
      const result = await api.post<{
        gameId: string;
        playerCards: any[];
        dealerCards: any[];
        playerValue: number;
        dealerVisibleValue: number;
        state: string;
        bet: number;
        balance: number;
      }>(`/games/blackjack/${gameState.gameId}/hit`, {});

      setGameState(prev => prev ? {
        ...prev,
        playerCards: result.playerCards,
        dealerCards: result.dealerCards,
        playerValue: result.playerValue,
        dealerVisibleValue: result.dealerVisibleValue,
        state: result.state as BlackjackGameState,
        balance: result.balance,
      } : null);

      return result;
    } catch (e: any) {
      setError(e?.message || 'No se pudo pedir carta.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [gameState]);

  const stand = useCallback(async () => {
    if (!gameState) return;

    setLoading(true);
    setError('');

    try {
      const result = await api.post<{
        gameId: string;
        playerCards: any[];
        dealerCards: any[];
        playerValue: number;
        dealerValue: number;
        state: string;
        result?: string;
        payout?: number;
        balance: number;
      }>(`/games/blackjack/${gameState.gameId}/stand`, {});

      setGameState({
        gameId: result.gameId,
        playerCards: result.playerCards,
        dealerCards: result.dealerCards,
        playerValue: result.playerValue,
        dealerValue: result.dealerValue,
        state: result.state as BlackjackGameState,
        bet: gameState.bet,
        balance: result.balance,
        result: result.result as any,
        payout: result.payout,
      });

      return result;
    } catch (e: any) {
      setError(e?.message || 'No se pudo plantar.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [gameState]);

  const fetchState = useCallback(async (gameId: string) => {
    setLoading(true);
    setError('');

    try {
      const result = await api.get<{
        gameId: string;
        playerCards: any[];
        dealerCards: any[];
        playerValue: number;
        dealerVisibleValue?: number;
        dealerValue?: number;
        state: string;
        bet: number;
        balance: number;
        result?: string;
        payout?: number;
      }>(`/games/blackjack/${gameId}`);

      setGameState({
        gameId: result.gameId,
        playerCards: result.playerCards,
        dealerCards: result.dealerCards,
        playerValue: result.playerValue,
        dealerVisibleValue: result.dealerVisibleValue,
        dealerValue: result.dealerValue,
        state: result.state as BlackjackGameState,
        bet: result.bet,
        balance: result.balance,
        result: result.result as any,
        payout: result.payout,
      });

      return result;
    } catch (e: any) {
      setError(e?.message || 'No se pudo obtener el estado de la partida.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const reset = useCallback(() => {
    setGameState(null);
    setError('');
  }, []);

  const canHit = gameState?.state === 'PLAYER_TURN' && !loading;
  const canStand = gameState?.state === 'PLAYER_TURN' && !loading;
  const isFinished = gameState?.state === 'FINISHED';
  const isPlayerTurn = gameState?.state === 'PLAYER_TURN';
  const isDealerTurn = gameState?.state === 'DEALER_TURN';

  return {
    gameState,
    loading,
    error,
    start,
    hit,
    stand,
    fetchState,
    clearError,
    reset,
    canHit,
    canStand,
    isFinished,
    isPlayerTurn,
    isDealerTurn,
  };
}