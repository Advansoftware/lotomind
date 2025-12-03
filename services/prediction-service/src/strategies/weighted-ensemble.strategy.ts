import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface StrategyWeight {
  strategyId: number;
  strategyName: string;
  weight: number;
  confidence: number;
  avgHits: number;
}

interface StrategyPrediction {
  strategyName: string;
  numbers: number[];
  weight: number;
}

@Injectable()
export class WeightedEnsembleStrategy {
  name = 'weighted_ensemble';
  displayName = 'Weighted Super-Ensemble';

  private readonly logger = new Logger(WeightedEnsembleStrategy.name);
  private strategies: Map<string, any> = new Map();

  constructor(private dataSource: DataSource) { }

  /**
   * Registra estratégias disponíveis
   */
  registerStrategies(strategies: Map<string, any>): void {
    this.strategies = strategies;
    this.logger.log(`Registered ${strategies.size} strategies for ensemble`);
  }

  /**
   * Obtém pesos do banco de dados
   */
  async getStrategyWeights(lotteryTypeId: number): Promise<StrategyWeight[]> {
    const weights = await this.dataSource.query(`
      SELECT 
        sw.strategy_id as strategyId,
        s.name as strategyName,
        sw.weight,
        sw.confidence,
        sw.avg_hits as avgHits
      FROM strategy_weights sw
      JOIN strategies s ON s.id = sw.strategy_id
      WHERE sw.lottery_type_id = ? AND sw.is_active = 1
      ORDER BY sw.weight DESC
    `, [lotteryTypeId]);

    return weights.map((w: any) => ({
      strategyId: w.strategyId,
      strategyName: w.strategyName,
      weight: parseFloat(w.weight) || 0.5,
      confidence: parseFloat(w.confidence) || 0.5,
      avgHits: parseFloat(w.avgHits) || 0
    }));
  }

  /**
   * Executa todas as estratégias e combina resultados
   */
  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const lotteryTypeId = config.lotteryTypeId || 1;

    this.logger.log(`Weighted Ensemble predicting for lottery ${lotteryTypeId}`);

    // Obter pesos do banco
    const strategyWeights = await this.getStrategyWeights(lotteryTypeId);

    if (strategyWeights.length === 0) {
      this.logger.warn('No strategy weights found, using equal weights');
    }

    // Coletar predições de todas as estratégias
    const predictions: StrategyPrediction[] = [];
    const weightMap = new Map(strategyWeights.map(sw => [sw.strategyName, sw]));

    for (const [name, strategy] of this.strategies) {
      if (name === this.name) continue; // Não chamar a si mesmo

      try {
        const numbers = await strategy.predict(historicalDraws, config);
        const strategyInfo = weightMap.get(name);
        const weight = strategyInfo?.weight || 0.5;

        predictions.push({
          strategyName: name,
          numbers,
          weight
        });

        this.logger.debug(`Strategy ${name}: ${numbers.join(',')} (weight: ${weight})`);
      } catch (error) {
        this.logger.error(`Strategy ${name} failed: ${error.message}`);
      }
    }

    if (predictions.length === 0) {
      this.logger.error('No strategy predictions available');
      return this.generateRandomNumbers(numbersToDraw, minNumber, maxNumber);
    }

    // Votação ponderada
    const votes = new Map<number, number>();

    for (let num = minNumber; num <= maxNumber; num++) {
      votes.set(num, 0);
    }

    // Calcular votos ponderados
    predictions.forEach(pred => {
      pred.numbers.forEach((num, position) => {
        // Peso baseado na posição (primeiros números têm mais peso)
        const positionWeight = (pred.numbers.length - position) / pred.numbers.length;
        const totalWeight = pred.weight * positionWeight;

        votes.set(num, (votes.get(num) || 0) + totalWeight);
      });
    });

    // Normalizar por número de estratégias
    const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0);
    votes.forEach((vote, num) => {
      votes.set(num, vote / totalWeight);
    });

    // Selecionar números com mais votos
    const selected = Array.from(votes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, numbersToDraw)
      .map(([num]) => num)
      .sort((a, b) => a - b);

    this.logger.log(`Weighted Ensemble result: ${selected.join(', ')}`);

    return selected;
  }

  /**
   * Previsão com análise de consenso
   */
  async predictWithConsensus(
    historicalDraws: any[],
    config: any
  ): Promise<{
    numbers: number[];
    consensus: number;
    strategyAgreement: { number: number; agreementPercentage: number }[];
    topStrategies: string[];
  }> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const lotteryTypeId = config.lotteryTypeId || 1;

    const strategyWeights = await this.getStrategyWeights(lotteryTypeId);
    const predictions: StrategyPrediction[] = [];
    const weightMap = new Map(strategyWeights.map(sw => [sw.strategyName, sw]));

    // Coletar predições
    for (const [name, strategy] of this.strategies) {
      if (name === this.name) continue;

      try {
        const numbers = await strategy.predict(historicalDraws, config);
        const strategyInfo = weightMap.get(name);
        const weight = strategyInfo?.weight || 0.5;

        predictions.push({
          strategyName: name,
          numbers,
          weight
        });
      } catch (error) {
        // Ignorar falhas
      }
    }

    // Calcular votos e consenso
    const votes = new Map<number, { count: number; weightedCount: number; strategies: string[] }>();

    for (let num = minNumber; num <= maxNumber; num++) {
      votes.set(num, { count: 0, weightedCount: 0, strategies: [] });
    }

    predictions.forEach(pred => {
      pred.numbers.forEach(num => {
        const info = votes.get(num)!;
        info.count++;
        info.weightedCount += pred.weight;
        info.strategies.push(pred.strategyName);
      });
    });

    // Selecionar números
    const sortedVotes = Array.from(votes.entries())
      .sort((a, b) => b[1].weightedCount - a[1].weightedCount);

    const selectedNumbers = sortedVotes
      .slice(0, numbersToDraw)
      .map(([num]) => num)
      .sort((a, b) => a - b);

    // Calcular consenso
    const selectedVotes = sortedVotes.slice(0, numbersToDraw);
    const avgAgreement = selectedVotes.reduce((sum, [_, info]) =>
      sum + info.count / predictions.length, 0
    ) / numbersToDraw;

    // Acordo por número
    const strategyAgreement = selectedVotes.map(([num, info]) => ({
      number: num,
      agreementPercentage: Math.round((info.count / predictions.length) * 100)
    })).sort((a, b) => a.number - b.number);

    // Top estratégias (mais presentes nos números selecionados)
    const strategyPresence = new Map<string, number>();
    selectedVotes.forEach(([_, info]) => {
      info.strategies.forEach(s => {
        strategyPresence.set(s, (strategyPresence.get(s) || 0) + 1);
      });
    });

    const topStrategies = Array.from(strategyPresence.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    return {
      numbers: selectedNumbers,
      consensus: Math.round(avgAgreement * 100),
      strategyAgreement,
      topStrategies
    };
  }

  /**
   * Gera predição diversificada (para múltiplos jogos)
   */
  async predictDiversified(
    historicalDraws: any[],
    config: any,
    numberOfGames: number = 5
  ): Promise<number[][]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;

    const games: number[][] = [];
    const usedCombinations = new Set<string>();

    // Primeiro jogo: consenso máximo
    const consensus = await this.predictWithConsensus(historicalDraws, config);
    games.push(consensus.numbers);
    usedCombinations.add(consensus.numbers.join(','));

    // Jogos adicionais com variações
    const strategyWeights = await this.getStrategyWeights(config.lotteryTypeId || 1);
    const predictions: StrategyPrediction[] = [];

    for (const [name, strategy] of this.strategies) {
      if (name === this.name) continue;
      try {
        const numbers = await strategy.predict(historicalDraws, config);
        const weight = strategyWeights.find(sw => sw.strategyName === name)?.weight || 0.5;
        predictions.push({ strategyName: name, numbers, weight });
      } catch { }
    }

    // Gerar jogos baseados em estratégias individuais de maior peso
    const sortedPredictions = predictions.sort((a, b) => b.weight - a.weight);

    for (const pred of sortedPredictions) {
      if (games.length >= numberOfGames) break;

      const key = pred.numbers.slice().sort((a, b) => a - b).join(',');
      if (!usedCombinations.has(key)) {
        games.push(pred.numbers);
        usedCombinations.add(key);
      }
    }

    // Se ainda precisar de mais jogos, criar variações
    while (games.length < numberOfGames) {
      const baseGame = games[0];
      const variation = this.createVariation(baseGame, maxNumber, minNumber, usedCombinations);
      if (variation) {
        games.push(variation);
        usedCombinations.add(variation.join(','));
      } else {
        break;
      }
    }

    return games;
  }

  /**
   * Cria variação de um jogo
   */
  private createVariation(
    base: number[],
    maxNumber: number,
    minNumber: number,
    used: Set<string>
  ): number[] | null {
    for (let attempt = 0; attempt < 100; attempt++) {
      const variation = [...base];

      // Trocar 1-2 números
      const numToReplace = Math.random() > 0.5 ? 1 : 2;

      for (let i = 0; i < numToReplace; i++) {
        const idxToReplace = Math.floor(Math.random() * variation.length);
        let newNum: number;

        do {
          newNum = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
        } while (variation.includes(newNum));

        variation[idxToReplace] = newNum;
      }

      variation.sort((a, b) => a - b);
      const key = variation.join(',');

      if (!used.has(key)) {
        return variation;
      }
    }

    return null;
  }

  /**
   * Gera números aleatórios (fallback)
   */
  private generateRandomNumbers(count: number, min: number, max: number): number[] {
    const numbers: number[] = [];
    while (numbers.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  }
}
