import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) { }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description: 'Get comprehensive dashboard metrics including predictions, accuracy, and performance'
  })
  @ApiQuery({ name: 'lotteryType', required: false, description: 'Lottery type (default: megasena)' })
  @ApiResponse({ status: 200, description: 'Returns dashboard metrics' })
  async getDashboard(@Query('lotteryType') lotteryType: string = 'megasena') {
    return await this.analyticsService.getDashboardMetrics(lotteryType);
  }

  @Get('strategies/comparison')
  @ApiOperation({
    summary: 'Compare strategies',
    description: 'Get comparison of all strategies performance'
  })
  @ApiQuery({ name: 'lotteryType', required: false })
  @ApiResponse({ status: 200, description: 'Returns strategy comparison' })
  async getStrategyComparison(@Query('lotteryType') lotteryType: string = 'megasena') {
    return await this.analyticsService.getStrategyComparison(lotteryType);
  }

  @Get('numbers/hot-cold')
  @ApiOperation({
    summary: 'Get hot and cold numbers',
    description: 'Get the most and least frequent numbers'
  })
  @ApiQuery({ name: 'lotteryType', required: false })
  @ApiResponse({ status: 200, description: 'Returns hot and cold numbers' })
  async getHotColdNumbers(@Query('lotteryType') lotteryType: string = 'megasena') {
    return await this.analyticsService.getHotColdNumbers(lotteryType);
  }

  @Get('numbers/frequency')
  @ApiOperation({
    summary: 'Get number frequency distribution',
    description: 'Get frequency distribution for all numbers'
  })
  @ApiQuery({ name: 'lotteryType', required: false })
  @ApiResponse({ status: 200, description: 'Returns frequency distribution' })
  async getNumberFrequency(@Query('lotteryType') lotteryType: string = 'megasena') {
    return await this.analyticsService.getNumberFrequencyDistribution(lotteryType);
  }

  @Get('predictions/accuracy-trend')
  @ApiOperation({
    summary: 'Get prediction accuracy trend',
    description: 'Get accuracy trend over time'
  })
  @ApiQuery({ name: 'lotteryType', required: false })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default: 30)' })
  @ApiResponse({ status: 200, description: 'Returns accuracy trend' })
  async getAccuracyTrend(
    @Query('lotteryType') lotteryType: string = 'megasena',
    @Query('days') days: number = 30
  ) {
    return await this.analyticsService.getPredictionAccuracyTrend(lotteryType, days);
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get general statistics',
    description: 'Get general lottery statistics'
  })
  @ApiQuery({ name: 'lotteryType', required: false })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  async getStatistics(@Query('lotteryType') lotteryType: string = 'megasena') {
    return await this.analyticsService.calculateStatistics(lotteryType);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return { status: 'ok', service: 'analytics-service' };
  }
}
