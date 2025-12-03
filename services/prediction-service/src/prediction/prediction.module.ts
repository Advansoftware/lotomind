import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './prediction.service';
import { BacktestService } from './backtest.service';
import { StrategySelector } from './strategy-selector.service';
import { ValidationService } from './validation.service';
import { ValidationController } from './validation.controller';
import { AutoRefinementService } from './auto-refinement.service';
import { RefinementController } from './refinement.controller';

// Import entities
import { Prediction } from './entities/prediction.entity';
import { BacktestResult } from './entities/backtest-result.entity';
import { StrategyPerformance } from './entities/strategy-performance.entity';

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

@Module({
  imports: [
    TypeOrmModule.forFeature([Prediction, BacktestResult, StrategyPerformance]),
    HttpModule,
    ClientsModule.register([
      {
        name: 'PREDICTION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://lotomind:lotomind123@rabbitmq:5672'],
          queue: 'prediction_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [PredictionController, ValidationController, RefinementController],
  providers: [
    PredictionService,
    BacktestService,
    StrategySelector,
    ValidationService,
    AutoRefinementService,
    // All 20 strategies
    FrequencyStrategy,
    DelayStrategy,
    HotColdStrategy,
    MovingAverageStrategy,
    StandardDeviationStrategy,
    PatternRepetitionStrategy,
    SumRangeStrategy,
    OddEvenBalanceStrategy,
    GapAnalysisStrategy,
    FibonacciStrategy,
    MarkovChainStrategy,
    MonteCarloStrategy,
    BayesianStrategy,
    EnsembleVotingStrategy,
    GeneticAlgorithmStrategy,
    RandomForestStrategy,
    KMeansClusteringStrategy,
    NeuralNetworkStrategy,
    CycleDetectionStrategy,
    AdaptiveHybridStrategy,
  ],
  exports: [PredictionService, ValidationService, AutoRefinementService],
})
export class PredictionModule { }
