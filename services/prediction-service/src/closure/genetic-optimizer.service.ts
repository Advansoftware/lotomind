import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface Chromosome {
  genes: number[]; // Números do jogo
  fitness: number;
  generation: number;
}

export interface GeneticConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  eliteSize: number;
  tournamentSize: number;
}

export interface EvolutionResult {
  bestChromosome: Chromosome;
  population: Chromosome[];
  generationsEvolved: number;
  fitnessHistory: number[];
  convergenceGeneration: number;
}

@Injectable()
export class GeneticOptimizerService {
  private readonly logger = new Logger(GeneticOptimizerService.name);

  constructor(private dataSource: DataSource) { }

  /**
   * Evolui população de jogos usando algoritmo genético
   */
  async evolveGames(
    lotteryTypeId: number,
    historicalDraws: any[],
    config: Partial<GeneticConfig> = {}
  ): Promise<EvolutionResult> {
    const fullConfig: GeneticConfig = {
      populationSize: config.populationSize || 100,
      generations: config.generations || 50,
      mutationRate: config.mutationRate || 0.1,
      crossoverRate: config.crossoverRate || 0.8,
      eliteSize: config.eliteSize || 10,
      tournamentSize: config.tournamentSize || 5
    };

    this.logger.log(`Starting genetic evolution for lottery ${lotteryTypeId}`);

    // Buscar config da loteria
    const [lotteryConfig] = await this.dataSource.query(`
      SELECT numbers_to_draw, min_number, max_number
      FROM lottery_types WHERE id = ?
    `, [lotteryTypeId]);

    const numbersToDraw = lotteryConfig?.numbers_to_draw || 6;
    const minNumber = lotteryConfig?.min_number || 1;
    const maxNumber = lotteryConfig?.max_number || 60;

    // Calcular estatísticas dos dados históricos para fitness
    const stats = this.calculateHistoricalStats(historicalDraws, minNumber, maxNumber);

    // Inicializar população
    let population = this.initializePopulation(
      fullConfig.populationSize,
      numbersToDraw,
      minNumber,
      maxNumber,
      historicalDraws,
      stats
    );

    const fitnessHistory: number[] = [];
    let bestEver: Chromosome = population[0];
    let convergenceGeneration = fullConfig.generations;

    // Evolução
    for (let gen = 0; gen < fullConfig.generations; gen++) {
      // Avaliar fitness
      population = population.map(chromosome => ({
        ...chromosome,
        fitness: this.calculateFitness(chromosome.genes, stats, historicalDraws),
        generation: gen
      }));

      // Ordenar por fitness
      population.sort((a, b) => b.fitness - a.fitness);

      // Registrar melhor fitness
      fitnessHistory.push(population[0].fitness);

      // Atualizar melhor de todos os tempos
      if (population[0].fitness > bestEver.fitness) {
        bestEver = { ...population[0] };
      }

      // Verificar convergência
      if (gen > 10) {
        const recentFitness = fitnessHistory.slice(-10);
        const avgRecent = recentFitness.reduce((a, b) => a + b, 0) / 10;
        const variance = recentFitness.reduce((sum, f) => sum + Math.pow(f - avgRecent, 2), 0) / 10;

        if (variance < 0.001) {
          convergenceGeneration = gen;
          this.logger.log(`Converged at generation ${gen}`);
          break;
        }
      }

      // Nova geração
      const newPopulation: Chromosome[] = [];

      // Elitismo
      newPopulation.push(...population.slice(0, fullConfig.eliteSize));

      // Gerar resto da população
      while (newPopulation.length < fullConfig.populationSize) {
        // Seleção por torneio
        const parent1 = this.tournamentSelection(population, fullConfig.tournamentSize);
        const parent2 = this.tournamentSelection(population, fullConfig.tournamentSize);

        // Crossover
        let offspring1 = [...parent1.genes];
        let offspring2 = [...parent2.genes];

        if (Math.random() < fullConfig.crossoverRate) {
          [offspring1, offspring2] = this.crossover(parent1.genes, parent2.genes, minNumber, maxNumber);
        }

        // Mutação
        if (Math.random() < fullConfig.mutationRate) {
          offspring1 = this.mutate(offspring1, minNumber, maxNumber);
        }
        if (Math.random() < fullConfig.mutationRate) {
          offspring2 = this.mutate(offspring2, minNumber, maxNumber);
        }

        newPopulation.push({
          genes: offspring1.sort((a, b) => a - b),
          fitness: 0,
          generation: gen + 1
        });

        if (newPopulation.length < fullConfig.populationSize) {
          newPopulation.push({
            genes: offspring2.sort((a, b) => a - b),
            fitness: 0,
            generation: gen + 1
          });
        }
      }

      population = newPopulation;

      if (gen % 10 === 0) {
        this.logger.debug(`Generation ${gen}: Best fitness = ${population[0].fitness.toFixed(4)}`);
      }
    }

    // Avaliar população final
    population = population.map(chromosome => ({
      ...chromosome,
      fitness: this.calculateFitness(chromosome.genes, stats, historicalDraws)
    }));
    population.sort((a, b) => b.fitness - a.fitness);

    this.logger.log(`Evolution complete: Best fitness = ${bestEver.fitness.toFixed(4)}`);

    // Salvar evolução no banco
    await this.saveEvolution(lotteryTypeId, bestEver, population, fullConfig.generations);

    return {
      bestChromosome: bestEver,
      population: population.slice(0, 20), // Top 20
      generationsEvolved: fitnessHistory.length,
      fitnessHistory,
      convergenceGeneration
    };
  }

  /**
   * Calcula estatísticas históricas
   */
  private calculateHistoricalStats(
    draws: any[],
    minNumber: number,
    maxNumber: number
  ): {
    frequency: Map<number, number>;
    pairFrequency: Map<string, number>;
    avgSum: number;
    avgOddCount: number;
    recentNumbers: Set<number>;
  } {
    const frequency = new Map<number, number>();
    const pairFrequency = new Map<string, number>();
    let totalSum = 0;
    let totalOddCount = 0;
    const recentNumbers = new Set<number>();

    draws.forEach((draw, idx) => {
      const numbers = Array.isArray(draw.numbers) ? draw.numbers : JSON.parse(draw.numbers);

      // Frequência
      numbers.forEach((num: number) => {
        frequency.set(num, (frequency.get(num) || 0) + 1);
        if (idx < 20) recentNumbers.add(num);
      });

      // Pares
      for (let i = 0; i < numbers.length - 1; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const key = `${Math.min(numbers[i], numbers[j])}-${Math.max(numbers[i], numbers[j])}`;
          pairFrequency.set(key, (pairFrequency.get(key) || 0) + 1);
        }
      }

      // Soma e pares/ímpares
      totalSum += numbers.reduce((a: number, b: number) => a + b, 0);
      totalOddCount += numbers.filter((n: number) => n % 2 !== 0).length;
    });

    return {
      frequency,
      pairFrequency,
      avgSum: totalSum / draws.length,
      avgOddCount: totalOddCount / draws.length,
      recentNumbers
    };
  }

  /**
   * Inicializa população com estratégias mistas
   */
  private initializePopulation(
    size: number,
    numbersToDraw: number,
    minNumber: number,
    maxNumber: number,
    draws: any[],
    stats: any
  ): Chromosome[] {
    const population: Chromosome[] = [];

    // 20% baseados em frequência
    for (let i = 0; i < size * 0.2; i++) {
      population.push({
        genes: this.generateFromFrequency(stats.frequency, numbersToDraw, minNumber, maxNumber),
        fitness: 0,
        generation: 0
      });
    }

    // 20% baseados em números recentes
    for (let i = 0; i < size * 0.2; i++) {
      population.push({
        genes: this.generateFromRecent(stats.recentNumbers, numbersToDraw, minNumber, maxNumber),
        fitness: 0,
        generation: 0
      });
    }

    // 60% aleatórios
    while (population.length < size) {
      population.push({
        genes: this.generateRandom(numbersToDraw, minNumber, maxNumber),
        fitness: 0,
        generation: 0
      });
    }

    return population;
  }

  /**
   * Gera cromossomo baseado em frequência
   */
  private generateFromFrequency(
    frequency: Map<number, number>,
    count: number,
    min: number,
    max: number
  ): number[] {
    const sorted = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1]);

    const topNumbers = sorted.slice(0, count * 2).map(([num]) => num);
    const selected = this.shuffleArray(topNumbers).slice(0, count);

    return selected.sort((a, b) => a - b);
  }

  /**
   * Gera cromossomo baseado em números recentes
   */
  private generateFromRecent(
    recent: Set<number>,
    count: number,
    min: number,
    max: number
  ): number[] {
    const recentArray = Array.from(recent);

    if (recentArray.length >= count) {
      return this.shuffleArray(recentArray).slice(0, count).sort((a, b) => a - b);
    }

    // Completar com aleatórios
    const selected = [...recentArray];
    while (selected.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!selected.includes(num)) {
        selected.push(num);
      }
    }

    return selected.sort((a, b) => a - b);
  }

  /**
   * Gera cromossomo aleatório
   */
  private generateRandom(count: number, min: number, max: number): number[] {
    const numbers: number[] = [];
    while (numbers.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  }

  /**
   * Calcula fitness de um cromossomo
   */
  private calculateFitness(
    genes: number[],
    stats: any,
    draws: any[]
  ): number {
    let fitness = 0;

    // 1. Score de frequência (números frequentes = bom)
    let freqScore = 0;
    genes.forEach(num => {
      freqScore += (stats.frequency.get(num) || 0) / draws.length;
    });
    fitness += (freqScore / genes.length) * 30;

    // 2. Score de pares frequentes
    let pairScore = 0;
    for (let i = 0; i < genes.length - 1; i++) {
      for (let j = i + 1; j < genes.length; j++) {
        const key = `${genes[i]}-${genes[j]}`;
        pairScore += (stats.pairFrequency.get(key) || 0) / draws.length;
      }
    }
    fitness += (pairScore / 15) * 20; // 15 pares possíveis em 6 números

    // 3. Proximidade com soma média
    const sum = genes.reduce((a, b) => a + b, 0);
    const sumDiff = Math.abs(sum - stats.avgSum) / stats.avgSum;
    fitness += (1 - Math.min(sumDiff, 1)) * 15;

    // 4. Balanceamento par/ímpar
    const oddCount = genes.filter(n => n % 2 !== 0).length;
    const oddDiff = Math.abs(oddCount - stats.avgOddCount) / genes.length;
    fitness += (1 - oddDiff) * 15;

    // 5. Números recentes (bônus)
    const recentCount = genes.filter(n => stats.recentNumbers.has(n)).length;
    fitness += (recentCount / genes.length) * 10;

    // 6. Distribuição (evitar números muito próximos)
    let distribution = 0;
    for (let i = 0; i < genes.length - 1; i++) {
      distribution += genes[i + 1] - genes[i];
    }
    const avgGap = distribution / (genes.length - 1);
    const idealGap = 10;
    fitness += (1 - Math.abs(avgGap - idealGap) / idealGap) * 10;

    return Math.max(0, fitness);
  }

  /**
   * Seleção por torneio
   */
  private tournamentSelection(population: Chromosome[], size: number): Chromosome {
    const tournament: Chromosome[] = [];

    for (let i = 0; i < size; i++) {
      const idx = Math.floor(Math.random() * population.length);
      tournament.push(population[idx]);
    }

    return tournament.reduce((best, curr) => curr.fitness > best.fitness ? curr : best);
  }

  /**
   * Crossover de dois pais
   */
  private crossover(
    parent1: number[],
    parent2: number[],
    min: number,
    max: number
  ): [number[], number[]] {
    const allGenes = [...new Set([...parent1, ...parent2])];

    // Embaralhar e dividir
    const shuffled = this.shuffleArray(allGenes);
    const mid = Math.floor(shuffled.length / 2);

    let offspring1 = shuffled.slice(0, parent1.length);
    let offspring2 = shuffled.slice(mid, mid + parent2.length);

    // Completar se necessário
    offspring1 = this.completeChromosome(offspring1, parent1.length, min, max);
    offspring2 = this.completeChromosome(offspring2, parent2.length, min, max);

    return [offspring1, offspring2];
  }

  /**
   * Completa cromossomo com genes únicos
   */
  private completeChromosome(genes: number[], targetSize: number, min: number, max: number): number[] {
    const result = [...new Set(genes)];

    while (result.length < targetSize) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!result.includes(num)) {
        result.push(num);
      }
    }

    return result.slice(0, targetSize);
  }

  /**
   * Mutação de um cromossomo
   */
  private mutate(genes: number[], min: number, max: number): number[] {
    const result = [...genes];
    const idx = Math.floor(Math.random() * genes.length);

    let newNum: number;
    do {
      newNum = Math.floor(Math.random() * (max - min + 1)) + min;
    } while (result.includes(newNum));

    result[idx] = newNum;
    return result;
  }

  /**
   * Embaralha array
   */
  private shuffleArray<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Salva evolução no banco
   */
  private async saveEvolution(
    lotteryTypeId: number,
    best: Chromosome,
    population: Chromosome[],
    generations: number
  ): Promise<void> {
    // Buscar última geração
    const [lastGen] = await this.dataSource.query(`
      SELECT MAX(generation) as max_gen FROM strategy_evolution WHERE lottery_type_id = ?
    `, [lotteryTypeId]);

    const newGeneration = (lastGen?.max_gen || 0) + 1;

    // Salvar melhor cromossomo
    await this.dataSource.query(`
      INSERT INTO strategy_evolution (
        lottery_type_id, generation, strategy_dna, chromosome, fitness_score,
        is_elite, is_best_ever
      ) VALUES (?, ?, ?, ?, ?, 1, 1)
    `, [
      lotteryTypeId,
      newGeneration,
      JSON.stringify({ genes: best.genes, fitness: best.fitness }),
      JSON.stringify(best.genes),
      best.fitness
    ]);

    // Salvar top 5 elite
    for (let i = 0; i < Math.min(5, population.length); i++) {
      const chrom = population[i];
      await this.dataSource.query(`
        INSERT INTO strategy_evolution (
          lottery_type_id, generation, strategy_dna, chromosome, fitness_score,
          is_elite, is_best_ever
        ) VALUES (?, ?, ?, ?, ?, 1, 0)
      `, [
        lotteryTypeId,
        newGeneration,
        JSON.stringify({ genes: chrom.genes, fitness: chrom.fitness }),
        JSON.stringify(chrom.genes),
        chrom.fitness
      ]);
    }

    this.logger.log(`Saved evolution generation ${newGeneration} for lottery ${lotteryTypeId}`);
  }

  /**
   * Obtém melhores jogos evoluídos
   */
  async getBestEvolvedGames(
    lotteryTypeId: number,
    count: number = 5
  ): Promise<number[][]> {
    const results = await this.dataSource.query(`
      SELECT chromosome, fitness_score
      FROM strategy_evolution
      WHERE lottery_type_id = ? AND is_elite = 1
      ORDER BY fitness_score DESC, generation DESC
      LIMIT ?
    `, [lotteryTypeId, count]);

    return results.map((r: any) => {
      const genes = typeof r.chromosome === 'string'
        ? JSON.parse(r.chromosome)
        : r.chromosome;
      return genes;
    });
  }
}
