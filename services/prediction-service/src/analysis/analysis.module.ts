import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FrequencyAnalysisService } from './frequency-analysis.service';
import { PairTrioAnalysisService } from './pair-trio-analysis.service';
import { CycleAnalysisService } from './cycle-analysis.service';
import { GapAnalysisService } from './gap-analysis.service';
import { AnalysisController } from './analysis.controller';

@Module({
  imports: [TypeOrmModule.forFeature([])],
  controllers: [AnalysisController],
  providers: [
    FrequencyAnalysisService,
    PairTrioAnalysisService,
    CycleAnalysisService,
    GapAnalysisService,
  ],
  exports: [
    FrequencyAnalysisService,
    PairTrioAnalysisService,
    CycleAnalysisService,
    GapAnalysisService,
  ],
})
export class AnalysisModule { }
