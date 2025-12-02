import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('LotoMind Analytics - Prediction Service')
    .setDescription('Prediction generation with 20 strategies and backtesting')
    .setVersion('1.0')
    .addTag('predictions', 'Prediction generation')
    .addTag('strategies', 'Strategy management')
    .addTag('backtest', 'Backtesting operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Prediction Service running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
