# 🎰 LotoMind Analytics

**Progressive Web App de Inteligência para Loterias com Backtesting em Tempo Real**

Sistema completo de análise e predição para loterias brasileiras (Mega-Sena, Quina, Lotofácil, etc.) com arquitetura de microserviços, 20+ estratégias de predição e dashboard visual estilo trading/analytics.

---

## 🏗️ Arquitetura

### Microserviços

```
┌─────────────────┐
│    Frontend     │  Next.js 14 + Material-UI + PWA
│   (Port 80)     │
└────────┬────────┘
         │
┌────────▼────────┐
│  API Gateway    │  NestJS - Roteamento e Rate Limiting
│   (Port 3000)   │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬──────────┐
    │         │         │          │
┌───▼──┐  ┌──▼───┐  ┌──▼────┐  ┌──▼────────┐
│Lottery│  │Pred  │  │Analyt │  │ Scheduler │
│Service│  │Service│  │Service│  │  Service  │
│ 3001  │  │ 3002 │  │ 3003  │  │   3004    │
└───┬───┘  └──┬───┘  └──┬────┘  └──┬────────┘
    │         │         │          │
    └─────────┴─────────┴──────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐      ┌──────▼──────┐
│ MySQL  │      │  RabbitMQ   │
│  3306  │      │  5672/15672 │
└────────┘      └─────────────┘
    │
┌───▼────┐
│ Redis  │
│  6379  │
└────────┘
```

### Componentes

- **Frontend**: Next.js 14 com Material-UI, PWA, dashboard visual
- **API Gateway**: Proxy reverso, CORS, rate limiting
- **Lottery Service**: Ingestão de dados, gerenciamento de sorteios
- **Prediction Service**: 20+ estratégias de predição, backtesting
- **Analytics Service**: Métricas, estatísticas, performance
- **Scheduler Service**: Cron jobs automáticos
- **MySQL**: Banco de dados principal com schema rico em contexto
- **Redis**: Cache de alta performance
- **RabbitMQ**: Mensageria entre microserviços

---

## 🎯 Funcionalidades

### ✅ Predições Inteligentes
- **20+ Estratégias** de predição:
  - **Estatísticas**: Frequência, Atraso, Hot/Cold, Média Móvel, Desvio Padrão
  - **Padrões**: Repetição, Ciclos, Gaps, Soma, Paridade
  - **Machine Learning**: Redes Neurais (LSTM), Random Forest, K-Means
  - **Matemática**: Fibonacci, Markov Chain, Monte Carlo, Bayesian
  - **Híbridas**: Ensemble Voting, Adaptive, Algoritmo Genético

### 📊 Backtesting Automático
- Testa todas as estratégias em dados históricos
- Seleciona automaticamente a melhor estratégia
- Métricas: hit rate, accuracy, precision, recall, F1-score
- Performance tracking em tempo real

### 🎨 Dashboard Visual (Estilo Predicd)
- **Bolas Verdes**: Números acertados
- **Bolas Cinzas**: Números não acertados
- Placar tipo futebol: "4 Acertos (Quadra)"
- Cards de predição com confiança
- Gráficos de performance

### ⚙️ Automação Completa
- **Cron Jobs Diários**:
  - 21:00 - Busca novos resultados
  - 21:30 - Confere predições
  - 22:00 - Gera novas predições
- Sem intervenção manual necessária
- Dados históricos desde 2015

### 📈 Contexto Máximo
O banco de dados captura:
- **Temporal**: Dia da semana, mês, trimestre, feriados
- **Numérico**: Soma, média, desvio, paridade, primos
- **Padrões**: Sequências, repetições, distribuição por década
- **Premiação**: Valores, ganhadores, acumulação
- **Frequência**: Aparições, atrasos, pares comuns

---

## 🚀 Quick Start

### Pré-requisitos
- Docker & Docker Compose
- Node.js 18+ (para desenvolvimento local)
- 4GB RAM mínimo

### Instalação

```bash
# 1. Clone o repositório
cd /home/beeleads/git/lotomind

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env se necessário

# 3. Inicie todos os serviços
docker-compose up -d

# 4. Aguarde os serviços iniciarem (30-60 segundos)
docker-compose ps

# 5. Acesse a aplicação
# Frontend: http://localhost
# API Gateway: http://localhost:3000
# RabbitMQ Management: http://localhost:15672 (guest/guest)
```

### Primeira Execução

Na primeira execução, o sistema irá:
1. Criar o banco de dados e tabelas
2. Buscar dados históricos desde 2015 (pode levar alguns minutos)
3. Executar backtest inicial em todas as estratégias
4. Gerar predições para os próximos sorteios

Acompanhe o progresso:
```bash
docker-compose logs -f scheduler-service
```

---

## 📁 Estrutura do Projeto

```
lotomind/
├── docker-compose.yml          # Orquestração de containers
├── .env.example                # Template de variáveis de ambiente
├── README.md                   # Este arquivo
│
├── database/
│   └── init.sql                # Schema MySQL completo
│
├── services/
│   ├── api-gateway/            # Gateway de API
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── lottery-service/        # Serviço de sorteios
│   │   ├── src/
│   │   │   ├── lottery/
│   │   │   │   ├── entities/
│   │   │   │   ├── dto/
│   │   │   │   ├── lottery.service.ts
│   │   │   │   └── lottery.controller.ts
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── prediction-service/     # Serviço de predições
│   │   ├── src/
│   │   │   ├── prediction/
│   │   │   │   ├── strategies/    # 20+ estratégias
│   │   │   │   ├── backtest.service.ts
│   │   │   │   ├── strategy-selector.service.ts
│   │   │   │   └── prediction.controller.ts
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── analytics-service/      # Serviço de analytics
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── scheduler-service/      # Serviço de agendamento
│       ├── src/
│       │   ├── jobs/
│       │   └── scheduler.service.ts
│       ├── Dockerfile
│       └── package.json
│
├── frontend/                   # Frontend Next.js
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── LotteryCard.tsx
│   │   ├── PredictionCard.tsx
│   │   └── DashboardMetrics.tsx
│   ├── lib/
│   ├── theme/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── next.config.js
│
└── shared/                     # Código compartilhado
    ├── types/
    └── constants/
```

---

## 🔧 Desenvolvimento

### Executar serviço individual

```bash
# Lottery Service
cd services/lottery-service
npm install
npm run start:dev

# Prediction Service
cd services/prediction-service
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Logs

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f prediction-service

# Últimas 100 linhas
docker-compose logs --tail=100 lottery-service
```

### Rebuild

```bash
# Rebuild todos os serviços
docker-compose up -d --build

# Rebuild serviço específico
docker-compose up -d --build prediction-service
```

---

## 📊 API Endpoints

### Lottery Service (Port 3001)
```
GET    /api/lottery/draws              # Lista sorteios
GET    /api/lottery/draws/:id          # Sorteio específico
POST   /api/lottery/draws/sync         # Sincroniza da API
GET    /api/lottery/types              # Tipos de loteria
```

### Prediction Service (Port 3002)
```
POST   /api/predictions/generate       # Gera predição
GET    /api/predictions/:concurso      # Predição específica
POST   /api/predictions/:id/check      # Confere predição
GET    /api/predictions/strategies     # Lista estratégias
GET    /api/predictions/best-strategy  # Melhor estratégia
POST   /api/predictions/backtest       # Executa backtest
```

### Analytics Service (Port 3003)
```
GET    /api/analytics/dashboard        # Métricas do dashboard
GET    /api/analytics/strategy-performance  # Performance de estratégias
GET    /api/analytics/hot-cold-numbers # Números quentes/frios
GET    /api/analytics/trends           # Tendências
```

---

## 🎲 Estratégias de Predição

### Estatísticas (5)
1. **Frequency Analysis** - Números mais frequentes
2. **Delay/Latency** - Números "atrasados"
3. **Hot & Cold** - Balanceamento quente/frio
4. **Moving Average** - Média móvel de frequências
5. **Standard Deviation** - Padrões de desvio

### Reconhecimento de Padrões (5)
6. **Pattern Repetition** - Combinações recorrentes
7. **Cycle Detection** - Padrões cíclicos (Fourier)
8. **Gap Analysis** - Análise de intervalos
9. **Sum Range** - Faixa ótima de soma
10. **Odd-Even Balance** - Distribuição par/ímpar

### Machine Learning (3)
11. **Neural Network (LSTM)** - Rede neural recorrente
12. **Random Forest** - Floresta de decisão
13. **K-Means Clustering** - Agrupamento de padrões

### Matemática Avançada (4)
14. **Fibonacci** - Sequência de Fibonacci
15. **Markov Chain** - Cadeia de Markov
16. **Monte Carlo** - Simulação estocástica
17. **Bayesian Inference** - Inferência bayesiana

### Híbridas (3)
18. **Ensemble Voting** - Votação ponderada
19. **Adaptive Hybrid** - Seleção dinâmica
20. **Genetic Algorithm** - Evolução genética

---

## 🔐 Segurança

- Rate limiting no API Gateway
- Validação de dados em todos os endpoints
- Sanitização de inputs
- CORS configurado
- Logs de auditoria
- Health checks em todos os serviços

---

## 📈 Performance

- **Cache Redis** para queries frequentes
- **Índices MySQL** otimizados
- **Connection pooling** em todos os serviços
- **Lazy loading** no frontend
- **Code splitting** automático (Next.js)
- **PWA** com service worker para offline

---

## 🧪 Testes

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## 📝 Licença

MIT License - Sinta-se livre para usar e modificar

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/lotomind/issues)
- **Documentação**: Este README
- **API Docs**: http://localhost:3000/api/docs (Swagger)

---

## 🎯 Roadmap

- [ ] Autenticação de usuários
- [ ] Múltiplas predições simultâneas
- [ ] Exportação de relatórios PDF
- [ ] Notificações push (PWA)
- [ ] API pública com rate limiting
- [ ] Dashboard administrativo
- [ ] Suporte a mais loterias internacionais
- [ ] Mobile app (React Native)

---

**Desenvolvido com ❤️ usando NestJS, Next.js, MySQL e Docker**
