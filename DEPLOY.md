# 🚀 LotoMind Analytics - Deployment Guide

## Quick Deploy (Production)

### Prerequisites
- Docker 20.10+ and Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 10GB disk space
- Ports available: 80, 3000, 3306, 5672, 6379, 15672

### Step 1: Initial Setup

```bash
cd /home/beeleads/git/lotomind

# Create environment file
cp .env.example .env

# Optional: Edit .env for production settings
nano .env
```

### Step 2: Start All Services

```bash
# Build and start all containers
docker-compose up -d --build

# This will start:
# - MySQL (database)
# - Redis (cache)
# - RabbitMQ (message broker)
# - API Gateway
# - Lottery Service
# - Prediction Service
# - Analytics Service
# - Scheduler Service
# - Frontend (Next.js)
```

### Step 3: Verify Services

```bash
# Check all services are running
docker-compose ps

# Expected output: All services should show "healthy" status
# Wait 30-60 seconds for all health checks to pass

# View logs
docker-compose logs -f
```

### Step 4: Access the Application

- **Frontend**: http://localhost
- **API**: http://localhost:3000/api
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

### Step 5: Initial Data Load

The system will automatically:
1. Create database schema (via init.sql)
2. Start cron jobs
3. At 21:00 daily, fetch historical lottery data from 2015
4. Generate predictions using available strategies

To manually trigger data sync:
```bash
curl -X POST http://localhost:3000/api/lottery/sync-all
```

---

## Development Setup

### Running Services Locally

#### 1. Start Infrastructure Only
```bash
# Start only MySQL, Redis, RabbitMQ
docker-compose up -d mysql redis rabbitmq

# Wait for services to be ready
docker-compose logs -f mysql
```

#### 2. Run Backend Services Locally

```bash
# Terminal 1 - Lottery Service
cd services/lottery-service
npm install
npm run start:dev

# Terminal 2 - Prediction Service
cd services/prediction-service
npm install
npm run start:dev

# Terminal 3 - Analytics Service
cd services/analytics-service
npm install
npm run start:dev

# Terminal 4 - Scheduler Service
cd services/scheduler-service
npm install
npm run start:dev

# Terminal 5 - API Gateway
cd services/api-gateway
npm install
npm run start:dev
```

#### 3. Run Frontend Locally

```bash
cd frontend
npm install
npm run dev

# Access at http://localhost:3000
```

---

## Environment Variables

### Production Settings (.env)

```bash
# Database
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_DATABASE=lotomind
MYSQL_USER=lotomind
MYSQL_PASSWORD=your-secure-password

# RabbitMQ
RABBITMQ_USER=lotomind
RABBITMQ_PASSWORD=your-secure-password

# Application
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key

# External APIs (optional)
WEATHER_API_KEY=your-weather-api-key
HOLIDAY_API_KEY=your-holiday-api-key

# Frontend
NEXT_PUBLIC_API_URL=http://your-domain.com:3000
```

---

## Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f lottery-service
docker-compose logs -f prediction-service
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 scheduler-service

# Follow logs with timestamps
docker-compose logs -f -t
```

### Health Checks

```bash
# API Gateway
curl http://localhost:3000/api/health

# Lottery Service
curl http://localhost:3001/lottery/health

# Prediction Service
curl http://localhost:3002/predictions/health

# Analytics Service
curl http://localhost:3003/analytics/health

# Scheduler Service
curl http://localhost:3004/health
```

### Database Access

```bash
# Connect to MySQL
docker exec -it lotomind-mysql mysql -u lotomind -p

# Run queries
USE lotomind;
SELECT COUNT(*) FROM draws;
SELECT * FROM lottery_types;
SELECT * FROM strategies;
```

### Redis Access

```bash
# Connect to Redis
docker exec -it lotomind-redis redis-cli

# Check keys
KEYS *
GET some_key
```

### RabbitMQ Management

Access http://localhost:15672
- Username: guest
- Password: guest

Monitor:
- Queues and messages
- Connections
- Channels
- Exchanges

---

## Troubleshooting

### Services Won't Start

```bash
# Check Docker status
docker --version
docker-compose --version

# Check available resources
docker system df

# Clean up
docker system prune -a

# Restart Docker daemon
sudo systemctl restart docker
```

### Database Connection Issues

```bash
# Check MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql

# Verify connection
docker exec -it lotomind-mysql mysqladmin ping -h localhost -u root -p
```

### Port Conflicts

```bash
# Check what's using ports
sudo lsof -i :80
sudo lsof -i :3000
sudo lsof -i :3306

# Stop conflicting services
sudo systemctl stop apache2  # If using port 80
sudo systemctl stop mysql    # If using port 3306
```

### Out of Memory

```bash
# Check Docker memory
docker stats

# Increase Docker memory limit
# Edit: /etc/docker/daemon.json
{
  "default-ulimits": {
    "memlock": {
      "Hard": -1,
      "Name": "memlock",
      "Soft": -1
    }
  }
}

# Restart Docker
sudo systemctl restart docker
```

### Clean Restart

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: Deletes all data)
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

---

## Performance Tuning

### MySQL Optimization

Edit `docker-compose.yml`:
```yaml
mysql:
  environment:
    - MYSQL_INNODB_BUFFER_POOL_SIZE=2G
    - MYSQL_MAX_CONNECTIONS=200
```

### Redis Optimization

```yaml
redis:
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Node.js Optimization

```yaml
lottery-service:
  environment:
    - NODE_OPTIONS=--max-old-space-size=2048
```

---

## Backup & Restore

### Database Backup

```bash
# Backup
docker exec lotomind-mysql mysqldump -u lotomind -p lotomind > backup.sql

# With date
docker exec lotomind-mysql mysqldump -u lotomind -p lotomind > backup-$(date +%Y%m%d).sql

# Restore
docker exec -i lotomind-mysql mysql -u lotomind -p lotomind < backup.sql
```

### Volume Backup

```bash
# Backup MySQL data
docker run --rm \
  -v lotomind_mysql_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mysql-backup.tar.gz /data

# Restore
docker run --rm \
  -v lotomind_mysql_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mysql-backup.tar.gz -C /
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale prediction service to 3 instances
docker-compose up -d --scale prediction-service=3

# Scale analytics service
docker-compose up -d --scale analytics-service=2
```

### Load Balancer (Nginx)

Create `nginx.conf`:
```nginx
upstream prediction_backend {
    server prediction-service-1:3002;
    server prediction-service-2:3002;
    server prediction-service-3:3002;
}

server {
    listen 80;
    location /api/predictions/ {
        proxy_pass http://prediction_backend;
    }
}
```

---

## Security Checklist

- [ ] Change default passwords in .env
- [ ] Use strong JWT secret
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure firewall rules
- [ ] Limit database access to localhost
- [ ] Enable RabbitMQ authentication
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

---

## Production Deployment (Cloud)

### AWS Deployment

1. **EC2 Instance**:
   - t3.medium or larger
   - Ubuntu 22.04 LTS
   - Security groups: 80, 443, 3000

2. **RDS MySQL**:
   - db.t3.medium
   - Multi-AZ for high availability

3. **ElastiCache Redis**:
   - cache.t3.micro

4. **Amazon MQ (RabbitMQ)**:
   - mq.t3.micro

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml lotomind

# Scale services
docker service scale lotomind_prediction-service=3
```

### Kubernetes

Convert docker-compose.yml to Kubernetes manifests:
```bash
kompose convert
kubectl apply -f .
```

---

## Maintenance

### Regular Tasks

**Daily**:
- Check service health
- Monitor disk space
- Review error logs

**Weekly**:
- Database backup
- Update dependencies
- Review performance metrics

**Monthly**:
- Security updates
- Database optimization
- Clean old logs

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild services
docker-compose up -d --build

# Check for breaking changes
docker-compose logs -f
```

---

## Support & Documentation

- **README.md**: Project overview
- **QUICKSTART.md**: Quick start guide
- **walkthrough.md**: Implementation details
- **API Documentation**: http://localhost:3000/api/docs (when Swagger is added)

---

## Success Criteria

✅ All services showing "healthy" status
✅ Frontend accessible at http://localhost
✅ API responding to requests
✅ Database populated with lottery types
✅ Cron jobs running (check scheduler logs)
✅ RabbitMQ queues active
✅ No error messages in logs

---

**🎉 Your LotoMind Analytics platform is now deployed and running!**
