import { SlotConfig, SlotSymbol, Payline } from './slots.types';

export const PAYTABLE_VERSION = '1.0.0';

export const SYMBOLS: SlotSymbol[] = [
  { id: 1, name: 'Cherry', emoji: '🍒', weight: 40, payout3: 5, payout4: 20, payout5: 100 },
  { id: 2, name: 'Lemon', emoji: '🍋', weight: 35, payout3: 5, payout4: 20, payout5: 100 },
  { id: 3, name: 'Orange', emoji: '🍊', weight: 30, payout3: 10, payout4: 40, payout5: 200 },
  { id: 4, name: 'Bell', emoji: '🔔', weight: 25, payout3: 15, payout4: 60, payout5: 300 },
  { id: 5, name: 'Star', emoji: '⭐', weight: 20, payout3: 20, payout4: 100, payout5: 500 },
  { id: 6, name: 'BAR', emoji: '🅱️', weight: 15, payout3: 30, payout4: 150, payout5: 750 },
  { id: 7, name: 'Seven', emoji: '7️⃣', weight: 10, payout3: 50, payout4: 250, payout5: 1000 },
  { id: 8, name: 'Diamond', emoji: '💎', weight: 5, payout3: 100, payout4: 500, payout5: 2500 },
];

export const PAYLINES: Payline[] = [
  { id: 1, name: 'Central', positions: [[0,1],[1,1],[2,1],[3,1],[4,1]] },
  { id: 2, name: 'Top', positions: [[0,0],[1,0],[2,0],[3,0],[4,0]] },
  { id: 3, name: 'Bottom', positions: [[0,2],[1,2],[2,2],[3,2],[4,2]] },
  { id: 4, name: 'Diagonal Down', positions: [[0,0],[1,1],[2,2],[3,1],[4,0]] },
  { id: 5, name: 'Diagonal Up', positions: [[0,2],[1,1],[2,0],[3,1],[4,2]] },
];

export const SLOT_CONFIG: SlotConfig = {
  reels: 5,
  rows: 3,
  symbols: SYMBOLS,
  paylines: PAYLINES,
  paytableVersion: PAYTABLE_VERSION,
};
