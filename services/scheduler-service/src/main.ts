import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const port = process.env.PORT || 3004;
  await app.listen(port);

  console.log(`⏰ Scheduler Service running on port ${port}`);
  console.log(`📅 Cron jobs activated`);
}

bootstrap();
