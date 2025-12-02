import { Injectable } from '@nestjs/common';

@Injectable()
export class RandomForestStrategy {
  name = 'random_forest';
  displayName = 'Random Forest';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const numTrees = config.numTrees || 10;

    // Build multiple decision trees (simplified random forest)
    const trees: Map<number, number>[] = [];

    for (let t = 0; t < numTrees; t++) {
      const tree = new Map<number, number>();

      // Sample random subset of historical draws (bootstrap)
      const sampleSize = Math.floor(historicalDraws.length * 0.7);
      const sample: any[] = [];

      for (let i = 0; i < sampleSize; i++) {
        const randomIndex = Math.floor(Math.random() * historicalDraws.length);
        sample.push(historicalDraws[randomIndex]);
      }

      // Build decision tree based on features
      for (let num = minNumber; num <= maxNumber; num++) {
        let score = 0;

        // Feature 1: Frequency in sample
        const frequency = sample.filter(draw =>
          draw.numbers.includes(num)
        ).length;
        score += frequency * 2;

        // Feature 2: Recent appearances
        const recentAppearances = sample.slice(0, 20).filter(draw =>
          draw.numbers.includes(num)
        ).length;
        score += recentAppearances * 3;

        // Feature 3: Gap analysis
        let lastSeen = -1;
        for (let i = 0; i < sample.length; i++) {
          if (sample[i].numbers.includes(num)) {
            lastSeen = i;
            break;
          }
        }
        if (lastSeen >= 0 && lastSeen < 10) {
          score += 5;
        }

        // Feature 4: Odd/Even balance
        const isOdd = num % 2 !== 0;
        const avgOddCount = sample.reduce((sum, draw) => {
          return sum + draw.numbers.filter((n: number) => n % 2 !== 0).length;
        }, 0) / sample.length;

        if ((isOdd && avgOddCount > 3) || (!isOdd && avgOddCount < 3)) {
          score += 2;
        }

        tree.set(num, score);
      }

      trees.push(tree);
    }

    // Aggregate predictions from all trees (voting)
    const aggregatedScores = new Map<number, number>();

    for (let num = minNumber; num <= maxNumber; num++) {
      let totalScore = 0;
      trees.forEach(tree => {
        totalScore += tree.get(num) || 0;
      });
      aggregatedScores.set(num, totalScore / numTrees);
    }

    // Select top numbers
    const candidates = Array.from(aggregatedScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    return candidates.slice(0, numbersToDraw);
  }
}
