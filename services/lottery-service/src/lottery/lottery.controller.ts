import { Controller, Get, Post, Param, Query, Body, Delete } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LotteryService } from './lottery.service';
import { SyncService } from './sync.service';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';

@Controller()
export class LotteryController {
  constructor(
    private readonly lotteryService: LotteryService,
    private readonly syncService: SyncService,
  ) { }

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

  // =====================
  // ASYNC SYNC ENDPOINTS
  // =====================

  @Post('sync-full')
  @ApiOperation({ summary: 'Start async full sync for a lottery type - returns immediately with job ID' })
  @ApiResponse({ status: 201, description: 'Sync job started' })
  async syncFull(@Body('lotteryType') lotteryType: string) {
    const job = await this.syncService.startSyncJob('sync_full', lotteryType);
    return {
      success: true,
      message: 'Sincronização iniciada em background',
      jobId: job.id,
      status: job.status,
    };
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync latest draws from external API (async)' })
  async syncDraws(@Body('lotteryType') lotteryType: string) {
    const job = await this.syncService.startSyncJob('sync_latest', lotteryType);
    return {
      success: true,
      message: 'Sincronização do último concurso iniciada',
      jobId: job.id,
      status: job.status,
    };
  }

  @Post('sync-all')
  @ApiOperation({ summary: 'Start async sync for all lottery types' })
  async syncAllDraws() {
    const job = await this.syncService.startSyncJob('sync_all');
    return {
      success: true,
      message: 'Sincronização de todas as loterias iniciada em background',
      jobId: job.id,
      status: job.status,
    };
  }

  @Get('sync/jobs')
  @ApiOperation({ summary: 'List all sync jobs' })
  async getSyncJobs(@Query('limit') limit: number = 10) {
    return this.syncService.getJobs(limit);
  }

  @Get('sync/jobs/:id')
  @ApiOperation({ summary: 'Get sync job status and progress' })
  async getSyncJobStatus(@Param('id') id: number) {
    const job = await this.syncService.getJobStatus(id);
    if (!job) {
      return { error: 'Job not found' };
    }
    return job;
  }

  @Delete('sync/jobs/:id')
  @ApiOperation({ summary: 'Cancel a running sync job' })
  async cancelSyncJob(@Param('id') id: number) {
    const cancelled = await this.syncService.cancelJob(id);
    return {
      success: cancelled,
      message: cancelled ? 'Job cancelado' : 'Não foi possível cancelar o job',
    };
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
