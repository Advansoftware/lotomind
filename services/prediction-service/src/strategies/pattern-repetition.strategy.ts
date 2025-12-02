import { Injectable } from '@nestjs/common';

@Injectable()
export class PatternRepetitionStrategy {
  name = 'pattern_repetition';
  displayName = 'Pattern Repetition';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const lookbackWindow = config.lookbackWindow || 100;
    const recentDraws = historicalDraws.slice(0, lookbackWindow);

    // Track pair and triplet frequencies
    const pairFrequency = new Map<string, number>();
    const tripletFrequency = new Map<string, number>();

    recentDraws.forEach((draw) => {
      const numbers = [...draw.numbers].sort((a: number, b: number) => a - b);

      // Count pairs
      for (let i = 0; i < numbers.length - 1; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const pair = `${numbers[i]}-${numbers[j]}`;
          pairFrequency.set(pair, (pairFrequency.get(pair) || 0) + 1);
        }
      }

      // Count triplets
      for (let i = 0; i < numbers.length - 2; i++) {
        for (let j = i + 1; j < numbers.length - 1; j++) {
          for (let k = j + 1; k < numbers.length; k++) {
            const triplet = `${numbers[i]}-${numbers[j]}-${numbers[k]}`;
            tripletFrequency.set(triplet, (tripletFrequency.get(triplet) || 0) + 1);
          }
        }
      }
    });

    // Find most frequent patterns
    const topPairs = Array.from(pairFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topTriplets = Array.from(tripletFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Extract numbers from top patterns
    const selectedNumbers = new Set<number>();

    // Add numbers from top triplet
    if (topTriplets.length > 0) {
      const triplet = topTriplets[0][0].split('-').map(Number);
      triplet.forEach(num => selectedNumbers.add(num));
    }

    // Add numbers from top pairs
    for (const [pair] of topPairs) {
      if (selectedNumbers.size >= numbersToDraw) break;
      const numbers = pair.split('-').map(Number);
      numbers.forEach(num => selectedNumbers.add(num));
    }

    // If still need more numbers, add from individual frequency
    if (selectedNumbers.size < numbersToDraw) {
      const individualFreq = new Map<number, number>();
      recentDraws.forEach((draw) => {
        draw.numbers.forEach((num: number) => {
          individualFreq.set(num, (individualFreq.get(num) || 0) + 1);
        });
      });

      const additional = Array.from(individualFreq.entries())
        .filter(([num]) => !selectedNumbers.has(num))
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => num);

      additional.forEach(num => {
        if (selectedNumbers.size < numbersToDraw) {
          selectedNumbers.add(num);
        }
      });
    }

    return Array.from(selectedNumbers).slice(0, numbersToDraw).sort((a, b) => a - b);
  }
}
