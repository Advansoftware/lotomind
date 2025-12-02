import { Injectable } from '@nestjs/common';

@Injectable()
export class MovingAverageStrategy {
  name = 'moving_average';
  displayName = 'Moving Average';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const windowSize = config.windowSize || 10;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const numbersToDraw = config.numbersToDraw || 6;

    // Calculate moving average for each number
    const movingAverages = new Map<number, number[]>();

    for (let num = minNumber; num <= maxNumber; num++) {
      movingAverages.set(num, []);
    }

    // Calculate frequency in sliding windows
    for (let i = 0; i < historicalDraws.length - windowSize; i++) {
      const window = historicalDraws.slice(i, i + windowSize);
      const windowFreq = new Map<number, number>();

      for (let num = minNumber; num <= maxNumber; num++) {
        windowFreq.set(num, 0);
      }

      window.forEach((draw: any) => {
        draw.numbers.forEach((num: number) => {
          windowFreq.set(num, (windowFreq.get(num) || 0) + 1);
        });
      });

      // Store frequency for this window
      windowFreq.forEach((freq, num) => {
        movingAverages.get(num)?.push(freq);
      });
    }

    // Calculate average and trend for each number
    const numberScores = new Map<number, { avg: number; trend: number }>();

    movingAverages.forEach((frequencies, num) => {
      if (frequencies.length === 0) {
        numberScores.set(num, { avg: 0, trend: 0 });
        return;
      }

      const avg = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;

      // Calculate trend (positive = increasing frequency)
      const recentAvg = frequencies.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, frequencies.length);
      const olderAvg = frequencies.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(5, frequencies.length);
      const trend = recentAvg - olderAvg;

      numberScores.set(num, { avg, trend });
    });

    // Select numbers with positive trend and above-average frequency
    const candidates = Array.from(numberScores.entries())
      .filter(([_, score]) => score.trend > 0 || score.avg > 1)
      .sort((a, b) => {
        // Prioritize trend, then average
        const trendDiff = b[1].trend - a[1].trend;
        if (Math.abs(trendDiff) > 0.1) return trendDiff;
        return b[1].avg - a[1].avg;
      })
      .map(([num]) => num);

    return candidates.slice(0, numbersToDraw);
  }
}
