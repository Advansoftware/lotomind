# 🚀 LotoMind Analytics - Guia de Acesso Rápido

## 📍 URLs de Acesso

### Frontend
- **URL**: http://localhost
- **Porta**: 80

### API Gateway
- **URL**: http://localhost:3000
- **Swagger**: http://localhost:3000/api/docs
- **Health**: http://localhost:3000/health

### Microserviços
- **Lottery Service**: http://localhost:3001/api/docs
- **Prediction Service**: http://localhost:3002/api/docs
- **Analytics Service**: http://localhost:3003/api/docs

### Infraestrutura
- **RabbitMQ Management**: http://localhost:15672
  - User: `lotomind`
  - Password: `lotomind123`

---

## 🔐 Credenciais Padrão

### Banco de Dados (MySQL)
- **Host**: localhost
- **Port**: 3306
- **Database**: lotomind
- **User**: lotomind
- **Password**: lotomind123

### RabbitMQ
- **Host**: localhost
- **Port**: 5672 (AMQP), 15672 (Management)
- **User**: lotomind
- **Password**: lotomind123

### Redis
- **Host**: localhost
- **Port**: 6379
- **Password**: (sem senha)

---

## 👤 Primeiro Acesso

### Não há usuário padrão criado!

Você precisa **registrar um novo usuário** na primeira vez:

#### Opção 1: Via API (Recomendado)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@lotomind.com",
    "password": "admin123"
  }'
```

**Resposta esperada:**
```json
{
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@lotomind.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2025-12-02T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Opção 2: Via Frontend
1. Acesse http://localhost
2. Clique em "Registrar" ou "Sign Up"
3. Preencha os dados:
   - Nome: Admin
   - Email: admin@lotomind.com
   - Senha: admin123
4. Clique em "Registrar"

---

## 🧪 Testando o Sistema

### 1. Verificar Saúde dos Serviços
```bash
# API Gateway
curl http://localhost:3000/health

# Lottery Service
curl http://localhost:3001/lottery/health

# Prediction Service
curl http://localhost:3002/predictions/health

# Analytics Service
curl http://localhost:3003/analytics/health
```

### 2. Sincronizar Dados Históricos
```bash
# Sincronizar últimos 50 sorteios da Mega-Sena
curl -X POST http://localhost:3000/api/lottery/sync \
  -H "Content-Type: application/json" \
  -d '{
    "lotteryType": "megasena",
    "lastN": 50
  }'
```

### 3. Gerar Primeira Predição
```bash
# Gerar predição (auto-seleciona melhor estratégia)
curl -X POST http://localhost:3000/api/predictions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "lotteryType": "megasena"
  }'
```

### 4. Ver Dashboard
```bash
curl http://localhost:3000/api/analytics/dashboard?lotteryType=megasena
```

---

## 🔍 Verificar Status dos Containers

```bash
# Ver todos os containers
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f api-gateway
docker compose logs -f lottery-service
docker compose logs -f prediction-service
```

---

## 🐛 Troubleshooting

### Container não está rodando?
```bash
# Reiniciar um serviço específico
docker compose restart api-gateway

# Reiniciar todos
docker compose restart

# Ver logs de erro
docker compose logs --tail=100 api-gateway
```

### Porta já em uso?
```bash
# Verificar o que está usando a porta
sudo lsof -i :3000
sudo lsof -i :80

# Parar o serviço conflitante ou mudar a porta no docker-compose.yml
```

### Banco de dados não conecta?
```bash
# Verificar se MySQL está healthy
docker compose ps mysql

# Conectar manualmente
docker exec -it lotomind-mysql mysql -ulotomind -plotomind123 lotomind

# Ver logs do MySQL
docker compose logs mysql
```

---

## 📊 Próximos Passos

1. ✅ Registrar primeiro usuário
2. ✅ Sincronizar dados históricos
3. ✅ Gerar primeira predição
4. ✅ Executar backtest
5. ✅ Explorar Swagger docs
6. ✅ Configurar notificações push (opcional)

---

## 🎯 Comandos Úteis

```bash
# Parar todos os serviços
docker compose down

# Parar e remover volumes (limpa banco de dados)
docker compose down -v

# Rebuild e restart
docker compose up -d --build

# Ver uso de recursos
docker stats

# Limpar tudo
docker compose down -v --remove-orphans
docker system prune -a
```

---

**Acesse agora**: http://localhost

**Swagger Docs**: http://localhost:3000/api/docs
