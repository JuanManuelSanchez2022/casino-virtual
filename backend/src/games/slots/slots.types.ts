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

export { SpinResult, SpinRequest, SlotSymbol, Payline } from '../types';
