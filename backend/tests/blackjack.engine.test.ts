import { BlackjackEngine } from '../src/games/blackjack/blackjack.engine';
import { BLACKJACK_CONFIG } from '../src/games/blackjack/blackjack.config';
import { Card, Suit, Rank } from '../src/games/blackjack/blackjack.types';

const card = (suit: Suit, rank: Rank, value: number): Card => ({ suit, rank, value });

describe('BlackjackEngine', () => {
  let engine: BlackjackEngine;

  beforeEach(() => {
    engine = new BlackjackEngine(BLACKJACK_CONFIG);
  });

  describe('createDeck', () => {
    it('should create a deck of 52 cards', () => {
      const deck = engine.createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should have 4 suits with 13 ranks each', () => {
      const deck = engine.createDeck();
      const suits = [...new Set(deck.map(c => c.suit))];
      const ranks = [...new Set(deck.map(c => c.rank))];
      expect(suits).toHaveLength(4);
      expect(ranks).toHaveLength(13);
    });

    it('should have correct values: numbers 2-10, face cards 10, Ace 1/11', () => {
      const deck = engine.createDeck();
      const rankValues: Record<string, number> = {};
      deck.forEach(card => {
        if (!rankValues[card.rank]) {
          rankValues[card.rank] = card.value;
        }
      });

      expect(rankValues['2']).toBe(2);
      expect(rankValues['3']).toBe(3);
      expect(rankValues['4']).toBe(4);
      expect(rankValues['5']).toBe(5);
      expect(rankValues['6']).toBe(6);
      expect(rankValues['7']).toBe(7);
      expect(rankValues['8']).toBe(8);
      expect(rankValues['9']).toBe(9);
      expect(rankValues['10']).toBe(10);
      expect(rankValues['J']).toBe(10);
      expect(rankValues['Q']).toBe(10);
      expect(rankValues['K']).toBe(10);
      expect(rankValues['A']).toBe(11);
    });
  });

  describe('shuffleDeck', () => {
    it('should return a deck of same length', () => {
      const deck = engine.createDeck();
      const shuffled = engine.shuffleDeck(deck);
      expect(shuffled).toHaveLength(52);
    });

    it('should not return cards in the same order', () => {
      const deck = engine.createDeck();
      const shuffled = engine.shuffleDeck([...deck]);
      expect(shuffled).not.toEqual(deck);
    });
  });

  describe('drawCard', () => {
    it('should remove and return a card from the deck', () => {
      const deck = engine.createDeck();
      const initialLength = deck.length;
      const card = engine.drawCard(deck);
      expect(card).toBeDefined();
      expect(deck).toHaveLength(initialLength - 1);
    });

    it('should return cards with correct structure', () => {
      const deck = engine.createDeck();
      const card = engine.drawCard(deck);
      expect(card).toHaveProperty('suit');
      expect(card).toHaveProperty('rank');
      expect(card).toHaveProperty('value');
    });
  });

  describe('calculateHandValue', () => {
    it('should calculate value of number cards', () => {
      const hand = [
        card('HEARTS', '5', 5),
        card('DIAMONDS', '7', 7),
      ];
      expect(engine.calculateHandValue(hand).value).toBe(12);
    });

    it('should calculate value of face cards as 10', () => {
      const hand = [
        card('HEARTS', 'J', 10),
        card('DIAMONDS', 'Q', 10),
      ];
      expect(engine.calculateHandValue(hand).value).toBe(20);
    });

    it('should count Ace as 11 when total <= 11', () => {
      const hand = [
        card('HEARTS', 'A', 11),
        card('DIAMONDS', '5', 5),
      ];
      expect(engine.calculateHandValue(hand).value).toBe(16);
    });

    it('should count Ace as 1 when total > 11', () => {
      const hand = [
        card('HEARTS', 'A', 11),
        card('DIAMONDS', 'K', 10),
        card('CLUBS', '5', 5),
      ];
      expect(engine.calculateHandValue(hand).value).toBe(16);
    });

    it('should handle multiple Aces correctly', () => {
      const hand = [
        card('HEARTS', 'A', 11),
        card('DIAMONDS', 'A', 11),
      ];
      expect(engine.calculateHandValue(hand).value).toBe(12);
    });

    it('should handle soft 17 (A+6)', () => {
      const hand = [
        card('HEARTS', 'A', 11),
        card('DIAMONDS', '6', 6),
      ];
      expect(engine.calculateHandValue(hand).value).toBe(17);
    });

    it('should handle hard 17 (10+7)', () => {
      const hand = [
        card('HEARTS', '10', 10),
        card('DIAMONDS', '7', 7),
      ];
      expect(engine.calculateHandValue(hand).value).toBe(17);
    });
  });

  describe('isBlackjack', () => {
    it('should return true for Ace + 10-value card', () => {
      const hand = [
        card('HEARTS', 'A', 11),
        card('DIAMONDS', 'K', 10),
      ];
      expect(engine.isBlackjack(hand)).toBe(true);
    });

    it('should return true for 10-value card + Ace', () => {
      const hand = [
        card('HEARTS', '10', 10),
        card('DIAMONDS', 'A', 11),
      ];
      expect(engine.isBlackjack(hand)).toBe(true);
    });

    it('should return false for 21 with 3+ cards', () => {
      const hand = [
        card('HEARTS', '7', 7),
        card('DIAMONDS', '7', 7),
        card('CLUBS', '7', 7),
      ];
      expect(engine.isBlackjack(hand)).toBe(false);
    });

    it('should return false for 20', () => {
      const hand = [
        card('HEARTS', 'K', 10),
        card('DIAMONDS', 'Q', 10),
      ];
      expect(engine.isBlackjack(hand)).toBe(false);
    });
  });

  describe('isBust', () => {
    it('should return true for value > 21', () => {
      const hand = [
        card('HEARTS', 'K', 10),
        card('DIAMONDS', 'Q', 10),
        card('CLUBS', '5', 5),
      ];
      expect(engine.isBust(hand)).toBe(true);
    });

    it('should return false for value <= 21', () => {
      const hand = [
        card('HEARTS', 'K', 10),
        card('DIAMONDS', 'Q', 10),
      ];
      expect(engine.isBust(hand)).toBe(false);
    });

    it('should return false for soft 21', () => {
      const hand = [
        card('HEARTS', 'A', 11),
        card('DIAMONDS', 'K', 10),
      ];
      expect(engine.isBust(hand)).toBe(false);
    });
  });

  describe('shouldDealerHit', () => {
    it('should return true for dealer < 17', () => {
      const hand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '6', 6),
      ]);
      expect(engine.shouldDealerHit(hand)).toBe(true);
    });

    it('should return false for dealer >= 17', () => {
      const hand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '7', 7),
      ]);
      expect(engine.shouldDealerHit(hand)).toBe(false);
    });

    it('should hit on soft 17 (A+6) if dealer stands on 17', () => {
      const hand = engine.getHand([
        card('HEARTS', 'A', 11),
        card('DIAMONDS', '6', 6),
      ]);
      expect(engine.shouldDealerHit(hand)).toBe(true);
    });

    it('should stand on hard 17', () => {
      const hand = engine.getHand([
        card('HEARTS', '9', 9),
        card('DIAMONDS', '8', 8),
      ]);
      expect(engine.shouldDealerHit(hand)).toBe(false);
    });

    it('should stand on 18+', () => {
      const hand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '8', 8),
      ]);
      expect(engine.shouldDealerHit(hand)).toBe(false);
    });
  });

  describe('determineResult', () => {
    it('should return WIN when player > dealer and both <= 21', () => {
      const playerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '9', 9),
      ]);
      const dealerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '7', 7),
      ]);
      expect(engine.determineResult(playerHand, dealerHand)).toBe('WIN');
    });

    it('should return LOSE when dealer > player and both <= 21', () => {
      const playerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '7', 7),
      ]);
      const dealerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '9', 9),
      ]);
      expect(engine.determineResult(playerHand, dealerHand)).toBe('LOSE');
    });

    it('should return PUSH when player == dealer and both <= 21', () => {
      const playerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '8', 8),
      ]);
      const dealerHand = engine.getHand([
        card('HEARTS', '9', 9),
        card('DIAMONDS', '9', 9),
      ]);
      expect(engine.determineResult(playerHand, dealerHand)).toBe('PUSH');
    });

    it('should return WIN when player <= 21 and dealer bust', () => {
      const playerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '8', 8),
      ]);
      const dealerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '9', 9),
        card('CLUBS', '5', 5),
      ]);
      expect(engine.determineResult(playerHand, dealerHand)).toBe('WIN');
    });

    it('should return LOSE when player bust and dealer <= 21', () => {
      const playerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '9', 9),
        card('CLUBS', '5', 5),
      ]);
      const dealerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '8', 8),
      ]);
      expect(engine.determineResult(playerHand, dealerHand)).toBe('LOSE');
    });

    it('should return LOSE when both bust (player busts first)', () => {
      const playerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '9', 9),
        card('CLUBS', '5', 5),
      ]);
      const dealerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '9', 9),
        card('CLUBS', '5', 5),
      ]);
      expect(engine.determineResult(playerHand, dealerHand)).toBe('LOSE');
    });

    it('should return BLACKJACK when player has blackjack and dealer does not', () => {
      const playerHand = engine.getHand([
        card('HEARTS', 'A', 11),
        card('DIAMONDS', 'K', 10),
      ]);
      const dealerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '9', 9),
      ]);
      expect(engine.determineResult(playerHand, dealerHand)).toBe('BLACKJACK');
    });

    it('should return PUSH when both have blackjack', () => {
      const playerHand = engine.getHand([
        card('HEARTS', 'A', 11),
        card('DIAMONDS', 'K', 10),
      ]);
      const dealerHand = engine.getHand([
        card('HEARTS', 'A', 11),
        card('DIAMONDS', 'Q', 10),
      ]);
      expect(engine.determineResult(playerHand, dealerHand)).toBe('PUSH');
    });

    it('should return LOSE when dealer has blackjack and player does not', () => {
      const playerHand = engine.getHand([
        card('HEARTS', '10', 10),
        card('DIAMONDS', '9', 9),
      ]);
      const dealerHand = engine.getHand([
        card('HEARTS', 'A', 11),
        card('DIAMONDS', 'K', 10),
      ]);
      expect(engine.determineResult(playerHand, dealerHand)).toBe('LOSE');
    });
  });

  describe('calculatePayout', () => {
    it('should return 1:1 payout for WIN', () => {
      expect(engine.calculatePayout(100, 'WIN')).toBe(100);
    });

    it('should return 3:2 payout for BLACKJACK', () => {
      expect(engine.calculatePayout(100, 'BLACKJACK')).toBe(150);
    });

    it('should return bet amount for PUSH', () => {
      expect(engine.calculatePayout(100, 'PUSH')).toBe(100);
    });

    it('should return 0 for LOSE', () => {
      expect(engine.calculatePayout(100, 'LOSE')).toBe(0);
    });

    it('should handle different bet amounts', () => {
      expect(engine.calculatePayout(50, 'WIN')).toBe(50);
      expect(engine.calculatePayout(50, 'BLACKJACK')).toBe(75);
      expect(engine.calculatePayout(50, 'PUSH')).toBe(50);
      expect(engine.calculatePayout(50, 'LOSE')).toBe(0);
    });

    it('should round blackjack payout correctly', () => {
      expect(engine.calculatePayout(10, 'BLACKJACK')).toBe(15);
      expect(engine.calculatePayout(25, 'BLACKJACK')).toBe(38);
    });
  });

  describe('getHand', () => {
    it('should return complete hand info', () => {
      const cards = [
        card('HEARTS', 'A', 11),
        card('DIAMONDS', 'K', 10),
      ];
      const hand = engine.getHand(cards);
      expect(hand.cards).toEqual(cards);
      expect(hand.value).toBe(21);
      expect(hand.isBlackjack).toBe(true);
      expect(hand.isBust).toBe(false);
      expect(hand.isSoft).toBe(true);
    });

    it('should correctly identify soft hands', () => {
      const cards = [
        card('HEARTS', 'A', 11),
        card('DIAMONDS', '6', 6),
      ];
      const hand = engine.getHand(cards);
      expect(hand.isSoft).toBe(true);
      expect(hand.value).toBe(17);
    });

    it('should correctly identify hard hands', () => {
      const cards = [
        card('HEARTS', '10', 10),
        card('DIAMONDS', '7', 7),
      ];
      const hand = engine.getHand(cards);
      expect(hand.isSoft).toBe(false);
      expect(hand.value).toBe(17);
    });
  });

  describe('paytable version', () => {
    it('should return the paytable version', () => {
      expect(engine.getPaytableVersion()).toBe('1.0.0');
    });
  });
});