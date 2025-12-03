import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { PredictionService } from './prediction.service';

class GeneratePredictionDto {
  lotteryType: string;
  strategyName?: string;
  targetConcurso?: number;
}

class GenerateMultipleDto {
  lotteryType: string;
  count?: number;
}

class BacktestDto {
  lotteryType: string;
  testSize?: number;
}

class GenerateForValidationDto {
  lotteryType: string;
  strategyName: string;
  historicalDraws: any[];
}

@ApiTags('predictions')
@Controller('predictions')
export class PredictionController {
  constructor(private predictionService: PredictionService) { }

  @Get()
  @ApiOperation({
    summary: 'List predictions',
    description: 'Get list of predictions for a lottery type'
  })
  @ApiQuery({ name: 'lotteryType', required: false, description: 'Lottery type (default: megasena)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of predictions to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'Returns list of predictions' })
  async listPredictions(
    @Query('lotteryType') lotteryType: string = 'megasena',
    @Query('limit') limit: number = 10
  ) {
    return await this.predictionService.listPredictions(lotteryType, limit);
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Generate prediction',
    description: 'Generate a lottery prediction using the best strategy or a specific one'
  })
  @ApiBody({ type: GeneratePredictionDto })
  @ApiResponse({ status: 201, description: 'Prediction generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async generatePrediction(
    @Body() body: { lotteryType: string; strategyName?: string; targetConcurso?: number }
  ) {
    return await this.predictionService.generatePrediction(body);
  }

  @Post('generate-multiple')
  @ApiOperation({
    summary: 'Generate multiple predictions',
    description: 'Generate multiple predictions using top N strategies'
  })
  @ApiBody({ type: GenerateMultipleDto })
  @ApiResponse({ status: 201, description: 'Multiple predictions generated' })
  async generateMultiple(
    @Body() body: { lotteryType: string; count?: number }
  ) {
    return await this.predictionService.generateMultiplePredictions(body);
  }

  @Post('backtest')
  @ApiOperation({
    summary: 'Run backtest',
    description: 'Test all strategies against historical data'
  })
  @ApiBody({ type: BacktestDto })
  @ApiResponse({ status: 201, description: 'Backtest completed' })
  async runBacktest(
    @Body() body: { lotteryType: string; testSize?: number }
  ) {
    return await this.predictionService.runBacktestAll(body);
  }

  @Post('generate-for-validation')
  @ApiOperation({
    summary: 'Generate prediction for validation',
    description: 'Generate prediction using provided historical data (used by validation service)'
  })
  @ApiBody({ type: GenerateForValidationDto })
  @ApiResponse({ status: 201, description: 'Prediction generated' })
  async generateForValidation(
    @Body() body: { lotteryType: string; strategyName: string; historicalDraws: any[] }
  ) {
    return await this.predictionService.generatePredictionForValidation(body);
  }

  @Get('strategies')
  @ApiOperation({
    summary: 'List all strategies',
    description: 'Get list of all 20 available prediction strategies'
  })
  @ApiResponse({ status: 200, description: 'Returns list of strategies' })
  async listStrategies() {
    return await this.predictionService.listStrategies();
  }

  @Get('strategies/:name/performance')
  @ApiOperation({
    summary: 'Get strategy performance',
    description: 'Get detailed performance metrics for a specific strategy'
  })
  @ApiParam({ name: 'name', description: 'Strategy name' })
  @ApiQuery({ name: 'lotteryType', required: false, description: 'Lottery type (default: megasena)' })
  @ApiResponse({ status: 200, description: 'Returns strategy performance' })
  async getStrategyPerformance(
    @Param('name') name: string,
    @Query('lotteryType') lotteryType: string = 'megasena'
  ) {
    return await this.predictionService.getStrategyPerformance({
      lotteryType,
      strategyName: name,
    });
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return { status: 'ok', service: 'prediction-service', strategies: 20 };
  }
}
