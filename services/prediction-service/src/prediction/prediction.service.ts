import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, map } from 'rxjs';
import { BacktestService } from './backtest.service';
import { StrategySelector } from './strategy-selector.service';

// Import all strategies
import { FrequencyStrategy } from '../strategies/frequency.strategy';
import { DelayStrategy } from '../strategies/delay.strategy';
import { HotColdStrategy } from '../strategies/hot-cold.strategy';
import { MovingAverageStrategy } from '../strategies/moving-average.strategy';
import { StandardDeviationStrategy } from '../strategies/standard-deviation.strategy';
import { PatternRepetitionStrategy } from '../strategies/pattern-repetition.strategy';
import { SumRangeStrategy } from '../strategies/sum-range.strategy';
import { OddEvenBalanceStrategy } from '../strategies/odd-even-balance.strategy';
import { GapAnalysisStrategy } from '../strategies/gap-analysis.strategy';
import { FibonacciStrategy } from '../strategies/fibonacci.strategy';
import { MarkovChainStrategy } from '../strategies/markov-chain.strategy';
import { MonteCarloStrategy } from '../strategies/monte-carlo.strategy';
import { BayesianStrategy } from '../strategies/bayesian.strategy';
import { EnsembleVotingStrategy } from '../strategies/ensemble-voting.strategy';
import { GeneticAlgorithmStrategy } from '../strategies/genetic-algorithm.strategy';
import { RandomForestStrategy } from '../strategies/random-forest.strategy';
import { KMeansClusteringStrategy } from '../strategies/kmeans-clustering.strategy';
import { NeuralNetworkStrategy } from '../strategies/neural-network.strategy';
import { CycleDetectionStrategy } from '../strategies/cycle-detection.strategy';
import { AdaptiveHybridStrategy } from '../strategies/adaptive-hybrid.strategy';

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);
  private strategies: any[];

  constructor(
    private httpService: HttpService,
    private backtestService: BacktestService,
    private strategySelector: StrategySelector,
    // Inject all strategies
    private frequencyStrategy: FrequencyStrategy,
    private delayStrategy: DelayStrategy,
    private hotColdStrategy: HotColdStrategy,
    private movingAverageStrategy: MovingAverageStrategy,
    private standardDeviationStrategy: StandardDeviationStrategy,
    private patternRepetitionStrategy: PatternRepetitionStrategy,
    private sumRangeStrategy: SumRangeStrategy,
    private oddEvenBalanceStrategy: OddEvenBalanceStrategy,
    private gapAnalysisStrategy: GapAnalysisStrategy,
    private fibonacciStrategy: FibonacciStrategy,
    private markovChainStrategy: MarkovChainStrategy,
    private monteCarloStrategy: MonteCarloStrategy,
    private bayesianStrategy: BayesianStrategy,
    private ensembleVotingStrategy: EnsembleVotingStrategy,
    private geneticAlgorithmStrategy: GeneticAlgorithmStrategy,
    private randomForestStrategy: RandomForestStrategy,
    private kmeansClusteringStrategy: KMeansClusteringStrategy,
    private neuralNetworkStrategy: NeuralNetworkStrategy,
    private cycleDetectionStrategy: CycleDetectionStrategy,
    private adaptiveHybridStrategy: AdaptiveHybridStrategy,
  ) {
    this.strategies = [
      this.frequencyStrategy,
      this.delayStrategy,
      this.hotColdStrategy,
      this.movingAverageStrategy,
      this.standardDeviationStrategy,
      this.patternRepetitionStrategy,
      this.sumRangeStrategy,
      this.oddEvenBalanceStrategy,
      this.gapAnalysisStrategy,
      this.fibonacciStrategy,
      this.markovChainStrategy,
      this.monteCarloStrategy,
      this.bayesianStrategy,
      this.ensembleVotingStrategy,
      this.geneticAlgorithmStrategy,
      this.randomForestStrategy,
      this.kmeansClusteringStrategy,
      this.neuralNetworkStrategy,
      this.cycleDetectionStrategy,
      this.adaptiveHybridStrategy,
    ];
  }

  async generatePrediction(params: {
    lotteryType: string;
    strategyName?: string;
    targetConcurso?: number;
  }): Promise<{
    lotteryType: string;
    targetConcurso: number;
    strategyName: string;
    predictedNumbers: number[];
    confidenceScore: number;
    generatedAt: Date;
  }> {
    this.logger.log(`Generating prediction for ${params.lotteryType}`);

    // Fetch historical draws
    const historicalDraws = await this.fetchHistoricalDraws(params.lotteryType);

    if (historicalDraws.length < 10) {
      throw new Error('Insufficient historical data for prediction');
    }

    // Select strategy
    let strategy;
    if (params.strategyName) {
      strategy = this.strategies.find(s => s.name === params.strategyName);
      if (!strategy) {
        throw new Error(`Strategy ${params.strategyName} not found`);
      }
    } else {
      // Auto-select best strategy
      const selection = await this.strategySelector.selectBestStrategy(
        this.strategies,
        historicalDraws,
        { lotteryType: params.lotteryType }
      );
      strategy = selection.bestStrategy;
      this.logger.log(`Auto - selected strategy: ${strategy.displayName} `);
    }

    // Generate prediction
    const predictedNumbers = await strategy.predict(historicalDraws, {
      numbersToDraw: 6,
      maxNumber: 60,
      minNumber: 1,
    });

    // Calculate confidence score based on recent backtest
    const backtestResult = await this.backtestService.runBacktest(
      strategy,
      historicalDraws,
      { lotteryType: params.lotteryType, endIndex: 20 }
    );

    const confidenceScore = backtestResult.hitRate;

    // Determine target concurso
    const latestConcurso = historicalDraws[0].concurso;
    const targetConcurso = params.targetConcurso || latestConcurso + 1;

    return {
      lotteryType: params.lotteryType,
      targetConcurso,
      strategyName: strategy.name,
      predictedNumbers,
      confidenceScore,
      generatedAt: new Date(),
    };
  }

  async generateMultiplePredictions(params: {
    lotteryType: string;
    count?: number;
  }): Promise<any[]> {
    const count = params.count || 5;
    const predictions = [];

    // Get top strategies
    const historicalDraws = await this.fetchHistoricalDraws(params.lotteryType);
    const topStrategies = await this.strategySelector.getTopStrategies(
      this.strategies,
      historicalDraws,
      { lotteryType: params.lotteryType, topN: count }
    );

    // Generate prediction with each top strategy
    for (const strategyResult of topStrategies) {
      const prediction = await this.generatePrediction({
        lotteryType: params.lotteryType,
        strategyName: strategyResult.strategy,
      });
      predictions.push(prediction);
    }

    return predictions;
  }

  async runBacktestAll(params: {
    lotteryType: string;
    testSize?: number;
  }): Promise<any[]> {
    this.logger.log(`Running backtest on all ${this.strategies.length} strategies`);

    const historicalDraws = await this.fetchHistoricalDraws(params.lotteryType);

    const results = await this.backtestService.runComprehensiveBacktest(
      this.strategies,
      historicalDraws,
      {
        lotteryType: params.lotteryType,
        testSize: params.testSize,
      }
    );

    // Save results to database
    await this.backtestService.saveBacktestResults(results);

    return results;
  }

  async getStrategyPerformance(params: {
    lotteryType: string;
    strategyName: string;
  }): Promise<any> {
    const strategy = this.strategies.find(s => s.name === params.strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${params.strategyName} not found`);
    }

    const historicalDraws = await this.fetchHistoricalDraws(params.lotteryType);

    return await this.strategySelector.evaluateStrategyPerformance(
      strategy,
      historicalDraws,
      { lotteryType: params.lotteryType }
    );
  }

  async listStrategies(): Promise<any[]> {
    return this.strategies.map(strategy => ({
      name: strategy.name,
      displayName: strategy.displayName,
    }));
  }

  async listPredictions(lotteryType: string, limit: number = 10): Promise<any[]> {
    // Return empty array for now - predictions aren't persisted yet
    // In a full implementation, this would query the predictions table
    return [];
  }

  /**
   * Generate prediction for validation using provided historical data
   * This is used by the validation service to test strategies
   */
  async generatePredictionForValidation(params: {
    lotteryType: string;
    strategyName: string;
    historicalDraws: any[];
  }): Promise<{ predictedNumbers: number[] }> {
    const strategy = this.strategies.find(s => s.name === params.strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${params.strategyName} not found`);
    }

    // Get lottery config
    const config = this.getLotteryConfig(params.lotteryType);

    // Parse historical draws and ensure numbers is always an array
    const parsedDraws = params.historicalDraws
      .map(draw => {
        let numbers = draw.numbers;
        if (typeof numbers === 'string') {
          try {
            numbers = JSON.parse(numbers);
          } catch {
            numbers = [];
          }
        }
        if (!Array.isArray(numbers)) {
          numbers = [];
        }
        return {
          ...draw,
          numbers,
        };
      })
      .filter(draw => draw.numbers.length > 0); // Only include draws with valid numbers

    if (parsedDraws.length < 5) {
      throw new Error('Not enough valid historical data');
    }

    // Generate prediction using the strategy
    const predictedNumbers = await strategy.predict(parsedDraws, config);

    return { predictedNumbers };
  }

  private getLotteryConfig(lotteryType: string) {
    const configs: Record<string, { numbersToDraw: number; maxNumber: number; minNumber: number }> = {
      megasena: { numbersToDraw: 6, maxNumber: 60, minNumber: 1 },
      quina: { numbersToDraw: 5, maxNumber: 80, minNumber: 1 },
      lotofacil: { numbersToDraw: 15, maxNumber: 25, minNumber: 1 },
      lotomania: { numbersToDraw: 20, maxNumber: 100, minNumber: 1 },
      duplasena: { numbersToDraw: 6, maxNumber: 50, minNumber: 1 },
      timemania: { numbersToDraw: 7, maxNumber: 80, minNumber: 1 },
      diadesorte: { numbersToDraw: 7, maxNumber: 31, minNumber: 1 },
    };
    return configs[lotteryType] || configs.megasena;
  }

  private async fetchHistoricalDraws(lotteryType: string): Promise<any[]> {
    try {
      const lotteryServiceUrl = process.env.LOTTERY_SERVICE_URL || 'http://lottery-service:3001';
      const response = await firstValueFrom(
        this.httpService.get(`${lotteryServiceUrl}/draws`, {
          params: {
            lotteryType,
            limit: 500, // Get last 500 draws for analysis
          },
        }).pipe(
          map((res) => res.data),
        ),
      );

      return response as any;
    } catch (error) {
      this.logger.error(`Error fetching historical draws: ${error.message}`);
      throw new Error('Failed to fetch historical data');
    }
  }
}
