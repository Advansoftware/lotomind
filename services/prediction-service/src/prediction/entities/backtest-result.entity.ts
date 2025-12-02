import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('backtest_results')
@Index(['strategyId', 'lotteryTypeId'])
export class BacktestResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'strategy_id' })
  strategyId: number;

  @Column({ name: 'lottery_type_id' })
  lotteryTypeId: number;

  @Column({ name: 'test_size' })
  testSize: number;

  @Column({ name: 'window_size' })
  windowSize: number;

  @Column({ name: 'total_predictions' })
  totalPredictions: number;

  @Column('decimal', { precision: 5, scale: 2, name: 'avg_hits' })
  avgHits: number;

  @Column({ name: 'max_hits' })
  maxHits: number;

  @Column('decimal', { precision: 5, scale: 4, name: 'hit_rate' })
  hitRate: number;

  @Column('decimal', { precision: 5, scale: 4 })
  accuracy: number;

  @Column('json', { name: 'hit_distribution' })
  hitDistribution: { [key: number]: number };

  @Column({ name: 'execution_time_ms' })
  executionTimeMs: number;

  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  precision: number;

  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  recall: number;

  @Column('decimal', { precision: 5, scale: 4, name: 'f1_score', nullable: true })
  f1Score: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
