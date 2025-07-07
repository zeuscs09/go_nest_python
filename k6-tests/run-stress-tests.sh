#!/bin/bash

# Enhanced Stress Test Runner Script with API Comparison
# Usage: ./run-stress-tests.sh [test-type] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test results directory
RESULTS_DIR="stress-test-results"
mkdir -p "$RESULTS_DIR"

# Timestamp for this test run
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

echo -e "${BLUE}🚀 Enhanced K6 Stress Test Runner with API Comparison${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Function to check if APIs are running
check_apis() {
    echo -e "${YELLOW}🔍 Checking API health...${NC}"
    
    apis=(
        "http://localhost:8081/api/v1/health|Golang"
        "http://localhost:3000/api/v1/health|NestJS"
        "http://localhost:8000/|Python"
        "http://localhost:5001/health|.NET"
    )
    
    all_healthy=true
    
    for api_info in "${apis[@]}"; do
        IFS='|' read -r url name <<< "$api_info"
        if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
            echo -e "  ✅ $name API is running"
        else
            echo -e "  ❌ $name API is NOT running"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = false ]; then
        echo -e "${RED}⚠️  Some APIs are not running. Please start all APIs first.${NC}"
        echo -e "${YELLOW}💡 Hint: Run 'docker compose up -d' to start all APIs${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All APIs are healthy!${NC}\n"
}

# Function to monitor system during test
monitor_system() {
    local test_name=$1
    local duration=$2
    
    echo -e "${YELLOW}📊 Starting system monitoring for $test_name...${NC}"
    
    {
        echo "timestamp,cpu_usage,memory_usage,disk_io"
        for i in $(seq 1 $duration); do
            timestamp=$(date +"%Y-%m-%d %H:%M:%S")
            cpu=$(top -l 1 -n 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "N/A")
            memory=$(ps -A -o %mem | awk '{s+=$1} END {print s}' || echo "N/A")
            echo "$timestamp,$cpu,$memory,N/A"
            sleep 1
        done
    } > "$RESULTS_DIR/system-monitor-$test_name-$TIMESTAMP.csv" &
    
    echo $! > "$RESULTS_DIR/monitor_pid.txt"
}

# Function to stop monitoring
stop_monitoring() {
    if [ -f "$RESULTS_DIR/monitor_pid.txt" ]; then
        local pid=$(cat "$RESULTS_DIR/monitor_pid.txt")
        kill $pid 2>/dev/null || true
        rm "$RESULTS_DIR/monitor_pid.txt"
        echo -e "${GREEN}📊 System monitoring stopped${NC}"
    fi
}

# Function to run benchmark comparison test
run_benchmark_comparison() {
    echo -e "${PURPLE}🏆 Running API Benchmark Comparison (5 minutes)${NC}"
    echo -e "${YELLOW}📊 This test compares performance between all 4 APIs fairly${NC}"
    
    monitor_system "benchmark-comparison" 300 &
    
    k6 run \
        --out json="$RESULTS_DIR/benchmark-comparison-results-$TIMESTAMP.json" \
        benchmark-compare.js
    
    stop_monitoring
    
    # Run analysis immediately after benchmark
    echo -e "${BLUE}🔍 Analyzing comparison results...${NC}"
    python3 analyze-results.py
    
    echo -e "${GREEN}✅ Benchmark comparison completed with analysis!${NC}\n"
}

# Function to run quick stress test
run_quick_stress() {
    echo -e "${BLUE}⚡ Running Quick Stress Test (5 minutes)${NC}"
    monitor_system "quick-stress" 300 &
    
    k6 run \
        --out json="$RESULTS_DIR/quick-stress-$TIMESTAMP.json" \
        quick-stress-test.js
    
    stop_monitoring
    echo -e "${GREEN}✅ Quick stress test completed!${NC}\n"
}

# Function to run full stress test
run_full_stress() {
    echo -e "${BLUE}🔥 Running Full Stress Test (~30 minutes)${NC}"
    echo -e "${YELLOW}⚠️  This is a long test that will push your system to its limits!${NC}"
    read -p "Are you sure you want to continue? (y/N): " confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Test cancelled."
        return
    fi
    
    monitor_system "full-stress" 1800 &
    
    k6 run \
        --out json="$RESULTS_DIR/full-stress-$TIMESTAMP.json" \
        stress-test.js
    
    stop_monitoring
    echo -e "${GREEN}✅ Full stress test completed!${NC}\n"
}

# Function to run spike test
run_spike_test() {
    echo -e "${BLUE}⚡ Running Spike Test (~15 minutes)${NC}"
    monitor_system "spike-test" 900 &
    
    k6 run \
        --out json="$RESULTS_DIR/spike-test-$TIMESTAMP.json" \
        spike-test.js
    
    stop_monitoring
    echo -e "${GREEN}✅ Spike test completed!${NC}\n"
}

# Function to run all tests
run_all_tests() {
    echo -e "${BLUE}🎯 Running All Tests with Comprehensive Analysis${NC}"
    echo -e "${YELLOW}⚠️  This will take approximately 60 minutes!${NC}"
    read -p "Are you sure you want to continue? (y/N): " confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Test cancelled."
        return
    fi
    
    # Start with benchmark comparison
    run_benchmark_comparison
    sleep 60  # Cool down period
    
    # Run other tests
    run_quick_stress
    sleep 60
    
    run_spike_test
    sleep 120
    
    run_full_stress
    
    echo -e "${GREEN}🎉 All tests completed!${NC}"
    generate_master_report
}

# Function to analyze existing results
analyze_results() {
    echo -e "${PURPLE}🔍 Analyzing Existing Test Results${NC}"
    
    if [ "$1" = "--all" ]; then
        python3 analyze-results.py --all
    else
        python3 analyze-results.py
    fi
}

# Function to generate master summary report
generate_master_report() {
    echo -e "${BLUE}📋 Generating Master Summary Report...${NC}"
    
    report_file="$RESULTS_DIR/master-summary-$TIMESTAMP.txt"
    
    {
        echo "=============================================="
        echo "MASTER STRESS TEST SUMMARY REPORT"
        echo "=============================================="
        echo "Generated: $(date)"
        echo "Test Results Directory: $RESULTS_DIR"
        echo ""
        
        echo "🧪 TEST SUITE COMPLETED:"
        [ -f "$RESULTS_DIR/benchmark-comparison-results-$TIMESTAMP.json" ] && echo "✅ Benchmark Comparison"
        [ -f "$RESULTS_DIR/quick-stress-$TIMESTAMP.json" ] && echo "✅ Quick Stress Test"
        [ -f "$RESULTS_DIR/spike-test-$TIMESTAMP.json" ] && echo "✅ Spike Test"
        [ -f "$RESULTS_DIR/full-stress-$TIMESTAMP.json" ] && echo "✅ Full Stress Test"
        
        echo ""
        echo "📊 FILES GENERATED:"
        ls -la "$RESULTS_DIR"/*$TIMESTAMP* 2>/dev/null | head -20
        
        echo ""
        echo "🎯 API ENDPOINTS TESTED:"
        echo "• 🟢 Golang API: http://localhost:8081"
        echo "• 🔴 NestJS API: http://localhost:3000"
        echo "• 🟡 Python API: http://localhost:8000"
        echo "• 🔵 .NET API: http://localhost:5001"
        
        echo ""
        echo "📈 ANALYSIS TOOLS:"
        echo "• Run 'python3 analyze-results.py' for detailed comparison"
        echo "• Check benchmark-comparison-report.txt for rankings"
        echo "• Review system-monitor CSV files for resource usage"
        echo "• JSON files contain complete metrics for custom analysis"
        
        echo ""
        echo "🔍 NEXT STEPS:"
        echo "1. Review performance rankings in analysis reports"
        echo "2. Identify bottlenecks and optimization opportunities"  
        echo "3. Compare different load scenarios (quick vs spike vs full)"
        echo "4. Use findings to optimize slower APIs"
        
    } > "$report_file"
    
    echo -e "${GREEN}📋 Master summary saved to: $report_file${NC}"
    
    # Run final analysis
    echo -e "${BLUE}🔍 Running final comprehensive analysis...${NC}"
    analyze_results --all
}

# Function to clean old test results
clean_results() {
    echo -e "${YELLOW}🧹 Cleaning old test results...${NC}"
    echo -e "${YELLOW}Current files in $RESULTS_DIR:${NC}"
    ls -la "$RESULTS_DIR" 2>/dev/null || echo "Directory is empty"
    echo ""
    read -p "This will delete all files in $RESULTS_DIR. Continue? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        rm -rf "$RESULTS_DIR"/*
        echo -e "${GREEN}✅ Test results cleaned!${NC}"
    else
        echo "Cleanup cancelled."
    fi
}

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage: $0 [COMMAND]${NC}"
    echo ""
    echo -e "${YELLOW}🧪 TEST COMMANDS:${NC}"
    echo "  compare    🏆 Run API benchmark comparison (5 min) - RECOMMENDED FIRST!"
    echo "  quick      ⚡ Run quick stress test (5 minutes)"
    echo "  spike      🌊 Run spike test (15 minutes)"
    echo "  full       🔥 Run full stress test (30 minutes)"
    echo "  all        🎯 Run all tests with analysis (60 minutes)"
    echo ""
    echo -e "${YELLOW}📊 ANALYSIS COMMANDS:${NC}"
    echo "  analyze    🔍 Analyze latest test results"
    echo "  analyze-all🔍 Analyze all historical results"
    echo ""
    echo -e "${YELLOW}🛠️  UTILITY COMMANDS:${NC}"
    echo "  clean      🧹 Clean old test results"
    echo "  check      ❤️  Check API health only"
    echo ""
    echo -e "${YELLOW}💡 EXAMPLES:${NC}"
    echo "  $0 compare     # Compare API performance (start here!)"
    echo "  $0 all         # Full test suite with analysis"
    echo "  $0 analyze     # Analyze existing results"
    echo ""
    echo -e "${PURPLE}🎯 RECOMMENDED WORKFLOW:${NC}"
    echo "  1. $0 check      # Verify APIs are running"
    echo "  2. $0 compare    # Compare API performance"
    echo "  3. $0 spike      # Test spike handling"
    echo "  4. $0 analyze    # Review results"
}

# Function to show system info
show_system_info() {
    echo -e "${BLUE}💻 System Information:${NC}"
    echo "• OS: $(uname -s) $(uname -r)"
    echo "• CPU: $(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo 'Unknown')"
    echo "• Memory: $(free -h 2>/dev/null | grep '^Mem' | awk '{print $2}' || echo 'Unknown')"
    echo "• k6 Version: $(k6 version --short 2>/dev/null || echo 'Not installed')"
    echo "• Python: $(python3 --version 2>/dev/null || echo 'Not installed')"
    echo ""
}

# Main execution
case "${1:-}" in
    "compare"|"benchmark")
        check_apis
        run_benchmark_comparison
        ;;
    "quick")
        check_apis
        run_quick_stress
        ;;
    "spike")
        check_apis
        run_spike_test
        ;;
    "full")
        check_apis
        run_full_stress
        ;;
    "all")
        check_apis
        run_all_tests
        ;;
    "analyze")
        analyze_results
        ;;
    "analyze-all")
        analyze_results --all
        ;;
    "clean")
        clean_results
        ;;
    "check")
        check_apis
        ;;
    "info")
        show_system_info
        ;;
    *)
        show_usage
        ;;
esac 