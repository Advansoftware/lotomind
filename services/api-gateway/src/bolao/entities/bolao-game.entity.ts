import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BolaoParticipant } from './bolao-participant.entity';

@Entity('bolao_games')
export class BolaoGame {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'participant_id' })
  participantId: number;

  @Column('json')
  numbers: number[];

  @ManyToOne(() => BolaoParticipant, participant => participant.games, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant: BolaoParticipant;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
