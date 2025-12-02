import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('lottery_types')
export class LotteryType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'numbers_to_draw' })
  numbersToDraw: number;

  @Column({ name: 'min_number' })
  minNumber: number;

  @Column({ name: 'max_number' })
  maxNumber: number;

  @Column({ name: 'draw_days', type: 'varchar', length: 100 })
  drawDays: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
