import { Module } from '@nestjs/common';
import { StatisticalClosureService } from './statistical-closure.service';
import { GeneticOptimizerService } from './genetic-optimizer.service';
import { ClosureController } from './closure.controller';

@Module({
  controllers: [ClosureController],
  providers: [
    StatisticalClosureService,
    GeneticOptimizerService,
  ],
  exports: [
    StatisticalClosureService,
    GeneticOptimizerService,
  ],
})
export class ClosureModule { }
