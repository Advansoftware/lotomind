import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bolao } from './entities/bolao.entity';
import { BolaoParticipant } from './entities/bolao-participant.entity';
import { BolaoGame } from './entities/bolao-game.entity';

@Injectable()
export class BolaoService {
  constructor(
    @InjectRepository(Bolao)
    private bolaoRepository: Repository<Bolao>,
    @InjectRepository(BolaoParticipant)
    private participantRepository: Repository<BolaoParticipant>,
    @InjectRepository(BolaoGame)
    private gameRepository: Repository<BolaoGame>,
  ) { }

  // ============ BOLAO CRUD ============

  async findAll(): Promise<Bolao[]> {
    return this.bolaoRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Bolao> {
    const bolao = await this.bolaoRepository.findOne({ where: { id } });
    if (!bolao) {
      throw new NotFoundException(`Bolão #${id} não encontrado`);
    }
    return bolao;
  }

  async create(
    name: string,
    year: number,
    pricePerGame: number,
    minGamesPerParticipant: number = 1,
    maxGamesPerParticipant?: number
  ): Promise<Bolao> {
    const bolao = this.bolaoRepository.create({
      name,
      year,
      pricePerGame,
      minGamesPerParticipant,
      maxGamesPerParticipant: maxGamesPerParticipant || null
    });
    return this.bolaoRepository.save(bolao);
  }

  async update(id: number, data: Partial<Bolao>): Promise<Bolao> {
    const bolao = await this.findOne(id);
    Object.assign(bolao, data);
    return this.bolaoRepository.save(bolao);
  }

  async delete(id: number): Promise<void> {
    const result = await this.bolaoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Bolão #${id} não encontrado`);
    }
  }

  // ============ PARTICIPANT CRUD ============

  async addParticipant(bolaoId: number, name: string): Promise<BolaoParticipant> {
    await this.findOne(bolaoId); // Validate bolao exists
    const participant = this.participantRepository.create({ bolaoId, name, paid: false });
    return this.participantRepository.save(participant);
  }

  async updateParticipant(participantId: number, data: Partial<BolaoParticipant>): Promise<BolaoParticipant> {
    const participant = await this.participantRepository.findOne({ where: { id: participantId } });
    if (!participant) {
      throw new NotFoundException(`Participante #${participantId} não encontrado`);
    }
    Object.assign(participant, data);
    return this.participantRepository.save(participant);
  }

  async togglePaid(participantId: number): Promise<BolaoParticipant> {
    const participant = await this.participantRepository.findOne({ where: { id: participantId } });
    if (!participant) {
      throw new NotFoundException(`Participante #${participantId} não encontrado`);
    }
    participant.paid = !participant.paid;
    return this.participantRepository.save(participant);
  }

  async deleteParticipant(participantId: number): Promise<void> {
    const result = await this.participantRepository.delete(participantId);
    if (result.affected === 0) {
      throw new NotFoundException(`Participante #${participantId} não encontrado`);
    }
  }

  // ============ GAME CRUD ============

  async addGame(participantId: number, numbers: number[]): Promise<BolaoGame> {
    const participant = await this.participantRepository.findOne({ where: { id: participantId } });
    if (!participant) {
      throw new NotFoundException(`Participante #${participantId} não encontrado`);
    }

    // Sort numbers
    const sortedNumbers = [...numbers].sort((a, b) => a - b);

    const game = this.gameRepository.create({ participantId, numbers: sortedNumbers });
    return this.gameRepository.save(game);
  }

  async deleteGame(gameId: number): Promise<void> {
    const result = await this.gameRepository.delete(gameId);
    if (result.affected === 0) {
      throw new NotFoundException(`Jogo #${gameId} não encontrado`);
    }
  }

  async updateGame(gameId: number, numbers: number[]): Promise<BolaoGame> {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException(`Jogo #${gameId} não encontrado`);
    }
    game.numbers = [...numbers].sort((a, b) => a - b);
    return this.gameRepository.save(game);
  }

  // ============ STATISTICS ============

  async getStats(bolaoId: number): Promise<{
    totalGames: number;
    totalValue: number;
    totalPaid: number;
  }> {
    const bolao = await this.findOne(bolaoId);

    let totalGames = 0;
    let paidGames = 0;

    for (const participant of bolao.participants) {
      totalGames += participant.games.length;
      if (participant.paid) {
        paidGames += participant.games.length;
      }
    }

    const pricePerGame = Number(bolao.pricePerGame) || 5;

    return {
      totalGames,
      totalValue: totalGames * pricePerGame,
      totalPaid: paidGames * pricePerGame,
    };
  }
}
