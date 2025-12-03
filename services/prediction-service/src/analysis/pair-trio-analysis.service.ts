import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface PairData {
  numbers: [number, number];
  count: number;
  frequency: number;
  lastAppearance: number;
  averageDelay: number;
}

export interface TrioData {
  numbers: [number, number, number];
  count: number;
  frequency: number;
  lastAppearance: number;
}

export interface PairTrioAnalysisResult {
  lotteryTypeId: number;
  totalDrawsAnalyzed: number;
  topPairs: PairData[];
  topTrios: TrioData[];
  pairMatrix: Map<string, { count: number; lastConcurso: number; delays: number[] }>;
}

@Injectable()
export class PairTrioAnalysisService {
  private readonly logger = new Logger(PairTrioAnalysisService.name);

  constructor(private dataSource: DataSource) { }

  /**
   * Analisa pares e trios de números mais frequentes
   */
  async analyzePairsAndTrios(
    lotteryTypeId: number,
    drawsToAnalyze: number = 500
  ): Promise<PairTrioAnalysisResult> {
    this.logger.log(`Analisando pares e trios para loteria ${lotteryTypeId}`);

    // Buscar sorteios
    const draws = await this.dataSource.query(`
      SELECT concurso, numbers
      FROM draws
      WHERE lottery_type_id = ?
      ORDER BY concurso DESC
      LIMIT ?
    `, [lotteryTypeId, drawsToAnalyze]);

    const pairCount = new Map<string, { count: number; lastConcurso: number; delays: number[] }>();
    const trioCount = new Map<string, { count: number; lastConcurso: number }>();
    let previousConcurso = 0;

    // Analisar cada sorteio
    draws.forEach((draw: any) => {
      const numbers = typeof draw.numbers === 'string'
        ? JSON.parse(draw.numbers)
        : draw.numbers;

      const sorted = [...numbers].sort((a: number, b: number) => a - b);

      // Gerar todos os pares
      for (let i = 0; i < sorted.length - 1; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const key = `${sorted[i]}-${sorted[j]}`;
          const existing = pairCount.get(key) || { count: 0, lastConcurso: 0, delays: [] };

          if (existing.lastConcurso > 0) {
            existing.delays.push(existing.lastConcurso - draw.concurso);
          }

          existing.count++;
          existing.lastConcurso = draw.concurso;
          pairCount.set(key, existing);
        }
      }

      // Gerar todos os trios
      for (let i = 0; i < sorted.length - 2; i++) {
        for (let j = i + 1; j < sorted.length - 1; j++) {
          for (let k = j + 1; k < sorted.length; k++) {
            const key = `${sorted[i]}-${sorted[j]}-${sorted[k]}`;
            const existing = trioCount.get(key) || { count: 0, lastConcurso: 0 };
            existing.count++;
            existing.lastConcurso = draw.concurso;
            trioCount.set(key, existing);
          }
        }
      }
    });

    // Top pares
    const topPairs: PairData[] = Array.from(pairCount.entries())
      .map(([key, data]) => {
        const [n1, n2] = key.split('-').map(Number);
        const avgDelay = data.delays.length > 0
          ? data.delays.reduce((a, b) => a + b, 0) / data.delays.length
          : 0;

        return {
          numbers: [n1, n2] as [number, number],
          count: data.count,
          frequency: data.count / draws.length,
          lastAppearance: data.lastConcurso,
          averageDelay: Math.round(avgDelay * 100) / 100
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    // Top trios
    const topTrios: TrioData[] = Array.from(trioCount.entries())
      .filter(([_, data]) => data.count >= 3) // Mínimo 3 aparições
      .map(([key, data]) => {
        const [n1, n2, n3] = key.split('-').map(Number);
        return {
          numbers: [n1, n2, n3] as [number, number, number],
          count: data.count,
          frequency: data.count / draws.length,
          lastAppearance: data.lastConcurso
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    this.logger.log(`Análise concluída: ${topPairs.length} pares, ${topTrios.length} trios`);

    return {
      lotteryTypeId,
      totalDrawsAnalyzed: draws.length,
      topPairs,
      topTrios,
      pairMatrix: pairCount
    };
  }

  /**
   * Encontra pares que estão "quentes" (aparecendo frequentemente)
   */
  async getHotPairs(lotteryTypeId: number, recentDraws: number = 50): Promise<PairData[]> {
    const analysis = await this.analyzePairsAndTrios(lotteryTypeId, recentDraws);

    return analysis.topPairs
      .filter(p => p.frequency > 0.1) // Mais de 10% de frequência
      .slice(0, 20);
  }

  /**
   * Encontra pares que estão "devidos" (não aparecem há muito tempo)
   */
  async getDuePairs(lotteryTypeId: number): Promise<PairData[]> {
    const draws = await this.dataSource.query(`
      SELECT MAX(concurso) as latest FROM draws WHERE lottery_type_id = ?
    `, [lotteryTypeId]);

    const latestConcurso = draws[0]?.latest || 0;
    const analysis = await this.analyzePairsAndTrios(lotteryTypeId, 500);

    return analysis.topPairs
      .filter(p => (latestConcurso - p.lastAppearance) > p.averageDelay * 1.5)
      .sort((a, b) => {
        const aOverdue = (latestConcurso - a.lastAppearance) / a.averageDelay;
        const bOverdue = (latestConcurso - b.lastAppearance) / b.averageDelay;
        return bOverdue - aOverdue;
      })
      .slice(0, 20);
  }

  /**
   * Sugere números baseado em pares frequentes
   */
  async suggestNumbersFromPairs(
    lotteryTypeId: number,
    count: number = 6
  ): Promise<number[]> {
    const hotPairs = await this.getHotPairs(lotteryTypeId);
    const duePairs = await this.getDuePairs(lotteryTypeId);

    const numberScores = new Map<number, number>();

    // Pontuar números dos pares quentes
    hotPairs.forEach((pair, index) => {
      const weight = (hotPairs.length - index) / hotPairs.length;
      pair.numbers.forEach(num => {
        numberScores.set(num, (numberScores.get(num) || 0) + weight * 2);
      });
    });

    // Pontuar números dos pares devidos
    duePairs.forEach((pair, index) => {
      const weight = (duePairs.length - index) / duePairs.length;
      pair.numbers.forEach(num => {
        numberScores.set(num, (numberScores.get(num) || 0) + weight);
      });
    });

    // Retornar top números
    return Array.from(numberScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([num]) => num)
      .sort((a, b) => a - b);
  }

  /**
   * Salva análise no banco para cache
   */
  async cacheAnalysis(lotteryTypeId: number): Promise<void> {
    const analysis = await this.analyzePairsAndTrios(lotteryTypeId);

    // Atualizar most_common_pairs na tabela number_frequency
    for (const pair of analysis.topPairs.slice(0, 100)) {
      const [n1, n2] = pair.numbers;

      // Atualizar para o primeiro número do par
      await this.dataSource.query(`
        UPDATE number_frequency
        SET most_common_pairs = JSON_ARRAY_APPEND(
          COALESCE(most_common_pairs, '[]'),
          '$',
          JSON_OBJECT('number', ?, 'count', ?)
        )
        WHERE lottery_type_id = ? AND number = ?
      `, [n2, pair.count, lotteryTypeId, n1]);
    }

    this.logger.log(`Análise de pares cacheada para loteria ${lotteryTypeId}`);
  }
}
