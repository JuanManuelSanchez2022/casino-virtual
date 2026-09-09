import { SlotSymbol, Payline } from './slots.types';

export function getSymbolById(symbols: SlotSymbol[], id: number): SlotSymbol | undefined {
  return symbols.find(s => s.id === id);
}

export function formatMultiplier(multiplier: number): string {
  return `×${multiplier.toLocaleString()}`;
}

export function calculateTotalWeight(symbols: SlotSymbol[]): number {
  return symbols.reduce((sum, s) => sum + s.weight, 0);
}

export function validatePayline(positions: number[][]): boolean {
  if (positions.length !== 5) return false;
  const reels = new Set(positions.map(p => p[0]));
  return reels.size === 5;
}
