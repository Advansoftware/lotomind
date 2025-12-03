import { Injectable } from '@nestjs/common';

@Injectable()
export class NeuralNetworkStrategy {
  name = 'neural_network';
  displayName = 'Neural Network (Simple)';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const epochs = config.epochs || 50;
    const learningRate = config.learningRate || 0.01;

    // Simplified neural network (single hidden layer)
    // Input: features from recent draws
    // Output: probability for each number

    const inputSize = 10; // Number of features
    const hiddenSize = 20;
    const outputSize = maxNumber - minNumber + 1;

    // Initialize weights randomly
    let weightsInputHidden = this.initializeWeights(inputSize, hiddenSize);
    let weightsHiddenOutput = this.initializeWeights(hiddenSize, outputSize);
    let biasHidden = Array(hiddenSize).fill(0).map(() => Math.random() * 0.1);
    let biasOutput = Array(outputSize).fill(0).map(() => Math.random() * 0.1);

    // Prepare training data
    const trainingData = historicalDraws.slice(0, 100).map((draw, idx) => {
      if (idx === 0) return null; // Skip first draw (no previous data)

      const prevDraw = historicalDraws[idx + 1];
      if (!prevDraw || !prevDraw.numbers || !draw.numbers) return null;

      const input = this.extractFeatures(prevDraw, maxNumber);
      const target = Array(outputSize).fill(0);

      // Mark actual numbers as targets
      const drawNumbers = Array.isArray(draw.numbers) ? draw.numbers : [];
      drawNumbers.forEach((num: number) => {
        if (num >= minNumber && num <= maxNumber) {
          target[num - minNumber] = 1;
        }
      });

      return { input, target };
    }).filter(d => d !== null);

    // Training (simplified backpropagation)
    for (let epoch = 0; epoch < epochs; epoch++) {
      trainingData.forEach(data => {
        if (!data) return;

        // Forward pass
        const hiddenLayer = this.activate(
          this.matrixMultiply([data.input], weightsInputHidden)[0],
          biasHidden
        );

        const outputLayer = this.activate(
          this.matrixMultiply([hiddenLayer], weightsHiddenOutput)[0],
          biasOutput
        );

        // Calculate error
        const outputError = data.target.map((t, i) => t - outputLayer[i]);

        // Backward pass (simplified - just update based on error)
        for (let i = 0; i < outputSize; i++) {
          for (let j = 0; j < hiddenSize; j++) {
            weightsHiddenOutput[j][i] += learningRate * outputError[i] * hiddenLayer[j];
          }
          biasOutput[i] += learningRate * outputError[i];
        }
      });
    }

    // Prediction
    if (!historicalDraws[0] || !historicalDraws[0].numbers) {
      // Return random numbers if no valid data
      return this.generateRandomNumbers(numbersToDraw, minNumber, maxNumber);
    }

    const recentFeatures = this.extractFeatures(historicalDraws[0], maxNumber);
    const hiddenLayer = this.activate(
      this.matrixMultiply([recentFeatures], weightsInputHidden)[0],
      biasHidden
    );
    const outputLayer = this.activate(
      this.matrixMultiply([hiddenLayer], weightsHiddenOutput)[0],
      biasOutput
    );

    // Select numbers with highest probabilities
    const numberProbabilities = outputLayer.map((prob, idx) => ({
      number: idx + minNumber,
      probability: prob,
    }));

    const selected = numberProbabilities
      .sort((a, b) => b.probability - a.probability)
      .slice(0, numbersToDraw)
      .map(item => item.number);

    return selected.sort((a, b) => a - b);
  }

  private initializeWeights(rows: number, cols: number): number[][] {
    const weights: number[][] = [];
    for (let i = 0; i < rows; i++) {
      weights[i] = [];
      for (let j = 0; j < cols; j++) {
        weights[i][j] = (Math.random() - 0.5) * 0.5; // Xavier initialization
      }
    }
    return weights;
  }

  private matrixMultiply(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < a[0].length; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private activate(values: number[], bias: number[]): number[] {
    // Sigmoid activation
    return values.map((val, idx) => {
      const z = val + bias[idx];
      return 1 / (1 + Math.exp(-z));
    });
  }

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

  private extractFeatures(draw: any, maxNumber: number): number[] {
    const features = [];
    const numbers = Array.isArray(draw.numbers) ? draw.numbers : [];
    const len = numbers.length || 1;

    // Feature 1: Average number (normalized)
    const avg = numbers.length > 0 ? numbers.reduce((a: number, b: number) => a + b, 0) / len : 30;
    features.push(avg / maxNumber);

    // Feature 2: Sum (normalized)
    const sum = numbers.reduce((a: number, b: number) => a + b, 0);
    features.push(sum / (maxNumber * 6));

    // Feature 3: Odd count (normalized)
    const oddCount = numbers.filter((n: number) => n % 2 !== 0).length;
    features.push(oddCount / 6);

    // Feature 4: Even count (normalized)
    features.push((6 - oddCount) / 6);

    // Feature 5: Min number (normalized)
    const min = numbers.length > 0 ? Math.min(...numbers) : 1;
    features.push(min / maxNumber);

    // Feature 6: Max number (normalized)
    const max = numbers.length > 0 ? Math.max(...numbers) : maxNumber;
    features.push(max / maxNumber);

    // Feature 7: Range (normalized)
    features.push((max - min) / maxNumber);

    // Feature 8: Consecutive count (normalized)
    const sorted = [...numbers].sort((a: number, b: number) => a - b);
    let consecutive = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] === 1) consecutive++;
    }
    features.push(consecutive / 5);

    // Feature 9: Low numbers count (1-30)
    const lowCount = numbers.filter((n: number) => n <= 30).length;
    features.push(lowCount / 6);

    // Feature 10: High numbers count (31-60)
    features.push((6 - lowCount) / 6);

    return features;
  }
}
