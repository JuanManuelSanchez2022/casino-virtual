import { RouletteConfig, RouletteBetType, RouletteColor, RouletteResult } from './roulette.types';

export class RouletteEngine {
  private config: RouletteConfig;

  constructor(config: RouletteConfig) {
    this.config = config;
  }

  private rollNumber(): number {
    return Math.floor(Math.random() * this.config.numbers);
  }

  private getColor(number: number): RouletteColor {
    if (number === 0) return 'GREEN';

    const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return reds.includes(number) ? 'RED' : 'BLACK';
  }

  private getParity(number: number): 'EVEN' | 'ODD' | 'NONE' {
    if (number === 0) return 'NONE';
    return number % 2 === 0 ? 'EVEN' : 'ODD';
  }

  private getRange(number: number): 'LOW' | 'HIGH' | 'NONE' {
    if (number === 0) return 'NONE';
    return number <= 18 ? 'LOW' : 'HIGH';
  }

  private getDozen(number: number): 1 | 2 | 3 | null {
    if (number === 0) return null;
    if (number <= 12) return 1;
    if (number <= 24) return 2;
    return 3;
  }

  private getColumn(number: number): 1 | 2 | 3 | null {
    if (number === 0) return null;
    if ([1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(number)) return 1;
    if ([2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(number)) return 2;
    return 3;
  }

  spin(): RouletteResult {
    const number = this.rollNumber();
    return {
      number,
      color: this.getColor(number),
      parity: this.getParity(number),
      range: this.getRange(number),
      dozen: this.getDozen(number),
      column: this.getColumn(number),
    };
  }

  evaluateBet(betType: RouletteBetType, betValue: number | undefined, result: RouletteResult): number {
    switch (betType) {
      case 'NUMBER':
        return betValue === result.number ? 36 : 0;

      case 'RED':
        return result.color === 'RED' ? 2 : 0;

      case 'BLACK':
        return result.color === 'BLACK' ? 2 : 0;

      case 'EVEN':
        return result.parity === 'EVEN' ? 2 : 0;

      case 'ODD':
        return result.parity === 'ODD' ? 2 : 0;

      case 'LOW':
        return result.range === 'LOW' ? 2 : 0;

      case 'HIGH':
        return result.range === 'HIGH' ? 2 : 0;

      case 'DOZEN_1':
        return result.dozen === 1 ? 3 : 0;

      case 'DOZEN_2':
        return result.dozen === 2 ? 3 : 0;

      case 'DOZEN_3':
        return result.dozen === 3 ? 3 : 0;

      case 'COLUMN_1':
        return result.column === 1 ? 3 : 0;

      case 'COLUMN_2':
        return result.column === 2 ? 3 : 0;

      case 'COLUMN_3':
        return result.column === 3 ? 3 : 0;

      default:
        return 0;
    }
  }

  getPaytableVersion(): string {
    return this.config.paytableVersion;
  }
}