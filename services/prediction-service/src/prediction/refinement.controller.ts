import { Controller, Get, Post, Query, Param, Logger } from '@nestjs/common';
import { AutoRefinementService } from './auto-refinement.service';

@Controller('refinement')
export class RefinementController {
  private readonly logger = new Logger(RefinementController.name);

  constructor(private readonly refinementService: AutoRefinementService) { }

  /**
   * Executa um ciclo completo de refinamento
   * POST /refinement/run
   */
  @Post('run')
  async runRefinementCycle() {
    this.logger.log('Iniciando ciclo de refinamento via API');
    const result = await this.refinementService.runRefinementCycle();
    return {
      success: result.success,
      message: result.success ? 'Ciclo de refinamento concluído' : 'Erro no refinamento',
      details: result.details
    };
  }

  /**
   * Calcula pesos para uma loteria específica
   * POST /refinement/calculate/:lotteryTypeId
   */
  @Post('calculate/:lotteryTypeId')
  async calculateWeights(@Param('lotteryTypeId') lotteryTypeId: string) {
    this.logger.log(`Calculando pesos para loteria ${lotteryTypeId}`);
    await this.refinementService.calculateStrategyWeights(parseInt(lotteryTypeId));
    return {
      success: true,
      message: `Pesos calculados para loteria ${lotteryTypeId}`
    };
  }

  /**
   * Obtem os pesos das estratégias para uma loteria
   * GET /refinement/weights/:lotteryTypeId
   */
  @Get('weights/:lotteryTypeId')
  async getStrategyWeights(@Param('lotteryTypeId') lotteryTypeId: string) {
    const weights = await this.refinementService.getStrategyWeights(parseInt(lotteryTypeId));
    return {
      success: true,
      lotteryTypeId: parseInt(lotteryTypeId),
      weights,
      total: weights.length
    };
  }

  /**
   * Obtem os pesos das estratégias por nome da loteria
   * GET /refinement/weights/by-slug/:slug
   */
  @Get('weights/by-slug/:slug')
  async getStrategyWeightsBySlug(@Param('slug') slug: string) {
    // Buscar ID pelo nome
    const weights = await this.refinementService['dataSource'].query(`
      SELECT sw.*, s.name as strategy_name
      FROM strategy_weights sw
      JOIN strategies s ON s.id = sw.strategy_id
      JOIN lottery_types lt ON lt.id = sw.lottery_type_id
      WHERE lt.name = ? AND sw.is_active = 1
      ORDER BY sw.weight DESC
    `, [slug]);

    return {
      success: true,
      lotterySlug: slug,
      weights,
      total: weights.length
    };
  }

  /**
   * Obtem histórico de refinamento
   * GET /refinement/history
   */
  @Get('history')
  async getRefinementHistory(
    @Query('lotteryTypeId') lotteryTypeId?: string,
    @Query('limit') limit?: string
  ) {
    const history = await this.refinementService.getRefinementHistory(
      lotteryTypeId ? parseInt(lotteryTypeId) : undefined,
      limit ? parseInt(limit) : 50
    );
    return {
      success: true,
      history,
      total: history.length
    };
  }

  /**
   * Obtem combinações ótimas de estratégias
   * GET /refinement/combinations/:lotteryTypeId
   */
  @Get('combinations/:lotteryTypeId')
  async getOptimalCombinations(@Param('lotteryTypeId') lotteryTypeId: string) {
    const combinations = await this.refinementService.getOptimalCombinations(parseInt(lotteryTypeId));
    return {
      success: true,
      lotteryTypeId: parseInt(lotteryTypeId),
      combinations,
      total: combinations.length
    };
  }

  /**
   * Executa evolução genética das estratégias
   * POST /refinement/evolve/:lotteryTypeId
   */
  @Post('evolve/:lotteryTypeId')
  async evolveStrategies(@Param('lotteryTypeId') lotteryTypeId: string) {
    this.logger.log(`Evoluindo estratégias para loteria ${lotteryTypeId}`);
    await this.refinementService.evolveStrategies(parseInt(lotteryTypeId));
    return {
      success: true,
      message: `Evolução executada para loteria ${lotteryTypeId}`
    };
  }

  /**
   * Executa evolução genética das estratégias por slug
   * POST /refinement/evolve/by-slug/:slug
   */
  @Post('evolve/by-slug/:slug')
  async evolveStrategiesBySlug(@Param('slug') slug: string) {
    this.logger.log(`Evoluindo estratégias para loteria ${slug}`);

    // Buscar ID pelo nome
    const [lottery] = await this.refinementService['dataSource'].query(`
      SELECT id FROM lottery_types WHERE name = ?
    `, [slug]);

    if (!lottery) {
      return {
        success: false,
        message: `Loteria ${slug} não encontrada`
      };
    }

    await this.refinementService.evolveStrategies(lottery.id);
    return {
      success: true,
      message: `Evolução executada para loteria ${slug}`
    };
  }

  /**
   * Obtem estatísticas gerais do refinamento
   * GET /refinement/stats
   */
  @Get('stats')
  async getRefinementStats() {
    const stats = await this.refinementService.getRefinementStats();
    return {
      success: true,
      stats
    };
  }

  /**
   * Limpa dados antigos
   * POST /refinement/cleanup
   */
  @Post('cleanup')
  async cleanupOldData(@Query('days') days?: string) {
    const daysToKeep = days ? parseInt(days) : 90;
    await this.refinementService.cleanupOldData(daysToKeep);
    return {
      success: true,
      message: `Dados mais antigos que ${daysToKeep} dias foram removidos`
    };
  }

  /**
   * Cria combinações ótimas manualmente
   * POST /refinement/create-combinations
   */
  @Post('create-combinations')
  async createCombinations() {
    const count = await this.refinementService.createOptimalCombinations();
    return {
      success: true,
      message: `${count} combinações criadas`
    };
  }
}
