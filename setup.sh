#!/bin/bash

# LotoMind Analytics - Complete Setup Script
# This script installs all dependencies, builds all services, and validates the system

set -e  # Exit on error

echo "🚀 LotoMind Analytics - Complete Setup"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if Docker is running
print_info "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_success "Docker is running"

# Install dependencies for all services
print_info "Installing dependencies..."

services=("api-gateway" "lottery-service" "prediction-service" "analytics-service" "scheduler-service")

for service in "${services[@]}"; do
    print_info "Installing dependencies for $service..."
    cd "services/$service"
    npm install --legacy-peer-deps
    print_success "$service dependencies installed"
    cd ../..
done

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
print_success "Frontend dependencies installed"
cd ..

# Build all services
print_info "Building all services..."

for service in "${services[@]}"; do
    print_info "Building $service..."
    cd "services/$service"
    npm run build
    print_success "$service built successfully"
    cd ../..
done

# Build frontend
print_info "Building frontend..."
cd frontend
npm run build
print_success "Frontend built successfully"
cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_info "Creating .env file..."
    cp .env.example .env
    print_success ".env file created"
else
    print_info ".env file already exists"
fi

# Start Docker Compose
print_info "Starting Docker Compose services..."
docker-compose up -d

# Wait for services to be healthy
print_info "Waiting for services to be healthy..."
sleep 10

# Check service health
print_info "Checking service health..."

services_urls=(
    "http://localhost:3000/health:API Gateway"
    "http://localhost:3001/lottery/health:Lottery Service"
    "http://localhost:3002/predictions/health:Prediction Service"
    "http://localhost:3003/analytics/health:Analytics Service"
)

for service_url in "${services_urls[@]}"; do
    IFS=':' read -r url name <<< "$service_url"
    if curl -s "$url" > /dev/null; then
        print_success "$name is healthy"
    else
        print_error "$name is not responding"
    fi
done

echo ""
echo "======================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "======================================="
echo ""
echo "Services running:"
echo "  - API Gateway:        http://localhost:3000"
echo "  - Lottery Service:    http://localhost:3001"
echo "  - Prediction Service: http://localhost:3002"
echo "  - Analytics Service:  http://localhost:3003"
echo "  - Frontend:           http://localhost"
echo "  - RabbitMQ Admin:     http://localhost:15672"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:      docker-compose down"
echo ""
