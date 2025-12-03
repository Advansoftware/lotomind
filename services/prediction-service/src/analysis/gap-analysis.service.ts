import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface GapData {
  number: number;
  currentGap: number;
  averageGap: number;
  maxGap: number;
  minGap: number;
  gapTrend: 'increasing' | 'decreasing' | 'stable';
  isOverdue: boolean;
  overdueBy: number;
  probability: number;
}

export interface GapAnalysisResult {
  lotteryTypeId: number;
  totalDraws: number;
  overdueNumbers: GapData[];
  optimalGapNumbers: GapData[];
  allGaps: GapData[];
}

@Injectable()
export class GapAnalysisService {
  private readonly logger = new Logger(GapAnalysisService.name);

  constructor(private dataSource: DataSource) { }

  /**
   * Analisa gaps (intervalos) de todos os números
   */
  async analyzeGaps(lotteryTypeId: number): Promise<GapAnalysisResult> {
    this.logger.log(`Analisando gaps para loteria ${lotteryTypeId}`);

    // Buscar configuração
    const [config] = await this.dataSource.query(`
      SELECT min_number, max_number, numbers_to_draw
      FROM lottery_types WHERE id = ?
    `, [lotteryTypeId]);

    const minNumber = config?.min_number || 1;
    const maxNumber = config?.max_number || 60;
    const numbersToDraw = config?.numbers_to_draw || 6;

    // Buscar sorteios
    const draws = await this.dataSource.query(`
      SELECT concurso, numbers
      FROM draws
      WHERE lottery_type_id = ?
      ORDER BY concurso DESC
    `, [lotteryTypeId]);

    const totalDraws = draws.length;
    const latestConcurso = draws[0]?.concurso || 0;
    const allGaps: GapData[] = [];

    // Probabilidade teórica de um número sair
    const theoreticalProbability = numbersToDraw / (maxNumber - minNumber + 1);

    for (let num = minNumber; num <= maxNumber; num++) {
      const gaps: number[] = [];
      let lastAppearance = -1;

      // Calcular gaps históricos (do mais recente ao mais antigo)
      draws.forEach((draw: any, index: number) => {
        const numbers = typeof draw.numbers === 'string'
          ? JSON.parse(draw.numbers)
          : draw.numbers;

        if (numbers.includes(num)) {
          if (lastAppearance >= 0) {
            gaps.push(lastAppearance);
          }
          lastAppearance = 0;
        } else if (lastAppearance >= 0) {
          lastAppearance++;
        }
      });

      // Gap atual (desde última aparição)
      const currentGap = draws.findIndex((draw: any) => {
        const numbers = typeof draw.numbers === 'string'
          ? JSON.parse(draw.numbers)
          : draw.numbers;
        return numbers.includes(num);
      });

      if (gaps.length < 2) continue;

      const averageGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const maxGap = Math.max(...gaps);
      const minGap = Math.min(...gaps);

      // Determinar tendência
      const recentGaps = gaps.slice(0, 5);
      const olderGaps = gaps.slice(5, 10);
      const recentAvg = recentGaps.reduce((a, b) => a + b, 0) / recentGaps.length;
      const olderAvg = olderGaps.length > 0
        ? olderGaps.reduce((a, b) => a + b, 0) / olderGaps.length
        : recentAvg;

      let gapTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentAvg > olderAvg * 1.2) gapTrend = 'increasing';
      else if (recentAvg < olderAvg * 0.8) gapTrend = 'decreasing';

      // Verificar se está atrasado
      const isOverdue = currentGap > averageGap;
      const overdueBy = isOverdue ? currentGap - averageGap : 0;

      // Calcular probabilidade baseada no gap
      // Quanto mais próximo do gap médio, maior a probabilidade
      const gapRatio = currentGap / averageGap;
      let probability = 0;

      if (gapRatio >= 0.7 && gapRatio <= 1.0) {
        // Aproximando do gap médio
        probability = 0.5 + (gapRatio - 0.7) * 1.5;
      } else if (gapRatio > 1.0 && gapRatio <= 1.5) {
        // Passou do gap médio
        probability = 0.8 + (gapRatio - 1.0) * 0.3;
      } else if (gapRatio > 1.5) {
        // Muito atrasado
        probability = Math.min(0.95, 0.9 + (gapRatio - 1.5) * 0.05);
      } else {
        // Muito cedo
        probability = gapRatio * 0.5;
      }

      allGaps.push({
        number: num,
        currentGap: currentGap >= 0 ? currentGap : totalDraws,
        averageGap: Math.round(averageGap * 100) / 100,
        maxGap,
        minGap,
        gapTrend,
        isOverdue,
        overdueBy: Math.round(overdueBy * 100) / 100,
        probability: Math.round(probability * 100) / 100
      });
    }

    // Números atrasados
    const overdueNumbers = allGaps
      .filter(g => g.isOverdue)
      .sort((a, b) => b.overdueBy - a.overdueBy)
      .slice(0, 15);

    // Números no ponto ótimo (70-110% do gap médio)
    const optimalGapNumbers = allGaps
      .filter(g => {
        const ratio = g.currentGap / g.averageGap;
        return ratio >= 0.7 && ratio <= 1.1;
      })
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 15);

    this.logger.log(`Análise de gaps concluída: ${overdueNumbers.length} atrasados, ${optimalGapNumbers.length} ótimos`);

    return {
      lotteryTypeId,
      totalDraws,
      overdueNumbers,
      optimalGapNumbers,
      allGaps
    };
  }

  /**
   * Sugere números baseado em análise de gaps
   */
  async suggestFromGaps(
    lotteryTypeId: number,
    count: number
  ): Promise<number[]> {
    const analysis = await this.analyzeGaps(lotteryTypeId);

    // Combinar atrasados e ótimos com pesos
    const scores = new Map<number, number>();

    // Números ótimos (peso maior)
    analysis.optimalGapNumbers.forEach((g, index) => {
      const weight = (analysis.optimalGapNumbers.length - index) / analysis.optimalGapNumbers.length;
      scores.set(g.number, (scores.get(g.number) || 0) + g.probability * weight * 2);
    });

    // Números atrasados
    analysis.overdueNumbers.forEach((g, index) => {
      const weight = (analysis.overdueNumbers.length - index) / analysis.overdueNumbers.length;
      scores.set(g.number, (scores.get(g.number) || 0) + g.probability * weight);
    });

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([num]) => num)
      .sort((a, b) => a - b);
  }

  /**
   * Obtém números com maior probabilidade de sair
   */
  async getHighProbabilityNumbers(
    lotteryTypeId: number,
    count: number = 10
  ): Promise<{ number: number; probability: number; reason: string }[]> {
    const analysis = await this.analyzeGaps(lotteryTypeId);

    return analysis.allGaps
      .sort((a, b) => b.probability - a.probability)
      .slice(0, count)
      .map(g => ({
        number: g.number,
        probability: g.probability,
        reason: g.isOverdue
          ? `Atrasado por ${g.overdueBy.toFixed(1)} sorteios`
          : `No ponto ótimo do ciclo (${Math.round(g.currentGap / g.averageGap * 100)}%)`
      }));
  }
}
