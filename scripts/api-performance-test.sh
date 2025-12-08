#!/bin/bash

# API Performance Test Script for PreProd Environment
# Tests all major endpoints and measures response times

set -e

# Configuration
BACKEND_URL="https://perundhu-backend-preprod-1032721240281.asia-south1.run.app"
RESULTS_FILE="api-performance-results-$(date +%Y%m%d-%H%M%S).txt"
WARM_UP_CALLS=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test an endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local expected_status=${4:-200}
    
    echo -e "\n${BLUE}Testing: $name${NC}"
    echo "URL: $url"
    
    # Warm-up calls
    for ((i=1; i<=WARM_UP_CALLS; i++)); do
        curl -s -X $method --max-time 60 "$url" -o /dev/null || true
    done
    
    # Actual test
    local response=$(curl -s -X $method --max-time 60 \
        -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\nTIME_CONNECT:%{time_connect}\nTIME_TTFB:%{time_starttransfer}\nSIZE:%{size_download}" \
        "$url" -o /tmp/api_response.json)
    
    local http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    local time_total=$(echo "$response" | grep "TIME_TOTAL:" | cut -d: -f2)
    local time_connect=$(echo "$response" | grep "TIME_CONNECT:" | cut -d: -f2)
    local time_ttfb=$(echo "$response" | grep "TIME_TTFB:" | cut -d: -f2)
    local size=$(echo "$response" | grep "SIZE:" | cut -d: -f2)
    
    # Color code based on performance
    local color=$GREEN
    if (( $(echo "$time_total > 2.0" | bc -l) )); then
        color=$YELLOW
    fi
    if (( $(echo "$time_total > 5.0" | bc -l) )); then
        color=$RED
    fi
    
    echo -e "${color}HTTP Status: $http_status${NC}"
    echo -e "${color}Total Time: ${time_total}s${NC}"
    echo -e "TTFB: ${time_ttfb}s"
    echo -e "Connect Time: ${time_connect}s"
    echo -e "Response Size: ${size} bytes"
    
    # Check if response is valid JSON
    if [ -s /tmp/api_response.json ]; then
        local is_json=$(cat /tmp/api_response.json | python3 -m json.tool > /dev/null 2>&1 && echo "yes" || echo "no")
        if [ "$is_json" = "yes" ]; then
            local item_count=$(cat /tmp/api_response.json | python3 -c "import json,sys; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 'N/A')" 2>/dev/null || echo "N/A")
            echo -e "Items in response: $item_count"
        fi
    fi
    
    # Log to results file
    echo "$name|$http_status|$time_total|$time_ttfb|$size" >> "$RESULTS_FILE"
}

# Start testing
echo "========================================="
echo "API Performance Test - PreProd Environment"
echo "Backend: $BACKEND_URL"
echo "Started: $(date)"
echo "========================================="

# Create results file with header
echo "Endpoint|HTTP_Status|Total_Time|TTFB|Size" > "$RESULTS_FILE"

# Test 1: Get Locations
test_endpoint \
    "Get Locations (English)" \
    "$BACKEND_URL/api/v1/bus-schedules/locations?lang=en"

# Test 2: Get Locations (Tamil)
test_endpoint \
    "Get Locations (Tamil)" \
    "$BACKEND_URL/api/v1/bus-schedules/locations?lang=ta"

# Test 3: Location Search
test_endpoint \
    "Location Search (Chennai)" \
    "$BACKEND_URL/api/v1/locations/search?query=Chennai&limit=10"

# Test 4: Location Autocomplete
test_endpoint \
    "Location Autocomplete (Mad)" \
    "$BACKEND_URL/api/v1/bus-schedules/locations/autocomplete?q=Mad&language=en"

# Test 5: Search Buses (Direct)
test_endpoint \
    "Search Buses (Chennai to Madurai)" \
    "$BACKEND_URL/api/v1/bus-schedules/search?fromLocationId=1&toLocationId=3&includeContinuing=false"

# Test 6: Search Buses (With Continuing)
test_endpoint \
    "Search Buses (With Continuing Routes)" \
    "$BACKEND_URL/api/v1/bus-schedules/search?fromLocationId=1&toLocationId=3&includeContinuing=true"

# Test 7: Search Via Stops
test_endpoint \
    "Search Via Stops" \
    "$BACKEND_URL/api/v1/bus-schedules/search-via-stops?fromLocationId=1&toLocationId=3"

# Test 8: Get Connecting Routes
test_endpoint \
    "Connecting Routes (max 2 transfers)" \
    "$BACKEND_URL/api/v1/bus-schedules/connecting-routes?fromLocationId=1&toLocationId=3&maxTransfers=2"

# Test 9: Get Bus Stops (Basic)
test_endpoint \
    "Get Bus Stops (Basic)" \
    "$BACKEND_URL/api/v1/bus-schedules/buses/1/stops/basic?lang=en"

# Test 10: Get All Buses
test_endpoint \
    "Get All Buses" \
    "$BACKEND_URL/api/v1/bus-schedules/buses"

# Test 11: Bus Tracking Live
test_endpoint \
    "Bus Tracking Live" \
    "$BACKEND_URL/api/v1/bus-tracking/live"

# Test 12: Bus Location History
test_endpoint \
    "Bus Location History" \
    "$BACKEND_URL/api/v1/bus-tracking/history/1"

echo ""
echo "========================================="
echo "Performance Test Completed!"
echo "Results saved to: $RESULTS_FILE"
echo "========================================="

# Generate summary
echo ""
echo "========================================="
echo "PERFORMANCE SUMMARY"
echo "========================================="
echo ""

# Calculate averages
awk -F'|' 'NR>1 {
    sum_time += $3;
    sum_ttfb += $4;
    sum_size += $5;
    count++;
    if ($3 > max_time) max_time = $3;
    if ($3 < min_time || min_time == 0) min_time = $3;
}
END {
    printf "Average Response Time: %.3fs\n", sum_time/count;
    printf "Average TTFB: %.3fs\n", sum_ttfb/count;
    printf "Average Response Size: %d bytes\n", sum_size/count;
    printf "Fastest Response: %.3fs\n", min_time;
    printf "Slowest Response: %.3fs\n", max_time;
}' "$RESULTS_FILE"

echo ""
echo "Detailed results in: $RESULTS_FILE"
