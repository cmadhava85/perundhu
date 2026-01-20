#!/bin/bash

# Test runner script to run tests in batches to avoid memory issues
# This runs tests in groups and provides a summary at the end

set -e  # Exit on error

echo "🧪 Running tests in batches to manage memory..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
total_passed=0
total_failed=0
failed_batches=()

# Function to run a batch of tests
run_batch() {
    local pattern=$1
    local name=$2
    
    echo ""
    echo "${YELLOW}Running: $name${NC}"
    echo "Pattern: $pattern"
    echo "-------------------------------------------"
    
    if NODE_OPTIONS='--max-old-space-size=4096 --expose-gc' npx vitest run --no-coverage "$pattern" 2>&1 | tee /tmp/test_output_$$; then
        echo "${GREEN}✓ $name passed${NC}"
        # Extract test count from output
        local count=$(grep -o "[0-9]* passed" /tmp/test_output_$$ | head -1 | awk '{print $1}')
        total_passed=$((total_passed + ${count:-0}))
    else
        echo "${RED}✗ $name failed${NC}"
        total_failed=$((total_failed + 1))
        failed_batches+=("$name")
    fi
    
    # Force cleanup
    sleep 2
}

# Run tests in batches
echo "Starting test execution..."

# Batch 1: Services
run_batch "src/__tests__/services/**/*.test.ts" "Services Tests"

# Batch 2: Components - Search & Results
run_batch "src/components/__tests__/{SearchResults,TransitBusList,RouteResults}.test.tsx" "Search Components"

# Batch 3: Components - Bus Cards & Tracker
run_batch "src/components/__tests__/{BusCardModern,BusTracker,TransitBusCard}.test.tsx" "Bus Components"

# Batch 4: Components - Maps
run_batch "src/components/__tests__/{RouteMap,CombinedMapTracker,OpenStreetMapComponent}.test.tsx" "Map Components"

# Batch 5: Components - Contribution
run_batch "src/components/contribution/**/*.test.tsx" "Contribution Components"

# Batch 6: Components - Admin
run_batch "src/components/admin/**/*.test.tsx" "Admin Components"

# Batch 7: Hooks
run_batch "src/hooks/**/*.test.ts*" "Hooks Tests"

# Batch 8: Utils
run_batch "src/utils/**/*.test.ts" "Utils Tests"

# Batch 9: Contexts
run_batch "src/contexts/**/*.test.tsx" "Context Tests"

# Batch 10: Remaining components
run_batch "src/components/__tests__/*.test.tsx" "Remaining Component Tests"

# Batch 11: App tests
run_batch "src/__tests__/*.test.tsx" "App Tests"

# Summary
echo ""
echo "================================================"
echo "📊 Test Summary"
echo "================================================"
echo "Total batches run: $((${#failed_batches[@]} + total_passed))"
echo "${GREEN}Batches passed: $total_passed${NC}"
echo "${RED}Batches failed: ${#failed_batches[@]}${NC}"

if [ ${#failed_batches[@]} -gt 0 ]; then
    echo ""
    echo "${RED}Failed batches:${NC}"
    for batch in "${failed_batches[@]}"; do
        echo "  - $batch"
    done
    exit 1
else
    echo ""
    echo "${GREEN}✓ All test batches passed!${NC}"
    exit 0
fi
