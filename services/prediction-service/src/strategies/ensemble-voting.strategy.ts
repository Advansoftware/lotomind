import { Injectable } from '@nestjs/common';

@Injectable()
export class EnsembleVotingStrategy {
  name = 'ensemble_voting';
  displayName = 'Ensemble Voting';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;

    // Validate input
    if (!historicalDraws || historicalDraws.length === 0) {
      return this.generateRandomNumbers(numbersToDraw, minNumber, maxNumber);
    }

    // Build ensemble from multiple analysis methods
    const votes = new Map<number, number>();

    for (let num = minNumber; num <= maxNumber; num++) {
      votes.set(num, 0);
    }

    // Method 1: Frequency-based voting (weight: 2)
    const frequencyScores = this.calculateFrequency(historicalDraws, minNumber, maxNumber);
    frequencyScores.forEach((score, num) => {
      votes.set(num, (votes.get(num) || 0) + score * 2);
    });

    // Method 2: Delay-based voting (weight: 1.5)
    const delayScores = this.calculateDelay(historicalDraws, minNumber, maxNumber);
    delayScores.forEach((score, num) => {
      votes.set(num, (votes.get(num) || 0) + score * 1.5);
    });

    // Method 3: Hot numbers (recent frequency) (weight: 1.5)
    const hotScores = this.calculateHotNumbers(historicalDraws.slice(0, 20), minNumber, maxNumber);
    hotScores.forEach((score, num) => {
      votes.set(num, (votes.get(num) || 0) + score * 1.5);
    });

    // Method 4: Pattern analysis (weight: 1)
    const patternScores = this.analyzePatterns(historicalDraws, minNumber, maxNumber);
    patternScores.forEach((score, num) => {
      votes.set(num, (votes.get(num) || 0) + score);
    });

    // Select numbers with most votes
    const selected = Array.from(votes.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num)
      .slice(0, numbersToDraw);

    return selected.sort((a, b) => a - b);
  }

  private calculateFrequency(draws: any[], min: number, max: number): Map<number, number> {
    const counts = new Map<number, number>();
    const total = draws.length;

    draws.forEach(draw => {
      const numbers = Array.isArray(draw.numbers) ? draw.numbers : [];
      numbers.forEach((num: number) => {
        counts.set(num, (counts.get(num) || 0) + 1);
      });
    });

    // Normalize to 0-1
    const result = new Map<number, number>();
    for (let num = min; num <= max; num++) {
      result.set(num, (counts.get(num) || 0) / total);
    }
    return result;
  }

  private calculateDelay(draws: any[], min: number, max: number): Map<number, number> {
    const lastSeen = new Map<number, number>();

    // Find last appearance of each number
    draws.forEach((draw, idx) => {
      const numbers = Array.isArray(draw.numbers) ? draw.numbers : [];
      numbers.forEach((num: number) => {
        if (!lastSeen.has(num)) {
          lastSeen.set(num, idx);
        }
      });
    });

    // Convert to score (longer delay = higher score)
    const result = new Map<number, number>();
    const maxDelay = draws.length;

    for (let num = min; num <= max; num++) {
      const delay = lastSeen.has(num) ? lastSeen.get(num)! : maxDelay;
      result.set(num, delay / maxDelay); // Normalize to 0-1
    }
    return result;
  }

  private calculateHotNumbers(recentDraws: any[], min: number, max: number): Map<number, number> {
    return this.calculateFrequency(recentDraws, min, max);
  }

  private analyzePatterns(draws: any[], min: number, max: number): Map<number, number> {
    const result = new Map<number, number>();

    // Analyze last 5 draws for patterns
    const recent = draws.slice(0, 5);
    const allNumbers: number[] = [];

    recent.forEach(draw => {
      const numbers = Array.isArray(draw.numbers) ? draw.numbers : [];
      allNumbers.push(...numbers);
    });

    // Count appearances in recent draws
    for (let num = min; num <= max; num++) {
      const count = allNumbers.filter(n => n === num).length;
      // Favor numbers that appear 1-2 times (not too hot, not too cold)
      const score = count === 1 || count === 2 ? 1 : count === 0 ? 0.5 : 0.3;
      result.set(num, score);
    }

    return result;
  }

  private generateRandomNumbers(count: number, min: number, max: number): number[] {
    const numbers: number[] = [];
    while (numbers.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  }
}
