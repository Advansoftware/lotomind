import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as webpush from 'web-push';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    // Configure web-push
    const vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBmYRTyPGbWJQRb_d_Ck',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls',
    };

    webpush.setVapidDetails(
      'mailto:admin@lotomind.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }

  async sendNewDrawNotification(lotteryType: string, draw: any): Promise<void> {
    try {
      // Get all subscribed users
      const subscriptions = await this.dataSource.query(
        'SELECT * FROM push_subscriptions WHERE is_active = 1'
      );

      const payload = JSON.stringify({
        title: `Novo Sorteio - ${lotteryType.toUpperCase()}`,
        body: `Concurso ${draw.concurso}: ${draw.numbers.join(', ')}`,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          url: `/lottery/${lotteryType}/${draw.concurso}`,
          lotteryType,
          concurso: draw.concurso,
        },
      });

      const promises = subscriptions.map(sub => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        return webpush.sendNotification(subscription, payload).catch(error => {
          this.logger.error(`Failed to send notification: ${error.message}`);
          // Mark subscription as inactive if it failed
          if (error.statusCode === 410) {
            this.dataSource.query(
              'UPDATE push_subscriptions SET is_active = 0 WHERE id = ?',
              [sub.id]
            );
          }
        });
      });

      await Promise.all(promises);
      this.logger.log(`Sent ${subscriptions.length} notifications for new draw`);
    } catch (error) {
      this.logger.error(`Error sending notifications: ${error.message}`);
    }
  }

  async sendPredictionResultNotification(prediction: any): Promise<void> {
    try {
      // Get user subscription
      const subscriptions = await this.dataSource.query(
        'SELECT ps.* FROM push_subscriptions ps WHERE ps.is_active = 1'
      );

      const payload = JSON.stringify({
        title: 'Resultado da Predição',
        body: `${prediction.hits} acertos! Estratégia: ${prediction.strategyName}`,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          url: `/predictions/${prediction.id}`,
          predictionId: prediction.id,
          hits: prediction.hits,
        },
      });

      const promises = subscriptions.map(sub => {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        return webpush.sendNotification(subscription, payload).catch(error => {
          this.logger.error(`Failed to send notification: ${error.message}`);
        });
      });

      await Promise.all(promises);
      this.logger.log(`Sent prediction result notifications`);
    } catch (error) {
      this.logger.error(`Error sending prediction notifications: ${error.message}`);
    }
  }

  async subscribe(subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userId?: number;
  }): Promise<void> {
    try {
      await this.dataSource.query(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, is_active) 
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE is_active = 1, updated_at = NOW()`,
        [
          subscription.userId || null,
          subscription.endpoint,
          subscription.keys.p256dh,
          subscription.keys.auth,
        ]
      );

      this.logger.log('Push subscription saved');
    } catch (error) {
      this.logger.error(`Error saving subscription: ${error.message}`);
      throw error;
    }
  }

  async unsubscribe(endpoint: string): Promise<void> {
    try {
      await this.dataSource.query(
        'UPDATE push_subscriptions SET is_active = 0 WHERE endpoint = ?',
        [endpoint]
      );

      this.logger.log('Push subscription removed');
    } catch (error) {
      this.logger.error(`Error removing subscription: ${error.message}`);
      throw error;
    }
  }
}
