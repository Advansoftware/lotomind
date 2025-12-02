import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) { }

  @All('lottery/*')
  async proxyLottery(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.LOTTERY_SERVICE_URL || 'http://lottery-service:3001',
      '/lottery',
    );
  }

  @All('predictions/*')
  async proxyPrediction(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002',
      '/predictions',
    );
  }

  @All('analytics/*')
  async proxyAnalytics(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3003',
      '/analytics',
    );
  }
}
