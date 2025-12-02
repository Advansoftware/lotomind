# LotoMind Analytics - Quick Start Guide

## Prerequisites
- Docker & Docker Compose installed
- 4GB RAM minimum
- Ports 80, 3000, 3306, 5672, 6379, 15672 available

## Installation

### 1. Start all services
```bash
docker-compose up -d
```

### 2. Check service health
```bash
docker-compose ps
```

All services should show "healthy" status after 30-60 seconds.

### 3. Access the application
- **Frontend**: http://localhost
- **API Gateway**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## First Run

The system will automatically:
1. Create database schema
2. Fetch historical lottery data from 2015
3. Run initial backtest on all strategies
4. Generate predictions for next draws

Monitor progress:
```bash
docker-compose logs -f scheduler-service
```

## Manual Operations

### Sync lottery data
```bash
curl -X POST http://localhost:3000/api/lottery/sync-all
```

### Generate predictions
```bash
curl -X POST http://localhost:3000/api/predictions/generate \
  -H "Content-Type: application/json" \
  -d '{"lotteryType": "megasena"}'
```

### View analytics
```bash
curl http://localhost:3000/api/analytics/dashboard
```

## Development

### Run service locally
```bash
cd services/lottery-service
npm install
npm run start:dev
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f prediction-service
```

### Rebuild service
```bash
docker-compose up -d --build prediction-service
```

## Troubleshooting

### Services not starting
```bash
docker-compose down
docker-compose up -d
```

### Database connection issues
```bash
docker-compose restart mysql
docker-compose logs mysql
```

### Clear all data and restart
```bash
docker-compose down -v
docker-compose up -d
```

## Next Steps

1. Review the generated predictions at http://localhost
2. Check strategy performance in the dashboard
3. Customize strategies in `services/prediction-service/src/strategies/`
4. Add more lottery types in the database

For full documentation, see README.md
