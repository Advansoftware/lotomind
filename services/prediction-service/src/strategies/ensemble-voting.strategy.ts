import { Injectable } from '@nestjs/common';

@Injectable()
export class EnsembleVotingStrategy {
  name = 'ensemble_voting';
  displayName = 'Ensemble Voting';

  async predict(historicalDraws: any[], config: any, strategies: any[]): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;

    // Get predictions from all strategies
    const allPredictions: number[][] = [];
    const strategyWeights = new Map<string, number>();

    // Use top 5 performing strategies (weights would come from performance tracking)
    const topStrategies = strategies.slice(0, 5);

    for (const strategy of topStrategies) {
      try {
        const prediction = await strategy.predict(historicalDraws, config);
        allPredictions.push(prediction);

        // Weight based on recent performance (mock - would come from database)
        strategyWeights.set(strategy.name, 1.0);
      } catch (error) {
        console.error(`Strategy ${strategy.name} failed:`, error);
      }
    }

    // Count votes for each number (weighted)
    const votes = new Map<number, number>();

    for (let num = minNumber; num <= maxNumber; num++) {
      votes.set(num, 0);
    }

    allPredictions.forEach((prediction, index) => {
      const strategy = topStrategies[index];
      const weight = strategyWeights.get(strategy.name) || 1.0;

      prediction.forEach((num: number) => {
        votes.set(num, (votes.get(num) || 0) + weight);
      });
    });

    // Select numbers with most votes
    const selected = Array.from(votes.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num)
      .slice(0, numbersToDraw);

    return selected.sort((a, b) => a - b);
  }
}
