export const PAYTABLE_VERSION = '1.0.0';

export const ROULETTE_CONFIG = {
  numbers: 37, // 0-36
  paytableVersion: PAYTABLE_VERSION,
  minBet: 1,
  maxBet: 100000,
};

// Números rojos en ruleta europea
export const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

// Números negros en ruleta europea
export const BLACK_NUMBERS = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
];

// Multiplicadores por tipo de apuesta
export const PAYTABLE: Record<string, number> = {
  NUMBER: 36,
  RED: 2,
  BLACK: 2,
  EVEN: 2,
  ODD: 2,
  LOW: 2,   // 1-18
  HIGH: 2,  // 19-36
  DOZEN_1: 3, // 1-12
  DOZEN_2: 3, // 13-24
  DOZEN_3: 3, // 25-36
  COLUMN_1: 3,
  COLUMN_2: 3,
  COLUMN_3: 3,
};

// Primera columna: 1,4,7,10,13,16,19,22,25,28,31,34
export const COLUMN_1_NUMBERS = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
// Segunda columna: 2,5,8,11,14,17,20,23,26,29,32,35
export const COLUMN_2_NUMBERS = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
// Tercera columna: 3,6,9,12,15,18,21,24,27,30,33,36
export const COLUMN_3_NUMBERS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];