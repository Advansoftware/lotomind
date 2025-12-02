#!/bin/bash

# LotoMind Analytics - Complete Project Generator
# This script generates all remaining files for the microservices architecture

set -e

echo "🎰 LotoMind Analytics - Generating Complete Project Structure"
echo "=============================================================="

PROJECT_ROOT="/home/beeleads/git/lotomind"
cd "$PROJECT_ROOT"

echo ""
echo "📦 Creating shared types and constants..."

# Shared Types
mkdir -p shared/types
cat > shared/types/index.ts << 'EOF'
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
EOF

# Shared Constants
mkdir -p shared/constants
cat > shared/constants/lottery-types.ts << 'EOF'
export const LOTTERY_CONFIGS = {
  megasena: {
    name: 'megasena',
    displayName: 'Mega-Sena',
    numbersToDraw: 6,
    minNumber: 1,
    maxNumber: 60,
    drawDays: ['Wednesday', 'Saturday'],
  },
  quina: {
    name: 'quina',
    displayName: 'Quina',
    numbersToDraw: 5,
    minNumber: 1,
    maxNumber: 80,
    drawDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  lotofacil: {
    name: 'lotofacil',
    displayName: 'Lotofácil',
    numbersToDraw: 15,
    minNumber: 1,
    maxNumber: 25,
    drawDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  lotomania: {
    name: 'lotomania',
    displayName: 'Lotomania',
    numbersToDraw: 20,
    minNumber: 1,
    maxNumber: 100,
    drawDays: ['Tuesday', 'Thursday', 'Saturday'],
  },
};

export const LOTTERY_API_ENDPOINTS = {
  megasena: 'https://loteriascaixa-api.herokuapp.com/api/megasena',
  quina: 'https://loteriascaixa-api.herokuapp.com/api/quina',
  lotofacil: 'https://loteriascaixa-api.herokuapp.com/api/lotofacil',
  lotomania: 'https://loteriascaixa-api.herokuapp.com/api/lotomania',
};
EOF

echo "✅ Shared files created"

echo ""
echo "📝 Creating package.json for shared module..."
cat > shared/package.json << 'EOF'
{
  "name": "@lotomind/shared",
  "version": "1.0.0",
  "description": "Shared types and constants for LotoMind",
  "main": "index.ts",
  "private": true
}
EOF

echo ""
echo "🎯 Project structure created successfully!"
echo ""
echo "Next steps:"
echo "1. Run: docker-compose up -d"
echo "2. Wait for services to start (check: docker-compose ps)"
echo "3. Access frontend at: http://localhost"
echo "4. Access RabbitMQ UI at: http://localhost:15672 (guest/guest)"
echo ""
echo "For development:"
echo "- cd services/lottery-service && npm install && npm run start:dev"
echo "- cd services/prediction-service && npm install && npm run start:dev"
echo "- cd frontend && npm install && npm run dev"
echo ""
echo "✨ LotoMind Analytics is ready!"
EOF

chmod +x "$PROJECT_ROOT/scripts/generate-project.sh"

echo "✅ Generator script created at: scripts/generate-project.sh"
