import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Bolao } from './bolao.entity';
import { BolaoGame } from './bolao-game.entity';

@Entity('bolao_participants')
export class BolaoParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'bolao_id' })
  bolaoId: number;

  @Column({ length: 200 })
  name: string;

  @Column({ default: false })
  paid: boolean;

  @ManyToOne(() => Bolao, bolao => bolao.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bolao_id' })
  bolao: Bolao;

  @OneToMany(() => BolaoGame, game => game.participant, { eager: true, cascade: true })
  games: BolaoGame[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
