# 🎰 LotoMind Analytics - Sistema Completo de Predição de Loterias

[![GitHub](https://img.shields.io/badge/GitHub-Advansoftware%2Flotomind-blue)](https://github.com/Advansoftware/lotomind)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](PRODUCTION_READY.md)
### ✨ Características Principais

- 🧠 **20 Estratégias de Predição** (Estatísticas, ML, Padrões, Matemática, Híbridas)
- 🔐 **Autenticação JWT** com gerenciamento de usuários
- ⚡ **WebSocket** para atualizações em tempo real
- 📊 **Analytics Dashboard** com métricas detalhadas
- 📄 **Exportação PDF** de relatórios
- 🔔 **Push Notifications** (Web Push)
- 📚 **Swagger/OpenAPI** em todos os serviços
- 🐳 **Docker Compose** para deploy fácil
- 🎯 **Dados Reais** da API oficial da Caixa

---

## 🚀 Quick Start

```bash
# Clone o repositório
git clone git@github.com:Advansoftware/lotomind.git
cd lotomind

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie todos os serviços
docker compose up -d

# Aguarde ~60s para os serviços iniciarem
docker compose ps

# Sincronize dados históricos
curl -X POST http://localhost:3000/api/lottery/sync-all

# Acesse a aplicação
open http://localhost
```

---

## 📊 Arquitetura

### Microserviços

- **API Gateway** (Port 3000) - Proxy, Auth, WebSocket
- **Lottery Service** (Port 3001) - Ingestão de dados
- **Prediction Service** (Port 3002) - 20 estratégias + backtest
- **Analytics Service** (Port 3003) - Métricas e relatórios
- **Scheduler Service** (Port 3004) - Automação (cron jobs)
- **Frontend** (Port 80) - Next.js 14 + Material-UI

### Infraestrutura

- **MySQL 8.0** - Banco de dados principal
- **Redis 7** - Cache
- **RabbitMQ 3** - Message broker

---

## 🧠 20 Estratégias de Predição

### Estatísticas (5)
1. Frequency Analysis
2. Delay/Latency
3. Hot & Cold
4. Moving Average
5. Standard Deviation

### Padrões (4)
6. Pattern Repetition
7. Sum Range
8. Odd-Even Balance
9. Gap Analysis

### Matemática (4)
10. Fibonacci
11. Markov Chain
12. Monte Carlo
13. Bayesian

### Machine Learning (3)
14. Neural Network
15. Random Forest
16. K-Means Clustering

### Híbridas (4)
17. Ensemble Voting
18. Genetic Algorithm
19. Cycle Detection
20. Adaptive Hybrid

---

## 📚 Documentação

### Swagger/OpenAPI

- API Gateway: http://localhost:3000/api/docs
- Lottery Service: http://localhost:3001/api/docs
- Prediction Service: http://localhost:3002/api/docs
- Analytics Service: http://localhost:3003/api/docs

### Guias

- [Quick Start](QUICKSTART.md)
- [Deployment](DEPLOY.md)
- [Production Ready](PRODUCTION_READY.md)
- [Strategies](services/prediction-service/STRATEGIES.md)

---

## 🔧 Uso

### Gerar Predição

```bash
curl -X POST http://localhost:3000/api/predictions/generate \
  -H "Content-Type: application/json" \
  -d '{"lotteryType": "megasena"}'
```

### Executar Backtest

```bash
curl -X POST http://localhost:3000/api/predictions/backtest \
  -H "Content-Type: application/json" \
  -d '{"lotteryType": "megasena", "testSize": 100}'
```

### Autenticação

```bash
# Registrar
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "User", "email": "user@example.com", "password": "pass123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass123"}'
```

---

## 🛠️ Tecnologias

### Backend
- NestJS 10
- TypeScript
- TypeORM
- MySQL 8
- Redis 7
- RabbitMQ 3
- Socket.IO
- JWT + Bcrypt
- Web Push

### Frontend
- Next.js 14
- TypeScript
- Material-UI
- PWA

### DevOps
- Docker & Docker Compose
- Swagger/OpenAPI
- Health Checks

---

## 📈 Estatísticas do Projeto

- **Arquivos**: 150+
- **Linhas de Código**: ~20,000+
- **Estratégias**: 20/20 (100%)
- **Endpoints API**: 50+
- **Tabelas DB**: 10+
- **Microserviços**: 5

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 License

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- **Advan Software** - [GitHub](https://github.com/Advansoftware)

---

## 🙏 Agradecimentos

- API oficial da Caixa Econômica Federal
- Comunidade NestJS
- Comunidade Next.js

---

**Status**: ✅ Production Ready | **Versão**: 1.0.0 | **Data**: 02/12/2025
