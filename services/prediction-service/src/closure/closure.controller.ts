import { Controller, Get, Post, Query, Param, Body, Logger, ParseIntPipe } from '@nestjs/common';
import { StatisticalClosureService } from './statistical-closure.service';
import { GeneticOptimizerService } from './genetic-optimizer.service';

interface GenerateGamesDto {
  count?: number;
  useEvolution?: boolean;
  evolutionGenerations?: number;
  useTopStrategies?: boolean;
}

@Controller('closure')
export class ClosureController {
  private readonly logger = new Logger(ClosureController.name);

  constructor(
    private readonly closureService: StatisticalClosureService,
    private readonly geneticService: GeneticOptimizerService,
  ) { }

  /**
   * Gera conjunto otimizado de jogos
   */
  @Post(':lotteryTypeId/generate')
  async generateOptimalGames(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Body() body: GenerateGamesDto = {},
  ) {
    this.logger.log(`Generating optimal games for lottery ${lotteryTypeId}`);

    const count = body.count || 5;

    // Se usar evolução genética
    if (body.useEvolution) {
      const result = await this.closureService.generateWithEvolution(
        lotteryTypeId,
        count,
        body.evolutionGenerations || 50
      );
      return {
        success: true,
        data: result,
        message: `Generated ${count} optimized games using genetic evolution`
      };
    }

    // Geração padrão com cobertura estatística
    const result = await this.closureService.generateOptimalSet(
      lotteryTypeId,
      count
    );

    return {
      success: true,
      data: result,
      message: `Generated ${count} games with statistical coverage`
    };
  }

  /**
   * Obtém estatísticas de cobertura para um conjunto de jogos
   */
  @Post(':lotteryTypeId/coverage')
  async getCoverage(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Body() body: { games: number[][] },
  ) {
    // Extrair números únicos dos jogos
    const allNumbers = [...new Set(body.games.flat())].sort((a, b) => a - b);
    const numbersToDraw = body.games[0]?.length || 6;

    const coverage = this.closureService.calculateCoveragePublic(
      body.games,
      allNumbers,
      numbersToDraw
    );

    return {
      success: true,
      data: coverage,
    };
  }

  /**
   * Evolui jogos usando algoritmo genético
   */
  @Post(':lotteryTypeId/evolve')
  async evolveGames(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Body() body: {
      generations?: number;
      populationSize?: number;
      mutationRate?: number;
    } = {},
  ) {
    this.logger.log(`Starting genetic evolution for lottery ${lotteryTypeId}`);

    const result = await this.closureService.runEvolution(
      lotteryTypeId,
      {
        generations: body.generations || 50,
        populationSize: body.populationSize || 100,
        mutationRate: body.mutationRate || 0.1,
      }
    );

    return {
      success: true,
      data: result,
      message: `Evolution completed after ${result.generationsEvolved} generations`
    };
  }

  /**
   * Obtém melhores jogos já evoluídos
   */
  @Get(':lotteryTypeId/best-evolved')
  async getBestEvolved(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Query('count') count: string = '5',
  ) {
    const games = await this.geneticService.getBestEvolvedGames(
      lotteryTypeId,
      parseInt(count)
    );

    return {
      success: true,
      data: { games },
      message: `Retrieved ${games.length} best evolved games`
    };
  }

  /**
   * Gera jogos combinando múltiplas estratégias com pesos refinados
   */
  @Post(':lotteryTypeId/smart-generate')
  async smartGenerate(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Body() body: {
      count?: number;
      strategies?: string[];
    } = {},
  ) {
    this.logger.log(`Smart generation for lottery ${lotteryTypeId}`);

    const result = await this.closureService.smartGenerate(
      lotteryTypeId,
      body.count || 5,
      body.strategies
    );

    return {
      success: true,
      data: result,
      message: `Generated ${result.games.length} smart games`
    };
  }

  /**
   * Calcula custo total de um fechamento
   */
  @Post(':lotteryTypeId/calculate-cost')
  async calculateCost(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Body() body: { gameCount: number },
  ) {
    const cost = await this.closureService.calculateClosureCost(
      lotteryTypeId,
      body.gameCount
    );

    return {
      success: true,
      data: cost,
    };
  }

  /**
   * Obtém recomendações de fechamento
   */
  @Get(':lotteryTypeId/recommendations')
  async getRecommendations(
    @Param('lotteryTypeId', ParseIntPipe) lotteryTypeId: number,
    @Query('budget') budget: string = '100',
  ) {
    const recommendations = await this.closureService.getRecommendations(
      lotteryTypeId,
      parseFloat(budget)
    );

    return {
      success: true,
      data: recommendations,
    };
  }
}
