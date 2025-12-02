export interface LotteryType {
  id: number;
  name: string;
  displayName: string;
  numbersToDraw: number;
  minNumber: number;
  maxNumber: number;
  drawDays: string[];
  active: boolean;
}

export interface Draw {
  id: number;
  lotteryTypeId: number;
  concurso: number;
  drawDate: Date;
  numbers: number[];
  // Temporal
  dayOfWeek: number;
  month: number;
  year: number;
  // Statistics
  sumOfNumbers: number;
  averageNumber: number;
  oddCount: number;
  evenCount: number;
  // Prize
  accumulated: boolean;
  accumulatedValue?: number;
  estimatedPrize?: number;
}

export interface Prediction {
  id: number;
  lotteryTypeId: number;
  strategyId: number;
  targetConcurso: number;
  predictedNumbers: number[];
  confidenceScore: number;
  status: 'pending' | 'checked' | 'expired';
  hits?: number;
  matchedNumbers?: number[];
}

export interface Strategy {
  id: number;
  name: string;
  displayName: string;
  category: 'statistical' | 'pattern' | 'ml' | 'mathematical' | 'hybrid';
  description: string;
  active: boolean;
}

export interface BacktestResult {
  id: number;
  lotteryTypeId: number;
  strategyId: number;
  testDate: Date;
  drawsAnalyzed: number;
  hitRate: number;
  accuracy: number;
  avgHits: number;
}
