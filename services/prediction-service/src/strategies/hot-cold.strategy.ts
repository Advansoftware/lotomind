import { Injectable } from '@nestjs/common';

@Injectable()
export class HotColdStrategy {
  name = 'hot_cold';
  displayName = 'Hot & Cold Numbers';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const recentWindow = config.recentWindow || 20;
    const recentDraws = historicalDraws.slice(0, recentWindow);

    const frequency = new Map<number, number>();
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;

    // Initialize all numbers
    for (let i = minNumber; i <= maxNumber; i++) {
      frequency.set(i, 0);
    }

    // Count frequency in recent draws
    recentDraws.forEach((draw) => {
      draw.numbers.forEach((num: number) => {
        frequency.set(num, (frequency.get(num) || 0) + 1);
      });
    });

    // Calculate average frequency
    const avgFrequency = Array.from(frequency.values()).reduce((a, b) => a + b, 0) / frequency.size;

    // Identify hot and cold numbers
    const hot: number[] = [];
    const cold: number[] = [];

    frequency.forEach((freq, num) => {
      if (freq > avgFrequency * 1.2) {
        hot.push(num);
      } else if (freq < avgFrequency * 0.5) {
        cold.push(num);
      }
    });

    // Balance selection: 60% hot, 40% cold
    const numbersToDraw = config.numbersToDraw || 6;
    const hotCount = Math.ceil(numbersToDraw * 0.6);
    const coldCount = numbersToDraw - hotCount;

    // Sort hot by frequency (descending) and cold by frequency (ascending)
    const hotSorted = hot.sort((a, b) => (frequency.get(b) || 0) - (frequency.get(a) || 0));
    const coldSorted = cold.sort((a, b) => (frequency.get(a) || 0) - (frequency.get(b) || 0));

    const selected = [
      ...hotSorted.slice(0, hotCount),
      ...coldSorted.slice(0, coldCount),
    ];

    // If not enough numbers, fill with medium frequency numbers
    if (selected.length < numbersToDraw) {
      const medium = Array.from(frequency.entries())
        .filter(([num]) => !selected.includes(num))
        .sort((a, b) => Math.abs(b[1] - avgFrequency) - Math.abs(a[1] - avgFrequency))
        .map(([num]) => num);

      selected.push(...medium.slice(0, numbersToDraw - selected.length));
    }

    return selected.slice(0, numbersToDraw).sort((a, b) => a - b);
  }
}
