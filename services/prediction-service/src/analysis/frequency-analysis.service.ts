import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface NumberFrequencyData {
  number: number;
  totalAppearances: number;
  lastAppearanceConcurso: number;
  currentDelay: number;
  maxDelay: number;
  averageDelay: number;
  appearancesLast10: number;
  appearancesLast30: number;
  appearancesLast50: number;
  appearancesLast100: number;
  avgPosition: number;
  trend: 'hot' | 'cold' | 'neutral';
  score: number;
}

export interface FrequencyAnalysisResult {
  lotteryTypeId: number;
  lotteryName: string;
  totalDraws: number;
  lastUpdated: Date;
  hotNumbers: number[];
  coldNumbers: number[];
  dueNumbers: number[];
  frequencies: NumberFrequencyData[];
}

@Injectable()
export class FrequencyAnalysisService {
  private readonly logger = new Logger(FrequencyAnalysisService.name);

  constructor(private dataSource: DataSource) { }

  /**
   * Popula a tabela number_frequency com análises completas
   */
  async populateFrequencies(lotteryTypeId: number): Promise<void> {
    this.logger.log(`Populando frequências para loteria ${lotteryTypeId}`);

    // Buscar configuração da loteria
    const [lotteryConfig] = await this.dataSource.query(`
      SELECT id, name, min_number, max_number, numbers_to_draw
      FROM lottery_types WHERE id = ?
    `, [lotteryTypeId]);

    if (!lotteryConfig) {
      throw new Error(`Loteria ${lotteryTypeId} não encontrada`);
    }

    const minNumber = lotteryConfig.min_number || 1;
    const maxNumber = lotteryConfig.max_number || 60;

    // Buscar todos os sorteios
    const draws = await this.dataSource.query(`
      SELECT concurso, numbers, draw_date
      FROM draws
      WHERE lottery_type_id = ?
      ORDER BY concurso DESC
    `, [lotteryTypeId]);

    if (draws.length === 0) {
      this.logger.warn(`Nenhum sorteio encontrado para loteria ${lotteryTypeId}`);
      return;
    }

    const latestConcurso = draws[0].concurso;
    const totalDraws = draws.length;

    // Analisar cada número
    for (let num = minNumber; num <= maxNumber; num++) {
      const analysis = this.analyzeNumber(num, draws, latestConcurso);

      // Upsert na tabela number_frequency
      await this.dataSource.query(`
        INSERT INTO number_frequency (
          lottery_type_id, number, total_appearances, last_appearance_concurso,
          last_appearance_date, current_delay, max_delay, average_delay,
          appearances_last_10, appearances_last_30, appearances_last_50, appearances_last_100,
          avg_position, most_common_pairs
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_appearances = VALUES(total_appearances),
          last_appearance_concurso = VALUES(last_appearance_concurso),
          last_appearance_date = VALUES(last_appearance_date),
          current_delay = VALUES(current_delay),
          max_delay = VALUES(max_delay),
          average_delay = VALUES(average_delay),
          appearances_last_10 = VALUES(appearances_last_10),
          appearances_last_30 = VALUES(appearances_last_30),
          appearances_last_50 = VALUES(appearances_last_50),
          appearances_last_100 = VALUES(appearances_last_100),
          avg_position = VALUES(avg_position),
          most_common_pairs = VALUES(most_common_pairs),
          updated_at = NOW()
      `, [
        lotteryTypeId,
        num,
        analysis.totalAppearances,
        analysis.lastAppearanceConcurso,
        analysis.lastAppearanceDate,
        analysis.currentDelay,
        analysis.maxDelay,
        analysis.averageDelay,
        analysis.appearancesLast10,
        analysis.appearancesLast30,
        analysis.appearancesLast50,
        analysis.appearancesLast100,
        analysis.avgPosition,
        JSON.stringify(analysis.mostCommonPairs)
      ]);
    }

    this.logger.log(`Frequências populadas para ${maxNumber - minNumber + 1} números da loteria ${lotteryTypeId}`);
  }

  /**
   * Analisa um número específico
   */
  private analyzeNumber(num: number, draws: any[], latestConcurso: number): any {
    const appearances: number[] = [];
    const positions: number[] = [];
    const pairCount = new Map<number, number>();
    let lastAppearanceDate: Date | null = null;

    draws.forEach((draw, index) => {
      const numbers = typeof draw.numbers === 'string'
        ? JSON.parse(draw.numbers)
        : draw.numbers;

      const position = numbers.indexOf(num);
      if (position !== -1) {
        appearances.push(draw.concurso);
        positions.push(position + 1);

        if (!lastAppearanceDate) {
          lastAppearanceDate = draw.draw_date;
        }

        // Contar pares
        numbers.forEach((n: number) => {
          if (n !== num) {
            pairCount.set(n, (pairCount.get(n) || 0) + 1);
          }
        });
      }
    });

    // Calcular delays (intervalos entre aparições)
    const delays: number[] = [];
    for (let i = 0; i < appearances.length - 1; i++) {
      delays.push(appearances[i] - appearances[i + 1]);
    }

    const currentDelay = appearances.length > 0
      ? latestConcurso - appearances[0]
      : draws.length;

    const maxDelay = delays.length > 0 ? Math.max(...delays) : currentDelay;
    const averageDelay = delays.length > 0
      ? delays.reduce((a, b) => a + b, 0) / delays.length
      : 0;

    // Contagem em janelas recentes
    const last10 = draws.slice(0, 10);
    const last30 = draws.slice(0, 30);
    const last50 = draws.slice(0, 50);
    const last100 = draws.slice(0, 100);

    const countIn = (drawList: any[]) => {
      return drawList.filter(d => {
        const nums = typeof d.numbers === 'string' ? JSON.parse(d.numbers) : d.numbers;
        return nums.includes(num);
      }).length;
    };

    // Top 5 pares mais frequentes
    const mostCommonPairs = Array.from(pairCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pair, count]) => ({ number: pair, count }));

    return {
      totalAppearances: appearances.length,
      lastAppearanceConcurso: appearances[0] || null,
      lastAppearanceDate,
      currentDelay,
      maxDelay,
      averageDelay: Math.round(averageDelay * 100) / 100,
      appearancesLast10: countIn(last10),
      appearancesLast30: countIn(last30),
      appearancesLast50: countIn(last50),
      appearancesLast100: countIn(last100),
      avgPosition: positions.length > 0
        ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 100) / 100
        : 0,
      mostCommonPairs
    };
  }

  /**
   * Obtém análise completa de frequências
   */
  async getFrequencyAnalysis(lotteryTypeId: number): Promise<FrequencyAnalysisResult> {
    // Buscar dados da loteria
    const [lottery] = await this.dataSource.query(`
      SELECT id, name FROM lottery_types WHERE id = ?
    `, [lotteryTypeId]);

    // Buscar frequências
    const frequencies = await this.dataSource.query(`
      SELECT * FROM number_frequency 
      WHERE lottery_type_id = ?
      ORDER BY number
    `, [lotteryTypeId]);

    if (frequencies.length === 0) {
      // Popular se não existir
      await this.populateFrequencies(lotteryTypeId);
      return this.getFrequencyAnalysis(lotteryTypeId);
    }

    // Calcular scores e classificar
    const analyzed = frequencies.map((f: any) => {
      // Score baseado em múltiplos fatores
      const recencyScore = f.appearances_last_30 / 30 * 40;
      const delayScore = (f.current_delay / f.average_delay) * 30;
      const frequencyScore = (f.total_appearances / frequencies.length) * 30;

      const score = recencyScore + delayScore + frequencyScore;

      let trend: 'hot' | 'cold' | 'neutral' = 'neutral';
      if (f.appearances_last_10 >= 3) trend = 'hot';
      else if (f.appearances_last_30 <= 2) trend = 'cold';

      return {
        number: f.number,
        totalAppearances: f.total_appearances,
        lastAppearanceConcurso: f.last_appearance_concurso,
        currentDelay: f.current_delay,
        maxDelay: f.max_delay,
        averageDelay: parseFloat(f.average_delay),
        appearancesLast10: f.appearances_last_10,
        appearancesLast30: f.appearances_last_30,
        appearancesLast50: f.appearances_last_50,
        appearancesLast100: f.appearances_last_100,
        avgPosition: parseFloat(f.avg_position),
        trend,
        score: Math.round(score * 100) / 100
      };
    });

    // Classificar números
    const sortedByRecent = [...analyzed].sort((a, b) => b.appearancesLast30 - a.appearancesLast30);
    const hotNumbers = sortedByRecent.slice(0, 10).map(n => n.number);

    const sortedByDelay = [...analyzed].sort((a, b) => b.currentDelay - a.currentDelay);
    const coldNumbers = sortedByDelay.slice(0, 10).map(n => n.number);

    // Números "devidos" - atrasados além da média
    const dueNumbers = analyzed
      .filter(n => n.currentDelay > n.averageDelay * 1.5)
      .sort((a, b) => b.currentDelay / b.averageDelay - a.currentDelay / a.averageDelay)
      .slice(0, 10)
      .map(n => n.number);

    return {
      lotteryTypeId,
      lotteryName: lottery?.name || 'unknown',
      totalDraws: analyzed[0]?.totalAppearances || 0,
      lastUpdated: new Date(),
      hotNumbers,
      coldNumbers,
      dueNumbers,
      frequencies: analyzed
    };
  }

  /**
   * Popula frequências para todas as loterias
   */
  async populateAllFrequencies(): Promise<void> {
    const lotteries = await this.dataSource.query(`
      SELECT id FROM lottery_types WHERE active = 1
    `);

    for (const lottery of lotteries) {
      await this.populateFrequencies(lottery.id);
    }

    this.logger.log(`Frequências populadas para ${lotteries.length} loterias`);
  }
}
