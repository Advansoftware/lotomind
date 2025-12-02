import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LotteryService } from './lottery.service';

@Controller()
export class LotteryController {
  constructor(private readonly lotteryService: LotteryService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'lottery-service',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('types')
  async getLotteryTypes() {
    return this.lotteryService.getLotteryTypes();
  }

  @Get('draws')
  async getDraws(
    @Query('lotteryType') lotteryType: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.lotteryService.getDraws(lotteryType, limit, offset);
  }

  @Get('draws/:concurso')
  async getDraw(
    @Param('concurso') concurso: number,
    @Query('lotteryType') lotteryType: string,
  ) {
    return this.lotteryService.getDraw(lotteryType, concurso);
  }

  @Get('latest')
  async getLatestDraw(@Query('lotteryType') lotteryType: string) {
    return this.lotteryService.getLatestDraw(lotteryType);
  }

  @Post('sync')
  async syncDraws(@Body('lotteryType') lotteryType: string) {
    return this.lotteryService.syncDrawsFromAPI(lotteryType);
  }

  @Post('sync-all')
  async syncAllDraws() {
    return this.lotteryService.syncAllLotteries();
  }

  // RabbitMQ Message Patterns
  @MessagePattern('lottery.get_latest')
  async handleGetLatest(@Payload() data: { lotteryType: string }) {
    return this.lotteryService.getLatestDraw(data.lotteryType);
  }

  @MessagePattern('lottery.get_draws')
  async handleGetDraws(@Payload() data: { lotteryType: string; limit: number }) {
    return this.lotteryService.getDraws(data.lotteryType, data.limit);
  }
}
