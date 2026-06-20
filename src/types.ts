/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PaymentMethod = 'UPI' | 'Gold Coins';

export interface Ticket {
  id: string;
  number: string; // 5 digits, e.g. "54921"
  userEmail: string;
  userName: string;
  userAvatar: string;
  paymentMethod: PaymentMethod;
  paymentId: string; // Unique payment reference ID provided to the user (e.g., LTR-54921-93A)
  txnId: string; // Transaction ID entered by the user
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

export interface User {
  email: string;
  name: string;
  photoURL: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  goldCoins?: number;
}

export interface DrawState {
  winningNumber: string; // "?????", or "38492"
  isRolling: boolean;
  lastDrawnAt: string | null;
}

export interface PastWinner {
  id: string;
  winningNumber: string;
  drawnAt: string;
}

export interface CoinTransaction {
  id: string;
  userEmail: string;
  amount: number; // e.g., +10, -30
  reason: string;  // e.g., "Referral Reward", "Manual Admin Reward", "Booked ticket with 30 coins"
  timestamp: string;
}

