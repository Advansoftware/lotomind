import { Injectable, Logger } from '@nestjs/common';
import { BacktestService } from './backtest.service';

@Injectable()
export class StrategySelector {
  private readonly logger = new Logger(StrategySelector.name);

  constructor(private backtestService: BacktestService) { }

  async selectBestStrategy(
    strategies: any[],
    historicalDraws: any[],
    config: {
      lotteryType: string;
      selectionCriteria?: 'hitRate' | 'avgHits' | 'consistency';
    }
  ): Promise<{
    bestStrategy: any;
    allResults: any[];
    reason: string;
  }> {
    this.logger.log(`Selecting best strategy from ${strategies.length} candidates`);

    // Run backtest on all strategies
    const results = await this.backtestService.runComprehensiveBacktest(
      strategies,
      historicalDraws,
      { lotteryType: config.lotteryType, testSize: 100 }
    );

    const criteria = config.selectionCriteria || 'hitRate';
    let bestResult;
    let reason;

    switch (criteria) {
      case 'hitRate':
        bestResult = results[0]; // Already sorted by hit rate
        reason = `Highest hit rate: ${(bestResult.hitRate * 100).toFixed(1)}%`;
        break;

      case 'avgHits':
        bestResult = results.sort((a, b) => b.avgHits - a.avgHits)[0];
        reason = `Highest average hits: ${bestResult.avgHits.toFixed(2)}`;
        break;

      case 'consistency':
        // Prefer strategies with lower variance in hits
        bestResult = results.sort((a, b) => {
          const varianceA = this.calculateVariance(a.hitDistribution);
          const varianceB = this.calculateVariance(b.hitDistribution);
          return varianceA - varianceB;
        })[0];
        reason = `Most consistent performance`;
        break;

      default:
        bestResult = results[0];
        reason = `Default selection (hit rate)`;
    }

    const bestStrategy = strategies.find(s => s.name === bestResult.strategy);

    this.logger.log(`Selected: ${bestResult.displayName} - ${reason}`);

    return {
      bestStrategy,
      allResults: results,
      reason,
    };
  }

  async getTopStrategies(
    strategies: any[],
    historicalDraws: any[],
    config: {
      lotteryType: string;
      topN?: number;
    }
  ): Promise<any[]> {
    const results = await this.backtestService.runComprehensiveBacktest(
      strategies,
      historicalDraws,
      { lotteryType: config.lotteryType }
    );

    const topN = config.topN || 5;
    return results.slice(0, topN);
  }

  async evaluateStrategyPerformance(
    strategy: any,
    historicalDraws: any[],
    config: {
      lotteryType: string;
      recentWindow?: number;
    }
  ): Promise<{
    recentPerformance: number;
    overallPerformance: number;
    trend: 'improving' | 'stable' | 'declining';
    recommendation: 'use' | 'monitor' | 'avoid';
  }> {
    const recentWindow = config.recentWindow || 20;

    // Test on recent draws
    const recentResult = await this.backtestService.runBacktest(
      strategy,
      historicalDraws,
      {
        lotteryType: config.lotteryType,
        endIndex: recentWindow,
      }
    );

    // Test on older draws
    const olderResult = await this.backtestService.runBacktest(
      strategy,
      historicalDraws,
      {
        lotteryType: config.lotteryType,
        startIndex: recentWindow,
        endIndex: recentWindow * 2,
      }
    );

    const recentPerformance = recentResult.hitRate;
    const overallPerformance = (recentResult.hitRate + olderResult.hitRate) / 2;

    // Determine trend
    let trend: 'improving' | 'stable' | 'declining';
    const performanceDiff = recentPerformance - olderResult.hitRate;

    if (performanceDiff > 0.05) {
      trend = 'improving';
    } else if (performanceDiff < -0.05) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    // Make recommendation
    let recommendation: 'use' | 'monitor' | 'avoid';
    if (recentPerformance > 0.3 && trend !== 'declining') {
      recommendation = 'use';
    } else if (recentPerformance > 0.2) {
      recommendation = 'monitor';
    } else {
      recommendation = 'avoid';
    }

    return {
      recentPerformance,
      overallPerformance,
      trend,
      recommendation,
    };
  }

  private calculateVariance(hitDistribution: { [key: number]: number }): number {
    const values = Object.values(hitDistribution);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }
}
