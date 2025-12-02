import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ValidationService, ValidationJob, StrategyPerformance } from './validation.service';

class StartValidationDto {
  lotteryType: string;
  startConcurso?: number;
  endConcurso?: number;
  strategyIds?: number[];
}

class PaginationDto {
  page?: number;
  limit?: number;
}

@ApiTags('validation')
@Controller('validation')
export class ValidationController {
  constructor(private validationService: ValidationService) { }

  @Post('start')
  @ApiOperation({
    summary: 'Start a full validation job',
    description: 'Starts a background job to validate all predictions against historical data'
  })
  @ApiBody({ type: StartValidationDto })
  @ApiResponse({ status: 201, description: 'Validation job started' })
  async startValidation(
    @Body() body: StartValidationDto
  ): Promise<ValidationJob> {
    return await this.validationService.startFullValidation(body);
  }

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get validation job status',
    description: 'Returns the current status and progress of a validation job'
  })
  @ApiParam({ name: 'jobId', description: 'Validation job ID' })
  @ApiResponse({ status: 200, description: 'Job status' })
  async getJobStatus(@Param('jobId') jobId: number): Promise<ValidationJob | null> {
    return await this.validationService.getJobStatus(jobId);
  }

  @Delete('jobs/:jobId')
  @ApiOperation({
    summary: 'Cancel a validation job',
    description: 'Cancels a running validation job'
  })
  @ApiParam({ name: 'jobId', description: 'Validation job ID' })
  @ApiResponse({ status: 200, description: 'Job cancelled' })
  async cancelJob(@Param('jobId') jobId: number): Promise<{ cancelled: boolean }> {
    const cancelled = await this.validationService.cancelJob(jobId);
    return { cancelled };
  }

  @Get('results')
  @ApiOperation({
    summary: 'Get validation results with pagination',
    description: 'Returns paginated validation results for a lottery type'
  })
  @ApiQuery({ name: 'lotteryType', required: true, description: 'Lottery type (megasena, quina, etc)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'strategyId', required: false, description: 'Filter by strategy ID' })
  @ApiQuery({ name: 'minHits', required: false, description: 'Minimum hits to filter' })
  @ApiResponse({ status: 200, description: 'Paginated validation results' })
  async getValidationResults(
    @Query('lotteryType') lotteryType: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('strategyId') strategyId?: number,
    @Query('minHits') minHits?: number
  ) {
    return await this.validationService.getValidationResults({
      lotteryType,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      strategyId: strategyId ? Number(strategyId) : undefined,
      minHits: minHits ? Number(minHits) : undefined,
    });
  }

  @Get('rankings')
  @ApiOperation({
    summary: 'Get strategy rankings',
    description: 'Returns all strategies ranked by performance for a lottery type'
  })
  @ApiQuery({ name: 'lotteryType', required: true })
  @ApiResponse({ status: 200, description: 'Strategy rankings' })
  async getStrategyRankings(
    @Query('lotteryType') lotteryType: string
  ): Promise<StrategyPerformance[]> {
    return await this.validationService.getStrategyRankings(lotteryType);
  }

  @Get('strategy-ranking')
  @ApiOperation({
    summary: 'Get strategy ranking with detailed stats',
    description: 'Returns all strategies ranked by performance with detailed statistics'
  })
  @ApiQuery({ name: 'lotteryType', required: true })
  @ApiResponse({ status: 200, description: 'Strategy ranking with stats' })
  async getStrategyRanking(
    @Query('lotteryType') lotteryType: string
  ) {
    return await this.validationService.getDetailedStrategyRanking(lotteryType);
  }

  @Get('concurso/:concurso')
  @ApiOperation({
    summary: 'Get detailed analysis for a specific concurso',
    description: 'Returns how all strategies performed for a specific draw'
  })
  @ApiParam({ name: 'concurso', description: 'Concurso number' })
  @ApiQuery({ name: 'lotteryType', required: true })
  @ApiResponse({ status: 200, description: 'Concurso analysis' })
  async getConcursoAnalysis(
    @Param('concurso') concurso: number,
    @Query('lotteryType') lotteryType: string
  ) {
    return await this.validationService.getConcursoAnalysis(lotteryType, Number(concurso));
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return { status: 'ok', service: 'validation' };
  }
}
