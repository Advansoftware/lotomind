import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Draw } from './entities/draw.entity';
import { LotteryType } from './entities/lottery-type.entity';

@Injectable()
export class LotteryService {
  private readonly logger = new Logger(LotteryService.name);

  constructor(
    @InjectRepository(Draw)
    private drawRepository: Repository<Draw>,
    @InjectRepository(LotteryType)
    private lotteryTypeRepository: Repository<LotteryType>,
    private httpService: HttpService,
    @Inject('LOTTERY_SERVICE') private client: ClientProxy,
  ) { }

  async getLotteryTypes() {
    return this.lotteryTypeRepository.find({ where: { active: true } });
  }

  async getDraws(lotteryTypeName: string, limit: number = 50, offset: number = 0) {
    const lotteryType = await this.lotteryTypeRepository.findOne({
      where: { name: lotteryTypeName },
    });

    if (!lotteryType) {
      throw new Error(`Lottery type ${lotteryTypeName} not found`);
    }

    return this.drawRepository.find({
      where: { lotteryTypeId: lotteryType.id },
      order: { concurso: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getDraw(lotteryTypeName: string, concurso: number) {
    const lotteryType = await this.lotteryTypeRepository.findOne({
      where: { name: lotteryTypeName },
    });

    if (!lotteryType) {
      throw new Error(`Lottery type ${lotteryTypeName} not found`);
    }

    return this.drawRepository.findOne({
      where: {
        lotteryTypeId: lotteryType.id,
        concurso,
      },
    });
  }

  async getLatestDraw(lotteryTypeName: string) {
    const lotteryType = await this.lotteryTypeRepository.findOne({
      where: { name: lotteryTypeName },
    });

    if (!lotteryType) {
      throw new Error(`Lottery type ${lotteryTypeName} not found`);
    }

    return this.drawRepository.findOne({
      where: { lotteryTypeId: lotteryType.id },
      order: { concurso: 'DESC' },
    });
  }

  async syncDrawsFromAPI(lotteryTypeName: string) {
    this.logger.log(`Syncing draws for ${lotteryTypeName}...`);

    const lotteryType = await this.lotteryTypeRepository.findOne({
      where: { name: lotteryTypeName },
    });

    if (!lotteryType) {
      throw new Error(`Lottery type ${lotteryTypeName} not found`);
    }

    const apiUrl = this.getAPIUrl(lotteryTypeName);

    try {
      const response = await firstValueFrom(this.httpService.get(apiUrl));
      const draws = Array.isArray(response.data) ? response.data : [response.data];

      let newDraws = 0;
      let updatedDraws = 0;

      for (const apiDraw of draws) {
        const existing = await this.drawRepository.findOne({
          where: {
            lotteryTypeId: lotteryType.id,
            concurso: apiDraw.concurso,
          },
        });

        if (existing) {
          updatedDraws++;
          continue;
        }

        const draw = this.createDrawFromAPI(apiDraw, lotteryType.id);
        await this.drawRepository.save(draw);
        newDraws++;

        // Emit event to RabbitMQ
        this.client.emit('lottery.draw.created', {
          lotteryType: lotteryTypeName,
          concurso: draw.concurso,
          numbers: draw.numbers,
        });
      }

      this.logger.log(`Sync complete: ${newDraws} new, ${updatedDraws} existing`);

      return {
        success: true,
        newDraws,
        updatedDraws,
        total: draws.length,
      };
    } catch (error) {
      this.logger.error(`Error syncing ${lotteryTypeName}: ${error.message}`);
      throw error;
    }
  }

  async syncAllLotteries() {
    const lotteryTypes = ['megasena', 'quina', 'lotofacil', 'lotomania'];
    const results = [];

    for (const lotteryType of lotteryTypes) {
      try {
        const result = await this.syncDrawsFromAPI(lotteryType);
        results.push({ lotteryType, ...result });
      } catch (error) {
        results.push({
          lotteryType,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  private getAPIUrl(lotteryType: string): string {
    const urls = {
      megasena: 'https://loteriascaixa-api.herokuapp.com/api/megasena',
      quina: 'https://loteriascaixa-api.herokuapp.com/api/quina',
      lotofacil: 'https://loteriascaixa-api.herokuapp.com/api/lotofacil',
      lotomania: 'https://loteriascaixa-api.herokuapp.com/api/lotomania',
    };
    return urls[lotteryType] || urls.megasena;
  }

  private createDrawFromAPI(apiDraw: any, lotteryTypeId: number): Draw {
    const draw = new Draw();
    draw.lotteryTypeId = lotteryTypeId;
    draw.concurso = apiDraw.concurso;
    draw.drawDate = new Date(apiDraw.data);
    draw.numbers = apiDraw.dezenas || apiDraw.listaDezenas || [];

    // Calculate temporal context
    const date = new Date(apiDraw.data);
    draw.dayOfWeek = date.getDay() + 1; // 1=Monday, 7=Sunday
    draw.dayOfMonth = date.getDate();
    draw.month = date.getMonth() + 1;
    draw.quarter = Math.floor(date.getMonth() / 3) + 1;
    draw.year = date.getFullYear();
    draw.isWeekend = draw.dayOfWeek === 6 || draw.dayOfWeek === 7;

    // Calculate numerical statistics
    const numbers = draw.numbers;
    draw.sumOfNumbers = numbers.reduce((a, b) => a + b, 0);
    draw.averageNumber = draw.sumOfNumbers / numbers.length;

    // Calculate standard deviation
    const mean = draw.averageNumber;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    draw.stdDeviation = Math.sqrt(variance);

    // Pattern analysis
    draw.oddCount = numbers.filter(n => n % 2 !== 0).length;
    draw.evenCount = numbers.filter(n => n % 2 === 0).length;
    draw.primeCount = numbers.filter(n => this.isPrime(n)).length;
    draw.consecutiveCount = this.countConsecutive(numbers);

    // Prize information
    draw.accumulated = apiDraw.acumulado || false;
    draw.accumulatedValue = apiDraw.valorAcumulado || 0;
    draw.estimatedPrize = apiDraw.valorEstimadoProximoConcurso || 0;

    return draw;
  }

  private isPrime(num: number): boolean {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }

  private countConsecutive(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    let count = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] === 1) {
        count++;
      }
    }
    return count;
  }
}
