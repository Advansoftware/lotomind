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
        this.logger.log(`Checking existence for concurso ${apiDraw.concurso} (type: ${typeof apiDraw.concurso})`);
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
        this.logger.log(`Saving draw: ${JSON.stringify(draw)}`);
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

  async syncFullHistory(lotteryTypeName: string) {
    this.logger.log(`Starting full history sync for ${lotteryTypeName}...`);

    try {
      // Get latest draw to know the limit
      const latestUrl = this.getAPIUrl(lotteryTypeName);
      const response = await firstValueFrom(this.httpService.get(latestUrl));
      const latestDraw = Array.isArray(response.data) ? response.data[0] : response.data;
      const latestConcurso = latestDraw.concurso;

      this.logger.log(`Latest concurso for ${lotteryTypeName} is ${latestConcurso}. Starting sync from 1...`);

      let syncedCount = 0;
      let errorCount = 0;

      // Sync in batches of 10 to avoid rate limiting, but sequential to be safe
      for (let concurso = 1; concurso <= latestConcurso; concurso++) {
        try {
          const exists = await this.drawRepository.findOne({
            where: {
              lotteryTypeId: (await this.getLotteryType(lotteryTypeName)).id,
              concurso,
            }
          });

          if (exists) {
            continue;
          }

          await this.syncConcurso(lotteryTypeName, concurso);
          syncedCount++;

          // Small delay to be nice to the API
          await new Promise(resolve => setTimeout(resolve, 100));

          if (syncedCount % 10 === 0) {
            this.logger.log(`Synced ${syncedCount}/${latestConcurso} draws...`);
          }
        } catch (error) {
          this.logger.error(`Failed to sync concurso ${concurso}: ${error.message}`);
          errorCount++;
        }
      }

      this.logger.log(`Full sync complete. Synced: ${syncedCount}, Errors: ${errorCount}`);
      return { success: true, syncedCount, errorCount };
    } catch (error) {
      this.logger.error(`Fatal error in full sync: ${error.message}`);
      throw error;
    }
  }

  async syncConcurso(lotteryTypeName: string, concurso: number) {
    const url = `${this.getAPIUrl(lotteryTypeName)}/${concurso}`;
    const response = await firstValueFrom(this.httpService.get(url));
    const apiDraw = response.data;

    const lotteryType = await this.getLotteryType(lotteryTypeName);
    const draw = this.createDrawFromAPI(apiDraw, lotteryType.id);

    await this.drawRepository.save(draw);

    // Emit event
    this.client.emit('lottery.draw.created', {
      lotteryType: lotteryTypeName,
      concurso: draw.concurso,
      numbers: draw.numbers,
    });

    return draw;
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

  private async getLotteryType(name: string) {
    const type = await this.lotteryTypeRepository.findOne({ where: { name } });
    if (!type) throw new Error(`Lottery type ${name} not found`);
    return type;
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

    // Robust Date Parsing
    const parseDate = (dateStr: string): Date => {
      if (!dateStr) throw new Error('Date string is empty');

      // Handle DD/MM/YYYY
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // Note: Month is 0-indexed in JS Date constructor if using arguments, 
          // but 1-indexed in string format "YYYY-MM-DD"
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          return new Date(year, month - 1, day);
        }
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}`);
      }
      return date;
    };

    try {
      draw.drawDate = parseDate(apiDraw.data);
    } catch (e) {
      this.logger.warn(`Date parsing failed for concurso ${apiDraw.concurso}: ${e.message}. Using current date as fallback for debug.`);
      // FAIL SAFE: Don't crash, but maybe mark as invalid? 
      // For now, let's throw to ensure we don't have bad data, but the loop catches it.
      throw e;
    }

    // Parse numbers ensuring they are numbers
    const rawNumbers = apiDraw.dezenas || apiDraw.listaDezenas || [];
    draw.numbers = rawNumbers.map((n: any) => parseInt(n, 10)).filter((n: number) => !isNaN(n));

    // Calculate temporal context
    const date = draw.drawDate;
    draw.dayOfWeek = date.getDay() + 1; // 1=Monday, 7=Sunday
    draw.dayOfMonth = date.getDate();
    draw.month = date.getMonth() + 1;
    draw.quarter = Math.floor(date.getMonth() / 3) + 1;
    draw.year = date.getFullYear();
    draw.isWeekend = draw.dayOfWeek === 6 || draw.dayOfWeek === 7;

    // Calculate numerical statistics
    const numbers = draw.numbers;

    if (numbers.length > 0) {
      draw.sumOfNumbers = numbers.reduce((a, b) => a + b, 0);
      draw.averageNumber = draw.sumOfNumbers / numbers.length;

      // Calculate standard deviation
      const mean = draw.averageNumber;
      const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
      draw.stdDeviation = Math.sqrt(variance);
    } else {
      draw.sumOfNumbers = 0;
      draw.averageNumber = 0;
      draw.stdDeviation = 0;
    }

    // Pattern analysis
    draw.oddCount = numbers.filter(n => n % 2 !== 0).length;
    draw.evenCount = numbers.filter(n => n % 2 === 0).length;
    draw.primeCount = numbers.filter(n => this.isPrime(n)).length;
    draw.consecutiveCount = this.countConsecutive(numbers);

    // Prize information - Handle string values like "R$ 1.000,00" or null
    const parseCurrency = (val: any): number => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      if (typeof val === 'string') {
        // Remove 'R$', '.', and replace ',' with '.'
        const clean = val.replace(/[^\d,]/g, '').replace(',', '.');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };

    draw.accumulated = apiDraw.acumulado || false;
    draw.accumulatedValue = parseCurrency(apiDraw.valorAcumulado);
    draw.estimatedPrize = parseCurrency(apiDraw.valorEstimadoProximoConcurso);

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
