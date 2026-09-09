export const PAYTABLE_VERSION = '1.0.0';

export const DICE_CONFIG = {
  sides: 6,
  dice: 2,
  paytableVersion: PAYTABLE_VERSION,
  minBet: 1,
  maxBet: 100000,
};

export const MULTIPLIERS: Record<'LOW' | 'SEVEN' | 'HIGH', number> = {
  LOW: 2,
  SEVEN: 5,
  HIGH: 2,
};

export const CHOICE_RANGES: Record<'LOW' | 'SEVEN' | 'HIGH', { min: number; max: number }> = {
  LOW: { min: 2, max: 6 },
  SEVEN: { min: 7, max: 7 },
  HIGH: { min: 8, max: 12 },
};