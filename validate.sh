#!/bin/bash

# LotoMind Analytics - System Validation Script
# Validates that all components are working correctly

set -e

echo "🔍 LotoMind Analytics - System Validation"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

test_endpoint() {
    local url=$1
    local name=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $name"
        ((FAILED++))
        return 1
    fi
}

test_json_endpoint() {
    local url=$1
    local name=$2
    
    response=$(curl -s "$url")
    if echo "$response" | jq . > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name (valid JSON)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $name (invalid JSON)"
        ((FAILED++))
        return 1
    fi
}

echo "Testing Health Endpoints..."
echo "----------------------------"
test_endpoint "http://localhost:3000/health" "API Gateway Health"
test_endpoint "http://localhost:3001/lottery/health" "Lottery Service Health"
test_endpoint "http://localhost:3002/predictions/health" "Prediction Service Health"
test_endpoint "http://localhost:3003/analytics/health" "Analytics Service Health"
echo ""

echo "Testing API Endpoints..."
echo "------------------------"
test_json_endpoint "http://localhost:3000/api/lottery/types" "Lottery Types"
test_json_endpoint "http://localhost:3000/api/predictions/strategies" "Prediction Strategies"
test_json_endpoint "http://localhost:3000/api/analytics/dashboard" "Analytics Dashboard"
echo ""

echo "Testing Database Connection..."
echo "------------------------------"
if docker exec lotomind-mysql mysql -ulotomind -plotomind123 -e "SELECT 1" lotomind > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} MySQL Connection"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} MySQL Connection"
    ((FAILED++))
fi
echo ""

echo "Testing RabbitMQ..."
echo "-------------------"
if curl -s -u lotomind:lotomind123 http://localhost:15672/api/overview > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} RabbitMQ Management"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} RabbitMQ Management"
    ((FAILED++))
fi
echo ""

echo "Testing Redis..."
echo "----------------"
if docker exec lotomind-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis Connection"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Redis Connection"
    ((FAILED++))
fi
echo ""

echo "Testing Docker Containers..."
echo "-----------------------------"
containers=("lotomind-mysql" "lotomind-redis" "lotomind-rabbitmq" "lotomind-api-gateway" "lotomind-lottery-service" "lotomind-prediction-service" "lotomind-analytics-service" "lotomind-scheduler-service" "lotomind-frontend")

for container in "${containers[@]}"; do
    if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
        echo -e "${GREEN}✓${NC} $container is running"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $container is not running"
        ((FAILED++))
    fi
done
echo ""

echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! System is 100% functional!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please check the logs.${NC}"
    exit 1
fi
