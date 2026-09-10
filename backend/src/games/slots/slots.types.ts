import type { SlotSymbol, Payline, SpinResult, SpinRequest } from '../../types';

export interface SlotConfig {
  reels: number;
  rows: number;
  symbols: SlotSymbol[];
  paylines: Payline[];
  paytableVersion: string;
}

export interface SlotSpinResult {
  symbols: number[][];
  winningLines: number[];
  totalWin: number;
}

export type { SlotSymbol, Payline, SpinResult, SpinRequest };
