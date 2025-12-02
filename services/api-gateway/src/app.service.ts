import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'LotoMind Analytics API Gateway',
      version: '1.0.0',
      description: 'API Gateway for LotoMind microservices',
      services: {
        lottery: process.env.LOTTERY_SERVICE_URL || 'http://lottery-service:3001',
        prediction: process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002',
        analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3003',
      },
      endpoints: {
        lottery: '/api/lottery/*',
        prediction: '/api/predictions/*',
        analytics: '/api/analytics/*',
      },
    };
  }
}
