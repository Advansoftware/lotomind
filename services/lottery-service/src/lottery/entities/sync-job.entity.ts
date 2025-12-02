import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type SyncJobType = 'sync_latest' | 'sync_full' | 'sync_all';
export type SyncJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

@Entity('sync_jobs')
export class SyncJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'job_type', type: 'enum', enum: ['sync_latest', 'sync_full', 'sync_all'] })
  jobType: SyncJobType;

  @Column({ name: 'lottery_type', length: 50, nullable: true })
  lotteryType: string;

  @Column({ type: 'enum', enum: ['pending', 'running', 'completed', 'failed', 'cancelled'], default: 'pending' })
  status: SyncJobStatus;

  @Column({ name: 'total_items', default: 0 })
  totalItems: number;

  @Column({ name: 'processed_items', default: 0 })
  processedItems: number;

  @Column({ name: 'success_count', default: 0 })
  successCount: number;

  @Column({ name: 'error_count', default: 0 })
  errorCount: number;

  @Column({ name: 'progress_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercent: number;

  @Column({ name: 'current_item', length: 100, nullable: true })
  currentItem: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'json', nullable: true })
  result: Record<string, unknown>;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
