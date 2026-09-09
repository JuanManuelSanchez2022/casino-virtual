import { useState, useCallback } from 'react';
import { api } from '../services/api';

export interface RouletteBet {
  type: string;
  value?: number;
  amount: number;
}

export interface RouletteResult {
  number: number;
  color: 'RED' | 'BLACK' | 'GREEN';
  parity: 'EVEN' | 'ODD' | 'NONE';
  range: 'LOW' | 'HIGH' | 'NONE';
  dozen: 1 | 2 | 3 | null;
  column: 1 | 2 | 3 | null;
}

export interface RoulettePlayResult {
  result: RouletteResult;
  bet: RouletteBet;
  multiplier: number;
  win: number;
  balance: number;
  spinId: string;
}

export function useRoulette() {
  const [playing, setPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<RoulettePlayResult | null>(null);

  const play = useCallback(
    async (bet: RouletteBet) => {
      setPlaying(true);
      setLastResult(null);

      try {
        const result = await api.post<RoulettePlayResult>(
          '/games/roulette/play',
          bet
        );
        setLastResult(result);
        return result;
      } finally {
        setPlaying(false);
      }
    },
    []
  );

  return { playing, lastResult, play };
}