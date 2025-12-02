import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private httpService: HttpService) {}

  @Cron('0 21 * * *') // Every day at 21:00
  async fetchLatestResults() {
    this.logger.log('🎲 Fetching latest lottery results...');
    
    try {
      const lotteryServiceUrl = process.env.LOTTERY_SERVICE_URL || 'http://lottery-service:3001';
      await firstValueFrom(
        this.httpService.post(`${lotteryServiceUrl}/lottery/sync-all`)
      );
      this.logger.log('✅ Results fetched successfully');
    } catch (error) {
      this.logger.error(`❌ Error fetching results: ${error.message}`);
    }
  }

  @Cron('30 21 * * *') // Every day at 21:30
  async checkPredictions() {
    this.logger.log('🔍 Checking predictions against results...');
    
    try {
      const predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002';
      // TODO: Implement prediction checking logic
      this.logger.log('✅ Predictions checked');
    } catch (error) {
      this.logger.error(`❌ Error checking predictions: ${error.message}`);
    }
  }

  @Cron('0 22 * * *') // Every day at 22:00
  async generatePredictions() {
    this.logger.log('🔮 Generating new predictions...');
    
    try {
      const predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002';
      // TODO: Implement prediction generation logic
      this.logger.log('✅ Predictions generated');
    } catch (error) {
      this.logger.error(`❌ Error generating predictions: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_WEEK) // Weekly backtest
  async runBacktest() {
    this.logger.log('📊 Running weekly backtest...');
    
    try {
      const predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002';
      // TODO: Implement backtest logic
      this.logger.log('✅ Backtest completed');
    } catch (error) {
      this.logger.error(`❌ Error running backtest: ${error.message}`);
    }
  }
}
