#!/bin/bash

# Performance Test Runner for Golang, NestJS, and Python APIs
echo "=========================================="
echo "API Performance Comparison Test"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}k6 is not installed. Please install k6 first.${NC}"
    echo "Installation: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    echo -e "${BLUE}Checking if $name is running...${NC}"
    
    if curl -s --max-time 5 "$url/health" > /dev/null; then
        echo -e "${GREEN}✓ $name is running${NC}"
        return 0
    else
        echo -e "${RED}✗ $name is not running${NC}"
        return 1
    fi
}

# Function to run test for specific API
run_test() {
    local api_url=$1
    local api_name=$2
    local output_file="results-${api_name,,}-$(date +%Y%m%d-%H%M%S).json"
    
    echo -e "${YELLOW}Testing $api_name API...${NC}"
    echo "URL: $api_url"
    echo "Output: $output_file"
    echo "----------------------------------------"
    
    API_URL="$api_url" API_NAME="$api_name" k6 run \
        --out json="$output_file" \
        test-individual-apis.js
    
    echo -e "${GREEN}Test completed for $api_name${NC}"
    echo "Results saved to: $output_file"
    echo
}

# Create results directory
mkdir -p results
cd load-test

# Define API endpoints
GOLANG_API="http://localhost:8081/api/v1"
NESTJS_API="http://localhost:3000/api/v1"
PYTHON_API="http://localhost:8000/api/v1"

# Check all services
echo -e "${BLUE}Checking all services...${NC}"
all_running=true

if ! check_service "$GOLANG_API" "Golang"; then
    all_running=false
fi

if ! check_service "$NESTJS_API" "NestJS"; then
    all_running=false
fi

if ! check_service "$PYTHON_API" "Python"; then
    all_running=false
fi

if [ "$all_running" = false ]; then
    echo -e "${RED}Some services are not running. Please start all APIs first.${NC}"
    echo
    echo "To start all services:"
    echo "docker-compose up -d"
    exit 1
fi

echo -e "${GREEN}All services are running!${NC}"
echo

# Run tests for each API
echo -e "${YELLOW}Starting performance tests...${NC}"
echo

# Test 1: Golang API
run_test "$GOLANG_API" "Golang"

# Test 2: NestJS API  
run_test "$NESTJS_API" "NestJS"

# Test 3: Python API
run_test "$PYTHON_API" "Python"

# Combined test (all APIs together)
echo -e "${YELLOW}Running combined test (all APIs)...${NC}"
output_file="results-combined-$(date +%Y%m%d-%H%M%S).json"
k6 run --out json="$output_file" k6-test.js
echo -e "${GREEN}Combined test completed${NC}"
echo "Results saved to: $output_file"
echo

echo -e "${GREEN}=========================================="
echo "All tests completed!"
echo "==========================================${NC}"
echo
echo "Results files:"
ls -la results-*.json 2>/dev/null || echo "No result files found"
echo
echo "To analyze results, you can use:"
echo "- k6 cloud upload <result-file>.json (if you have k6 cloud account)"
echo "- Manual analysis of JSON files"
echo "- Convert to other formats for visualization" 