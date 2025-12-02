import { Injectable } from '@nestjs/common';

@Injectable()
export class DelayStrategy {
  name = 'delay';
  displayName = 'Delay/Latency Analysis';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;

    // Calculate delay (draws since last appearance) for each number
    const delays = new Map<number, number>();

    for (let num = minNumber; num <= maxNumber; num++) {
      let delay = 0;
      for (const draw of historicalDraws) {
        if (draw.numbers.includes(num)) {
          break;
        }
        delay++;
      }
      delays.set(num, delay);
    }

    // Sort by delay (highest first) and return top N
    const sorted = Array.from(delays.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    return sorted.slice(0, numbersToDraw);
  }
}
