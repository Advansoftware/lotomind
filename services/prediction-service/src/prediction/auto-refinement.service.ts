import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Interfaces para tipagem - exportadas para uso externo
export interface StrategyWeight {
  id: number;
  strategyId: number;
  lotteryTypeId: number;
  weight: number;
  confidence: number;
  hitRate: number;
  avgHits: number;
  totalPredictions: number;
  successfulPredictions: number;
  lastCalculated: Date;
  isActive: boolean;
}

export interface RefinementHistory {
  id: number;
  strategyId: number;
  lotteryTypeId: number;
  previousWeight: number;
  newWeight: number;
  changeReason: string;
  performanceData: any;
  createdAt: Date;
}

export interface StrategyEvolution {
  id: number;
  generation: number;
  lotteryTypeId: number;
  strategyDna: any;
  fitnessScore: number;
  parentIds: string;
  mutations: any;
  createdAt: Date;
}

export interface StrategyCombination {
  id: number;
  name: string;
  lotteryTypeId: number;
  strategyWeights: any;
  combinedHitRate: number;
  combinedAvgHits: number;
  totalTests: number;
  isActive: boolean;
  createdAt: Date;
}

interface ValidationResult {
  strategyId: number;
  strategyName: string;
  lotteryTypeId: number;
  hits: number;
  maxHits: number;
}

@Injectable()
export class AutoRefinementService {
  private readonly logger = new Logger(AutoRefinementService.name);

  constructor(
    private dataSource: DataSource,
  ) { }

  /**
   * Calcula e atualiza os pesos de todas as estratégias para um tipo de loteria
   */
  async calculateStrategyWeights(lotteryTypeId: number): Promise<void> {
    this.logger.log(`Calculando pesos das estratégias para loteria ${lotteryTypeId}`);

    try {
      // Buscar resultados de validação dos últimos 30 dias
      const validationResults = await this.dataSource.query(`
        SELECT 
          vr.strategy_id,
          s.name as strategy_name,
          vr.lottery_type_id,
          COUNT(*) as total_predictions,
          SUM(CASE WHEN vr.hits >= (
            SELECT CASE 
              WHEN lt.name = 'megasena' THEN 4
              WHEN lt.name = 'quina' THEN 3
              WHEN lt.name = 'lotofacil' THEN 11
              WHEN lt.name = 'lotomania' THEN 15
              WHEN lt.name = 'duplasena' THEN 4
              WHEN lt.name = 'timemania' THEN 4
              WHEN lt.name = 'diadesorte' THEN 4
              ELSE 3
            END
            FROM lottery_types lt WHERE lt.id = vr.lottery_type_id
          ) THEN 1 ELSE 0 END) as successful_predictions,
          AVG(vr.hits) as avg_hits,
          MAX(vr.hits) as max_hits,
          STDDEV(vr.hits) as hits_stddev
        FROM validation_results vr
        JOIN strategies s ON s.id = vr.strategy_id
        WHERE vr.lottery_type_id = ?
          AND vr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY vr.strategy_id, s.name, vr.lottery_type_id
        HAVING total_predictions >= 5
      `, [lotteryTypeId]);

      if (validationResults.length === 0) {
        this.logger.warn(`Sem resultados de validação suficientes para loteria ${lotteryTypeId}`);
        return;
      }

      // Buscar configuração da loteria
      const [lotteryConfig] = await this.dataSource.query(`
        SELECT numbers_to_draw FROM lottery_types WHERE id = ?
      `, [lotteryTypeId]);

      const maxPossibleHits = lotteryConfig?.numbers_to_draw || 6;

      // Calcular peso normalizado para cada estratégia
      const totalAvgHits = validationResults.reduce((sum, r) => sum + parseFloat(r.avg_hits || 0), 0);

      for (const result of validationResults) {
        const avgHits = parseFloat(result.avg_hits || 0);
        const maxHits = parseInt(result.max_hits || 0);
        const totalPredictions = parseInt(result.total_predictions || 0);
        const successfulPredictions = parseInt(result.successful_predictions || 0);
        const hitRate = totalPredictions > 0 ? successfulPredictions / totalPredictions : 0;

        // Peso baseado em múltiplos fatores
        // 1. Média de acertos normalizada (40%)
        const avgHitsScore = (avgHits / maxPossibleHits) * 0.4;

        // 2. Taxa de sucesso (30%)
        const hitRateScore = hitRate * 0.3;

        // 3. Máximo de acertos normalizado (20%)
        const maxHitsScore = (maxHits / maxPossibleHits) * 0.2;

        // 4. Consistência - menor desvio é melhor (10%)
        const stddev = parseFloat(result.hits_stddev || 0);
        const consistencyScore = stddev > 0 ? (1 - Math.min(stddev / maxPossibleHits, 1)) * 0.1 : 0.1;

        // Peso final (0 a 1)
        const weight = Math.min(avgHitsScore + hitRateScore + maxHitsScore + consistencyScore, 1);

        // Confiança baseada no número de predições
        const confidence = Math.min(totalPredictions / 100, 1);

        // Verificar se já existe registro
        const [existing] = await this.dataSource.query(`
          SELECT id, weight FROM strategy_weights 
          WHERE strategy_id = ? AND lottery_type_id = ?
        `, [result.strategy_id, lotteryTypeId]);

        if (existing) {
          const previousWeight = existing.weight;

          // Atualizar peso com suavização (evitar mudanças bruscas)
          const smoothedWeight = previousWeight * 0.3 + weight * 0.7;

          await this.dataSource.query(`
            UPDATE strategy_weights SET
              weight = ?,
              confidence = ?,
              hit_rate = ?,
              avg_hits = ?,
              total_predictions = ?,
              successful_predictions = ?,
              last_calculated = NOW()
            WHERE id = ?
          `, [smoothedWeight, confidence, hitRate, avgHits, totalPredictions, successfulPredictions, existing.id]);

          // Registrar histórico se houve mudança significativa
          if (Math.abs(smoothedWeight - previousWeight) > 0.05) {
            await this.dataSource.query(`
              INSERT INTO refinement_history 
              (strategy_id, lottery_type_id, previous_weight, new_weight, change_reason, performance_data)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
              result.strategy_id,
              lotteryTypeId,
              previousWeight,
              smoothedWeight,
              'Recálculo automático de pesos',
              JSON.stringify({ avgHits, maxHits, hitRate, confidence, totalPredictions })
            ]);
          }
        } else {
          // Criar novo registro
          await this.dataSource.query(`
            INSERT INTO strategy_weights 
            (strategy_id, lottery_type_id, weight, confidence, hit_rate, avg_hits, 
             total_predictions, successful_predictions, last_calculated, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)
          `, [result.strategy_id, lotteryTypeId, weight, confidence, hitRate, avgHits,
            totalPredictions, successfulPredictions]);
        }

        this.logger.debug(`Estratégia ${result.strategy_name}: peso=${weight.toFixed(4)}, conf=${confidence.toFixed(2)}`);
      }

      this.logger.log(`Pesos calculados para ${validationResults.length} estratégias da loteria ${lotteryTypeId}`);
    } catch (error) {
      this.logger.error(`Erro ao calcular pesos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Executa um ciclo completo de refinamento para todas as loterias
   */
  async runRefinementCycle(): Promise<{ success: boolean; details: any }> {
    this.logger.log('Iniciando ciclo de refinamento automático');

    const startTime = Date.now();
    const results = {
      lotteries: [],
      combinationsCreated: 0,
      errors: []
    };

    try {
      // Registrar job de refinamento
      const jobResult = await this.dataSource.query(`
        INSERT INTO refinement_jobs (status, started_at) VALUES ('running', NOW())
      `);
      const jobId = jobResult.insertId;

      // Buscar todas as loterias ativas
      const lotteryTypes = await this.dataSource.query(`
        SELECT id, name FROM lottery_types WHERE active = 1
      `);

      for (const lottery of lotteryTypes) {
        try {
          await this.calculateStrategyWeights(lottery.id);
          results.lotteries.push({ id: lottery.id, name: lottery.name, status: 'success' });
        } catch (error) {
          results.errors.push({ lottery: lottery.name, error: error.message });
          results.lotteries.push({ id: lottery.id, name: lottery.name, status: 'error' });
        }
      }

      // Criar/atualizar combinações híbridas
      try {
        const combinationsCreated = await this.createOptimalCombinations();
        results.combinationsCreated = combinationsCreated;
      } catch (error) {
        results.errors.push({ step: 'combinations', error: error.message });
      }

      const duration = Date.now() - startTime;

      // Atualizar job
      await this.dataSource.query(`
        UPDATE refinement_jobs SET
          status = 'completed',
          finished_at = NOW(),
          results = ?
        WHERE id = ?
      `, [JSON.stringify(results), jobId]);

      this.logger.log(`Ciclo de refinamento concluído em ${duration}ms`);
      return { success: true, details: results };

    } catch (error) {
      this.logger.error(`Erro no ciclo de refinamento: ${error.message}`);
      return { success: false, details: { error: error.message } };
    }
  }

  /**
   * Cria combinações ótimas de estratégias baseadas nos pesos
   */
  async createOptimalCombinations(): Promise<number> {
    this.logger.log('Criando combinações ótimas de estratégias');
    let combinationsCreated = 0;

    const lotteryTypes = await this.dataSource.query(`
      SELECT id, name FROM lottery_types WHERE active = 1
    `);

    for (const lottery of lotteryTypes) {
      // Buscar top 5 estratégias por peso
      const topStrategies = await this.dataSource.query(`
        SELECT sw.strategy_id, s.name, sw.weight, sw.confidence, sw.avg_hits
        FROM strategy_weights sw
        JOIN strategies s ON s.id = sw.strategy_id
        WHERE sw.lottery_type_id = ? AND sw.is_active = 1
        ORDER BY sw.weight DESC
        LIMIT 5
      `, [lottery.id]);

      if (topStrategies.length < 2) continue;

      // Criar combinação das top 3 estratégias
      const top3 = topStrategies.slice(0, 3);
      const combinationWeights = {};
      let totalWeight = 0;

      for (const strategy of top3) {
        combinationWeights[strategy.name] = strategy.weight;
        totalWeight += strategy.weight;
      }

      // Normalizar pesos para soma = 1
      for (const key of Object.keys(combinationWeights)) {
        combinationWeights[key] = combinationWeights[key] / totalWeight;
      }

      const combinationName = `auto_hybrid_${lottery.name}_top3`;

      // Verificar se já existe
      const [existing] = await this.dataSource.query(`
        SELECT id FROM strategy_combinations WHERE name = ?
      `, [combinationName]);

      const avgAvgHits = top3.reduce((sum, s) => sum + parseFloat(s.avg_hits || 0), 0) / top3.length;

      if (existing) {
        await this.dataSource.query(`
          UPDATE strategy_combinations SET
            strategy_weights = ?,
            combined_avg_hits = ?,
            updated_at = NOW()
          WHERE id = ?
        `, [JSON.stringify(combinationWeights), avgAvgHits, existing.id]);
      } else {
        await this.dataSource.query(`
          INSERT INTO strategy_combinations 
          (name, lottery_type_id, strategy_weights, combined_avg_hits, is_active)
          VALUES (?, ?, ?, ?, 1)
        `, [combinationName, lottery.id, JSON.stringify(combinationWeights), avgAvgHits]);
        combinationsCreated++;
      }
    }

    return combinationsCreated;
  }

  /**
   * Obtem os pesos atuais das estratégias para uma loteria
   */
  async getStrategyWeights(lotteryTypeId: number): Promise<StrategyWeight[]> {
    return await this.dataSource.query(`
      SELECT sw.*, s.name as strategy_name
      FROM strategy_weights sw
      JOIN strategies s ON s.id = sw.strategy_id
      WHERE sw.lottery_type_id = ? AND sw.is_active = 1
      ORDER BY sw.weight DESC
    `, [lotteryTypeId]);
  }

  /**
   * Obtem histórico de refinamento
   */
  async getRefinementHistory(lotteryTypeId?: number, limit: number = 50): Promise<RefinementHistory[]> {
    let query = `
      SELECT rh.*, s.name as strategy_name, lt.name as lottery_name
      FROM refinement_history rh
      JOIN strategies s ON s.id = rh.strategy_id
      JOIN lottery_types lt ON lt.id = rh.lottery_type_id
    `;

    const params: any[] = [];

    if (lotteryTypeId) {
      query += ' WHERE rh.lottery_type_id = ?';
      params.push(lotteryTypeId);
    }

    query += ` ORDER BY rh.created_at DESC LIMIT ?`;
    params.push(limit);

    return await this.dataSource.query(query, params);
  }

  /**
   * Obtem as melhores combinações para uma loteria
   */
  async getOptimalCombinations(lotteryTypeId: number): Promise<StrategyCombination[]> {
    return await this.dataSource.query(`
      SELECT * FROM strategy_combinations
      WHERE lottery_type_id = ? AND is_active = 1
      ORDER BY combined_avg_hits DESC
    `, [lotteryTypeId]);
  }

  /**
   * Usa os pesos calculados para gerar uma predição ponderada
   */
  async generateWeightedPrediction(
    lotteryTypeId: number,
    strategyPredictions: Map<string, number[]>
  ): Promise<number[]> {
    // Buscar pesos das estratégias
    const weights = await this.getStrategyWeights(lotteryTypeId);

    if (weights.length === 0) {
      this.logger.warn('Sem pesos calculados, usando votação simples');
      return this.simpleVoting(strategyPredictions);
    }

    // Criar mapa de pesos
    const weightMap = new Map<string, number>();
    for (const w of weights) {
      weightMap.set(w['strategy_name'], w.weight);
    }

    // Votação ponderada
    const numberScores = new Map<number, number>();

    for (const [strategyName, numbers] of strategyPredictions) {
      const weight = weightMap.get(strategyName) || 0.1; // Peso mínimo para estratégias desconhecidas

      for (const num of numbers) {
        const currentScore = numberScores.get(num) || 0;
        numberScores.set(num, currentScore + weight);
      }
    }

    // Ordenar por score e retornar os top
    const sortedNumbers = Array.from(numberScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num);

    // Buscar quantidade de números para a loteria
    const [lottery] = await this.dataSource.query(`
      SELECT numbers_to_draw FROM lottery_types WHERE id = ?
    `, [lotteryTypeId]);

    const numbersToChoose = lottery?.numbers_to_draw || 6;

    return sortedNumbers.slice(0, numbersToChoose).sort((a, b) => a - b);
  }

  /**
   * Votação simples quando não há pesos
   */
  private simpleVoting(strategyPredictions: Map<string, number[]>): number[] {
    const numberVotes = new Map<number, number>();

    for (const numbers of strategyPredictions.values()) {
      for (const num of numbers) {
        numberVotes.set(num, (numberVotes.get(num) || 0) + 1);
      }
    }

    return Array.from(numberVotes.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([num]) => num)
      .slice(0, 6)
      .sort((a, b) => a - b);
  }

  /**
   * Evolução genética das estratégias (executa periodicamente)
   */
  async evolveStrategies(lotteryTypeId: number): Promise<void> {
    this.logger.log(`Evoluindo estratégias para loteria ${lotteryTypeId}`);

    // Buscar estratégias com melhor performance
    const topStrategies = await this.dataSource.query(`
      SELECT sw.strategy_id, s.name, sw.weight, sw.avg_hits, sw.hit_rate
      FROM strategy_weights sw
      JOIN strategies s ON s.id = sw.strategy_id
      WHERE sw.lottery_type_id = ? AND sw.is_active = 1
      ORDER BY sw.weight DESC
      LIMIT 10
    `, [lotteryTypeId]);

    if (topStrategies.length < 3) {
      this.logger.warn('Estratégias insuficientes para evolução');
      return;
    }

    // Buscar última geração
    const [lastGen] = await this.dataSource.query(`
      SELECT MAX(generation) as max_gen FROM strategy_evolution WHERE lottery_type_id = ?
    `, [lotteryTypeId]);

    const newGeneration = (lastGen?.max_gen || 0) + 1;

    // Criar "DNA" das melhores estratégias
    for (let i = 0; i < Math.min(topStrategies.length, 5); i++) {
      const strategy = topStrategies[i];

      // DNA representa os parâmetros que funcionaram bem
      const dna = {
        strategyName: strategy.name,
        weight: strategy.weight,
        avgHits: strategy.avg_hits,
        hitRate: strategy.hit_rate,
        rank: i + 1
      };

      // Fitness score baseado na performance
      const fitnessScore = (strategy.weight * 0.5) + (parseFloat(strategy.hit_rate || 0) * 0.3) +
        (parseFloat(strategy.avg_hits || 0) / 10 * 0.2);

      // Registrar evolução
      await this.dataSource.query(`
        INSERT INTO strategy_evolution 
        (generation, lottery_type_id, strategy_dna, fitness_score, parent_ids, mutations)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        newGeneration,
        lotteryTypeId,
        JSON.stringify(dna),
        fitnessScore,
        i > 0 ? `${topStrategies[0].strategy_id}` : null,
        JSON.stringify({
          crossover: i > 0 ? true : false,
          mutation_rate: 0.1
        })
      ]);
    }

    this.logger.log(`Geração ${newGeneration} criada para loteria ${lotteryTypeId}`);
  }

  /**
   * Obtem estatísticas do refinamento
   */
  async getRefinementStats(): Promise<any> {
    const stats = {
      totalWeightsCalculated: 0,
      totalHistoryRecords: 0,
      totalEvolutions: 0,
      totalCombinations: 0,
      lastRefinementJob: null,
      weightsByLottery: []
    };

    const [weights] = await this.dataSource.query(`SELECT COUNT(*) as count FROM strategy_weights`);
    stats.totalWeightsCalculated = weights.count;

    const [history] = await this.dataSource.query(`SELECT COUNT(*) as count FROM refinement_history`);
    stats.totalHistoryRecords = history.count;

    const [evolutions] = await this.dataSource.query(`SELECT COUNT(*) as count FROM strategy_evolution`);
    stats.totalEvolutions = evolutions.count;

    const [combinations] = await this.dataSource.query(`SELECT COUNT(*) as count FROM strategy_combinations`);
    stats.totalCombinations = combinations.count;

    const [lastJob] = await this.dataSource.query(`
      SELECT * FROM refinement_jobs ORDER BY started_at DESC LIMIT 1
    `);
    stats.lastRefinementJob = lastJob;

    const weightsByLottery = await this.dataSource.query(`
      SELECT lt.name, COUNT(sw.id) as strategies_count, AVG(sw.weight) as avg_weight
      FROM lottery_types lt
      LEFT JOIN strategy_weights sw ON sw.lottery_type_id = lt.id AND sw.is_active = 1
      WHERE lt.active = 1
      GROUP BY lt.id
    `);
    stats.weightsByLottery = weightsByLottery;

    return stats;
  }

  /**
   * Limpa dados antigos de refinamento (manutenção)
   */
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    this.logger.log(`Limpando dados de refinamento mais antigos que ${daysToKeep} dias`);

    await this.dataSource.query(`
      DELETE FROM refinement_history WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [daysToKeep]);

    await this.dataSource.query(`
      DELETE FROM strategy_evolution WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [daysToKeep * 2]); // Evoluções são mantidas por mais tempo

    await this.dataSource.query(`
      DELETE FROM refinement_jobs WHERE started_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND status = 'completed'
    `, [daysToKeep]);

    this.logger.log('Limpeza concluída');
  }
}
