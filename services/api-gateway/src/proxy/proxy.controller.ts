import { Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) { }

  // Lottery routes - base path
  @All('lottery')
  async proxyLotteryBase(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.LOTTERY_SERVICE_URL || 'http://lottery-service:3001',
      '/lottery',
      false,
    );
  }

  // Lottery routes - with subpaths
  @All('lottery/*')
  async proxyLottery(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.LOTTERY_SERVICE_URL || 'http://lottery-service:3001',
      '/lottery',
      false,
    );
  }

  // Predictions routes - base path
  @All('predictions')
  async proxyPredictionBase(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002',
      '/predictions',
      true,
    );
  }

  // Predictions routes - with subpaths
  @All('predictions/*')
  async proxyPrediction(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002',
      '/predictions',
      true,
    );
  }

  // Validation routes - base path
  @All('validation')
  async proxyValidationBase(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002',
      '/validation',
      true,
    );
  }

  // Validation routes - with subpaths
  @All('validation/*')
  async proxyValidation(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002',
      '/validation',
      true,
    );
  }

  // Analytics routes - base path
  @All('analytics')
  async proxyAnalyticsBase(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3003',
      '/analytics',
      true,
    );
  }

  // Analytics routes - with subpaths
  @All('analytics/*')
  async proxyAnalytics(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3003',
      '/analytics',
      true,
    );
  }

  // Refinement routes - base path
  @All('refinement')
  async proxyRefinementBase(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002',
      '/refinement',
      true,
    );
  }

  // Refinement routes - with subpaths
  @All('refinement/*')
  async proxyRefinement(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.proxyRequest(
      req,
      res,
      process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002',
      '/refinement',
      true,
    );
  }
}
