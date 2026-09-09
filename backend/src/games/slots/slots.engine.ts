export class SlotsEngine {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  private getWeightedRandomSymbol(symbols: any[]): number {
    const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const symbol of symbols) {
      random -= symbol.weight;
      if (random <= 0) return symbol.id;
    }
    return symbols[symbols.length - 1].id;
  }

  generateResult(): number[][] {
    const { reels, rows, symbols } = this.config;
    const result: number[][] = [];

    for (let r = 0; r < reels; r++) {
      const reelSymbols: number[] = [];
      for (let row = 0; row < rows; row++) {
        reelSymbols.push(this.getWeightedRandomSymbol(symbols));
      }
      result.push(reelSymbols);
    }

    return result;
  }

  evaluateWin(symbols: number[][], bet: number): { winningLines: number[]; totalWin: number } {
    const { paylines, symbols: symbolTable } = this.config;
    const winningLines: number[] = [];
    let totalWin = 0;

    for (const payline of paylines) {
      const lineSymbols = payline.positions.map(([reel, row]) => symbols[reel][row]);

      const firstSymbol = lineSymbols[0];
      const matchCount = lineSymbols.filter(s => s === firstSymbol).length;

      if (matchCount >= 3) {
        const symbolData = symbolTable.find(s => s.id === firstSymbol);
        if (!symbolData) continue;

        let lineWin = 0;
        if (matchCount === 3) lineWin = symbolData.payout3;
        else if (matchCount === 4) lineWin = symbolData.payout4;
        else if (matchCount === 5) lineWin = symbolData.payout5;

        totalWin += lineWin * bet;
        winningLines.push(payline.id);
      }
    }

    return { winningLines, totalWin };
  }

  spin(bet: number): { symbols: number[][]; winningLines: number[]; totalWin: number } {
    const symbols = this.generateResult();
    const { winningLines, totalWin } = this.evaluateWin(symbols, bet);
    return { symbols, winningLines, totalWin };
  }

  getPaytableVersion(): string {
    return this.config.paytableVersion;
  }
}
