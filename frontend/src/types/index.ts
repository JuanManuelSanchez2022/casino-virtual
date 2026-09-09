export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  phone?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  description?: string;
  type: string;
}

export interface SpinResult {
  spinId: string;
  symbols: number[][];
  bet: number;
  win: number;
  balance: number;
  winningLines: number[];
}
