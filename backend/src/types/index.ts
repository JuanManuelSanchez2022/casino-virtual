export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  createdAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  totalDeposited: number;
  totalWon: number;
  totalLost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  gameId?: string;
  spinId?: string;
  description?: string;
  createdAt: Date;
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  config?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSession {
  id: string;
  userId: string;
  gameId: string;
  totalBet: number;
  totalWin: number;
  startedAt: Date;
  endedAt?: Date;
}

export interface Spin {
  id: string;
  sessionId: string;
  userId: string;
  gameId: string;
  bet: number;
  win: number;
  symbols: number[][];
  winningLines: number[] | null;
  paytableVersion: string;
  createdAt: Date;
}

export type TransactionType = 'INITIAL_BONUS' | 'VIRTUAL_TOPUP' | 'BET' | 'WIN';

export interface SlotSymbol {
  id: number;
  name: string;
  emoji: string;
  weight: number;
  payout3: number;
  payout4: number;
  payout5: number;
}

export interface Payline {
  id: number;
  name: string;
  positions: number[][];
}

export interface SpinRequest {
  bet: number;
}

export interface SpinResult {
  spinId: string;
  symbols: number[][];
  bet: number;
  win: number;
  balance: number;
  winningLines: number[];
}
