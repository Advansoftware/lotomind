import { Injectable } from '@nestjs/common';

@Injectable()
export class KMeansClusteringStrategy {
  name = 'kmeans_clustering';
  displayName = 'K-Means Clustering';

  async predict(historicalDraws: any[], config: any): Promise<number[]> {
    const numbersToDraw = config.numbersToDraw || 6;
    const maxNumber = config.maxNumber || 60;
    const minNumber = config.minNumber || 1;
    const k = config.clusters || 5;
    const maxIterations = config.maxIterations || 20;

    // Prepare data points (each draw as a feature vector)
    const dataPoints = historicalDraws.slice(0, 100).map(draw => {
      const features = [];

      // Feature 1-6: The actual numbers (normalized)
      draw.numbers.forEach((num: number) => {
        features.push(num / maxNumber);
      });

      // Feature 7: Sum of numbers (normalized)
      const sum = draw.numbers.reduce((a: number, b: number) => a + b, 0);
      features.push(sum / (maxNumber * numbersToDraw));

      // Feature 8: Odd count
      const oddCount = draw.numbers.filter((n: number) => n % 2 !== 0).length;
      features.push(oddCount / numbersToDraw);

      // Feature 9: Average number
      features.push((sum / numbersToDraw) / maxNumber);

      return features;
    });

    // Initialize centroids randomly
    let centroids: number[][] = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * dataPoints.length);
      centroids.push([...dataPoints[randomIndex]]);
    }

    // K-Means iterations
    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign points to nearest centroid
      const clusters: number[][][] = Array(k).fill(null).map(() => []);

      dataPoints.forEach(point => {
        let minDist = Infinity;
        let closestCluster = 0;

        centroids.forEach((centroid, idx) => {
          const dist = this.euclideanDistance(point, centroid);
          if (dist < minDist) {
            minDist = dist;
            closestCluster = idx;
          }
        });

        clusters[closestCluster].push(point);
      });

      // Update centroids
      const newCentroids: number[][] = [];
      clusters.forEach(cluster => {
        if (cluster.length === 0) {
          newCentroids.push(centroids[0]); // Keep old centroid if cluster is empty
          return;
        }

        const newCentroid = Array(cluster[0].length).fill(0);
        cluster.forEach(point => {
          point.forEach((val, idx) => {
            newCentroid[idx] += val;
          });
        });

        newCentroid.forEach((val, idx) => {
          newCentroid[idx] = val / cluster.length;
        });

        newCentroids.push(newCentroid);
      });

      centroids = newCentroids;
    }

    // Find the cluster closest to recent draws
    const recentDrawFeatures = this.extractFeatures(
      historicalDraws[0],
      maxNumber,
      numbersToDraw
    );

    let closestClusterIdx = 0;
    let minDist = Infinity;

    centroids.forEach((centroid, idx) => {
      const dist = this.euclideanDistance(recentDrawFeatures, centroid);
      if (dist < minDist) {
        minDist = dist;
        closestClusterIdx = idx;
      }
    });

    // Generate prediction based on closest cluster centroid
    const targetCentroid = centroids[closestClusterIdx];

    // Denormalize first 6 features (the numbers)
    const predictedNumbers = targetCentroid
      .slice(0, numbersToDraw)
      .map(val => Math.round(val * maxNumber))
      .filter(num => num >= minNumber && num <= maxNumber);

    // If we don't have enough numbers, fill with frequency-based selection
    if (predictedNumbers.length < numbersToDraw) {
      const frequency = new Map<number, number>();
      historicalDraws.slice(0, 50).forEach(draw => {
        draw.numbers.forEach((num: number) => {
          frequency.set(num, (frequency.get(num) || 0) + 1);
        });
      });

      const additional = Array.from(frequency.entries())
        .filter(([num]) => !predictedNumbers.includes(num))
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => num);

      predictedNumbers.push(...additional.slice(0, numbersToDraw - predictedNumbers.length));
    }

    return predictedNumbers.slice(0, numbersToDraw).sort((a, b) => a - b);
  }

  private euclideanDistance(point1: number[], point2: number[]): number {
    let sum = 0;
    for (let i = 0; i < Math.min(point1.length, point2.length); i++) {
      sum += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(sum);
  }

  private extractFeatures(draw: any, maxNumber: number, numbersToDraw: number): number[] {
    const features = [];

    draw.numbers.forEach((num: number) => {
      features.push(num / maxNumber);
    });

    const sum = draw.numbers.reduce((a: number, b: number) => a + b, 0);
    features.push(sum / (maxNumber * numbersToDraw));

    const oddCount = draw.numbers.filter((n: number) => n % 2 !== 0).length;
    features.push(oddCount / numbersToDraw);

    features.push((sum / numbersToDraw) / maxNumber);

    return features;
  }
}
