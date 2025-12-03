import { Controller, Get, Post, Param, Query, ParseIntPipe } from '@nestjs/common';
import { FrequencyAnalysisService } from './frequency-analysis.service';
import { PairTrioAnalysisService } from './pair-trio-analysis.service';
import { CycleAnalysisService } from './cycle-analysis.service';
import { GapAnalysisService } from './gap-analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(
    private frequencyService: FrequencyAnalysisService,
    private pairTrioService: PairTrioAnalysisService,
    private cycleService: CycleAnalysisService,
    private gapService: GapAnalysisService,
  ) { }

  // =====================
  // FREQUENCY ENDPOINTS
  // =====================

  @Post('frequency/populate/:lotteryTypeId')
  async populateFrequencies(@Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number) {
    await this.frequencyService.populateFrequencies(lotteryTypeId);
    return { success: true, message: `Frequências populadas para loteria ${lotteryTypeId}` };
  }

  @Post('frequency/populate-all')
  async populateAllFrequencies() {
    await this.frequencyService.populateAllFrequencies();
    return { success: true, message: 'Frequências populadas para todas as loterias' };
  }

  @Get('frequency/:lotteryTypeId')
  async getFrequencyAnalysis(@Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number) {
    const analysis = await this.frequencyService.getFrequencyAnalysis(lotteryTypeId);
    return { success: true, analysis };
  }

  // =====================
  // PAIR/TRIO ENDPOINTS
  // =====================

  @Get('pairs/:lotteryTypeId')
  async getPairsAnalysis(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Query('draws') draws?: number
  ) {
    const analysis = await this.pairTrioService.analyzePairsAndTrios(lotteryTypeId, draws || 500);
    return {
      success: true,
      lotteryTypeId,
      totalDrawsAnalyzed: analysis.totalDrawsAnalyzed,
      topPairs: analysis.topPairs,
      topTrios: analysis.topTrios
    };
  }

  @Get('pairs/:lotteryTypeId/hot')
  async getHotPairs(@Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number) {
    const hotPairs = await this.pairTrioService.getHotPairs(lotteryTypeId);
    return { success: true, hotPairs };
  }

  @Get('pairs/:lotteryTypeId/due')
  async getDuePairs(@Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number) {
    const duePairs = await this.pairTrioService.getDuePairs(lotteryTypeId);
    return { success: true, duePairs };
  }

  @Get('pairs/:lotteryTypeId/suggest')
  async suggestFromPairs(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Query('count') count?: number
  ) {
    const numbers = await this.pairTrioService.suggestNumbersFromPairs(lotteryTypeId, count || 6);
    return { success: true, suggestedNumbers: numbers };
  }

  // =====================
  // CYCLE ENDPOINTS
  // =====================

  @Get('cycles/:lotteryTypeId')
  async getCycleAnalysis(@Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number) {
    const analysis = await this.cycleService.analyzeCycles(lotteryTypeId);
    return {
      success: true,
      lotteryTypeId,
      totalDrawsAnalyzed: analysis.totalDrawsAnalyzed,
      predictedForNext: analysis.predictedForNext,
      numbersInCycle: analysis.numbersInCycle.slice(0, 30) // Top 30
    };
  }

  @Get('cycles/:lotteryTypeId/optimal')
  async getOptimalCycleNumbers(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Query('count') count?: number
  ) {
    const numbers = await this.cycleService.getOptimalCycleNumbers(lotteryTypeId, count || 10);
    return { success: true, optimalNumbers: numbers };
  }

  @Get('cycles/:lotteryTypeId/overdue')
  async getOverdueNumbers(@Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number) {
    const overdueNumbers = await this.cycleService.getOverdueNumbers(lotteryTypeId);
    return { success: true, overdueNumbers };
  }

  @Get('cycles/:lotteryTypeId/predict')
  async predictFromCycles(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Query('count') count?: number
  ) {
    const numbers = await this.cycleService.predictFromCycles(lotteryTypeId, count || 6);
    return { success: true, predictedNumbers: numbers };
  }

  // =====================
  // GAP ENDPOINTS
  // =====================

  @Get('gaps/:lotteryTypeId')
  async getGapAnalysis(@Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number) {
    const analysis = await this.gapService.analyzeGaps(lotteryTypeId);
    return {
      success: true,
      lotteryTypeId,
      totalDraws: analysis.totalDraws,
      overdueNumbers: analysis.overdueNumbers,
      optimalGapNumbers: analysis.optimalGapNumbers
    };
  }

  @Get('gaps/:lotteryTypeId/suggest')
  async suggestFromGaps(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Query('count') count?: number
  ) {
    const numbers = await this.gapService.suggestFromGaps(lotteryTypeId, count || 6);
    return { success: true, suggestedNumbers: numbers };
  }

  @Get('gaps/:lotteryTypeId/probability')
  async getHighProbabilityNumbers(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Query('count') count?: number
  ) {
    const numbers = await this.gapService.getHighProbabilityNumbers(lotteryTypeId, count || 10);
    return { success: true, highProbabilityNumbers: numbers };
  }

  // =====================
  // COMBINED ANALYSIS
  // =====================

  @Get('combined/:lotteryTypeId')
  async getCombinedAnalysis(@Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number) {
    const [frequency, pairs, cycles, gaps] = await Promise.all([
      this.frequencyService.getFrequencyAnalysis(lotteryTypeId),
      this.pairTrioService.analyzePairsAndTrios(lotteryTypeId, 200),
      this.cycleService.analyzeCycles(lotteryTypeId),
      this.gapService.analyzeGaps(lotteryTypeId)
    ]);

    // Combinar scores de todas as análises
    const combinedScores = new Map<number, number>();

    // Frequências (peso 0.25)
    frequency.frequencies.forEach(f => {
      combinedScores.set(f.number, (combinedScores.get(f.number) || 0) + f.score * 0.25);
    });

    // Ciclos (peso 0.30)
    cycles.predictedForNext.forEach((num, index) => {
      const weight = (cycles.predictedForNext.length - index) / cycles.predictedForNext.length;
      combinedScores.set(num, (combinedScores.get(num) || 0) + weight * 30);
    });

    // Gaps (peso 0.30)
    gaps.optimalGapNumbers.forEach(g => {
      combinedScores.set(g.number, (combinedScores.get(g.number) || 0) + g.probability * 30);
    });

    // Pares (peso 0.15)
    pairs.topPairs.slice(0, 20).forEach(p => {
      p.numbers.forEach(num => {
        combinedScores.set(num, (combinedScores.get(num) || 0) + p.frequency * 15);
      });
    });

    // Top números combinados
    const topCombined = Array.from(combinedScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([number, score]) => ({ number, score: Math.round(score * 100) / 100 }));

    return {
      success: true,
      lotteryTypeId,
      hotNumbers: frequency.hotNumbers,
      coldNumbers: frequency.coldNumbers,
      dueNumbers: frequency.dueNumbers,
      cyclesPredicted: cycles.predictedForNext,
      gapsOptimal: gaps.optimalGapNumbers.map(g => g.number),
      topCombined: topCombined,
      recommendedNumbers: topCombined.slice(0, 10).map(t => t.number).sort((a, b) => a - b)
    };
  }
}
