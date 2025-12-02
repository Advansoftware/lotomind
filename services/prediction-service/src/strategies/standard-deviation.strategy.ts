import { Injectable } from '@nestjs/common';

@Injectable()
export class StandardDeviationStrategy {
  name = 'standard_deviation';
  displayName = 'Standard Deviation';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const numbersToDraw = config.numbersToDraw || 6;
    const recentDraws = historicalDraws.slice(0, config.windowSize || 50);

    // Calculate frequency for each number
    const frequency = new Map<number, number>();
    for (let num = minNumber; num <= maxNumber; num++) {
      frequency.set(num, 0);
    }

    recentDraws.forEach((draw) => {
      draw.numbers.forEach((num: number) => {
        frequency.set(num, (frequency.get(num) || 0) + 1);
      });
    });

    // Calculate mean and standard deviation
    const frequencies = Array.from(frequency.values());
    const mean = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
    const variance = frequencies.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) / frequencies.length;
    const stdDev = Math.sqrt(variance);

    // Identify numbers within optimal deviation range
    // We want numbers that are 0.5 to 1.5 standard deviations above mean
    const optimalMin = mean + (stdDev * 0.5);
    const optimalMax = mean + (stdDev * 1.5);

    const candidates = Array.from(frequency.entries())
      .filter(([_, freq]) => freq >= optimalMin && freq <= optimalMax)
      .sort((a, b) => {
        // Prefer numbers closer to 1 std dev above mean
        const targetFreq = mean + stdDev;
        return Math.abs(b[1] - targetFreq) - Math.abs(a[1] - targetFreq);
      })
      .map(([num]) => num);

    // If not enough candidates, add numbers just above mean
    if (candidates.length < numbersToDraw) {
      const additional = Array.from(frequency.entries())
        .filter(([num]) => !candidates.includes(num))
        .filter(([_, freq]) => freq > mean)
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => num);

      candidates.push(...additional);
    }

    return candidates.slice(0, numbersToDraw);
  }
}
