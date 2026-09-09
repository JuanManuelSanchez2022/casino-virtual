import { useState, useCallback } from 'react';
import { api } from '../services/api';

export interface DicePlayResult {
  dice: {
    die1: number;
    die2: number;
    total: number;
    result: 'LOW' | 'SEVEN' | 'HIGH';
  };
  choice: 'LOW' | 'SEVEN' | 'HIGH';
  bet: number;
  multiplier: number;
  win: number;
  balance: number;
  spinId: string;
}

export function useDice() {
  const [playing, setPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<DicePlayResult | null>(null);

  const play = useCallback(
    async (bet: number, choice: 'LOW' | 'SEVEN' | 'HIGH') => {
      setPlaying(true);
      setLastResult(null);

      try {
        const result = await api.post<DicePlayResult>(
          '/games/dice/play',
          { bet, choice }
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