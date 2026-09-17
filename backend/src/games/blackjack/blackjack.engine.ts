import {
  BlackjackConfig,
  Card,
  Hand,
  Rank,
  Suit,
} from './blackjack.types';
import {
  BLACKJACK_CONFIG,
  RANK_VALUES,
  SUITS,
  RANKS,
} from './blackjack.config';

export class BlackjackEngine {
  private config: BlackjackConfig;

  constructor(config: BlackjackConfig = BLACKJACK_CONFIG) {
    this.config = config;
  }

  createDeck(): Card[] {
    const deck: Card[] = [];
    for (let d = 0; d < this.config.decks; d++) {
      for (const suit of SUITS) {
        for (const rank of RANKS) {
          deck.push({
            suit,
            rank,
            value: RANK_VALUES[rank],
          });
        }
      }
    }
    return deck;
  }

  shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  drawCard(deck: Card[]): Card {
    if (deck.length === 0) {
      throw new Error('No cards left in deck');
    }
    return deck.pop()!;
  }

  calculateHandValue(cards: Card[]): { value: number; isSoft: boolean; isBlackjack: boolean; isBust: boolean } {
    let value = 0;
    let aceCount = 0;

    for (const card of cards) {
      value += card.value;
      if (card.rank === 'A') {
        aceCount++;
      }
    }

    while (value > 21 && aceCount > 0) {
      value -= 10;
      aceCount--;
    }

    const isSoft = aceCount > 0 && value <= 21;
    const isBlackjack = cards.length === 2 && value === 21;
    const isBust = value > 21;

    return { value, isSoft, isBlackjack, isBust };
  }

  getHand(cards: Card[]): Hand {
    const { value, isSoft, isBlackjack, isBust } = this.calculateHandValue(cards);
    return {
      cards,
      value,
      isSoft,
      isBlackjack,
      isBust,
    };
  }

  isBlackjack(cards: Card[]): boolean {
    return cards.length === 2 && this.calculateHandValue(cards).value === 21;
  }

  isBust(cards: Card[]): boolean {
    return this.calculateHandValue(cards).value > 21;
  }

  shouldDealerHit(hand: Hand): boolean {
    if (hand.value < this.config.dealerStandOn) {
      return true;
    }
    if (hand.value === this.config.dealerStandOn && hand.isSoft) {
      return true;
    }
    return false;
  }

  determineResult(playerHand: Hand, dealerHand: Hand): 'WIN' | 'LOSE' | 'PUSH' | 'BLACKJACK' {
    if (playerHand.isBlackjack && !dealerHand.isBlackjack) {
      return 'BLACKJACK';
    }
    if (dealerHand.isBlackjack && !playerHand.isBlackjack) {
      return 'LOSE';
    }
    if (playerHand.isBlackjack && dealerHand.isBlackjack) {
      return 'PUSH';
    }
    if (playerHand.isBust) {
      return 'LOSE';
    }
    if (dealerHand.isBust) {
      return 'WIN';
    }
    if (playerHand.value > dealerHand.value) {
      return 'WIN';
    }
    if (playerHand.value < dealerHand.value) {
      return 'LOSE';
    }
    return 'PUSH';
  }

  calculatePayout(bet: number, result: 'WIN' | 'LOSE' | 'PUSH' | 'BLACKJACK'): number {
    switch (result) {
      case 'WIN':
        return bet;
      case 'LOSE':
        return 0;
      case 'PUSH':
        return bet;
      case 'BLACKJACK':
        return Math.round(bet * this.config.blackjackPayout);
      default:
        return 0;
    }
  }

  getPaytableVersion(): string {
    return this.config.paytableVersion;
  }
}