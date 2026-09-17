export const PAYTABLE_VERSION = '1.0.0';

export const BLACKJACK_CONFIG = {
  decks: 1,
  paytableVersion: PAYTABLE_VERSION,
  minBet: 1,
  maxBet: 100000,
  dealerStandOn: 17,
  blackjackPayout: 1.5,
};

export const SUITS: ('HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES')[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];

export const RANKS: ('A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K')[] = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K',
];

export const RANK_VALUES: Record<string, number> = {
  A: 11,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 10,
  Q: 10,
  K: 10,
};