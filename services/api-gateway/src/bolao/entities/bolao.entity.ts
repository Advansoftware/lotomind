import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BolaoParticipant } from './bolao-participant.entity';

@Entity('bolaos')
export class Bolao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'int', default: 2025 })
  year: number;

  @Column({ name: 'price_per_game', type: 'decimal', precision: 10, scale: 2, default: 6.00 })
  pricePerGame: number;

  @Column({ name: 'min_games_per_participant', type: 'int', default: 1 })
  minGamesPerParticipant: number;

  @Column({ name: 'max_games_per_participant', type: 'int', nullable: true })
  maxGamesPerParticipant: number;

  @OneToMany(() => BolaoParticipant, participant => participant.bolao, { eager: true, cascade: true })
  participants: BolaoParticipant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


