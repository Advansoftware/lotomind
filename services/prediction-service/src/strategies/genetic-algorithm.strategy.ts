import { Injectable } from '@nestjs/common';

@Injectable()
export class GeneticAlgorithmStrategy {
  name = 'genetic_algorithm';
  displayName = 'Genetic Algorithm';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const populationSize = config.populationSize || 100;
    const generations = config.generations || 50;
    const mutationRate = config.mutationRate || 0.1;

    // Initialize population with random combinations
    let population = this.initializePopulation(populationSize, numbersToDraw, minNumber, maxNumber);

    // Evolve over generations
    for (let gen = 0; gen < generations; gen++) {
      // Calculate fitness for each individual
      const fitness = population.map(individual =>
        this.calculateFitness(individual, historicalDraws)
      );

      // Selection: keep top 50%
      const sortedPopulation = population
        .map((individual, index) => ({ individual, fitness: fitness[index] }))
        .sort((a, b) => b.fitness - a.fitness);

      const survivors = sortedPopulation.slice(0, Math.floor(populationSize / 2));

      // Crossover: create offspring
      const offspring: number[][] = [];
      while (offspring.length < populationSize - survivors.length) {
        const parent1 = survivors[Math.floor(Math.random() * survivors.length)].individual;
        const parent2 = survivors[Math.floor(Math.random() * survivors.length)].individual;
        const child = this.crossover(parent1, parent2, numbersToDraw);
        offspring.push(child);
      }

      // Mutation
      offspring.forEach(child => {
        if (Math.random() < mutationRate) {
          this.mutate(child, minNumber, maxNumber);
        }
      });

      // New population
      population = [...survivors.map(s => s.individual), ...offspring];
    }

    // Return the fittest individual
    const finalFitness = population.map(individual =>
      this.calculateFitness(individual, historicalDraws)
    );
    const bestIndex = finalFitness.indexOf(Math.max(...finalFitness));

    return population[bestIndex].sort((a, b) => a - b);
  }

  private initializePopulation(size: number, count: number, min: number, max: number): number[][] {
    const population: number[][] = [];
    for (let i = 0; i < size; i++) {
      const individual: number[] = [];
      while (individual.length < count) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!individual.includes(num)) {
          individual.push(num);
        }
      }
      population.push(individual);
    }
    return population;
  }

  private calculateFitness(individual: number[], historicalDraws: any[]): number {
    let score = 0;
    const recentDraws = historicalDraws.slice(0, 20);

    // Fitness based on how many numbers match recent draws
    recentDraws.forEach((draw, index) => {
      const matches = individual.filter(num => draw.numbers.includes(num)).length;
      const weight = 1 / (index + 1); // Recent draws have more weight
      score += matches * weight;
    });

    // Bonus for balanced odd/even
    const oddCount = individual.filter(n => n % 2 !== 0).length;
    if (oddCount >= 2 && oddCount <= 4) score += 5;

    // Bonus for good sum range
    const sum = individual.reduce((a, b) => a + b, 0);
    const avgSum = recentDraws.reduce((sum, draw) =>
      sum + draw.numbers.reduce((a: number, b: number) => a + b, 0), 0
    ) / recentDraws.length;

    if (Math.abs(sum - avgSum) < avgSum * 0.2) score += 5;

    return score;
  }

  private crossover(parent1: number[], parent2: number[], count: number): number[] {
    const crossoverPoint = Math.floor(count / 2);
    const child = new Set<number>();

    // Take first half from parent1
    for (let i = 0; i < crossoverPoint; i++) {
      child.add(parent1[i]);
    }

    // Fill remaining from parent2
    for (const num of parent2) {
      if (child.size >= count) break;
      child.add(num);
    }

    // Fill any remaining slots randomly
    while (child.size < count) {
      const allNumbers = [...parent1, ...parent2];
      const randomNum = allNumbers[Math.floor(Math.random() * allNumbers.length)];
      child.add(randomNum);
    }

    return Array.from(child).slice(0, count);
  }

  private mutate(individual: number[], min: number, max: number): void {
    const mutationIndex = Math.floor(Math.random() * individual.length);
    let newNum = Math.floor(Math.random() * (max - min + 1)) + min;

    while (individual.includes(newNum)) {
      newNum = Math.floor(Math.random() * (max - min + 1)) + min;
    }

    individual[mutationIndex] = newNum;
  }
}
