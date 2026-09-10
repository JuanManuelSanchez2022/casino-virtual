import { useState, useCallback } from 'react';
import { api } from '../services/api';

export type RouletteBetType =
  | 'NUMBER'
  | 'RED'
  | 'BLACK'
  | 'EVEN'
  | 'ODD'
  | 'LOW'
  | 'HIGH'
  | 'DOZEN_1'
  | 'DOZEN_2'
  | 'DOZEN_3'
  | 'COLUMN_1'
  | 'COLUMN_2'
  | 'COLUMN_3';

export type RouletteColor = 'RED' | 'BLACK' | 'GREEN';

export interface RouletteBet {
  type: RouletteBetType;
  value?: number;
  amount: number;
}

export interface RouletteResult {
  number: number;
  color: RouletteColor;
  parity: 'EVEN' | 'ODD' | 'NONE';
  range: 'LOW' | 'HIGH' | 'NONE';
  dozen: 1 | 2 | 3 | null;
  column: 1 | 2 | 3 | null;
}

export interface RouletteBetResult {
  type: RouletteBetType;
  value?: number;
  amount: number;
  multiplier: number;
  win: number;
  won: boolean;
}

export interface RouletteRoundResult {
  result: RouletteResult;
  bets: RouletteBetResult[];
  totalBet: number;
  totalWin: number;
  netResult: number;
  balance: number;
  spinId: string;
}

export function useRoulette() {
  const [playing, setPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<RouletteRoundResult | null>(null);

  const play = useCallback(
    async (bets: RouletteBet[]) => {
      setPlaying(true);
      setLastResult(null);

      try {
        const result = await api.post<RouletteRoundResult>(
          '/games/roulette/play',
          { bets }
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
