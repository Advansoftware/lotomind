import { Injectable } from '@nestjs/common';

@Injectable()
export class OddEvenBalanceStrategy {
  name = 'odd_even_balance';
  displayName = 'Odd-Even Balance';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const recentDraws = historicalDraws.slice(0, config.windowSize || 50);

    // Analyze historical odd/even distribution
    const distributions = new Map<string, number>();

    recentDraws.forEach((draw) => {
      const oddCount = draw.numbers.filter((n: number) => n % 2 !== 0).length;
      const evenCount = draw.numbers.length - oddCount;
      const key = `${oddCount}-${evenCount}`;
      distributions.set(key, (distributions.get(key) || 0) + 1);
    });

    // Find most common distribution
    const mostCommon = Array.from(distributions.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const [targetOdd, targetEven] = mostCommon[0].split('-').map(Number);

    // Also analyze high/low distribution (for Mega-Sena: 1-30 = low, 31-60 = high)
    const midPoint = Math.floor((maxNumber + minNumber) / 2);
    const highLowDistributions = new Map<string, number>();

    recentDraws.forEach((draw) => {
      const lowCount = draw.numbers.filter((n: number) => n <= midPoint).length;
      const highCount = draw.numbers.length - lowCount;
      const key = `${lowCount}-${highCount}`;
      highLowDistributions.set(key, (highLowDistributions.get(key) || 0) + 1);
    });

    const mostCommonHighLow = Array.from(highLowDistributions.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const [targetLow, targetHigh] = mostCommonHighLow[0].split('-').map(Number);

    // Calculate frequency for number selection
    const frequency = new Map<number, number>();
    for (let num = minNumber; num <= maxNumber; num++) {
      frequency.set(num, 0);
    }

    recentDraws.forEach((draw) => {
      draw.numbers.forEach((num: number) => {
        frequency.set(num, (frequency.get(num) || 0) + 1);
      });
    });

    // Select numbers maintaining balance
    const oddNumbers = Array.from(frequency.entries())
      .filter(([num]) => num % 2 !== 0)
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    const evenNumbers = Array.from(frequency.entries())
      .filter(([num]) => num % 2 === 0)
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    const lowNumbers = Array.from(frequency.entries())
      .filter(([num]) => num <= midPoint)
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    const highNumbers = Array.from(frequency.entries())
      .filter(([num]) => num > midPoint)
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    // Build selection maintaining both balances
    const selected = new Set<number>();

    // Add odd numbers from low range
    const oddLow = oddNumbers.filter(n => n <= midPoint);
    const oddHigh = oddNumbers.filter(n => n > midPoint);
    const evenLow = evenNumbers.filter(n => n <= midPoint);
    const evenHigh = evenNumbers.filter(n => n > midPoint);

    let oddNeeded = targetOdd;
    let evenNeeded = targetEven;
    let lowNeeded = targetLow;
    let highNeeded = targetHigh;

    // Greedy selection maintaining all constraints
    const pools = [
      { pool: oddLow, isOdd: true, isLow: true },
      { pool: oddHigh, isOdd: true, isLow: false },
      { pool: evenLow, isOdd: false, isLow: true },
      { pool: evenHigh, isOdd: false, isLow: false },
    ];

    for (const { pool, isOdd, isLow } of pools) {
      for (const num of pool) {
        if (selected.size >= numbersToDraw) break;

        const canAdd = (isOdd && oddNeeded > 0 || !isOdd && evenNeeded > 0) &&
          (isLow && lowNeeded > 0 || !isLow && highNeeded > 0);

        if (canAdd) {
          selected.add(num);
          if (isOdd) oddNeeded--;
          else evenNeeded--;
          if (isLow) lowNeeded--;
          else highNeeded--;
        }
      }
    }

    // Fill remaining if needed
    if (selected.size < numbersToDraw) {
      const remaining = Array.from(frequency.entries())
        .filter(([num]) => !selected.has(num))
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => num);

      remaining.forEach(num => {
        if (selected.size < numbersToDraw) {
          selected.add(num);
        }
      });
    }

    return Array.from(selected).slice(0, numbersToDraw).sort((a, b) => a - b);
  }
}
