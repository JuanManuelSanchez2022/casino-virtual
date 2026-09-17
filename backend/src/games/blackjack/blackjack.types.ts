export type BlackjackAction = 'HIT' | 'STAND';

export type BlackjackGameState = 'BETTING' | 'PLAYER_TURN' | 'DEALER_TURN' | 'FINISHED';

export type BlackjackResult = 'WIN' | 'LOSE' | 'PUSH' | 'BLACKJACK';

export type Suit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES';

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export interface Hand {
  cards: Card[];
  value: number;
  isSoft: boolean;
  isBlackjack: boolean;
  isBust: boolean;
}

export interface BlackjackConfig {
  decks: number;
  paytableVersion: string;
  minBet: number;
  maxBet: number;
  dealerStandOn: number;
  blackjackPayout: number;
}

export interface BlackjackBet {
  amount: number;
}

export interface BlackjackGame {
  id: string;
  userId: string;
  gameId: string;
  state: BlackjackGameState;
  bet: number;
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  playerValue: number;
  dealerValue: number;
  dealerHidden: boolean;
  result?: BlackjackResult;
  payout?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlackjackStartRequest {
  bet: number;
}

export interface BlackjackActionRequest {
  action: BlackjackAction;
}

export interface BlackjackStartResponse {
  gameId: string;
  playerCards: Card[];
  dealerCards: Card[];
  playerValue: number;
  dealerVisibleValue: number;
  state: BlackjackGameState;
  bet: number;
  balance: number;
}

export interface BlackjackActionResponse {
  gameId: string;
  playerCards: Card[];
  dealerCards: Card[];
  playerValue: number;
  dealerValue: number;
  state: BlackjackGameState;
  result?: BlackjackResult;
  payout?: number;
  balance: number;
}

export interface BlackjackGameStateResponse {
  gameId: string;
  playerCards: Card[];
  dealerCards: Card[];
  playerValue: number;
  dealerValue?: number;
  state: BlackjackGameState;
  bet: number;
  balance: number;
  result?: BlackjackResult;
  payout?: number;
}