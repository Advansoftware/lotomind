import { Injectable } from '@nestjs/common';

@Injectable()
export class GapAnalysisStrategy {
  name = 'gap_analysis';
  displayName = 'Gap Analysis';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;

    // Track gaps between consecutive appearances for each number
    const gaps = new Map<number, number[]>();
    const lastSeen = new Map<number, number>();

    for (let num = minNumber; num <= maxNumber; num++) {
      gaps.set(num, []);
      lastSeen.set(num, -1);
    }

    // Calculate gaps
    historicalDraws.forEach((draw, index) => {
      draw.numbers.forEach((num: number) => {
        const last = lastSeen.get(num);
        if (last !== undefined && last >= 0) {
          const gap = index - last;
          gaps.get(num)?.push(gap);
        }
        lastSeen.set(num, index);
      });
    });

    // Calculate average gap and current gap for each number
    const numberScores = new Map<number, { avgGap: number; currentGap: number; score: number }>();

    gaps.forEach((gapList, num) => {
      if (gapList.length === 0) {
        numberScores.set(num, { avgGap: 0, currentGap: historicalDraws.length, score: 0 });
        return;
      }

      const avgGap = gapList.reduce((a, b) => a + b, 0) / gapList.length;
      const currentGap = lastSeen.get(num) !== undefined ? lastSeen.get(num)! : historicalDraws.length;

      // Score: numbers whose current gap is close to or exceeds average gap
      const score = currentGap / (avgGap || 1);

      numberScores.set(num, { avgGap, currentGap, score });
    });

    // Select numbers with highest scores (current gap >= average gap)
    const candidates = Array.from(numberScores.entries())
      .filter(([_, data]) => data.score >= 0.8) // Current gap is at least 80% of average
      .sort((a, b) => b[1].score - a[1].score)
      .map(([num]) => num);

    return candidates.slice(0, numbersToDraw);
  }
}
