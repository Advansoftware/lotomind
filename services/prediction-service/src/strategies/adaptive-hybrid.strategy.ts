import { Injectable } from '@nestjs/common';

@Injectable()
export class AdaptiveHybridStrategy {
  name = 'adaptive_hybrid';
  displayName = 'Adaptive Hybrid';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;

    // Adaptive strategy that combines multiple approaches based on recent performance
    // Analyzes last 20 draws to determine which patterns are working best

    const recentDraws = historicalDraws.slice(0, 20);
    const numberScores = new Map<number, number>();

    // Initialize scores
    for (let num = minNumber; num <= maxNumber; num++) {
      numberScores.set(num, 0);
    }

    // 1. Adaptive Frequency (weight based on recency)
    const frequencyWeight = this.calculateAdaptiveWeight('frequency', recentDraws);
    recentDraws.forEach((draw, index) => {
      const recencyFactor = 1 - (index / recentDraws.length);
      draw.numbers.forEach((num: number) => {
        const current = numberScores.get(num) || 0;
        numberScores.set(num, current + (10 * recencyFactor * frequencyWeight));
      });
    });

    // 2. Adaptive Delay Analysis
    const delayWeight = this.calculateAdaptiveWeight('delay', recentDraws);
    for (let num = minNumber; num <= maxNumber; num++) {
      let lastSeen = -1;
      for (let i = 0; i < recentDraws.length; i++) {
        if (recentDraws[i].numbers.includes(num)) {
          lastSeen = i;
          break;
        }
      }

      if (lastSeen >= 0) {
        const delay = lastSeen;
        const avgDelay = this.calculateAverageDelay(num, historicalDraws);

        // Score higher if delay is near or exceeding average
        if (delay >= avgDelay * 0.8) {
          const current = numberScores.get(num) || 0;
          numberScores.set(num, current + (delay * 2 * delayWeight));
        }
      }
    }

    // 3. Adaptive Pattern Recognition
    const patternWeight = this.calculateAdaptiveWeight('pattern', recentDraws);
    const pairs = this.findFrequentPairs(recentDraws);

    pairs.forEach(([num1, num2, freq]) => {
      if (freq >= 3) {
        const current1 = numberScores.get(num1) || 0;
        const current2 = numberScores.get(num2) || 0;
        numberScores.set(num1, current1 + (freq * 5 * patternWeight));
        numberScores.set(num2, current2 + (freq * 5 * patternWeight));
      }
    });

    // 4. Adaptive Balance (odd/even, high/low)
    const balanceWeight = this.calculateAdaptiveWeight('balance', recentDraws);
    const avgOddCount = recentDraws.reduce((sum, draw) => {
      return sum + draw.numbers.filter((n: number) => n % 2 !== 0).length;
    }, 0) / recentDraws.length;

    const avgHighCount = recentDraws.reduce((sum, draw) => {
      return sum + draw.numbers.filter((n: number) => n > 30).length;
    }, 0) / recentDraws.length;

    for (let num = minNumber; num <= maxNumber; num++) {
      const isOdd = num % 2 !== 0;
      const isHigh = num > 30;

      let balanceScore = 0;

      // Favor numbers that maintain historical balance
      if ((isOdd && avgOddCount > 2.5) || (!isOdd && avgOddCount < 3.5)) {
        balanceScore += 5;
      }

      if ((isHigh && avgHighCount > 2.5) || (!isHigh && avgHighCount < 3.5)) {
        balanceScore += 5;
      }

      const current = numberScores.get(num) || 0;
      numberScores.set(num, current + (balanceScore * balanceWeight));
    }

    // 5. Trend Detection (increasing/decreasing frequency)
    const trendWeight = this.calculateAdaptiveWeight('trend', recentDraws);
    for (let num = minNumber; num <= maxNumber; num++) {
      const trend = this.detectTrend(num, historicalDraws);

      if (trend > 0) {
        // Increasing trend
        const current = numberScores.get(num) || 0;
        numberScores.set(num, current + (trend * 10 * trendWeight));
      }
    }

    // Select top numbers
    const candidates = Array.from(numberScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    return candidates.slice(0, numbersToDraw);
  }

  private calculateAdaptiveWeight(method: string, recentDraws: any[]): number {
    // Simulate performance analysis - in production, this would use actual backtest results
    // For now, return balanced weights
    const weights = {
      frequency: 0.25,
      delay: 0.20,
      pattern: 0.20,
      balance: 0.15,
      trend: 0.20,
    };

    return weights[method] || 0.2;
  }

  private calculateAverageDelay(num: number, draws: any[]): number {
    const appearances: number[] = [];
    draws.forEach((draw, index) => {
      if (draw.numbers.includes(num)) {
        appearances.push(index);
      }
    });

    if (appearances.length < 2) return 10;

    const intervals: number[] = [];
    for (let i = 1; i < appearances.length; i++) {
      intervals.push(appearances[i] - appearances[i - 1]);
    }

    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  private findFrequentPairs(draws: any[]): Array<[number, number, number]> {
    const pairFrequency = new Map<string, number>();

    draws.forEach(draw => {
      const numbers = draw.numbers.sort((a: number, b: number) => a - b);
      for (let i = 0; i < numbers.length - 1; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const key = `${numbers[i]}-${numbers[j]}`;
          pairFrequency.set(key, (pairFrequency.get(key) || 0) + 1);
        }
      }
    });

    const pairs: Array<[number, number, number]> = [];
    pairFrequency.forEach((freq, key) => {
      const [num1, num2] = key.split('-').map(Number);
      pairs.push([num1, num2, freq]);
    });

    return pairs.sort((a, b) => b[2] - a[2]);
  }

  private detectTrend(num: number, draws: any[]): number {
    // Analyze frequency in recent vs older draws
    const recent = draws.slice(0, 30);
    const older = draws.slice(30, 60);

    const recentFreq = recent.filter(d => d.numbers.includes(num)).length;
    const olderFreq = older.filter(d => d.numbers.includes(num)).length;

    // Return positive for increasing trend, negative for decreasing
    return (recentFreq / 30) - (olderFreq / 30);
  }
}
