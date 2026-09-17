export type BlackjackAction = 'HIT' | 'STAND';

export type BlackjackGameState = 'BETTING' | 'PLAYER_TURN' | 'DEALER_TURN' | 'FINISHED';

export type BlackjackResult = 'WIN' | 'LOSE' | 'PUSH' | 'BLACKJACK';

export type Suit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  hidden?: boolean;
}

export interface BlackjackBet {
  amount: number;
}

export interface BlackjackGameStateResponse {
  gameId: string;
  playerCards: Card[];
  dealerCards: Card[];
  playerValue: number;
  dealerVisibleValue?: number;
  dealerValue?: number;
  state: BlackjackGameState;
  bet: number;
  balance: number;
  result?: 'WIN' | 'LOSE' | 'PUSH' | 'BLACKJACK';
  payout?: number;
}

export interface BlackjackStartRequest {
  bet: number;
}

export interface BlackjackActionRequest {
  action: 'HIT' | 'STAND';
}

const SUIT_SYMBOLS: Record<string, string> = {
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
  SPADES: '♠',
};

const RANK_SYMBOLS: Record<string, string> = {
  A: 'A',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'J',
  Q: 'Q',
  K: 'K',
};

export const getCardSymbol = (card: Card): string => {
  if (card.hidden) return '🂠';
  return `${SUIT_SYMBOLS[card.suit] || ''}${RANK_SYMBOLS[card.rank] || card.rank}`;
};

export const getCardColor = (card: Card): 'red' | 'black' => {
  if (card.hidden) return 'black';
  return card.suit === 'HEARTS' || card.suit === 'DIAMONDS' ? 'red' : 'black';
};

export const formatCardValue = (card: Card): string => {
  if (card.hidden) return '?';
  return card.rank;
};