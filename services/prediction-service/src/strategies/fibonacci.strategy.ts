import { Injectable } from '@nestjs/common';

@Injectable()
export class FibonacciStrategy {
  name = 'fibonacci';
  displayName = 'Fibonacci Sequence';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;

    // Generate Fibonacci sequence up to maxNumber
    const fibonacci: number[] = [1, 1];
    while (fibonacci[fibonacci.length - 1] < maxNumber) {
      const next = fibonacci[fibonacci.length - 1] + fibonacci[fibonacci.length - 2];
      if (next <= maxNumber) {
        fibonacci.push(next);
      } else {
        break;
      }
    }

    // Calculate frequency of all numbers
    const frequency = new Map<number, number>();
    const recentDraws = historicalDraws.slice(0, 50);

    for (let num = minNumber; num <= maxNumber; num++) {
      frequency.set(num, 0);
    }

    recentDraws.forEach((draw) => {
      draw.numbers.forEach((num: number) => {
        frequency.set(num, (frequency.get(num) || 0) + 1);
      });
    });

    // Prioritize Fibonacci numbers with good frequency
    const fibonacciWithFreq = fibonacci
      .filter(num => num >= minNumber && num <= maxNumber)
      .map(num => ({ num, freq: frequency.get(num) || 0 }))
      .sort((a, b) => b.freq - a.freq);

    const selected: number[] = [];

    // Select top Fibonacci numbers (aim for 50% of selection)
    const fibCount = Math.ceil(numbersToDraw / 2);
    fibonacciWithFreq.slice(0, fibCount).forEach(({ num }) => {
      selected.push(num);
    });

    // Fill remaining with high-frequency non-Fibonacci numbers
    if (selected.length < numbersToDraw) {
      const nonFib = Array.from(frequency.entries())
        .filter(([num]) => !fibonacci.includes(num))
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => num);

      nonFib.forEach(num => {
        if (selected.length < numbersToDraw) {
          selected.push(num);
        }
      });
    }

    return selected.slice(0, numbersToDraw).sort((a, b) => a - b);
  }
}
