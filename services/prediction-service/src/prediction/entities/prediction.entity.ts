import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('predictions')
@Index(['lotteryTypeId', 'targetConcurso'])
@Index(['strategyId'])
@Index(['status'])
export class Prediction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'lottery_type_id' })
  lotteryTypeId: number;

  @Column({ name: 'strategy_id' })
  strategyId: number;

  @Column({ name: 'target_concurso' })
  targetConcurso: number;

  @Column('json', { name: 'predicted_numbers' })
  predictedNumbers: number[];

  @Column('decimal', { precision: 5, scale: 4, name: 'confidence_score', nullable: true })
  confidenceScore: number;

  @Column({ length: 20, default: 'pending' })
  status: string; // pending, checked, expired

  @Column('json', { name: 'actual_numbers', nullable: true })
  actualNumbers: number[];

  @Column({ nullable: true })
  hits: number;

  @Column('json', { name: 'matched_numbers', nullable: true })
  matchedNumbers: number[];

  @Column({ name: 'prize_won', type: 'decimal', precision: 15, scale: 2, nullable: true })
  prizeWon: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'checked_at', type: 'datetime', nullable: true })
  checkedAt: Date;
}
