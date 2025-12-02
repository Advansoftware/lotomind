import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('strategy_performance')
@Index(['strategyId', 'lotteryTypeId', 'period'])
export class StrategyPerformance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'strategy_id' })
  strategyId: number;

  @Column({ name: 'lottery_type_id' })
  lotteryTypeId: number;

  @Column({ length: 7 }) // Format: YYYY-MM
  period: string;

  @Column({ name: 'total_predictions' })
  totalPredictions: number;

  @Column({ name: 'total_hits' })
  totalHits: number;

  @Column('decimal', { precision: 5, scale: 2, name: 'avg_hits' })
  avgHits: number;

  @Column('decimal', { precision: 5, scale: 4, name: 'hit_rate' })
  hitRate: number;

  @Column('decimal', { precision: 5, scale: 4 })
  accuracy: number;

  @Column({ name: 'quadra_count', default: 0 })
  quadraCount: number; // 4 hits

  @Column({ name: 'quina_count', default: 0 })
  quinaCount: number; // 5 hits

  @Column({ name: 'sena_count', default: 0 })
  senaCount: number; // 6 hits

  @Column('decimal', { precision: 15, scale: 2, name: 'total_prize', default: 0 })
  totalPrize: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
