import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface LotteryConfig {
  name: string;
  drawDays: number[]; // 0=Sunday, 6=Saturday
  drawTime: string; // HH:mm format
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  // Lottery draw schedules
  private readonly lotteryConfigs: LotteryConfig[] = [
    { name: 'megasena', drawDays: [3, 6], drawTime: '20:00' }, // Wed, Sat
    { name: 'quina', drawDays: [1, 2, 3, 4, 5, 6], drawTime: '20:00' }, // Mon-Sat
    { name: 'lotofacil', drawDays: [1, 2, 3, 4, 5, 6], drawTime: '20:00' }, // Mon-Sat
    { name: 'lotomania', drawDays: [2, 4, 6], drawTime: '20:00' }, // Tue, Thu, Sat
  ];

  constructor(private httpService: HttpService) { }

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
  async checkAndValidatePredictions() {
    this.logger.log('🔍 Checking predictions against results...');

    try {
      const predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002';
      const lotteryServiceUrl = process.env.LOTTERY_SERVICE_URL || 'http://lottery-service:3001';

      // For each lottery type that had a draw today
      const today = new Date().getDay();

      for (const config of this.lotteryConfigs) {
        if (config.drawDays.includes(today)) {
          this.logger.log(`📋 Validating predictions for ${config.name}...`);

          try {
            // Get latest draw
            const drawResponse = await firstValueFrom(
              this.httpService.get(`${lotteryServiceUrl}/lottery/latest?lotteryType=${config.name}`)
            );
            const latestDraw = drawResponse.data;

            if (latestDraw) {
              // Validate pending predictions for this concurso
              await firstValueFrom(
                this.httpService.post(`${predictionServiceUrl}/predictions/validate`, {
                  lotteryType: config.name,
                  concurso: latestDraw.concurso,
                  actualNumbers: latestDraw.numbers,
                })
              );

              this.logger.log(`✅ Predictions validated for ${config.name} concurso ${latestDraw.concurso}`);
            }
          } catch (error) {
            this.logger.error(`❌ Error validating ${config.name}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error in validation process: ${error.message}`);
    }
  }

  @Cron('0 8 * * *') // Every day at 08:00 - Generate predictions early
  async generateDailyPredictions() {
    this.logger.log('🔮 Generating predictions for upcoming draws...');

    const today = new Date().getDay();
    const predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002';

    try {
      for (const config of this.lotteryConfigs) {
        // If today is a draw day, generate predictions
        if (config.drawDays.includes(today)) {
          this.logger.log(`🎯 Generating predictions for ${config.name}...`);

          try {
            // Generate predictions using all strategies
            const response = await firstValueFrom(
              this.httpService.post(`${predictionServiceUrl}/predictions/generate-daily`, {
                lotteryType: config.name,
                useAllStrategies: true,
              })
            );

            this.logger.log(`✅ Generated ${response.data.count} predictions for ${config.name}`);
          } catch (error) {
            this.logger.error(`❌ Error generating predictions for ${config.name}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error in prediction generation: ${error.message}`);
    }
  }

  @Cron('0 18 * * *') // Every day at 18:00 - Reminder and final predictions
  async generateFinalPredictions() {
    this.logger.log('🚨 Final prediction run before draws...');

    const today = new Date().getDay();
    const predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002';

    try {
      for (const config of this.lotteryConfigs) {
        if (config.drawDays.includes(today)) {
          this.logger.log(`⏰ Final predictions for ${config.name}...`);

          try {
            // Generate final predictions with highest confidence strategies
            await firstValueFrom(
              this.httpService.post(`${predictionServiceUrl}/predictions/generate-final`, {
                lotteryType: config.name,
                topStrategiesOnly: true,
                count: 5,
              })
            );

            this.logger.log(`✅ Final predictions generated for ${config.name}`);
          } catch (error) {
            this.logger.error(`❌ Error in final predictions for ${config.name}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error in final prediction generation: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_WEEK) // Weekly backtest on Sundays
  async runWeeklyBacktest() {
    this.logger.log('📊 Running weekly backtest for all lotteries...');

    const predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002';

    try {
      for (const config of this.lotteryConfigs) {
        this.logger.log(`📈 Running backtest for ${config.name}...`);

        try {
          await firstValueFrom(
            this.httpService.post(`${predictionServiceUrl}/predictions/backtest`, {
              lotteryType: config.name,
              testSize: 100, // Test on last 100 draws
            })
          );

          this.logger.log(`✅ Backtest completed for ${config.name}`);
        } catch (error) {
          this.logger.error(`❌ Error in backtest for ${config.name}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error running weekly backtest: ${error.message}`);
    }
  }

  @Cron('0 0 30 12 *') // December 30th - Special handling for Mega da Virada
  async handleMegaDaVirada() {
    this.logger.log('🎆 Generating special predictions for Mega da Virada!');

    const predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002';

    try {
      // Run special backtest on historical Mega da Virada draws
      await firstValueFrom(
        this.httpService.post(`${predictionServiceUrl}/predictions/special-event`, {
          lotteryType: 'megasena',
          eventType: 'mega_da_virada',
          useHistoricalSpecialDraws: true,
        })
      );

      // Generate predictions using all strategies
      await firstValueFrom(
        this.httpService.post(`${predictionServiceUrl}/predictions/generate-multiple`, {
          lotteryType: 'megasena',
          count: 20, // All strategies
          specialEvent: 'mega_da_virada',
        })
      );

      this.logger.log('✅ Mega da Virada predictions generated successfully!');
    } catch (error) {
      this.logger.error(`❌ Error generating Mega da Virada predictions: ${error.message}`);
    }
  }

  // Manual trigger for full validation
  async triggerFullValidation(lotteryType: string): Promise<{ jobId: number }> {
    const predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002';

    const response = await firstValueFrom(
      this.httpService.post(`${predictionServiceUrl}/validation/start`, {
        lotteryType,
      })
    );

    return { jobId: response.data.id };
  }
}
