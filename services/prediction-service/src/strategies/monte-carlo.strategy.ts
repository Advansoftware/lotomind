import { Injectable } from '@nestjs/common';

@Injectable()
export class MonteCarloStrategy {
  name = 'monte_carlo';
  displayName = 'Monte Carlo Simulation';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const simulations = config.simulations || 10000;

    // Calculate historical probabilities for each number
    const frequency = new Map<number, number>();
    const recentDraws = historicalDraws.slice(0, 100);

    for (let num = minNumber; num <= maxNumber; num++) {
      frequency.set(num, 0);
    }

    recentDraws.forEach((draw) => {
      draw.numbers.forEach((num: number) => {
        frequency.set(num, (frequency.get(num) || 0) + 1);
      });
    });

    // Convert to probabilities
    const totalDraws = recentDraws.length;
    const probabilities = new Map<number, number>();
    frequency.forEach((count, num) => {
      probabilities.set(num, count / totalDraws);
    });

    // Run Monte Carlo simulations
    const simulationResults = new Map<number, number>();
    for (let num = minNumber; num <= maxNumber; num++) {
      simulationResults.set(num, 0);
    }

    for (let sim = 0; sim < simulations; sim++) {
      const selected = new Set<number>();

      while (selected.size < numbersToDraw) {
        // Weighted random selection based on probabilities
        const rand = Math.random();
        let cumulative = 0;

        for (let num = minNumber; num <= maxNumber; num++) {
          if (selected.has(num)) continue;

          cumulative += probabilities.get(num) || 0;
          if (rand <= cumulative) {
            selected.add(num);
            break;
          }
        }

        // Fallback: random selection if probability-based fails
        if (selected.size < numbersToDraw) {
          const available = [];
          for (let num = minNumber; num <= maxNumber; num++) {
            if (!selected.has(num)) available.push(num);
          }
          if (available.length > 0) {
            selected.add(available[Math.floor(Math.random() * available.length)]);
          }
        }
      }

      // Count occurrences
      selected.forEach(num => {
        simulationResults.set(num, (simulationResults.get(num) || 0) + 1);
      });
    }

    // Select numbers that appeared most frequently in simulations
    const candidates = Array.from(simulationResults.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    return candidates.slice(0, numbersToDraw);
  }
}
