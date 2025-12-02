import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Draw } from './entities/draw.entity';
import { LotteryType } from './entities/lottery-type.entity';
import { SyncJob, SyncJobStatus, SyncJobType } from './entities/sync-job.entity';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private runningJobs: Map<number, boolean> = new Map();

  constructor(
    @InjectRepository(Draw)
    private drawRepository: Repository<Draw>,
    @InjectRepository(LotteryType)
    private lotteryTypeRepository: Repository<LotteryType>,
    @InjectRepository(SyncJob)
    private syncJobRepository: Repository<SyncJob>,
    private httpService: HttpService,
    @Inject('LOTTERY_SERVICE') private client: ClientProxy,
  ) { }

  /**
   * Create and start an async sync job
   */
  async startSyncJob(jobType: SyncJobType, lotteryType?: string): Promise<SyncJob> {
    // Create job record
    const job = this.syncJobRepository.create({
      jobType,
      lotteryType,
      status: 'pending',
      totalItems: 0,
      processedItems: 0,
      progressPercent: 0,
      message: 'Iniciando sincronização...',
    });

    await this.syncJobRepository.save(job);

    // Start async execution (don't await)
    this.executeJob(job.id).catch(err => {
      this.logger.error(`Job ${job.id} failed: ${err.message}`);
    });

    return job;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: number): Promise<SyncJob | null> {
    return this.syncJobRepository.findOne({ where: { id: jobId } });
  }

  /**
   * Get all jobs
   */
  async getJobs(limit: number = 10): Promise<SyncJob[]> {
    return this.syncJobRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: number): Promise<boolean> {
    const job = await this.syncJobRepository.findOne({ where: { id: jobId } });
    if (!job || job.status !== 'running') {
      return false;
    }

    this.runningJobs.set(jobId, false);
    job.status = 'cancelled';
    job.message = 'Sincronização cancelada pelo usuário';
    job.completedAt = new Date();
    await this.syncJobRepository.save(job);

    return true;
  }

  /**
   * Execute sync job
   */
  private async executeJob(jobId: number): Promise<void> {
    const job = await this.syncJobRepository.findOne({ where: { id: jobId } });
    if (!job) return;

    this.runningJobs.set(jobId, true);

    try {
      job.status = 'running';
      job.startedAt = new Date();
      await this.syncJobRepository.save(job);

      // Emit start event
      this.client.emit('sync.job.started', { jobId, jobType: job.jobType, lotteryType: job.lotteryType });

      switch (job.jobType) {
        case 'sync_full':
          await this.executeSyncFull(job);
          break;
        case 'sync_latest':
          await this.executeSyncLatest(job);
          break;
        case 'sync_all':
          await this.executeSyncAll(job);
          break;
      }

      if (this.runningJobs.get(jobId)) {
        job.status = 'completed';
        job.completedAt = new Date();
        job.message = 'Sincronização concluída com sucesso!';
        await this.syncJobRepository.save(job);

        // Emit completion event
        this.client.emit('sync.job.completed', {
          jobId,
          successCount: job.successCount,
          errorCount: job.errorCount
        });
      }
    } catch (error) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.message = `Erro: ${error.message}`;
      await this.syncJobRepository.save(job);

      // Emit error event
      this.client.emit('sync.job.failed', { jobId, error: error.message });
    } finally {
      this.runningJobs.delete(jobId);
    }
  }

  /**
   * Execute full sync for a specific lottery
   */
  private async executeSyncFull(job: SyncJob): Promise<void> {
    const lotteryType = await this.lotteryTypeRepository.findOne({
      where: { name: job.lotteryType },
    });

    if (!lotteryType) {
      throw new Error(`Lottery type ${job.lotteryType} not found`);
    }

    // Get latest concurso from API
    const apiUrl = this.getAPIUrl(job.lotteryType);
    const response = await firstValueFrom(this.httpService.get(apiUrl));
    const latestDraw = Array.isArray(response.data) ? response.data[0] : response.data;
    const latestConcurso = latestDraw.concurso;

    // Get existing concursos
    const existingDraws = await this.drawRepository.find({
      where: { lotteryTypeId: lotteryType.id },
      select: ['concurso'],
    });
    const existingConcursos = new Set(existingDraws.map(d => d.concurso));

    // Calculate missing concursos
    const missingConcursos: number[] = [];
    for (let i = 1; i <= latestConcurso; i++) {
      if (!existingConcursos.has(i)) {
        missingConcursos.push(i);
      }
    }

    job.totalItems = missingConcursos.length;
    job.message = `Sincronizando ${missingConcursos.length} concursos de ${job.lotteryType}...`;
    await this.syncJobRepository.save(job);

    if (missingConcursos.length === 0) {
      job.message = 'Todos os concursos já estão sincronizados!';
      return;
    }

    // Process in batches
    for (let i = 0; i < missingConcursos.length; i++) {
      if (!this.runningJobs.get(job.id)) break; // Check if cancelled

      const concurso = missingConcursos[i];

      try {
        await this.syncConcurso(job.lotteryType, concurso, lotteryType.id);
        job.successCount++;
      } catch (error) {
        this.logger.warn(`Failed to sync concurso ${concurso}: ${error.message}`);
        job.errorCount++;
      }

      job.processedItems++;
      job.progressPercent = Math.round((job.processedItems / job.totalItems) * 100);
      job.currentItem = `Concurso ${concurso}`;

      // Update every 10 items or at completion
      if (i % 10 === 0 || i === missingConcursos.length - 1) {
        await this.syncJobRepository.save(job);

        // Emit progress event
        this.client.emit('sync.job.progress', {
          jobId: job.id,
          progress: job.progressPercent,
          processedItems: job.processedItems,
          totalItems: job.totalItems,
          currentItem: job.currentItem,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    job.result = {
      totalSynced: job.successCount,
      errors: job.errorCount,
      lotteryType: job.lotteryType,
    };
  }

  /**
   * Execute sync for latest draws only
   */
  private async executeSyncLatest(job: SyncJob): Promise<void> {
    const lotteryType = await this.lotteryTypeRepository.findOne({
      where: { name: job.lotteryType },
    });

    if (!lotteryType) {
      throw new Error(`Lottery type ${job.lotteryType} not found`);
    }

    job.totalItems = 1;
    job.message = `Sincronizando último concurso de ${job.lotteryType}...`;
    await this.syncJobRepository.save(job);

    const apiUrl = this.getAPIUrl(job.lotteryType);
    const response = await firstValueFrom(this.httpService.get(apiUrl));
    const apiDraw = Array.isArray(response.data) ? response.data[0] : response.data;

    const existing = await this.drawRepository.findOne({
      where: { lotteryTypeId: lotteryType.id, concurso: apiDraw.concurso },
    });

    if (!existing) {
      const draw = this.createDrawFromAPI(apiDraw, lotteryType.id);
      await this.drawRepository.save(draw);
      job.successCount = 1;
      job.message = `Concurso ${apiDraw.concurso} sincronizado!`;
    } else {
      job.message = `Concurso ${apiDraw.concurso} já existe.`;
    }

    job.processedItems = 1;
    job.progressPercent = 100;
    job.result = { concurso: apiDraw.concurso, wasNew: !existing };
  }

  /**
   * Execute sync for all lottery types
   */
  private async executeSyncAll(job: SyncJob): Promise<void> {
    const lotteryTypes = ['megasena', 'quina', 'lotofacil', 'lotomania'];
    job.totalItems = lotteryTypes.length;
    job.message = 'Sincronizando todas as loterias...';
    await this.syncJobRepository.save(job);

    const results: Record<string, unknown>[] = [];

    for (let i = 0; i < lotteryTypes.length; i++) {
      if (!this.runningJobs.get(job.id)) break;

      const lt = lotteryTypes[i];
      job.currentItem = lt;

      try {
        // Create a sub-job for full sync
        const subJob = this.syncJobRepository.create({
          jobType: 'sync_full',
          lotteryType: lt,
          status: 'running',
        });
        await this.syncJobRepository.save(subJob);

        await this.executeSyncFull(subJob);

        results.push({ lotteryType: lt, success: true, count: subJob.successCount });
        job.successCount++;
      } catch (error) {
        results.push({ lotteryType: lt, success: false, error: error.message });
        job.errorCount++;
      }

      job.processedItems++;
      job.progressPercent = Math.round((job.processedItems / job.totalItems) * 100);
      await this.syncJobRepository.save(job);

      this.client.emit('sync.job.progress', {
        jobId: job.id,
        progress: job.progressPercent,
        currentItem: lt,
      });
    }

    job.result = { results };
  }

  /**
   * Sync a specific concurso
   */
  private async syncConcurso(lotteryTypeName: string, concurso: number, lotteryTypeId: number): Promise<Draw> {
    const url = `${this.getAPIUrl(lotteryTypeName)}/${concurso}`;
    const response = await firstValueFrom(this.httpService.get(url));
    const apiDraw = response.data;

    const draw = this.createDrawFromAPI(apiDraw, lotteryTypeId);
    await this.drawRepository.save(draw);

    this.client.emit('lottery.draw.created', {
      lotteryType: lotteryTypeName,
      concurso: draw.concurso,
      numbers: draw.numbers,
    });

    return draw;
  }

  private getAPIUrl(lotteryType: string): string {
    const urls: Record<string, string> = {
      megasena: 'https://loteriascaixa-api.herokuapp.com/api/megasena',
      quina: 'https://loteriascaixa-api.herokuapp.com/api/quina',
      lotofacil: 'https://loteriascaixa-api.herokuapp.com/api/lotofacil',
      lotomania: 'https://loteriascaixa-api.herokuapp.com/api/lotomania',
    };
    return urls[lotteryType] || urls.megasena;
  }

  private createDrawFromAPI(apiDraw: Record<string, unknown>, lotteryTypeId: number): Draw {
    const draw = new Draw();
    draw.lotteryTypeId = lotteryTypeId;
    draw.concurso = apiDraw.concurso as number;

    // Parse date
    const dateStr = apiDraw.data as string;
    if (dateStr && dateStr.includes('/')) {
      const parts = dateStr.split('/');
      draw.drawDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      draw.drawDate = new Date(dateStr);
    }

    // Parse numbers
    const rawNumbers = (apiDraw.dezenas || apiDraw.listaDezenas) as string[];
    draw.numbers = rawNumbers.map(n => parseInt(n, 10)).filter(n => !isNaN(n));

    // Calculate statistics
    const numbers = draw.numbers;
    if (numbers.length > 0) {
      draw.sumOfNumbers = numbers.reduce((a, b) => a + b, 0);
      draw.averageNumber = draw.sumOfNumbers / numbers.length;
      const mean = draw.averageNumber;
      const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
      draw.stdDeviation = Math.sqrt(variance);
    }

    draw.oddCount = numbers.filter(n => n % 2 !== 0).length;
    draw.evenCount = numbers.filter(n => n % 2 === 0).length;
    draw.accumulated = (apiDraw.acumulado as boolean) || false;

    return draw;
  }
}
