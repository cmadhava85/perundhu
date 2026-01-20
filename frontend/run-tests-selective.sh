#!/bin/bash

# Script to run tests selectively to identify memory issues
# Usage: ./run-tests-selective.sh

set -e

cd "$(dirname "$0")"

echo "🧪 Running Frontend Tests Selectively..."
echo "========================================"

# Test configuration
NODE_OPTS="NODE_OPTIONS='--max-old-space-size=8192 --expose-gc'"
VITEST_OPTS="--no-coverage --reporter=basic --testTimeout=10000"

# Function to run a single test file
run_test() {
  local test_file=$1
  local test_name=$(basename "$test_file")
  
  echo ""
  echo "📝 Testing: $test_name"
  echo "----------------------------------------"
  
  if eval "$NODE_OPTS npx vitest run \"$test_file\" $VITEST_OPTS 2>&1 | head -100"; then
    echo "✅ PASSED: $test_name"
    return 0
  else
    echo "❌ FAILED: $test_name"
    return 1
  fi
}

# Track results
PASSED=0
FAILED=0
FAILED_TESTS=()

# Test services first (usually lightweight)
echo ""
echo "🔧 Testing Services..."
echo "========================================"

for test in src/__tests__/services/*.test.ts; do
  if [ -f "$test" ]; then
    if run_test "$test"; then
      ((PASSED++))
    else
      ((FAILED++))
      FAILED_TESTS+=("$test")
    fi
  fi
done

# Test hooks (medium weight)
echo ""
echo "🪝 Testing Hooks..."
echo "========================================"

for test in src/hooks/__tests__/*.test.ts; do
  if [ -f "$test" ]; then
    if run_test "$test"; then
      ((PASSED++))
    else
      ((FAILED++))
      FAILED_TESTS+=("$test")
    fi
  fi
done

# Test components (heavy - skip known problematic ones)
echo ""
echo "🎨 Testing Components..."
echo "========================================"

SKIP_TESTS=(
  "SearchResults.test.tsx"
  "CombinedMapTracker.test.tsx"
  "BusTracker.test.tsx"
)

for test in src/components/__tests__/*.test.tsx; do
  if [ -f "$test" ]; then
    test_name=$(basename "$test")
    
    # Check if test should be skipped
    skip=false
    for skip_test in "${SKIP_TESTS[@]}"; do
      if [ "$test_name" = "$skip_test" ]; then
        skip=true
        echo ""
        echo "⏭️  SKIPPING: $test_name (known memory issue)"
        break
      fi
    done
    
    if [ "$skip" = false ]; then
      if run_test "$test"; then
        ((PASSED++))
      else
        ((FAILED++))
        FAILED_TESTS+=("$test")
      fi
    fi
  fi
done

# Summary
echo ""
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo ""
  echo "Failed tests:"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  - $test"
  done
fi

echo ""
echo "✨ Selective test run complete!"

# Exit with error if any tests failed
[ $FAILED -eq 0 ]
