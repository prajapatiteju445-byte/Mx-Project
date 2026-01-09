#!/bin/bash
# SafeHer Functionality Test Script

API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
echo "🧪 Testing SafeHer Application"
echo "================================"
echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local endpoint=$2
    local method=${3:-GET}
    local expected=${4:-200}
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint")
    else
        status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API_URL$endpoint")
    fi
    
    if [ "$status" = "$expected" ] || [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $status)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $status, expected $expected)"
        ((FAILED++))
    fi
}

echo "📡 Backend API Tests"
echo "-------------------"

# Basic endpoints
test_endpoint "Root API" "/api/"
test_endpoint "Safety Zones" "/api/safety/zones"
test_endpoint "Community Reports" "/api/community/reports"

echo ""
echo "🗄️  Database Tests"
echo "------------------"

# Check MongoDB collections
echo -n "Checking safety_zones collection... "
count=$(mongosh --quiet --eval "db.safety_zones.countDocuments()" mongodb://localhost:27017/test_database)
if [ "$count" -gt 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC} ($count zones)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (0 zones)"
    ((FAILED++))
fi

echo ""
echo "🌐 Frontend Tests"
echo "-----------------"

# Test frontend
echo -n "Testing Frontend loads... "
status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $status)"
    ((FAILED++))
fi

echo -n "Testing PWA Manifest... "
status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/manifest.json")
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo -n "Testing Service Worker... "
status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/service-worker.js")
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((FAILED++))
fi

echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! SafeHer is working correctly.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Please check the errors above.${NC}"
    exit 1
fi
