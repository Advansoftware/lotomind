import { Injectable } from '@nestjs/common';

@Injectable()
export class BayesianStrategy {
  name = 'bayesian';
  displayName = 'Bayesian Inference';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;

    // Prior probability (uniform distribution)
    const prior = 1 / (maxNumber - minNumber + 1);

    // Calculate likelihood based on recent draws
    const recentDraws = historicalDraws.slice(0, 50);
    const likelihood = new Map<number, number>();

    for (let num = minNumber; num <= maxNumber; num++) {
      likelihood.set(num, 0);
    }

    recentDraws.forEach((draw) => {
      draw.numbers.forEach((num: number) => {
        likelihood.set(num, (likelihood.get(num) || 0) + 1);
      });
    });

    // Normalize likelihood
    const totalOccurrences = Array.from(likelihood.values()).reduce((a, b) => a + b, 0);
    likelihood.forEach((count, num) => {
      likelihood.set(num, count / totalOccurrences);
    });

    // Calculate posterior probability using Bayes' theorem
    // P(number|data) = P(data|number) * P(number) / P(data)
    const posterior = new Map<number, number>();
    let evidenceSum = 0;

    // Calculate evidence (marginal probability)
    for (let num = minNumber; num <= maxNumber; num++) {
      const likelihoodValue = likelihood.get(num) || 0;
      evidenceSum += likelihoodValue * prior;
    }

    // Calculate posterior for each number
    for (let num = minNumber; num <= maxNumber; num++) {
      const likelihoodValue = likelihood.get(num) || 0;
      const posteriorProb = (likelihoodValue * prior) / (evidenceSum || 1);
      posterior.set(num, posteriorProb);
    }

    // Update with evidence from patterns (e.g., odd/even distribution)
    const recentOddCount = recentDraws.reduce((sum, draw) => {
      return sum + draw.numbers.filter((n: number) => n % 2 !== 0).length;
    }, 0);
    const avgOddCount = recentOddCount / recentDraws.length;

    // Adjust posterior based on odd/even pattern
    posterior.forEach((prob, num) => {
      let adjustment = 1.0;

      // Favor numbers that maintain historical odd/even balance
      const isOdd = num % 2 !== 0;
      if (isOdd && avgOddCount > numbersToDraw / 2) {
        adjustment = 1.1;
      } else if (!isOdd && avgOddCount < numbersToDraw / 2) {
        adjustment = 1.1;
      }

      posterior.set(num, prob * adjustment);
    });

    // Normalize posterior
    const posteriorSum = Array.from(posterior.values()).reduce((a, b) => a + b, 0);
    posterior.forEach((prob, num) => {
      posterior.set(num, prob / posteriorSum);
    });

    // Select numbers with highest posterior probability
    const candidates = Array.from(posterior.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    return candidates.slice(0, numbersToDraw);
  }
}
