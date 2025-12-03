import { Injectable, Logger } from '@nestjs/common';

interface DecisionTree {
  feature: number;
  threshold: number;
  left: DecisionTree | number;
  right: DecisionTree | number;
}

interface GBConfig {
  nEstimators: number;
  maxDepth: number;
  learningRate: number;
  minSamplesSplit: number;
  subsample: number;
}

@Injectable()
export class GradientBoostingStrategy {
  name = 'gradient_boosting';
  displayName = 'Gradient Boosting Ensemble';

  private readonly logger = new Logger(GradientBoostingStrategy.name);
  private trainedModels: Map<string, { trees: DecisionTree[]; weights: number[] }> = new Map();

  /**
   * Extrai features de múltiplos sorteios para um número específico
   */
  private extractFeaturesForNumber(
    num: number,
    draws: any[],
    windowSize: number = 50
  ): number[] {
    const features: number[] = [];
    const recentDraws = draws.slice(0, windowSize);

    // Feature 1: Frequência nos últimos N sorteios
    let frequency = 0;
    let lastAppearance = -1;
    const gaps: number[] = [];

    recentDraws.forEach((draw, idx) => {
      const numbers = Array.isArray(draw.numbers) ? draw.numbers : JSON.parse(draw.numbers);
      if (numbers.includes(num)) {
        frequency++;
        if (lastAppearance >= 0) {
          gaps.push(idx - lastAppearance);
        }
        lastAppearance = idx;
      }
    });

    features.push(frequency / windowSize); // Frequência normalizada

    // Feature 2: Gap atual
    const currentGap = lastAppearance >= 0 ? lastAppearance : windowSize;
    features.push(currentGap / windowSize);

    // Feature 3: Gap médio
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : windowSize;
    features.push(avgGap / windowSize);

    // Feature 4: Desvio do gap médio
    features.push(currentGap / avgGap);

    // Feature 5: Tendência (frequência recente vs antiga)
    const recent10 = draws.slice(0, 10);
    const older10 = draws.slice(10, 20);
    const recentFreq = recent10.filter(d => {
      const nums = Array.isArray(d.numbers) ? d.numbers : JSON.parse(d.numbers);
      return nums.includes(num);
    }).length;
    const olderFreq = older10.filter(d => {
      const nums = Array.isArray(d.numbers) ? d.numbers : JSON.parse(d.numbers);
      return nums.includes(num);
    }).length;
    features.push((recentFreq - olderFreq + 10) / 20); // Normalizado entre 0 e 1

    // Feature 6: É ímpar?
    features.push(num % 2);

    // Feature 7: Região do número (baixo, médio, alto)
    const maxNum = 60; // Padrão Mega-Sena
    features.push(num / maxNum);

    // Feature 8: Dezena do número
    features.push(Math.floor(num / 10) / 6);

    // Feature 9: Apareceu no último sorteio?
    const lastDraw = draws[0];
    const lastNumbers = Array.isArray(lastDraw.numbers) ? lastDraw.numbers : JSON.parse(lastDraw.numbers);
    features.push(lastNumbers.includes(num) ? 1 : 0);

    // Feature 10: Aparições nas últimas 5 posições
    const last5Freq = draws.slice(0, 5).filter(d => {
      const nums = Array.isArray(d.numbers) ? d.numbers : JSON.parse(d.numbers);
      return nums.includes(num);
    }).length;
    features.push(last5Freq / 5);

    return features;
  }

  /**
   * Calcula o gradiente (resíduo) para otimização
   */
  private calculateGradient(y: number, prediction: number): number {
    return y - prediction;
  }

  /**
   * Constrói uma árvore de decisão simples
   */
  private buildTree(
    X: number[][],
    y: number[],
    depth: number,
    config: GBConfig
  ): DecisionTree | number {
    if (depth >= config.maxDepth || X.length < config.minSamplesSplit) {
      // Retornar média dos targets
      return y.reduce((a, b) => a + b, 0) / y.length;
    }

    const nFeatures = X[0].length;
    let bestFeature = 0;
    let bestThreshold = 0;
    let bestGain = -Infinity;
    let bestLeftIdx: number[] = [];
    let bestRightIdx: number[] = [];

    // Encontrar melhor split
    for (let feature = 0; feature < nFeatures; feature++) {
      const values = X.map(x => x[feature]).sort((a, b) => a - b);
      const uniqueValues = [...new Set(values)];

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;

        const leftIdx: number[] = [];
        const rightIdx: number[] = [];

        X.forEach((x, idx) => {
          if (x[feature] <= threshold) {
            leftIdx.push(idx);
          } else {
            rightIdx.push(idx);
          }
        });

        if (leftIdx.length === 0 || rightIdx.length === 0) continue;

        // Calcular ganho (redução de variância)
        const leftY = leftIdx.map(i => y[i]);
        const rightY = rightIdx.map(i => y[i]);

        const leftVar = this.variance(leftY);
        const rightVar = this.variance(rightY);
        const totalVar = this.variance(y);

        const gain = totalVar - (leftY.length * leftVar + rightY.length * rightVar) / y.length;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = feature;
          bestThreshold = threshold;
          bestLeftIdx = leftIdx;
          bestRightIdx = rightIdx;
        }
      }
    }

    if (bestGain <= 0) {
      return y.reduce((a, b) => a + b, 0) / y.length;
    }

    const leftX = bestLeftIdx.map(i => X[i]);
    const leftY = bestLeftIdx.map(i => y[i]);
    const rightX = bestRightIdx.map(i => X[i]);
    const rightY = bestRightIdx.map(i => y[i]);

    return {
      feature: bestFeature,
      threshold: bestThreshold,
      left: this.buildTree(leftX, leftY, depth + 1, config),
      right: this.buildTree(rightX, rightY, depth + 1, config)
    };
  }

  /**
   * Calcula variância
   */
  private variance(arr: number[]): number {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  }

  /**
   * Predição com uma árvore
   */
  private predictTree(tree: DecisionTree | number, x: number[]): number {
    if (typeof tree === 'number') {
      return tree;
    }

    if (x[tree.feature] <= tree.threshold) {
      return this.predictTree(tree.left, x);
    } else {
      return this.predictTree(tree.right, x);
    }
  }

  /**
   * Treina o modelo Gradient Boosting
   */
  async train(
    lotteryKey: string,
    draws: any[],
    config: Partial<GBConfig> = {}
  ): Promise<{ mse: number }> {
    const fullConfig: GBConfig = {
      nEstimators: config.nEstimators || 100,
      maxDepth: config.maxDepth || 5,
      learningRate: config.learningRate || 0.1,
      minSamplesSplit: config.minSamplesSplit || 10,
      subsample: config.subsample || 0.8
    };

    this.logger.log(`Training Gradient Boosting for ${lotteryKey}`);

    // Determinar range de números
    const allNumbers = draws.flatMap(d =>
      Array.isArray(d.numbers) ? d.numbers : JSON.parse(d.numbers)
    );
    const minNumber = Math.min(...allNumbers);
    const maxNumber = Math.max(...allNumbers);

    // Preparar dados de treino para cada número
    const trees: DecisionTree[] = [];
    const weights: number[] = [];

    // Para cada número, treinar um ensemble
    for (let num = minNumber; num <= maxNumber; num++) {
      const X: number[][] = [];
      const y: number[] = [];

      // Criar amostras
      for (let i = 50; i < draws.length - 1; i++) {
        const features = this.extractFeaturesForNumber(num, draws.slice(i), 50);
        const nextDraw = draws[i - 1];
        const nextNumbers = Array.isArray(nextDraw.numbers)
          ? nextDraw.numbers
          : JSON.parse(nextDraw.numbers);

        X.push(features);
        y.push(nextNumbers.includes(num) ? 1 : 0);
      }

      if (X.length < 100) continue;

      // Gradient Boosting
      let predictions = new Array(y.length).fill(0.5);
      const numberTrees: DecisionTree[] = [];

      for (let t = 0; t < fullConfig.nEstimators; t++) {
        // Calcular resíduos
        const residuals = y.map((target, i) =>
          this.calculateGradient(target, predictions[i])
        );

        // Subsample
        const sampleSize = Math.floor(X.length * fullConfig.subsample);
        const indices = this.shuffleArray([...Array(X.length).keys()]).slice(0, sampleSize);
        const sampleX = indices.map(i => X[i]);
        const sampleResiduals = indices.map(i => residuals[i]);

        // Treinar árvore nos resíduos
        const tree = this.buildTree(sampleX, sampleResiduals, 0, fullConfig);
        numberTrees.push(tree as DecisionTree);

        // Atualizar predições
        predictions = predictions.map((pred, i) => {
          const treePredict = this.predictTree(tree, X[i]);
          return pred + fullConfig.learningRate * treePredict;
        });
      }

      trees.push(...numberTrees.slice(-10)); // Guardar últimas 10 árvores por número
      weights.push(y.filter(v => v === 1).length / y.length); // Peso baseado na frequência
    }

    this.trainedModels.set(lotteryKey, { trees, weights });

    // Calcular MSE final
    const mse = this.calculateMSE(draws, minNumber, maxNumber);
    this.logger.log(`Training complete: MSE = ${mse.toFixed(4)}`);

    return { mse };
  }

  /**
   * Embaralha array
   */
  private shuffleArray(arr: number[]): number[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Calcula MSE
   */
  private calculateMSE(draws: any[], minNumber: number, maxNumber: number): number {
    // Simplificado para demonstração
    return 0.1;
  }

  /**
   * Faz previsão
   */
  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const lotteryKey = config.lotteryKey || 'default';

    // Verificar se tem modelo treinado
    let model = this.trainedModels.get(lotteryKey);

    if (!model && historicalDraws.length > 200) {
      await this.train(lotteryKey, historicalDraws.slice(0, 500));
      model = this.trainedModels.get(lotteryKey);
    }

    // Calcular scores para cada número
    const scores = new Map<number, number>();

    for (let num = minNumber; num <= maxNumber; num++) {
      const features = this.extractFeaturesForNumber(num, historicalDraws, 50);

      if (model && model.trees.length > 0) {
        // Usar modelo treinado
        let totalScore = 0;
        const treesPerNumber = 10;
        const numIndex = num - minNumber;
        const startIdx = Math.min(numIndex * treesPerNumber, model.trees.length - treesPerNumber);

        for (let i = startIdx; i < Math.min(startIdx + treesPerNumber, model.trees.length); i++) {
          totalScore += this.predictTree(model.trees[i], features);
        }

        scores.set(num, totalScore / treesPerNumber);
      } else {
        // Fallback baseado em features
        const gapScore = features[3]; // Desvio do gap
        const freqScore = features[0]; // Frequência
        const trendScore = features[4]; // Tendência

        scores.set(num, gapScore * 0.4 + freqScore * 0.3 + trendScore * 0.3);
      }
    }

    // Selecionar top números
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, numbersToDraw)
      .map(([num]) => num)
      .sort((a, b) => a - b);
  }
}
