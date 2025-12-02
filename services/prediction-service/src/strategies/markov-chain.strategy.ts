import { Injectable } from '@nestjs/common';

@Injectable()
export class MarkovChainStrategy {
  name = 'markov_chain';
  displayName = 'Markov Chain';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const recentDraws = historicalDraws.slice(0, config.windowSize || 100);

    // Build transition matrix: probability of number B appearing after number A
    const transitions = new Map<number, Map<number, number>>();

    for (let num = minNumber; num <= maxNumber; num++) {
      transitions.set(num, new Map());
    }

    // Count transitions
    for (let i = 0; i < recentDraws.length - 1; i++) {
      const currentDraw = recentDraws[i].numbers;
      const nextDraw = recentDraws[i + 1].numbers;

      currentDraw.forEach((currentNum: number) => {
        nextDraw.forEach((nextNum: number) => {
          const transitionMap = transitions.get(currentNum);
          if (transitionMap) {
            transitionMap.set(nextNum, (transitionMap.get(nextNum) || 0) + 1);
          }
        });
      });
    }

    // Normalize to probabilities
    transitions.forEach((transitionMap, fromNum) => {
      const total = Array.from(transitionMap.values()).reduce((a, b) => a + b, 0);
      if (total > 0) {
        transitionMap.forEach((count, toNum) => {
          transitionMap.set(toNum, count / total);
        });
      }
    });

    // Start from most recent draw
    const lastDraw = recentDraws[0].numbers;
    const selected = new Set<number>();

    // Calculate probability for each number based on last draw
    const probabilities = new Map<number, number>();

    for (let num = minNumber; num <= maxNumber; num++) {
      let totalProb = 0;
      lastDraw.forEach((lastNum: number) => {
        const transitionMap = transitions.get(lastNum);
        if (transitionMap) {
          totalProb += transitionMap.get(num) || 0;
        }
      });
      probabilities.set(num, totalProb / lastDraw.length);
    }

    // Select numbers with highest transition probabilities
    const candidates = Array.from(probabilities.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    return candidates.slice(0, numbersToDraw);
  }
}
