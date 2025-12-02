import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { LotteryType } from './lottery-type.entity';

@Entity('draws')
@Index(['lotteryTypeId', 'concurso'], { unique: true })
export class Draw {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'lottery_type_id' })
  lotteryTypeId: number;

  @Column()
  concurso: number;

  @Column({ name: 'draw_date', type: 'date' })
  drawDate: Date;

  @Column({ type: 'json' })
  numbers: number[];

  // Temporal Context
  @Column({ name: 'day_of_week', type: 'tinyint', nullable: true })
  dayOfWeek: number;

  @Column({ name: 'day_of_month', type: 'tinyint', nullable: true })
  dayOfMonth: number;

  @Column({ type: 'tinyint', nullable: true })
  month: number;

  @Column({ type: 'tinyint', nullable: true })
  quarter: number;

  @Column({ type: 'smallint', nullable: true })
  year: number;

  @Column({ name: 'is_weekend', type: 'boolean', default: false })
  isWeekend: boolean;

  @Column({ name: 'is_holiday', type: 'boolean', default: false })
  isHoliday: boolean;

  @Column({ name: 'holiday_name', nullable: true })
  holidayName: string;

  // Numerical Statistics
  @Column({ name: 'sum_of_numbers', nullable: true })
  sumOfNumbers: number;

  @Column({ name: 'average_number', type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageNumber: number;

  @Column({ name: 'std_deviation', type: 'decimal', precision: 5, scale: 2, nullable: true })
  stdDeviation: number;

  // Pattern Analysis
  @Column({ name: 'odd_count', type: 'tinyint', nullable: true })
  oddCount: number;

  @Column({ name: 'even_count', type: 'tinyint', nullable: true })
  evenCount: number;

  @Column({ name: 'prime_count', type: 'tinyint', nullable: true })
  primeCount: number;

  @Column({ name: 'consecutive_count', type: 'tinyint', nullable: true })
  consecutiveCount: number;

  // Prize Information
  @Column({ type: 'boolean', default: false })
  accumulated: boolean;

  @Column({ name: 'accumulated_value', type: 'decimal', precision: 15, scale: 2, nullable: true })
  accumulatedValue: number;

  @Column({ name: 'estimated_prize', type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimatedPrize: number;

  @ManyToOne(() => LotteryType)
  @JoinColumn({ name: 'lottery_type_id' })
  lotteryType: LotteryType;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
