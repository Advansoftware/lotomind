#!/bin/bash

# Comprehensive System Test
# Tests all components and functionality

set -e

echo "🧪 LotoMind Analytics - Comprehensive System Test"
echo "=================================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

test_endpoint() {
    local url=$1
    local name=$2
    local expected_code=${3:-200}
    
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response_code" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} $name (HTTP $response_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $name (HTTP $response_code, expected $expected_code)"
        ((FAILED++))
        return 1
    fi
}

test_json_response() {
    local url=$1
    local name=$2
    
    response=$(curl -s "$url")
    
    if echo "$response" | jq . > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name (valid JSON)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $name (invalid JSON)"
        echo "Response: $response"
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}1. Testing Infrastructure${NC}"
echo "-------------------------"

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 15

# Test MySQL
if docker exec lotomind-mysql mysql -ulotomind -plotomind123 -e "SELECT 1" lotomind > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} MySQL Connection"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} MySQL Connection"
    ((FAILED++))
fi

# Test Redis
if docker exec lotomind-redis redis-cli ping | grep -q PONG; then
    echo -e "${GREEN}✓${NC} Redis Connection"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Redis Connection"
    ((FAILED++))
fi

# Test RabbitMQ
if curl -s -u lotomind:lotomind123 http://localhost:15672/api/overview > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} RabbitMQ Management"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} RabbitMQ Management"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}2. Testing Microservices Health${NC}"
echo "-------------------------------"

test_endpoint "http://localhost:3000/health" "API Gateway Health"
test_endpoint "http://localhost:3001/lottery/health" "Lottery Service Health"
test_endpoint "http://localhost:3002/predictions/health" "Prediction Service Health"
test_endpoint "http://localhost:3003/analytics/health" "Analytics Service Health"

echo ""
echo -e "${BLUE}3. Testing Data Ingestion${NC}"
echo "-------------------------"

# Sync Mega-Sena data
echo "Syncing Mega-Sena data (last 10 draws)..."
sync_response=$(curl -s -X POST http://localhost:3000/api/lottery/sync \
  -H "Content-Type: application/json" \
  -d '{"lotteryType": "megasena", "lastN": 10}')

if echo "$sync_response" | jq . > /dev/null 2>&1; then
    synced=$(echo "$sync_response" | jq -r '.synced')
    echo -e "${GREEN}✓${NC} Data Sync (Synced: $synced draws)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Data Sync Failed"
    ((FAILED++))
fi

# Verify data was saved
test_json_response "http://localhost:3000/api/lottery/draws?lotteryType=megasena&limit=5" "Fetch Draws"

echo ""
echo -e "${BLUE}4. Testing Prediction Generation${NC}"
echo "--------------------------------"

# List strategies
test_json_response "http://localhost:3000/api/predictions/strategies" "List Strategies"

# Generate prediction
echo "Generating prediction..."
prediction_response=$(curl -s -X POST http://localhost:3000/api/predictions/generate \
  -H "Content-Type: application/json" \
  -d '{"lotteryType": "megasena"}')

if echo "$prediction_response" | jq . > /dev/null 2>&1; then
    strategy=$(echo "$prediction_response" | jq -r '.strategyName')
    numbers=$(echo "$prediction_response" | jq -r '.predictedNumbers | join(", ")')
    confidence=$(echo "$prediction_response" | jq -r '.confidenceScore')
    echo -e "${GREEN}✓${NC} Prediction Generated"
    echo "  Strategy: $strategy"
    echo "  Numbers: $numbers"
    echo "  Confidence: $confidence"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Prediction Generation Failed"
    echo "Response: $prediction_response"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}5. Testing Analytics${NC}"
echo "-------------------"

test_json_response "http://localhost:3000/api/analytics/dashboard" "Dashboard Metrics"
test_json_response "http://localhost:3000/api/analytics/numbers/hot-cold" "Hot/Cold Numbers"
test_json_response "http://localhost:3000/api/analytics/statistics" "Statistics"

echo ""
echo -e "${BLUE}6. Testing Authentication${NC}"
echo "------------------------"

# Register user
register_response=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@lotomind.com", "password": "test123"}')

if echo "$register_response" | jq -r '.token' > /dev/null 2>&1; then
    token=$(echo "$register_response" | jq -r '.token')
    echo -e "${GREEN}✓${NC} User Registration"
    ((PASSED++))
    
    # Test protected route
    profile_response=$(curl -s http://localhost:3000/auth/profile \
      -H "Authorization: Bearer $token")
    
    if echo "$profile_response" | jq . > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Protected Route Access"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Protected Route Access"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} User Registration (user may already exist)"
    # Try login instead
    login_response=$(curl -s -X POST http://localhost:3000/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email": "test@lotomind.com", "password": "test123"}')
    
    if echo "$login_response" | jq -r '.token' > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} User Login"
        ((PASSED++))
    fi
fi

echo ""
echo -e "${BLUE}7. Testing Frontend${NC}"
echo "------------------"

test_endpoint "http://localhost" "Frontend Homepage"

echo ""
echo "=================================================="
echo -e "${BLUE}Test Summary${NC}"
echo "=================================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! System is fully functional!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the logs above.${NC}"
    exit 1
fi
