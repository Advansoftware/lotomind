import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface CycleData {
  number: number;
  cycles: number[];
  averageCycle: number;
  medianCycle: number;
  stdDeviation: number;
  currentPosition: number;
  predictedNextAppearance: number;
  confidence: number;
}

export interface CycleAnalysisResult {
  lotteryTypeId: number;
  totalDrawsAnalyzed: number;
  numbersInCycle: CycleData[];
  predictedForNext: number[];
}

@Injectable()
export class CycleAnalysisService {
  private readonly logger = new Logger(CycleAnalysisService.name);

  constructor(private dataSource: DataSource) { }

  /**
   * Analisa ciclos de aparição de cada número
   */
  async analyzeCycles(lotteryTypeId: number): Promise<CycleAnalysisResult> {
    this.logger.log(`Analisando ciclos para loteria ${lotteryTypeId}`);

    // Buscar configuração da loteria
    const [lotteryConfig] = await this.dataSource.query(`
      SELECT min_number, max_number FROM lottery_types WHERE id = ?
    `, [lotteryTypeId]);

    const minNumber = lotteryConfig?.min_number || 1;
    const maxNumber = lotteryConfig?.max_number || 60;

    // Buscar todos os sorteios
    const draws = await this.dataSource.query(`
      SELECT concurso, numbers
      FROM draws
      WHERE lottery_type_id = ?
      ORDER BY concurso ASC
    `, [lotteryTypeId]);

    const latestConcurso = draws.length > 0 ? draws[draws.length - 1].concurso : 0;
    const cyclesData: CycleData[] = [];

    // Analisar cada número
    for (let num = minNumber; num <= maxNumber; num++) {
      const appearances: number[] = [];

      // Encontrar todas as aparições
      draws.forEach((draw: any) => {
        const numbers = typeof draw.numbers === 'string'
          ? JSON.parse(draw.numbers)
          : draw.numbers;

        if (numbers.includes(num)) {
          appearances.push(draw.concurso);
        }
      });

      if (appearances.length < 3) continue;

      // Calcular ciclos (intervalos entre aparições)
      const cycles: number[] = [];
      for (let i = 1; i < appearances.length; i++) {
        cycles.push(appearances[i] - appearances[i - 1]);
      }

      // Estatísticas
      const averageCycle = cycles.reduce((a, b) => a + b, 0) / cycles.length;

      // Mediana
      const sortedCycles = [...cycles].sort((a, b) => a - b);
      const medianCycle = sortedCycles[Math.floor(sortedCycles.length / 2)];

      // Desvio padrão
      const variance = cycles.reduce((sum, c) => sum + Math.pow(c - averageCycle, 2), 0) / cycles.length;
      const stdDeviation = Math.sqrt(variance);

      // Posição atual no ciclo
      const lastAppearance = appearances[appearances.length - 1];
      const currentPosition = latestConcurso - lastAppearance;

      // Previsão de próxima aparição
      const predictedNextAppearance = Math.round(lastAppearance + averageCycle);

      // Confiança baseada na consistência dos ciclos
      const consistency = 1 - (stdDeviation / averageCycle);
      const confidence = Math.max(0, Math.min(1, consistency));

      cyclesData.push({
        number: num,
        cycles,
        averageCycle: Math.round(averageCycle * 100) / 100,
        medianCycle,
        stdDeviation: Math.round(stdDeviation * 100) / 100,
        currentPosition,
        predictedNextAppearance,
        confidence: Math.round(confidence * 100) / 100
      });
    }

    // Números previstos para próximo sorteio (estão "devidos" no ciclo)
    const predictedForNext = cyclesData
      .filter(c => {
        // Número está além do ciclo médio
        const overdueRatio = c.currentPosition / c.averageCycle;
        return overdueRatio >= 0.8 && c.confidence > 0.3;
      })
      .sort((a, b) => {
        // Ordenar por quanto está "atrasado" ponderado pela confiança
        const aScore = (a.currentPosition / a.averageCycle) * a.confidence;
        const bScore = (b.currentPosition / b.averageCycle) * b.confidence;
        return bScore - aScore;
      })
      .slice(0, 15)
      .map(c => c.number);

    this.logger.log(`Análise de ciclos concluída: ${cyclesData.length} números analisados`);

    return {
      lotteryTypeId,
      totalDrawsAnalyzed: draws.length,
      numbersInCycle: cyclesData,
      predictedForNext
    };
  }

  /**
   * Obtém números que estão no ponto ideal do ciclo
   */
  async getOptimalCycleNumbers(
    lotteryTypeId: number,
    count: number = 10
  ): Promise<number[]> {
    const analysis = await this.analyzeCycles(lotteryTypeId);

    // Números no "sweet spot" - entre 80% e 120% do ciclo médio
    const optimalNumbers = analysis.numbersInCycle
      .filter(c => {
        const ratio = c.currentPosition / c.averageCycle;
        return ratio >= 0.8 && ratio <= 1.5 && c.confidence > 0.4;
      })
      .sort((a, b) => {
        // Score: quanto mais perto de 1.0 (100% do ciclo), melhor
        const aScore = Math.abs(1 - a.currentPosition / a.averageCycle) * (1 - a.confidence);
        const bScore = Math.abs(1 - b.currentPosition / b.averageCycle) * (1 - b.confidence);
        return aScore - bScore;
      })
      .slice(0, count)
      .map(c => c.number);

    return optimalNumbers.sort((a, b) => a - b);
  }

  /**
   * Obtém números "atrasados" que deveriam ter aparecido
   */
  async getOverdueNumbers(
    lotteryTypeId: number,
    count: number = 10
  ): Promise<{ number: number; overdueRatio: number; confidence: number }[]> {
    const analysis = await this.analyzeCycles(lotteryTypeId);

    return analysis.numbersInCycle
      .filter(c => c.currentPosition > c.averageCycle)
      .map(c => ({
        number: c.number,
        overdueRatio: Math.round((c.currentPosition / c.averageCycle) * 100) / 100,
        confidence: c.confidence
      }))
      .sort((a, b) => b.overdueRatio - a.overdueRatio)
      .slice(0, count);
  }

  /**
   * Previsão baseada em ciclos para próximo sorteio
   */
  async predictFromCycles(
    lotteryTypeId: number,
    numbersToDraw: number
  ): Promise<number[]> {
    const analysis = await this.analyzeCycles(lotteryTypeId);

    // Pontuar cada número
    const scores = new Map<number, number>();

    analysis.numbersInCycle.forEach(c => {
      const overdueRatio = c.currentPosition / c.averageCycle;

      // Score baseado em:
      // 1. Quão atrasado está (até 1.5x)
      // 2. Confiança do ciclo
      // 3. Proximidade do pico do ciclo

      let score = 0;

      if (overdueRatio >= 0.8 && overdueRatio <= 1.5) {
        // "Sweet spot" - alta pontuação
        score = (1 - Math.abs(1 - overdueRatio)) * c.confidence * 100;
      } else if (overdueRatio > 1.5) {
        // Muito atrasado - pontuação moderada
        score = c.confidence * 50;
      } else {
        // Muito cedo - baixa pontuação
        score = overdueRatio * c.confidence * 20;
      }

      scores.set(c.number, score);
    });

    // Retornar top números
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, numbersToDraw)
      .map(([num]) => num)
      .sort((a, b) => a - b);
  }
}
