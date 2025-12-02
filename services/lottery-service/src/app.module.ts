import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { LotteryModule } from './lottery/lottery.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'mysql',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'lotomind',
      password: process.env.DB_PASSWORD || 'lotomind123',
      database: process.env.DB_DATABASE || 'lotomind',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Use migrations in production
      logging: process.env.NODE_ENV !== 'production',
    }),
    HttpModule,
    LotteryModule,
  ],
})
export class AppModule {}
