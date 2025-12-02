import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) { }

  async getDashboardMetrics(lotteryType: string = 'megasena'): Promise<{
    totalPredictions: number;
    avgAccuracy: number;
    bestStrategy: string;
    totalHits: number;
    recentPerformance: any[];
  }> {
    try {
      // Get lottery type ID
      const lotteryTypeResult = await this.dataSource.query(
        'SELECT id FROM lottery_types WHERE name = ? LIMIT 1',
        [lotteryType]
      );

      if (!lotteryTypeResult || lotteryTypeResult.length === 0) {
        throw new Error(`Lottery type ${lotteryType} not found`);
      }

      const lotteryTypeId = lotteryTypeResult[0].id;

      // Get total predictions
      const totalPredictionsResult = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM predictions WHERE lottery_type_id = ?',
        [lotteryTypeId]
      );
      const totalPredictions = totalPredictionsResult[0]?.count || 0;

      // Get average accuracy
      const avgAccuracyResult = await this.dataSource.query(
        'SELECT AVG(hits) / 6 as avg FROM predictions WHERE lottery_type_id = ? AND status = "checked"',
        [lotteryTypeId]
      );
      const avgAccuracy = avgAccuracyResult[0]?.avg || 0;

      // Get best strategy
      const bestStrategyResult = await this.dataSource.query(
        `SELECT s.name, AVG(p.hits) as avg_hits 
         FROM predictions p 
         JOIN strategies s ON p.strategy_id = s.id 
         WHERE p.lottery_type_id = ? AND p.status = 'checked'
         GROUP BY s.id 
         ORDER BY avg_hits DESC 
         LIMIT 1`,
        [lotteryTypeId]
      );
      const bestStrategy = bestStrategyResult[0]?.name || 'N/A';

      // Get total hits
      const totalHitsResult = await this.dataSource.query(
        'SELECT SUM(hits) as total FROM predictions WHERE lottery_type_id = ? AND status = "checked"',
        [lotteryTypeId]
      );
      const totalHits = totalHitsResult[0]?.total || 0;

      // Get recent performance
      const recentPerformance = await this.dataSource.query(
        `SELECT DATE(created_at) as date, AVG(hits) as hits, s.name as strategy
         FROM predictions p
         JOIN strategies s ON p.strategy_id = s.id
         WHERE p.lottery_type_id = ? AND p.status = 'checked'
         GROUP BY DATE(created_at), s.id
         ORDER BY created_at DESC
         LIMIT 10`,
        [lotteryTypeId]
      );

      return {
        totalPredictions,
        avgAccuracy: parseFloat(avgAccuracy.toFixed(2)),
        bestStrategy,
        totalHits,
        recentPerformance,
      };
    } catch (error) {
      this.logger.error(`Error getting dashboard metrics: ${error.message}`);
      // Return empty data if no predictions yet
      return {
        totalPredictions: 0,
        avgAccuracy: 0,
        bestStrategy: 'N/A',
        totalHits: 0,
        recentPerformance: [],
      };
    }
  }

  async getStrategyComparison(lotteryType: string = 'megasena'): Promise<any[]> {
    try {
      const lotteryTypeResult = await this.dataSource.query(
        'SELECT id FROM lottery_types WHERE name = ? LIMIT 1',
        [lotteryType]
      );

      if (!lotteryTypeResult || lotteryTypeResult.length === 0) {
        return [];
      }

      const lotteryTypeId = lotteryTypeResult[0].id;

      const results = await this.dataSource.query(
        `SELECT 
          s.name as strategy,
          s.display_name as displayName,
          AVG(br.avg_hits) as avgHits,
          AVG(br.hit_rate) as hitRate,
          SUM(br.total_predictions) as totalPredictions
         FROM backtest_results br
         JOIN strategies s ON br.strategy_id = s.id
         WHERE br.lottery_type_id = ?
         GROUP BY s.id
         ORDER BY avgHits DESC`,
        [lotteryTypeId]
      );

      return results;
    } catch (error) {
      this.logger.error(`Error getting strategy comparison: ${error.message}`);
      return [];
    }
  }

  async getHotColdNumbers(lotteryType: string = 'megasena'): Promise<{
    hot: Array<{ number: number; frequency: number }>;
    cold: Array<{ number: number; frequency: number }>;
  }> {
    try {
      const lotteryTypeResult = await this.dataSource.query(
        'SELECT id FROM lottery_types WHERE name = ? LIMIT 1',
        [lotteryType]
      );

      if (!lotteryTypeResult || lotteryTypeResult.length === 0) {
        return { hot: [], cold: [] };
      }

      const lotteryTypeId = lotteryTypeResult[0].id;

      const hot = await this.dataSource.query(
        `SELECT number, frequency 
         FROM number_frequency 
         WHERE lottery_type_id = ? 
         ORDER BY frequency DESC 
         LIMIT 10`,
        [lotteryTypeId]
      );

      const cold = await this.dataSource.query(
        `SELECT number, frequency 
         FROM number_frequency 
         WHERE lottery_type_id = ? 
         ORDER BY frequency ASC 
         LIMIT 10`,
        [lotteryTypeId]
      );

      return { hot, cold };
    } catch (error) {
      this.logger.error(`Error getting hot/cold numbers: ${error.message}`);
      return { hot: [], cold: [] };
    }
  }

  async getNumberFrequencyDistribution(lotteryType: string = 'megasena'): Promise<any[]> {
    try {
      const lotteryTypeResult = await this.dataSource.query(
        'SELECT id FROM lottery_types WHERE name = ? LIMIT 1',
        [lotteryType]
      );

      if (!lotteryTypeResult || lotteryTypeResult.length === 0) {
        return [];
      }

      const lotteryTypeId = lotteryTypeResult[0].id;

      const distribution = await this.dataSource.query(
        `SELECT number, frequency, delay as lastAppearance 
         FROM number_frequency 
         WHERE lottery_type_id = ? 
         ORDER BY number ASC`,
        [lotteryTypeId]
      );

      return distribution;
    } catch (error) {
      this.logger.error(`Error getting number frequency: ${error.message}`);
      return [];
    }
  }

  async getPredictionAccuracyTrend(
    lotteryType: string = 'megasena',
    days: number = 30
  ): Promise<any[]> {
    try {
      const lotteryTypeResult = await this.dataSource.query(
        'SELECT id FROM lottery_types WHERE name = ? LIMIT 1',
        [lotteryType]
      );

      if (!lotteryTypeResult || lotteryTypeResult.length === 0) {
        return [];
      }

      const lotteryTypeId = lotteryTypeResult[0].id;

      const trend = await this.dataSource.query(
        `SELECT 
          DATE(created_at) as date,
          AVG(hits) / 6 as accuracy,
          COUNT(*) as predictions
         FROM predictions
         WHERE lottery_type_id = ? 
           AND status = 'checked'
           AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [lotteryTypeId, days]
      );

      return trend;
    } catch (error) {
      this.logger.error(`Error getting accuracy trend: ${error.message}`);
      return [];
    }
  }

  async getStrategyPerformanceHistory(
    strategyName: string,
    lotteryType: string = 'megasena'
  ): Promise<any[]> {
    try {
      const results = await this.dataSource.query(
        `SELECT 
          sp.period,
          sp.avg_hits as avgHits,
          sp.hit_rate as hitRate,
          sp.total_predictions as predictions
         FROM strategy_performance sp
         JOIN strategies s ON sp.strategy_id = s.id
         JOIN lottery_types lt ON sp.lottery_type_id = lt.id
         WHERE s.name = ? AND lt.name = ?
         ORDER BY sp.period DESC
         LIMIT 12`,
        [strategyName, lotteryType]
      );

      return results;
    } catch (error) {
      this.logger.error(`Error getting strategy history: ${error.message}`);
      return [];
    }
  }

  async getTopPredictions(
    lotteryType: string = 'megasena',
    limit: number = 10
  ): Promise<any[]> {
    try {
      const lotteryTypeResult = await this.dataSource.query(
        'SELECT id FROM lottery_types WHERE name = ? LIMIT 1',
        [lotteryType]
      );

      if (!lotteryTypeResult || lotteryTypeResult.length === 0) {
        return [];
      }

      const lotteryTypeId = lotteryTypeResult[0].id;

      const predictions = await this.dataSource.query(
        `SELECT 
          p.target_concurso as concurso,
          s.display_name as strategy,
          p.predicted_numbers as predictedNumbers,
          p.actual_numbers as actualNumbers,
          p.hits,
          DATE(p.created_at) as date
         FROM predictions p
         JOIN strategies s ON p.strategy_id = s.id
         WHERE p.lottery_type_id = ? AND p.status = 'checked'
         ORDER BY p.hits DESC, p.created_at DESC
         LIMIT ?`,
        [lotteryTypeId, limit]
      );

      return predictions;
    } catch (error) {
      this.logger.error(`Error getting top predictions: ${error.message}`);
      return [];
    }
  }

  async calculateStatistics(lotteryType: string = 'megasena'): Promise<{
    totalDraws: number;
    avgSum: number;
    avgOddCount: number;
    avgEvenCount: number;
    mostFrequentNumber: number;
    leastFrequentNumber: number;
  }> {
    try {
      const lotteryTypeResult = await this.dataSource.query(
        'SELECT id FROM lottery_types WHERE name = ? LIMIT 1',
        [lotteryType]
      );

      if (!lotteryTypeResult || lotteryTypeResult.length === 0) {
        return {
          totalDraws: 0,
          avgSum: 0,
          avgOddCount: 0,
          avgEvenCount: 0,
          mostFrequentNumber: 0,
          leastFrequentNumber: 0,
        };
      }

      const lotteryTypeId = lotteryTypeResult[0].id;

      const stats = await this.dataSource.query(
        `SELECT 
          COUNT(*) as totalDraws,
          AVG(sum) as avgSum,
          AVG(odd_count) as avgOddCount,
          AVG(even_count) as avgEvenCount
         FROM draws
         WHERE lottery_type_id = ?`,
        [lotteryTypeId]
      );

      const mostFrequent = await this.dataSource.query(
        `SELECT number 
         FROM number_frequency 
         WHERE lottery_type_id = ? 
         ORDER BY frequency DESC 
         LIMIT 1`,
        [lotteryTypeId]
      );

      const leastFrequent = await this.dataSource.query(
        `SELECT number 
         FROM number_frequency 
         WHERE lottery_type_id = ? 
         ORDER BY frequency ASC 
         LIMIT 1`,
        [lotteryTypeId]
      );

      return {
        totalDraws: stats[0]?.totalDraws || 0,
        avgSum: parseFloat(stats[0]?.avgSum || 0),
        avgOddCount: parseFloat(stats[0]?.avgOddCount || 0),
        avgEvenCount: parseFloat(stats[0]?.avgEvenCount || 0),
        mostFrequentNumber: mostFrequent[0]?.number || 0,
        leastFrequentNumber: leastFrequent[0]?.number || 0,
      };
    } catch (error) {
      this.logger.error(`Error calculating statistics: ${error.message}`);
      return {
        totalDraws: 0,
        avgSum: 0,
        avgOddCount: 0,
        avgEvenCount: 0,
        mostFrequentNumber: 0,
        leastFrequentNumber: 0,
      };
    }
  }
}
