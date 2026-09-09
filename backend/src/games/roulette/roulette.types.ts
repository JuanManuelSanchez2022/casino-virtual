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

export interface RouletteResult {
  number: number;
  color: RouletteColor;
  parity: 'EVEN' | 'ODD' | 'NONE';
  range: 'LOW' | 'HIGH' | 'NONE';
  dozen: 1 | 2 | 3 | null;
  column: 1 | 2 | 3 | null;
}

export interface RouletteBet {
  type: RouletteBetType;
  value?: number;
  amount: number;
}

export interface RoulettePlayResult {
  result: RouletteResult;
  bet: RouletteBet;
  multiplier: number;
  win: number;
  balance: number;
  spinId: string;
}