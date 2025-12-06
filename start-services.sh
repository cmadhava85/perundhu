#!/bin/bash
# Start all Perundhu services locally (without Docker)
# Usage: ./start-services.sh [dev|prod|test]
# 
# Note: Image processing is handled by Gemini Vision AI (no separate OCR service needed)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV="${1:-dev}"

echo "=========================================="
echo "  Starting Perundhu Services ($ENV)"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Waiting for $name to be ready...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $name is ready${NC}"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    echo -e "${RED}✗ $name failed to start${NC}"
    return 1
}

# Stop any existing services
echo ""
echo "Checking for existing services..."

if check_port 8080; then
    echo -e "${YELLOW}Backend already running on port 8080${NC}"
    read -p "Kill existing backend? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $(lsof -t -i:8080) 2>/dev/null || true
        sleep 2
    fi
fi

# Start Java Backend
echo ""
echo "=========================================="
echo "  Starting Java Backend"
echo "=========================================="

cd "$SCRIPT_DIR/backend"

# Set Spring profile
export SPRING_PROFILES_ACTIVE=$ENV

echo "Starting backend with profile: $ENV"
nohup ./gradlew bootRun > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
wait_for_service "http://localhost:8080/actuator/health" "Backend"

# Summary
echo ""
echo "=========================================="
echo "  Services Started Successfully"
echo "=========================================="
echo ""
echo -e "${GREEN}Backend:${NC}      http://localhost:8080 (PID: $BACKEND_PID)"
echo ""
echo "Logs:"
echo "  - Backend: $SCRIPT_DIR/logs/backend.log"
echo ""
echo "Note: Image processing is handled by Gemini Vision AI"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID"
echo ""
echo "Or use: ./stop-services.sh"
