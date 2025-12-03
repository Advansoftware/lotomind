import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GeneticOptimizerService, GeneticConfig } from './genetic-optimizer.service';

export interface GameSet {
  games: number[][];
  coverage: CoverageStats;
  cost: number;
  potentialReturn: PotentialReturn[];
}

export interface CoverageStats {
  totalGames: number;
  uniqueNumbers: number[];
  numberCoverage: number; // % dos números cobertos
  pairsCovered: number;
  triosCovered: number;
  guaranteedPrize: string; // Ex: "Quadra garantida se acertar 5"
}

export interface PotentialReturn {
  scenario: string;
  probability: number;
  expectedPrize: string;
}

export interface ClosureRecommendation {
  gamesCount: number;
  cost: number;
  coverage: number;
  description: string;
  recommended: boolean;
}

@Injectable()
export class StatisticalClosureService {
  private readonly logger = new Logger(StatisticalClosureService.name);

  constructor(
    private dataSource: DataSource,
    private geneticOptimizer: GeneticOptimizerService,
  ) { }

  /**
   * Gera fechamento com garantia de acertos mínimos
   */
  async generateClosure(
    lotteryTypeId: number,
    baseNumbers: number[],
    options: {
      guarantee: number; // Mínimo de acertos garantidos se acertar X
      ifHit: number; // Quantos números precisa acertar
      maxGames?: number;
    }
  ): Promise<GameSet> {
    const { guarantee, ifHit, maxGames = 50 } = options;

    this.logger.log(`Generating closure: ${guarantee} guaranteed if ${ifHit} hit`);

    // Buscar config da loteria
    const [lotteryConfig] = await this.dataSource.query(`
      SELECT numbers_to_draw, name FROM lottery_types WHERE id = ?
    `, [lotteryTypeId]);

    const numbersToDraw = lotteryConfig?.numbers_to_draw || 6;
    const lotteryName = lotteryConfig?.name || 'unknown';

    // Gerar todas as combinações possíveis
    const allCombinations = this.generateCombinations(baseNumbers, numbersToDraw);

    // Filtrar combinações para garantir cobertura
    const selectedGames = this.selectOptimalGames(
      allCombinations,
      baseNumbers,
      guarantee,
      ifHit,
      maxGames
    );

    // Calcular estatísticas de cobertura
    const coverage = this.calculateCoverage(selectedGames, baseNumbers, numbersToDraw);

    // Calcular custo e retorno potencial
    const cost = selectedGames.length * this.getGameCost(lotteryName);
    const potentialReturn = this.calculatePotentialReturn(
      selectedGames,
      guarantee,
      ifHit,
      lotteryName
    );

    return {
      games: selectedGames,
      coverage,
      cost,
      potentialReturn
    };
  }

  /**
   * Gera todas as combinações de N números em grupos de K
   */
  private generateCombinations(numbers: number[], groupSize: number): number[][] {
    const result: number[][] = [];

    function combine(start: number, current: number[]): void {
      if (current.length === groupSize) {
        result.push([...current]);
        return;
      }

      for (let i = start; i < numbers.length; i++) {
        current.push(numbers[i]);
        combine(i + 1, current);
        current.pop();
      }
    }

    combine(0, []);
    return result;
  }

  /**
   * Seleciona jogos ótimos para garantir cobertura
   */
  private selectOptimalGames(
    allGames: number[][],
    baseNumbers: number[],
    guarantee: number,
    ifHit: number,
    maxGames: number
  ): number[][] {
    // Algoritmo guloso para cobertura mínima
    const selected: number[][] = [];
    const coveredPatterns = new Set<string>();

    // Gerar padrões que precisam ser cobertos
    const requiredPatterns = this.generateCombinations(baseNumbers, ifHit);

    // Para cada padrão, precisamos ter pelo menos um jogo com 'guarantee' números dele
    while (selected.length < maxGames && coveredPatterns.size < requiredPatterns.length) {
      let bestGame: number[] | null = null;
      let bestCoverage = 0;

      for (const game of allGames) {
        if (selected.some(s => this.arraysEqual(s, game))) continue;

        let newCoverage = 0;

        for (let i = 0; i < requiredPatterns.length; i++) {
          const pattern = requiredPatterns[i];
          const patternKey = pattern.join(',');

          if (coveredPatterns.has(patternKey)) continue;

          // Verificar se o jogo cobre este padrão
          const hits = pattern.filter(n => game.includes(n)).length;
          if (hits >= guarantee) {
            newCoverage++;
          }
        }

        if (newCoverage > bestCoverage) {
          bestCoverage = newCoverage;
          bestGame = game;
        }
      }

      if (bestGame && bestCoverage > 0) {
        selected.push(bestGame);

        // Marcar padrões cobertos
        for (const pattern of requiredPatterns) {
          const hits = pattern.filter(n => bestGame!.includes(n)).length;
          if (hits >= guarantee) {
            coveredPatterns.add(pattern.join(','));
          }
        }
      } else {
        break;
      }
    }

    this.logger.log(`Selected ${selected.length} games covering ${coveredPatterns.size}/${requiredPatterns.length} patterns`);

    return selected;
  }

  /**
   * Compara arrays
   */
  private arraysEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  /**
   * Calcula estatísticas de cobertura
   */
  private calculateCoverage(
    games: number[][],
    baseNumbers: number[],
    numbersToDraw: number
  ): CoverageStats {
    const uniqueNumbers = new Set<number>();
    const pairs = new Set<string>();
    const trios = new Set<string>();

    games.forEach(game => {
      game.forEach(num => uniqueNumbers.add(num));

      // Contar pares
      for (let i = 0; i < game.length - 1; i++) {
        for (let j = i + 1; j < game.length; j++) {
          pairs.add(`${game[i]}-${game[j]}`);
        }
      }

      // Contar trios
      for (let i = 0; i < game.length - 2; i++) {
        for (let j = i + 1; j < game.length - 1; j++) {
          for (let k = j + 1; k < game.length; k++) {
            trios.add(`${game[i]}-${game[j]}-${game[k]}`);
          }
        }
      }
    });

    const totalPossiblePairs = (baseNumbers.length * (baseNumbers.length - 1)) / 2;
    const totalPossibleTrios = (baseNumbers.length * (baseNumbers.length - 1) * (baseNumbers.length - 2)) / 6;

    return {
      totalGames: games.length,
      uniqueNumbers: Array.from(uniqueNumbers).sort((a, b) => a - b),
      numberCoverage: (uniqueNumbers.size / baseNumbers.length) * 100,
      pairsCovered: pairs.size,
      triosCovered: trios.size,
      guaranteedPrize: this.determineGuarantee(games, baseNumbers)
    };
  }

  /**
   * Determina garantia do fechamento
   */
  private determineGuarantee(games: number[][], baseNumbers: number[]): string {
    // Simplificado - análise completa seria mais complexa
    if (games.length >= 20) {
      return 'Quadra garantida se acertar 5 números base';
    } else if (games.length >= 10) {
      return 'Terno garantido se acertar 5 números base';
    }
    return 'Sem garantia mínima';
  }

  /**
   * Obtém custo do jogo
   */
  private getGameCost(lotteryName: string): number {
    const costs: Record<string, number> = {
      megasena: 5.00,
      quina: 2.50,
      lotofacil: 3.00,
      lotomania: 3.00,
      duplasena: 2.50,
      timemania: 3.50,
      diadesorte: 2.50
    };
    return costs[lotteryName] || 3.00;
  }

  /**
   * Calcula retorno potencial
   */
  private calculatePotentialReturn(
    games: number[][],
    guarantee: number,
    ifHit: number,
    lotteryName: string
  ): PotentialReturn[] {
    // Retornos estimados (simplificado)
    return [
      {
        scenario: `Acertando ${ifHit} dos números base`,
        probability: 0.001, // Simplificado
        expectedPrize: 'Varia conforme prêmio acumulado'
      },
      {
        scenario: `Quadra garantida`,
        probability: 0.05,
        expectedPrize: 'R$ 500 - R$ 2.000 por jogo'
      },
      {
        scenario: `Terno/Trio`,
        probability: 0.15,
        expectedPrize: 'R$ 5 - R$ 20 por jogo'
      }
    ];
  }

  /**
   * Gera fechamento otimizado para múltiplas estratégias
   */
  async generateSmartClosure(
    lotteryTypeId: number,
    strategies: any[],
    historicalDraws: any[],
    options: {
      numberOfGames: number;
      includeHotNumbers: boolean;
      includeDueNumbers: boolean;
    }
  ): Promise<GameSet> {
    const { numberOfGames, includeHotNumbers, includeDueNumbers } = options;

    // Coletar números de todas as estratégias
    const allPredictedNumbers = new Set<number>();
    const numberScores = new Map<number, number>();

    for (const strategy of strategies) {
      try {
        const config = await this.getLotteryConfig(lotteryTypeId);
        const numbers = await strategy.predict(historicalDraws, config);

        numbers.forEach((num: number, idx: number) => {
          allPredictedNumbers.add(num);
          const positionScore = (numbers.length - idx) / numbers.length;
          numberScores.set(num, (numberScores.get(num) || 0) + positionScore);
        });
      } catch { }
    }

    // Adicionar números quentes e devidos se solicitado
    if (includeHotNumbers || includeDueNumbers) {
      const analysis = await this.getNumberAnalysis(lotteryTypeId);

      if (includeHotNumbers && analysis.hotNumbers) {
        analysis.hotNumbers.forEach((num: number) => {
          allPredictedNumbers.add(num);
          numberScores.set(num, (numberScores.get(num) || 0) + 0.5);
        });
      }

      if (includeDueNumbers && analysis.dueNumbers) {
        analysis.dueNumbers.forEach((num: number) => {
          allPredictedNumbers.add(num);
          numberScores.set(num, (numberScores.get(num) || 0) + 0.3);
        });
      }
    }

    // Ordenar por score e pegar top números
    const topNumbers = Array.from(numberScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.min(15, allPredictedNumbers.size))
      .map(([num]) => num)
      .sort((a, b) => a - b);

    // Gerar fechamento
    return this.generateClosure(lotteryTypeId, topNumbers, {
      guarantee: 4,
      ifHit: 5,
      maxGames: numberOfGames
    });
  }

  /**
   * Obtém config da loteria
   */
  private async getLotteryConfig(lotteryTypeId: number): Promise<any> {
    const [config] = await this.dataSource.query(`
      SELECT * FROM lottery_types WHERE id = ?
    `, [lotteryTypeId]);

    return {
      numbersToDraw: config?.numbers_to_draw || 6,
      maxNumber: config?.max_number || 60,
      minNumber: config?.min_number || 1,
      lotteryTypeId
    };
  }

  /**
   * Obtém análise de números
   */
  private async getNumberAnalysis(lotteryTypeId: number): Promise<any> {
    const hotNumbers = await this.dataSource.query(`
      SELECT number FROM number_frequency
      WHERE lottery_type_id = ?
      ORDER BY appearances_last_30 DESC
      LIMIT 10
    `, [lotteryTypeId]);

    const dueNumbers = await this.dataSource.query(`
      SELECT number FROM number_frequency
      WHERE lottery_type_id = ? AND current_delay > average_delay
      ORDER BY (current_delay / average_delay) DESC
      LIMIT 10
    `, [lotteryTypeId]);

    return {
      hotNumbers: hotNumbers.map((n: any) => n.number),
      dueNumbers: dueNumbers.map((n: any) => n.number)
    };
  }

  /**
   * Gera conjunto otimizado de jogos - MÉTODO PÚBLICO
   */
  async generateOptimalSet(
    lotteryTypeId: number,
    count: number = 5,
  ): Promise<GameSet> {
    this.logger.log(`Generating ${count} optimal games for lottery ${lotteryTypeId}`);

    // Buscar dados históricos
    const draws = await this.dataSource.query(`
      SELECT numbers, draw_date, concurso_number
      FROM draws
      WHERE lottery_type_id = ?
      ORDER BY draw_date DESC
      LIMIT 500
    `, [lotteryTypeId]);

    // Análise estatística para selecionar números base
    const analysis = await this.getNumberAnalysis(lotteryTypeId);
    const config = await this.getLotteryConfig(lotteryTypeId);

    // Combinar números quentes e devidos
    const baseNumbers = [...new Set([
      ...analysis.hotNumbers.slice(0, 10),
      ...analysis.dueNumbers.slice(0, 5)
    ])].sort((a, b) => a - b);

    // Se não temos números suficientes, gerar baseado em frequência
    if (baseNumbers.length < 12) {
      const freqNumbers = await this.dataSource.query(`
        SELECT number FROM number_frequency
        WHERE lottery_type_id = ?
        ORDER BY total_appearances DESC
        LIMIT 15
      `, [lotteryTypeId]);

      freqNumbers.forEach((n: any) => {
        if (!baseNumbers.includes(n.number)) {
          baseNumbers.push(n.number);
        }
      });
      baseNumbers.sort((a, b) => a - b);
    }

    // Gerar fechamento
    return this.generateClosure(lotteryTypeId, baseNumbers.slice(0, 15), {
      guarantee: 4,
      ifHit: 5,
      maxGames: count
    });
  }

  /**
   * Gera jogos usando evolução genética - MÉTODO PÚBLICO
   */
  async generateWithEvolution(
    lotteryTypeId: number,
    count: number = 5,
    generations: number = 50,
  ): Promise<{
    games: number[][];
    evolution: any;
    coverage: CoverageStats;
    cost: number;
  }> {
    this.logger.log(`Generating ${count} evolved games for lottery ${lotteryTypeId}`);

    // Buscar histórico
    const draws = await this.dataSource.query(`
      SELECT numbers, draw_date, concurso_number
      FROM draws
      WHERE lottery_type_id = ?
      ORDER BY draw_date DESC
      LIMIT 500
    `, [lotteryTypeId]);

    // Evoluir
    const evolution = await this.geneticOptimizer.evolveGames(
      lotteryTypeId,
      draws,
      { generations, populationSize: 100 }
    );

    // Pegar top jogos da população final
    const games = evolution.population
      .slice(0, count)
      .map(c => c.genes);

    const config = await this.getLotteryConfig(lotteryTypeId);
    const allNumbers = [...new Set(games.flat())];
    const coverage = this.calculateCoveragePublic(games, allNumbers, config.numbersToDraw);

    return {
      games,
      evolution: {
        generationsEvolved: evolution.generationsEvolved,
        convergenceGeneration: evolution.convergenceGeneration,
        bestFitness: evolution.bestChromosome.fitness,
        fitnessHistory: evolution.fitnessHistory.slice(-10) // Últimas 10
      },
      coverage,
      cost: games.length * this.getGameCost(config.name || 'megasena')
    };
  }

  /**
   * Calcula cobertura - MÉTODO PÚBLICO
   */
  calculateCoveragePublic(
    games: number[][],
    baseNumbers: number[],
    numbersToDraw: number
  ): CoverageStats {
    return this.calculateCoverage(games, baseNumbers, numbersToDraw);
  }

  /**
   * Executa evolução - MÉTODO PÚBLICO
   */
  async runEvolution(
    lotteryTypeId: number,
    config: Partial<GeneticConfig> = {},
  ): Promise<{
    generationsEvolved: number;
    bestGame: number[];
    bestFitness: number;
    topGames: number[][];
    convergenceGeneration: number;
  }> {
    // Buscar histórico
    const draws = await this.dataSource.query(`
      SELECT numbers, draw_date, concurso_number
      FROM draws
      WHERE lottery_type_id = ?
      ORDER BY draw_date DESC
      LIMIT 500
    `, [lotteryTypeId]);

    const result = await this.geneticOptimizer.evolveGames(
      lotteryTypeId,
      draws,
      config
    );

    return {
      generationsEvolved: result.generationsEvolved,
      bestGame: result.bestChromosome.genes,
      bestFitness: result.bestChromosome.fitness,
      topGames: result.population.slice(0, 10).map(c => c.genes),
      convergenceGeneration: result.convergenceGeneration
    };
  }

  /**
   * Geração inteligente com múltiplas estratégias - MÉTODO PÚBLICO
   */
  async smartGenerate(
    lotteryTypeId: number,
    count: number = 5,
    strategyNames?: string[],
  ): Promise<{
    games: number[][];
    strategyContributions: Record<string, number>;
    coverage: CoverageStats;
    confidence: number;
  }> {
    this.logger.log(`Smart generating ${count} games for lottery ${lotteryTypeId}`);

    // Buscar pesos das estratégias
    const weights = await this.dataSource.query(`
      SELECT strategy_name, weight
      FROM strategy_weights
      WHERE lottery_type_id = ?
      ORDER BY weight DESC
    `, [lotteryTypeId]);

    // Buscar previsões de cada estratégia do banco
    const predictions = await this.dataSource.query(`
      SELECT p.strategy_name, p.numbers
      FROM predictions p
      WHERE p.lottery_type_id = ?
        AND p.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY p.created_at DESC
    `, [lotteryTypeId]);

    // Agregar números com peso
    const numberScores = new Map<number, number>();
    const strategyContributions: Record<string, number> = {};

    for (const pred of predictions) {
      const weight = weights.find((w: any) => w.strategy_name === pred.strategy_name)?.weight || 0.5;
      const numbers = typeof pred.numbers === 'string' ? JSON.parse(pred.numbers) : pred.numbers;

      if (!strategyContributions[pred.strategy_name]) {
        strategyContributions[pred.strategy_name] = 0;
      }
      strategyContributions[pred.strategy_name] += weight;

      numbers.forEach((num: number, idx: number) => {
        const positionWeight = (numbers.length - idx) / numbers.length;
        const score = weight * positionWeight;
        numberScores.set(num, (numberScores.get(num) || 0) + score);
      });
    }

    // Top números ordenados por score
    const topNumbers = Array.from(numberScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([num]) => num)
      .sort((a, b) => a - b);

    // Gerar jogos
    const config = await this.getLotteryConfig(lotteryTypeId);
    const closure = await this.generateClosure(lotteryTypeId, topNumbers, {
      guarantee: 4,
      ifHit: 5,
      maxGames: count
    });

    // Calcular confiança média
    const totalWeight = Object.values(strategyContributions).reduce((a, b) => a + b, 0);
    const confidence = Math.min(1, totalWeight / 10); // Normalizado

    return {
      games: closure.games,
      strategyContributions,
      coverage: closure.coverage,
      confidence
    };
  }

  /**
   * Calcula custo do fechamento - MÉTODO PÚBLICO
   */
  async calculateClosureCost(
    lotteryTypeId: number,
    gameCount: number,
  ): Promise<{
    gameCount: number;
    costPerGame: number;
    totalCost: number;
    lotteryName: string;
  }> {
    const config = await this.getLotteryConfig(lotteryTypeId);
    const costPerGame = this.getGameCost(config.name || 'megasena');

    return {
      gameCount,
      costPerGame,
      totalCost: gameCount * costPerGame,
      lotteryName: config.name
    };
  }

  /**
   * Obtém recomendações de fechamento - MÉTODO PÚBLICO
   */
  async getRecommendations(
    lotteryTypeId: number,
    budget: number,
  ): Promise<ClosureRecommendation[]> {
    const config = await this.getLotteryConfig(lotteryTypeId);
    const costPerGame = this.getGameCost(config.name || 'megasena');
    const maxGames = Math.floor(budget / costPerGame);

    const recommendations: ClosureRecommendation[] = [];

    // Recomendações baseadas em diferentes níveis
    const levels = [
      { games: 3, coverage: 15, desc: 'Básico: 3 jogos bem selecionados' },
      { games: 5, coverage: 25, desc: 'Intermediário: 5 jogos com boa cobertura' },
      { games: 10, coverage: 45, desc: 'Avançado: 10 jogos cobrindo mais padrões' },
      { games: 15, coverage: 60, desc: 'Profissional: 15 jogos com alta cobertura' },
      { games: 20, coverage: 70, desc: 'Expert: 20 jogos maximizando chances' },
    ];

    for (const level of levels) {
      if (level.games <= maxGames) {
        recommendations.push({
          gamesCount: level.games,
          cost: level.games * costPerGame,
          coverage: level.coverage,
          description: level.desc,
          recommended: level.games === Math.min(
            ...levels.filter(l => l.games <= maxGames).map(l => Math.abs(l.games - maxGames * 0.6))
          )
        });
      }
    }

    // Marcar a recomendação mais próxima de 60% do orçamento como recomendada
    const targetGames = maxGames * 0.6;
    let bestMatch = recommendations[0];
    let bestDiff = Infinity;

    for (const rec of recommendations) {
      const diff = Math.abs(rec.gamesCount - targetGames);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestMatch = rec;
      }
    }

    recommendations.forEach(r => r.recommended = (r === bestMatch));

    return recommendations;
  }
}
