import { Controller, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { BolaoService } from './bolao.service';

// DTOs
class CreateBolaoDto {
  name: string;
  year: number;
  pricePerGame: number;
  minGamesPerParticipant?: number;
  maxGamesPerParticipant?: number;
}

class UpdateBolaoDto {
  name?: string;
  year?: number;
  pricePerGame?: number;
  minGamesPerParticipant?: number;
  maxGamesPerParticipant?: number;
}

class CreateParticipantDto {
  name: string;
}

class UpdateParticipantDto {
  name?: string;
}

class CreateGameDto {
  numbers: number[];
}

class UpdateGameDto {
  numbers: number[];
}

@Controller('bolao')
export class BolaoController {
  constructor(private readonly bolaoService: BolaoService) { }

  // ============ BOLAO ROUTES ============

  @Get()
  async findAll() {
    return this.bolaoService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bolaoService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateBolaoDto) {
    return this.bolaoService.create(
      dto.name,
      dto.year,
      dto.pricePerGame,
      dto.minGamesPerParticipant || 1,
      dto.maxGamesPerParticipant
    );
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBolaoDto) {
    return this.bolaoService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.bolaoService.delete(id);
    return { success: true };
  }

  @Get(':id/stats')
  async getStats(@Param('id', ParseIntPipe) id: number) {
    return this.bolaoService.getStats(id);
  }

  // ============ PARTICIPANT ROUTES ============

  @Post(':bolaoId/participants')
  async addParticipant(
    @Param('bolaoId', ParseIntPipe) bolaoId: number,
    @Body() dto: CreateParticipantDto,
  ) {
    return this.bolaoService.addParticipant(bolaoId, dto.name);
  }

  @Put('participants/:participantId')
  async updateParticipant(
    @Param('participantId', ParseIntPipe) participantId: number,
    @Body() dto: UpdateParticipantDto,
  ) {
    return this.bolaoService.updateParticipant(participantId, dto);
  }

  @Patch('participants/:participantId/toggle-paid')
  async togglePaid(@Param('participantId', ParseIntPipe) participantId: number) {
    return this.bolaoService.togglePaid(participantId);
  }

  @Delete('participants/:participantId')
  async deleteParticipant(@Param('participantId', ParseIntPipe) participantId: number) {
    await this.bolaoService.deleteParticipant(participantId);
    return { success: true };
  }

  // ============ GAME ROUTES ============

  @Post('participants/:participantId/games')
  async addGame(
    @Param('participantId', ParseIntPipe) participantId: number,
    @Body() dto: CreateGameDto,
  ) {
    return this.bolaoService.addGame(participantId, dto.numbers);
  }

  @Put('games/:gameId')
  async updateGame(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Body() dto: UpdateGameDto,
  ) {
    return this.bolaoService.updateGame(gameId, dto.numbers);
  }

  @Delete('games/:gameId')
  async deleteGame(@Param('gameId', ParseIntPipe) gameId: number) {
    await this.bolaoService.deleteGame(gameId);
    return { success: true };
  }
}

