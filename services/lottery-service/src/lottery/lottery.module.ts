import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LotteryController } from './lottery.controller';
import { LotteryService } from './lottery.service';
import { Draw } from './entities/draw.entity';
import { LotteryType } from './entities/lottery-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Draw, LotteryType]),
    HttpModule,
    ClientsModule.register([
      {
        name: 'LOTTERY_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://lotomind:lotomind123@rabbitmq:5672'],
          queue: 'lottery_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [LotteryController],
  providers: [LotteryService],
  exports: [LotteryService],
})
export class LotteryModule {}
