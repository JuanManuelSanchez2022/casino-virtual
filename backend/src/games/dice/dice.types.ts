export type DiceChoice = 'LOW' | 'SEVEN' | 'HIGH';

export interface DiceConfig {
  sides: number;
  dice: number;
  paytableVersion: string;
  minBet: number;
  maxBet: number;
}

export interface DiceRoll {
  die1: number;
  die2: number;
  total: number;
  result: 'LOW' | 'SEVEN' | 'HIGH';
}

export interface DicePlayResult {
  dice: DiceRoll;
  choice: DiceChoice;
  bet: number;
  multiplier: number;
  win: number;
  balance: number;
  spinId: string;
}