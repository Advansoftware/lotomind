import { Injectable } from '@nestjs/common';

@Injectable()
export class SumRangeStrategy {
  name = 'sum_range';
  displayName = 'Sum Range';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const recentDraws = historicalDraws.slice(0, config.windowSize || 100);

    // Calculate sum of each historical draw
    const sums: number[] = recentDraws.map((draw) =>
      draw.numbers.reduce((a: number, b: number) => a + b, 0)
    );

    // Calculate statistics
    const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
    const sortedSums = [...sums].sort((a, b) => a - b);
    const q1 = sortedSums[Math.floor(sortedSums.length * 0.25)];
    const q3 = sortedSums[Math.floor(sortedSums.length * 0.75)];

    // Target sum range (between Q1 and Q3)
    const targetMin = q1;
    const targetMax = q3;
    const targetSum = (targetMin + targetMax) / 2;

    // Generate combinations that sum to target range
    const candidates = this.generateCombinationsInRange(
      minNumber,
      maxNumber,
      numbersToDraw,
      targetMin,
      targetMax,
      targetSum
    );

    // If no perfect match, use frequency-based fallback
    if (candidates.length === 0) {
      const frequency = new Map<number, number>();
      recentDraws.forEach((draw) => {
        draw.numbers.forEach((num: number) => {
          frequency.set(num, (frequency.get(num) || 0) + 1);
        });
      });

      return Array.from(frequency.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => num)
        .slice(0, numbersToDraw);
    }

    return candidates;
  }

  private generateCombinationsInRange(
    min: number,
    max: number,
    count: number,
    targetMin: number,
    targetMax: number,
    targetSum: number
  ): number[] {
    // Greedy approach: start with numbers that average to target
    const avgNumber = targetSum / count;
    const result: number[] = [];

    // Start with number closest to average
    let current = Math.round(avgNumber);
    const used = new Set<number>();

    while (result.length < count) {
      if (current >= min && current <= max && !used.has(current)) {
        result.push(current);
        used.add(current);
      }

      // Alternate between higher and lower numbers
      if (result.length % 2 === 0) {
        current = Math.round(avgNumber + (result.length / 2) * 5);
      } else {
        current = Math.round(avgNumber - (result.length / 2) * 5);
      }

      // Prevent infinite loop
      if (current < min || current > max) {
        // Fill remaining with unused numbers
        for (let num = min; num <= max && result.length < count; num++) {
          if (!used.has(num)) {
            result.push(num);
            used.add(num);
          }
        }
        break;
      }
    }

    return result.sort((a, b) => a - b);
  }
}
