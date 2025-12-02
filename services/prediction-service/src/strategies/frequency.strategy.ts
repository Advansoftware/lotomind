import { Injectable } from '@nestjs/common';

@Injectable()
export class FrequencyStrategy {
  name = 'frequency';
  displayName = 'Frequency Analysis';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;

    // Count frequency of each number with recency weight
    const frequency = new Map<number, number>();

    historicalDraws.forEach((draw, index) => {
      const recencyWeight = 1 - (index / historicalDraws.length);
      draw.numbers.forEach((num: number) => {
        const current = frequency.get(num) || 0;
        frequency.set(num, current + recencyWeight);
      });
    });

    // Sort by frequency and return top N
    const sorted = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    return sorted.slice(0, numbersToDraw);
  }
}
