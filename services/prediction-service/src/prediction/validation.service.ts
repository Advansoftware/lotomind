import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, map } from 'rxjs';

export interface ValidationJob {
  id: number;
  lotteryTypeId: number;
  lotteryType: string;
  jobType: string;
  status: string;
  progressCurrent: number;
  progressTotal: number;
  progressPercentage: number;
  currentConcurso?: number;
  currentStrategy?: string;
  startedAt?: Date;
  estimatedCompletion?: Date;
}

export interface ValidationResult {
  concurso: number;
  strategyId: number;
  strategyName: string;
  predictedNumbers: number[];
  actualNumbers: number[];
  matchedNumbers: number[];
  hits: number;
  confidenceScore: number;
  reasoning?: string;
}

export interface StrategyPerformance {
  strategyId: number;
  strategyName: string;
  displayName: string;
  category: string;
  totalPredictions: number;
  avgHits: number;
  maxHits: number;
  perfectMatches: number;
  quinaMatches: number;
  quadraMatches: number;
  hitRate4Plus: number;
  rank: number;
}

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private activeJobs: Map<number, boolean> = new Map(); // jobId -> isRunning
  private progressCallbacks: Map<number, (data: any) => void> = new Map();

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private httpService: HttpService,
    @Inject('PREDICTION_SERVICE') private client: ClientProxy,
  ) { }

  /**
   * Start a full historical validation job
   */
  async startFullValidation(params: {
    lotteryType: string;
    startConcurso?: number;
    endConcurso?: number;
    strategyIds?: number[];
  }): Promise<ValidationJob> {
    this.logger.log(`Starting full validation for ${params.lotteryType}`);

    // Get lottery type ID
    const lotteryTypeResult = await this.dataSource.query(
      'SELECT id FROM lottery_types WHERE name = ? LIMIT 1',
      [params.lotteryType]
    );

    if (!lotteryTypeResult?.length) {
      throw new Error(`Lottery type ${params.lotteryType} not found`);
    }

    const lotteryTypeId = lotteryTypeResult[0].id;

    // Get draw range
    const drawRange = await this.dataSource.query(
      `SELECT MIN(concurso) as min_concurso, MAX(concurso) as max_concurso 
       FROM draws WHERE lottery_type_id = ?`,
      [lotteryTypeId]
    );

    const startConcurso = params.startConcurso || drawRange[0]?.min_concurso || 1;
    const endConcurso = params.endConcurso || drawRange[0]?.max_concurso || 1;

    // Get strategies to test
    const strategies = await this.dataSource.query(
      params.strategyIds?.length
        ? 'SELECT id, name FROM strategies WHERE id IN (?) AND active = true'
        : 'SELECT id, name FROM strategies WHERE active = true',
      params.strategyIds?.length ? [params.strategyIds] : []
    );

    const totalConcursos = endConcurso - startConcurso + 1;
    const progressTotal = totalConcursos * strategies.length;

    // Create validation job
    const jobResult = await this.dataSource.query(
      `INSERT INTO validation_jobs 
       (lottery_type_id, job_type, start_concurso, end_concurso, strategies_to_test, 
        status, progress_total, progress_current, progress_percentage)
       VALUES (?, 'full_backtest', ?, ?, ?, 'queued', ?, 0, 0)`,
      [lotteryTypeId, startConcurso, endConcurso, JSON.stringify(strategies.map((s: any) => s.id)), progressTotal]
    );

    const jobId = jobResult.insertId;

    // Start validation in background
    this.processValidationJob(jobId, params.lotteryType, lotteryTypeId, startConcurso, endConcurso, strategies);

    return {
      id: jobId,
      lotteryTypeId,
      lotteryType: params.lotteryType,
      jobType: 'full_backtest',
      status: 'queued',
      progressCurrent: 0,
      progressTotal,
      progressPercentage: 0,
    };
  }

  /**
   * Process validation job in background
   */
  private async processValidationJob(
    jobId: number,
    lotteryType: string,
    lotteryTypeId: number,
    startConcurso: number,
    endConcurso: number,
    strategies: any[]
  ): Promise<void> {
    this.activeJobs.set(jobId, true);

    try {
      // Update job status to running
      await this.dataSource.query(
        `UPDATE validation_jobs SET status = 'running', started_at = NOW() WHERE id = ?`,
        [jobId]
      );

      this.emitProgress(jobId, {
        status: 'running',
        message: 'Iniciando validação...',
        progressCurrent: 0,
        progressTotal: (endConcurso - startConcurso + 1) * strategies.length,
      });

      // Get all historical draws
      const draws = await this.dataSource.query(
        `SELECT concurso, numbers, draw_date FROM draws 
         WHERE lottery_type_id = ? AND concurso BETWEEN ? AND ?
         ORDER BY concurso ASC`,
        [lotteryTypeId, startConcurso, endConcurso]
      );

      let progressCurrent = 0;
      const progressTotal = draws.length * strategies.length;

      // For each draw, test all strategies
      for (let i = 0; i < draws.length; i++) {
        const draw = draws[i];
        const actualNumbers = typeof draw.numbers === 'string'
          ? JSON.parse(draw.numbers)
          : draw.numbers;

        // Check if job was cancelled
        if (!this.activeJobs.get(jobId)) {
          await this.dataSource.query(
            `UPDATE validation_jobs SET status = 'cancelled' WHERE id = ?`,
            [jobId]
          );
          return;
        }

        // Get training data (all draws before current)
        const trainingDraws = draws.slice(0, i);

        if (trainingDraws.length < 10) {
          progressCurrent += strategies.length;
          continue; // Need minimum training data
        }

        for (const strategy of strategies) {
          try {
            // Generate prediction using the strategy
            const prediction = await this.generatePredictionForValidation(
              lotteryType,
              strategy.name,
              trainingDraws
            );

            // Calculate hits
            const matchedNumbers = prediction.filter((n: number) => actualNumbers.includes(n));
            const hits = matchedNumbers.length;

            // Save validation result
            await this.dataSource.query(
              `INSERT INTO validation_results 
               (validation_job_id, lottery_type_id, strategy_id, concurso,
                predicted_numbers, actual_numbers, matched_numbers, hits,
                confidence_score, draws_used_for_prediction,
                is_perfect_match, is_quina, is_quadra)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
                predicted_numbers = VALUES(predicted_numbers),
                hits = VALUES(hits),
                matched_numbers = VALUES(matched_numbers)`,
              [
                jobId, lotteryTypeId, strategy.id, draw.concurso,
                JSON.stringify(prediction), JSON.stringify(actualNumbers),
                JSON.stringify(matchedNumbers), hits,
                0.5, trainingDraws.length,
                hits === 6, hits === 5, hits === 4
              ]
            );

            progressCurrent++;

            // Update progress every 10 iterations or on significant milestones
            if (progressCurrent % 10 === 0 || hits >= 4) {
              const percentage = (progressCurrent / progressTotal) * 100;

              await this.dataSource.query(
                `UPDATE validation_jobs 
                 SET progress_current = ?, progress_percentage = ?, 
                     current_concurso = ?, current_strategy = ?
                 WHERE id = ?`,
                [progressCurrent, percentage, draw.concurso, strategy.name, jobId]
              );

              this.emitProgress(jobId, {
                status: 'running',
                progressCurrent,
                progressTotal,
                progressPercentage: percentage,
                currentConcurso: draw.concurso,
                currentStrategy: strategy.name,
                hits: hits >= 4 ? { concurso: draw.concurso, strategy: strategy.name, hits } : undefined,
              });
            }

          } catch (error) {
            this.logger.error(`Error validating ${strategy.name} for concurso ${draw.concurso}: ${error.message}`);
            progressCurrent++;
          }
        }
      }

      // Calculate final statistics
      const stats = await this.calculateJobStatistics(jobId, lotteryTypeId);

      // Update job as completed
      await this.dataSource.query(
        `UPDATE validation_jobs 
         SET status = 'completed', completed_at = NOW(),
             progress_percentage = 100, progress_current = progress_total,
             total_predictions_tested = ?, total_hits = ?, avg_hits = ?,
             best_strategy_id = ?, best_hit_count = ?,
             execution_time_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW())
         WHERE id = ?`,
        [stats.totalPredictions, stats.totalHits, stats.avgHits,
        stats.bestStrategyId, stats.bestHitCount, jobId]
      );

      // Update strategy performance tables
      for (const strategy of strategies) {
        await this.dataSource.query(
          'CALL update_strategy_performance(?, ?)',
          [lotteryTypeId, strategy.id]
        );
      }

      this.emitProgress(jobId, {
        status: 'completed',
        progressCurrent: progressTotal,
        progressTotal,
        progressPercentage: 100,
        statistics: stats,
      });

      this.logger.log(`Validation job ${jobId} completed successfully`);

    } catch (error) {
      this.logger.error(`Validation job ${jobId} failed: ${error.message}`);

      await this.dataSource.query(
        `UPDATE validation_jobs SET status = 'failed', error_message = ? WHERE id = ?`,
        [error.message, jobId]
      );

      this.emitProgress(jobId, {
        status: 'failed',
        error: error.message,
      });
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Generate prediction for validation using prediction service
   */
  private async generatePredictionForValidation(
    lotteryType: string,
    strategyName: string,
    trainingDraws: any[]
  ): Promise<number[]> {
    try {
      const predictionServiceUrl = process.env.PREDICTION_SERVICE_URL || 'http://prediction-service:3002';

      const response = await firstValueFrom(
        this.httpService.post(`${predictionServiceUrl}/predictions/generate-for-validation`, {
          lotteryType,
          strategyName,
          historicalDraws: trainingDraws.slice(-100), // Last 100 draws
        }).pipe(map(res => res.data))
      );

      return response.predictedNumbers;
    } catch (error) {
      // Fallback: generate simple prediction based on frequency
      return this.generateFallbackPrediction(trainingDraws, lotteryType);
    }
  }

  /**
   * Simple fallback prediction based on frequency
   */
  private generateFallbackPrediction(draws: any[], lotteryType: string): number[] {
    const frequency: Map<number, number> = new Map();

    // Count frequency of each number
    for (const draw of draws.slice(-50)) {
      const numbers = typeof draw.numbers === 'string'
        ? JSON.parse(draw.numbers)
        : draw.numbers;

      for (const num of numbers) {
        frequency.set(num, (frequency.get(num) || 0) + 1);
      }
    }

    // Sort by frequency and take top N
    const sorted = [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    const config = this.getLotteryConfig(lotteryType);
    return sorted.slice(0, config.numbersToDraw).sort((a, b) => a - b);
  }

  private getLotteryConfig(lotteryType: string) {
    const configs: Record<string, { numbersToDraw: number; maxNumber: number }> = {
      megasena: { numbersToDraw: 6, maxNumber: 60 },
      quina: { numbersToDraw: 5, maxNumber: 80 },
      lotofacil: { numbersToDraw: 15, maxNumber: 25 },
      lotomania: { numbersToDraw: 20, maxNumber: 100 },
    };
    return configs[lotteryType] || configs.megasena;
  }

  /**
   * Calculate statistics for a validation job
   */
  private async calculateJobStatistics(jobId: number, lotteryTypeId: number): Promise<{
    totalPredictions: number;
    totalHits: number;
    avgHits: number;
    bestStrategyId: number;
    bestHitCount: number;
  }> {
    const stats = await this.dataSource.query(
      `SELECT 
         COUNT(*) as total_predictions,
         SUM(hits) as total_hits,
         AVG(hits) as avg_hits,
         MAX(hits) as max_hits
       FROM validation_results
       WHERE validation_job_id = ?`,
      [jobId]
    );

    const bestStrategy = await this.dataSource.query(
      `SELECT strategy_id, AVG(hits) as avg_hits
       FROM validation_results
       WHERE validation_job_id = ?
       GROUP BY strategy_id
       ORDER BY avg_hits DESC
       LIMIT 1`,
      [jobId]
    );

    return {
      totalPredictions: stats[0]?.total_predictions || 0,
      totalHits: stats[0]?.total_hits || 0,
      avgHits: parseFloat(stats[0]?.avg_hits) || 0,
      bestStrategyId: bestStrategy[0]?.strategy_id || null,
      bestHitCount: stats[0]?.max_hits || 0,
    };
  }

  /**
   * Get validation job status
   */
  async getJobStatus(jobId: number): Promise<ValidationJob | null> {
    const result = await this.dataSource.query(
      `SELECT vj.*, lt.name as lottery_type
       FROM validation_jobs vj
       JOIN lottery_types lt ON vj.lottery_type_id = lt.id
       WHERE vj.id = ?`,
      [jobId]
    );

    if (!result?.length) return null;

    const job = result[0];
    return {
      id: job.id,
      lotteryTypeId: job.lottery_type_id,
      lotteryType: job.lottery_type,
      jobType: job.job_type,
      status: job.status,
      progressCurrent: job.progress_current,
      progressTotal: job.progress_total,
      progressPercentage: job.progress_percentage,
      currentConcurso: job.current_concurso,
      currentStrategy: job.current_strategy,
      startedAt: job.started_at,
      estimatedCompletion: job.estimated_completion,
    };
  }

  /**
   * Cancel a running validation job
   */
  async cancelJob(jobId: number): Promise<boolean> {
    if (this.activeJobs.has(jobId)) {
      this.activeJobs.set(jobId, false);
      return true;
    }
    return false;
  }

  /**
   * Get validation results with pagination
   */
  async getValidationResults(params: {
    lotteryType: string;
    page?: number;
    limit?: number;
    strategyId?: number;
    minHits?: number;
  }): Promise<{
    data: ValidationResult[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE lt.name = ?';
    const queryParams: any[] = [params.lotteryType];

    if (params.strategyId) {
      whereClause += ' AND vr.strategy_id = ?';
      queryParams.push(params.strategyId);
    }

    if (params.minHits) {
      whereClause += ' AND vr.hits >= ?';
      queryParams.push(params.minHits);
    }

    // Get total count
    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) as total
       FROM validation_results vr
       JOIN lottery_types lt ON vr.lottery_type_id = lt.id
       ${whereClause}`,
      queryParams
    );

    const total = countResult[0]?.total || 0;

    // Get paginated results
    const results = await this.dataSource.query(
      `SELECT 
         vr.concurso,
         vr.strategy_id,
         s.name as strategy_name,
         s.display_name as strategy_display_name,
         vr.predicted_numbers,
         vr.actual_numbers,
         vr.matched_numbers,
         vr.hits,
         vr.confidence_score,
         vr.reasoning,
         vr.is_perfect_match,
         vr.is_quina,
         vr.is_quadra,
         vr.created_at
       FROM validation_results vr
       JOIN lottery_types lt ON vr.lottery_type_id = lt.id
       JOIN strategies s ON vr.strategy_id = s.id
       ${whereClause}
       ORDER BY vr.concurso DESC, vr.hits DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    return {
      data: results.map((r: any) => ({
        concurso: r.concurso,
        strategyId: r.strategy_id,
        strategyName: r.strategy_name,
        predictedNumbers: typeof r.predicted_numbers === 'string'
          ? JSON.parse(r.predicted_numbers)
          : r.predicted_numbers,
        actualNumbers: typeof r.actual_numbers === 'string'
          ? JSON.parse(r.actual_numbers)
          : r.actual_numbers,
        matchedNumbers: typeof r.matched_numbers === 'string'
          ? JSON.parse(r.matched_numbers)
          : r.matched_numbers,
        hits: r.hits,
        confidenceScore: r.confidence_score,
        reasoning: r.reasoning,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get strategy performance rankings
   */
  async getStrategyRankings(lotteryType: string): Promise<StrategyPerformance[]> {
    const results = await this.dataSource.query(
      `SELECT 
         shp.strategy_id,
         s.name as strategy_name,
         s.display_name,
         s.category,
         shp.total_predictions,
         shp.avg_hits,
         shp.max_hits,
         shp.perfect_matches,
         shp.quina_matches,
         shp.quadra_matches,
         shp.hit_rate_4plus,
         shp.overall_rank
       FROM strategy_historical_performance shp
       JOIN strategies s ON shp.strategy_id = s.id
       JOIN lottery_types lt ON shp.lottery_type_id = lt.id
       WHERE lt.name = ?
       ORDER BY shp.overall_rank ASC`,
      [lotteryType]
    );

    return results.map((r: any) => ({
      strategyId: r.strategy_id,
      strategyName: r.strategy_name,
      displayName: r.display_name,
      category: r.category,
      totalPredictions: r.total_predictions,
      avgHits: parseFloat(r.avg_hits),
      maxHits: r.max_hits,
      perfectMatches: r.perfect_matches,
      quinaMatches: r.quina_matches,
      quadraMatches: r.quadra_matches,
      hitRate4Plus: parseFloat(r.hit_rate_4plus),
      rank: r.overall_rank,
    }));
  }

  /**
   * Get detailed strategy ranking for frontend display
   */
  async getDetailedStrategyRanking(lotteryType: string): Promise<Array<{
    strategyName: string;
    strategyDescription: string;
    totalPredictions: number;
    avgHits: number;
    maxHits: number;
    avgConfidence: number;
    hitRate4Plus: number;
    hitRate5Plus: number;
    hitRate6: number;
    score: number;
  }>> {
    // Try to get from pre-calculated performance table first
    const cachedResults = await this.dataSource.query(
      `SELECT 
         s.name as strategy_name,
         s.description as strategy_description,
         shp.total_predictions,
         shp.avg_hits,
         shp.max_hits,
         0.5 as avg_confidence,
         COALESCE(shp.hit_rate_4plus, 0) as hit_rate_4plus,
         COALESCE((shp.quina_matches + shp.perfect_matches) / NULLIF(shp.total_predictions, 0), 0) as hit_rate_5plus,
         COALESCE(shp.perfect_matches / NULLIF(shp.total_predictions, 0), 0) as hit_rate_6,
         (shp.avg_hits * 10 + shp.hit_rate_4plus * 100 + shp.max_hits * 2) as score
       FROM strategy_historical_performance shp
       JOIN strategies s ON shp.strategy_id = s.id
       JOIN lottery_types lt ON shp.lottery_type_id = lt.id
       WHERE lt.name = ?
       ORDER BY score DESC`,
      [lotteryType]
    );

    if (cachedResults?.length > 0) {
      return cachedResults.map((r: any) => ({
        strategyName: r.strategy_name,
        strategyDescription: r.strategy_description || '',
        totalPredictions: r.total_predictions,
        avgHits: parseFloat(r.avg_hits) || 0,
        maxHits: r.max_hits || 0,
        avgConfidence: parseFloat(r.avg_confidence) || 0.5,
        hitRate4Plus: parseFloat(r.hit_rate_4plus) || 0,
        hitRate5Plus: parseFloat(r.hit_rate_5plus) || 0,
        hitRate6: parseFloat(r.hit_rate_6) || 0,
        score: parseFloat(r.score) || 0,
      }));
    }

    // Fallback: Calculate from validation_results directly
    const results = await this.dataSource.query(
      `SELECT 
         s.name as strategy_name,
         s.description as strategy_description,
         COUNT(*) as total_predictions,
         AVG(vr.hits) as avg_hits,
         MAX(vr.hits) as max_hits,
         AVG(vr.confidence_score) as avg_confidence,
         SUM(CASE WHEN vr.hits >= 4 THEN 1 ELSE 0 END) / COUNT(*) as hit_rate_4plus,
         SUM(CASE WHEN vr.hits >= 5 THEN 1 ELSE 0 END) / COUNT(*) as hit_rate_5plus,
         SUM(CASE WHEN vr.hits >= 6 THEN 1 ELSE 0 END) / COUNT(*) as hit_rate_6
       FROM validation_results vr
       JOIN strategies s ON vr.strategy_id = s.id
       JOIN lottery_types lt ON vr.lottery_type_id = lt.id
       WHERE lt.name = ?
       GROUP BY s.id, s.name, s.description
       HAVING COUNT(*) > 0
       ORDER BY avg_hits DESC, hit_rate_4plus DESC`,
      [lotteryType]
    );

    return results.map((r: any) => ({
      strategyName: r.strategy_name,
      strategyDescription: r.strategy_description || '',
      totalPredictions: r.total_predictions,
      avgHits: parseFloat(r.avg_hits) || 0,
      maxHits: r.max_hits || 0,
      avgConfidence: parseFloat(r.avg_confidence) || 0.5,
      hitRate4Plus: parseFloat(r.hit_rate_4plus) || 0,
      hitRate5Plus: parseFloat(r.hit_rate_5plus) || 0,
      hitRate6: parseFloat(r.hit_rate_6) || 0,
      score: (parseFloat(r.avg_hits) * 10) + (parseFloat(r.hit_rate_4plus) * 100) + (r.max_hits * 2),
    }));
  }

  /**
   * Get detailed analysis for a specific concurso
   */
  async getConcursoAnalysis(lotteryType: string, concurso: number): Promise<{
    concurso: number;
    drawDate: Date;
    actualNumbers: number[];
    strategyResults: Array<{
      strategyId: number;
      strategyName: string;
      displayName: string;
      category: string;
      predictedNumbers: number[];
      matchedNumbers: number[];
      hits: number;
      reasoning?: string;
    }>;
    bestStrategy: string;
    bestHits: number;
  }> {
    // Get draw info
    const drawResult = await this.dataSource.query(
      `SELECT d.concurso, d.draw_date, d.numbers
       FROM draws d
       JOIN lottery_types lt ON d.lottery_type_id = lt.id
       WHERE lt.name = ? AND d.concurso = ?`,
      [lotteryType, concurso]
    );

    if (!drawResult?.length) {
      throw new Error(`Draw ${concurso} not found for ${lotteryType}`);
    }

    const draw = drawResult[0];
    const actualNumbers = typeof draw.numbers === 'string'
      ? JSON.parse(draw.numbers)
      : draw.numbers;

    // Get all strategy results for this concurso
    const results = await this.dataSource.query(
      `SELECT 
         vr.strategy_id,
         s.name as strategy_name,
         s.display_name,
         s.category,
         vr.predicted_numbers,
         vr.matched_numbers,
         vr.hits,
         vr.reasoning
       FROM validation_results vr
       JOIN strategies s ON vr.strategy_id = s.id
       JOIN lottery_types lt ON vr.lottery_type_id = lt.id
       WHERE lt.name = ? AND vr.concurso = ?
       ORDER BY vr.hits DESC`,
      [lotteryType, concurso]
    );

    const strategyResults = results.map((r: any) => ({
      strategyId: r.strategy_id,
      strategyName: r.strategy_name,
      displayName: r.display_name,
      category: r.category,
      predictedNumbers: typeof r.predicted_numbers === 'string'
        ? JSON.parse(r.predicted_numbers)
        : r.predicted_numbers,
      matchedNumbers: typeof r.matched_numbers === 'string'
        ? JSON.parse(r.matched_numbers)
        : r.matched_numbers,
      hits: r.hits,
      reasoning: r.reasoning,
    }));

    const bestResult = strategyResults[0];

    return {
      concurso,
      drawDate: draw.draw_date,
      actualNumbers,
      strategyResults,
      bestStrategy: bestResult?.displayName || 'N/A',
      bestHits: bestResult?.hits || 0,
    };
  }

  /**
   * Emit progress event via RabbitMQ
   */
  private emitProgress(jobId: number, data: any): void {
    const payload = {
      jobId,
      ...data,
      timestamp: new Date().toISOString(),
    };

    // Emit via RabbitMQ for WebSocket broadcast
    this.client.emit('validation.progress', payload);

    // Also notify any registered callback
    const callback = this.progressCallbacks.get(jobId);
    if (callback) {
      callback(payload);
    }

    this.logger.debug(`Validation progress emitted: Job ${jobId} - ${JSON.stringify(data)}`);
  }

  /**
   * Register a callback to receive progress updates for a job
   */
  onProgress(jobId: number, callback: (data: any) => void): void {
    this.progressCallbacks.set(jobId, callback);
  }

  /**
   * Unregister progress callback
   */
  offProgress(jobId: number): void {
    this.progressCallbacks.delete(jobId);
  }
}
