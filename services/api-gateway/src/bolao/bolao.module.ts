import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BolaoController } from './bolao.controller';
import { BolaoService } from './bolao.service';
import { Bolao } from './entities/bolao.entity';
import { BolaoParticipant } from './entities/bolao-participant.entity';
import { BolaoGame } from './entities/bolao-game.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bolao, BolaoParticipant, BolaoGame]),
  ],
  controllers: [BolaoController],
  providers: [BolaoService],
  exports: [BolaoService],
})
export class BolaoModule { }
