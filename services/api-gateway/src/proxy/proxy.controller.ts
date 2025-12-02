import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) { }

  @All('lottery/*')
  async proxyLottery(@Req() req: Request, @Res() res: Response) {
    // Lottery service doesn't have /lottery prefix in its routes
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.LOTTERY_SERVICE_URL || 'http://lottery-service:3001',
      '/lottery',
      false, // Remove /lottery prefix
    );
  }

  @All('predictions/*')
  async proxyPrediction(@Req() req: Request, @Res() res: Response) {
    // Prediction service has /predictions prefix in its routes
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002',
      '/predictions',
      true, // Keep /predictions prefix
    );
  }

  @All('validation/*')
  async proxyValidation(@Req() req: Request, @Res() res: Response) {
    // Validation routes are under /validation in prediction service
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002',
      '/validation',
      true, // Keep /validation prefix
    );
  }

  @All('analytics/*')
  async proxyAnalytics(@Req() req: Request, @Res() res: Response) {
    // Analytics service doesn't have /analytics prefix in its routes
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3003',
      '/analytics',
      false, // Remove /analytics prefix
    );
  }
}
