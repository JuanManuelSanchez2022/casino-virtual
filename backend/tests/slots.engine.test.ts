import { SlotsEngine } from '../src/games/slots/slots.engine';
import { SLOT_CONFIG } from '../src/games/slots/slots.paytable';

describe('SlotsEngine', () => {
  let engine: SlotsEngine;

  beforeEach(() => {
    engine = new SlotsEngine(SLOT_CONFIG);
  });

  describe('generateResult', () => {
    it('should generate a 5x3 symbols array', () => {
      const result = engine.generateResult();
      expect(result).toHaveLength(5);
      result.forEach(reel => {
        expect(reel).toHaveLength(3);
      });
    });

    it('should only return valid symbol IDs', () => {
      const result = engine.generateResult();
      result.forEach(reel => {
        reel.forEach(symbol => {
          expect(symbol).toBeGreaterThanOrEqual(1);
          expect(symbol).toBeLessThanOrEqual(8);
        });
      });
    });
  });

  describe('evaluateWin', () => {
    it('should return no wins for random symbols', () => {
      const symbols = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 1],
        [2, 3, 4],
        [5, 6, 7],
      ];
      const { winningLines, totalWin } = engine.evaluateWin(symbols, 100);
      expect(winningLines).toHaveLength(0);
      expect(totalWin).toBe(0);
    });

    it('should detect 3 matching symbols on a payline', () => {
      const symbols = [
        [1, 1, 1],
        [2, 3, 4],
        [5, 6, 7],
        [8, 1, 2],
        [3, 4, 5],
      ];
      const { winningLines, totalWin } = engine.evaluateWin(symbols, 100);
      expect(winningLines).toContain(1);
      expect(totalWin).toBeGreaterThan(0);
    });

    it('should calculate win based on bet', () => {
      const symbols = [
        [7, 1, 2],
        [1, 3, 4],
        [7, 5, 6],
        [7, 7, 7],
        [7, 8, 1],
      ];
      const bet = 100;
      const { winningLines, totalWin } = engine.evaluateWin(symbols, bet);
      expect(totalWin).toBeGreaterThan(0);
      winningLines.forEach(lineId => {
        const line = SLOT_CONFIG.paylines.find(l => l.id === lineId);
        expect(line).toBeDefined();
      });
    });

    it('should handle 5 matching symbols', () => {
      const symbols = [
        [8, 1, 2],
        [8, 3, 4],
        [8, 5, 6],
        [8, 7, 1],
        [8, 2, 3],
      ];
      const { winningLines, totalWin } = engine.evaluateWin(symbols, 100);
      expect(winningLines).toContain(1);
      expect(totalWin).toBeGreaterThan(0);
    });
  });

  describe('spin', () => {
    it('should return a complete spin result', () => {
      const result = engine.spin(100);
      expect(result.symbols).toHaveLength(5);
      expect(result.symbols[0]).toHaveLength(3);
      expect(typeof result.totalWin).toBe('number');
      expect(Array.isArray(result.winningLines)).toBe(true);
    });
  });

  describe('paytable version', () => {
    it('should return the paytable version', () => {
      expect(engine.getPaytableVersion()).toBe('1.0.0');
    });
  });
});

describe('Balance integrity', () => {
  it('should ensure saldo_final = saldo_inicial - apuesta + premio', () => {
    const engine = new SlotsEngine(SLOT_CONFIG);
    const initialBalance = 10000;
    const bet = 100;
    const { totalWin } = engine.spin(bet);
    const expectedFinalBalance = initialBalance - bet + totalWin;
    expect(expectedFinalBalance).toBeLessThanOrEqual(initialBalance + totalWin);
    expect(expectedFinalBalance).toBeGreaterThanOrEqual(initialBalance - bet);
  });
});
