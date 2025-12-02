import { Injectable } from '@nestjs/common';

@Injectable()
export class CycleDetectionStrategy {
  name = 'cycle_detection';
  displayName = 'Cycle Detection (Fourier)';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;

    // Analyze cycles for each number using simplified Fourier-like approach
    const numberScores = new Map<number, number>();

    for (let num = minNumber; num <= maxNumber; num++) {
      // Get appearance positions for this number
      const appearances: number[] = [];
      historicalDraws.forEach((draw, index) => {
        if (draw.numbers.includes(num)) {
          appearances.push(index);
        }
      });

      if (appearances.length < 2) {
        numberScores.set(num, 0);
        continue;
      }

      // Calculate intervals between appearances
      const intervals: number[] = [];
      for (let i = 1; i < appearances.length; i++) {
        intervals.push(appearances[i] - appearances[i - 1]);
      }

      // Detect dominant cycle (most common interval)
      const intervalFrequency = new Map<number, number>();
      intervals.forEach(interval => {
        intervalFrequency.set(interval, (intervalFrequency.get(interval) || 0) + 1);
      });

      // Find most common interval (cycle period)
      let dominantCycle = 0;
      let maxFreq = 0;
      intervalFrequency.forEach((freq, interval) => {
        if (freq > maxFreq) {
          maxFreq = freq;
          dominantCycle = interval;
        }
      });

      // Calculate score based on cycle prediction
      let score = 0;

      if (dominantCycle > 0) {
        const lastAppearance = appearances[0]; // Most recent (index 0)
        const expectedNext = dominantCycle;
        const currentDelay = lastAppearance;

        // Score higher if we're near the expected cycle point
        const cycleDiff = Math.abs(currentDelay - expectedNext);
        const cycleStrength = maxFreq / intervals.length; // How consistent is the cycle

        if (cycleDiff <= 2) {
          // Within 2 draws of expected cycle
          score = 100 * cycleStrength;
        } else if (cycleDiff <= 5) {
          score = 50 * cycleStrength;
        } else {
          score = 10 * cycleStrength;
        }

        // Bonus for very consistent cycles
        if (cycleStrength > 0.6) {
          score *= 1.5;
        }
      }

      // Add frequency bonus
      const frequency = appearances.length;
      score += frequency * 2;

      numberScores.set(num, score);
    }

    // Select top numbers by score
    const candidates = Array.from(numberScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    return candidates.slice(0, numbersToDraw);
  }
}
