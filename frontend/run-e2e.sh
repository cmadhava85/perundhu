#!/bin/bash

# DEAD SIMPLE E2E Test Runner
# No more frustration!

set -e  # Exit on error

echo "🚀 Perundhu E2E Tests"
echo ""

# Step 1: Clean up
echo "1️⃣  Cleaning up existing servers..."
pkill -f "vite" 2>/dev/null || true
sleep 1

# Step 2: Start dev server
echo "2️⃣  Starting dev server..."
npm run dev &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"

# Step 3: Wait for server
echo "3️⃣  Waiting for server to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Server is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "   ❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
  sleep 1
  echo -n "."
done
echo ""

# Step 4: Run tests
echo "4️⃣  Running tests..."
echo ""
npx playwright test "$@"
TEST_RESULT=$?

# Step 5: Cleanup
echo ""
echo "5️⃣  Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Done
echo ""
if [ $TEST_RESULT -eq 0 ]; then
  echo "✅ SUCCESS - All tests passed!"
else
  echo "❌ FAILED - Check errors above"
fi

exit $TEST_RESULT
