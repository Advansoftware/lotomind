import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class BacktestService {
  private readonly logger = new Logger(BacktestService.name);

  constructor(
    // Inject repositories when entities are created
    // @InjectRepository(BacktestResult) private backtestRepository: Repository<BacktestResult>,
  ) { }

  async runBacktest(
    strategy: any,
    historicalDraws: any[],
    config: {
      lotteryType: string;
      startIndex?: number;
      endIndex?: number;
      windowSize?: number;
    }
  ): Promise<{
    strategyName: string;
    totalPredictions: number;
    hitDistribution: { [key: number]: number };
    avgHits: number;
    maxHits: number;
    hitRate: number;
    accuracy: number;
    executionTimeMs: number;
  }> {
    const startTime = Date.now();

    const startIndex = config.startIndex || 0;
    const endIndex = config.endIndex || Math.min(100, historicalDraws.length - 1);
    const windowSize = config.windowSize || 50;

    const results: number[] = [];
    const hitDistribution: { [key: number]: number } = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
    };

    this.logger.log(`Running backtest for ${strategy.name} on ${endIndex - startIndex} draws`);

    // For each historical draw, predict using previous draws
    for (let i = startIndex; i < endIndex; i++) {
      try {
        // Get training data (draws before current)
        const trainingData = historicalDraws.slice(i + 1, i + 1 + windowSize);

        if (trainingData.length < 10) continue; // Need minimum data

        // Generate prediction
        const prediction = await strategy.predict(trainingData, {
          numbersToDraw: 6,
          maxNumber: 60,
          minNumber: 1,
          windowSize,
        });

        // Compare with actual draw
        const actualDraw = historicalDraws[i];
        const hits = this.countHits(prediction, actualDraw.numbers);

        results.push(hits);
        hitDistribution[hits] = (hitDistribution[hits] || 0) + 1;

      } catch (error) {
        this.logger.error(`Error in backtest iteration ${i}: ${error.message}`);
      }
    }

    const executionTimeMs = Date.now() - startTime;

    // Calculate metrics
    const totalPredictions = results.length;
    const avgHits = results.reduce((a, b) => a + b, 0) / totalPredictions;
    const maxHits = Math.max(...results);

    // Hit rate: percentage of predictions with at least 4 hits (quadra)
    const successfulPredictions = results.filter(hits => hits >= 4).length;
    const hitRate = successfulPredictions / totalPredictions;

    // Accuracy: average hits / total possible hits
    const accuracy = avgHits / 6;

    this.logger.log(
      `Backtest complete: ${strategy.name} - ` +
      `Avg: ${avgHits.toFixed(2)}, Max: ${maxHits}, ` +
      `Hit Rate: ${(hitRate * 100).toFixed(1)}%, ` +
      `Time: ${executionTimeMs}ms`
    );

    return {
      strategyName: strategy.name,
      totalPredictions,
      hitDistribution,
      avgHits,
      maxHits,
      hitRate,
      accuracy,
      executionTimeMs,
    };
  }

  async runComprehensiveBacktest(
    strategies: any[],
    historicalDraws: any[],
    config: {
      lotteryType: string;
      testSize?: number;
    }
  ): Promise<any[]> {
    this.logger.log(`Running comprehensive backtest on ${strategies.length} strategies`);

    const results = [];

    for (const strategy of strategies) {
      try {
        const result = await this.runBacktest(strategy, historicalDraws, {
          lotteryType: config.lotteryType,
          endIndex: config.testSize || 100,
        });

        results.push({
          strategy: strategy.name,
          displayName: strategy.displayName,
          ...result,
        });

      } catch (error) {
        this.logger.error(`Failed to backtest ${strategy.name}: ${error.message}`);
        results.push({
          strategy: strategy.name,
          displayName: strategy.displayName,
          error: error.message,
        });
      }
    }

    // Sort by hit rate (descending)
    results.sort((a, b) => (b.hitRate || 0) - (a.hitRate || 0));

    // Add ranking
    results.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results;
  }

  private countHits(prediction: number[], actual: number[]): number {
    return prediction.filter(num => actual.includes(num)).length;
  }

  async saveBacktestResults(results: any[]): Promise<void> {
    // TODO: Save to database when entity is created
    this.logger.log(`Saving ${results.length} backtest results to database`);

    // For now, just log the results
    results.forEach(result => {
      this.logger.log(
        `${result.rank}. ${result.displayName}: ` +
        `${(result.hitRate * 100).toFixed(1)}% hit rate, ` +
        `${result.avgHits.toFixed(2)} avg hits`
      );
    });
  }

  calculatePrecisionRecall(hitDistribution: { [key: number]: number }): {
    precision: number;
    recall: number;
    f1Score: number;
  } {
    // For lottery, we consider 4+ hits as "positive" predictions
    const truePositives = (hitDistribution[4] || 0) + (hitDistribution[5] || 0) + (hitDistribution[6] || 0);
    const falsePositives = (hitDistribution[0] || 0) + (hitDistribution[1] || 0) +
      (hitDistribution[2] || 0) + (hitDistribution[3] || 0);

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falsePositives) || 0; // Simplified for lottery
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return { precision, recall, f1Score };
  }
}
