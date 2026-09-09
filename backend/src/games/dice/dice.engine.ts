import { DiceConfig, DiceChoice, DiceRoll } from './dice.types';

export class DiceEngine {
  private config: DiceConfig;

  constructor(config: DiceConfig) {
    this.config = config;
  }

  private rollDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  roll(): DiceRoll {
    const { sides, dice } = this.config;
    const values: number[] = [];
    for (let i = 0; i < dice; i++) {
      values.push(this.rollDie(sides));
    }

    const total = values.reduce((sum, v) => sum + v, 0);
    let result: 'LOW' | 'SEVEN' | 'HIGH';
    if (total >= 2 && total <= 6) {
      result = 'LOW';
    } else if (total === 7) {
      result = 'SEVEN';
    } else {
      result = 'HIGH';
    }

    return {
      die1: values[0],
      die2: values[1],
      total,
      result,
    };
  }

  getMultiplier(choice: DiceChoice, rollResult: 'LOW' | 'SEVEN' | 'HIGH'): number {
    if (choice !== rollResult) {
      return 0;
    }

    return choice === 'SEVEN' ? 5 : 2;
  }

  getPaytableVersion(): string {
    return this.config.paytableVersion;
  }
}