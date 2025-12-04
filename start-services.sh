#!/bin/bash
# Start all Perundhu services locally (without Docker)
# Usage: ./start-services.sh [dev|prod|test]

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

if check_port 8081; then
    echo -e "${YELLOW}OCR service already running on port 8081${NC}"
    read -p "Kill existing OCR service? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $(lsof -t -i:8081) 2>/dev/null || true
        sleep 2
    fi
fi

if check_port 8080; then
    echo -e "${YELLOW}Backend already running on port 8080${NC}"
    read -p "Kill existing backend? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $(lsof -t -i:8080) 2>/dev/null || true
        sleep 2
    fi
fi

# Start OCR Service
echo ""
echo "=========================================="
echo "  Starting OCR Service (PaddleOCR)"
echo "=========================================="

cd "$SCRIPT_DIR/ocr-service"

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate venv and install dependencies
echo "Installing dependencies..."
source venv/bin/activate
pip install -q -r requirements.txt

# Start OCR service in background
echo "Starting OCR service on port 8081..."
nohup python main.py > ../logs/ocr-service.log 2>&1 &
OCR_PID=$!
echo "OCR service started with PID: $OCR_PID"

# Wait for OCR service to be ready
wait_for_service "http://localhost:8081/health" "OCR Service"

# Start Java Backend
echo ""
echo "=========================================="
echo "  Starting Java Backend"
echo "=========================================="

cd "$SCRIPT_DIR/backend"

# Set Spring profile
export SPRING_PROFILES_ACTIVE=$ENV
export OCR_SERVICE_ENABLED=true
export OCR_SERVICE_URL=http://localhost:8081

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
echo -e "${GREEN}OCR Service:${NC}  http://localhost:8081 (PID: $OCR_PID)"
echo -e "${GREEN}Backend:${NC}      http://localhost:8080 (PID: $BACKEND_PID)"
echo ""
echo "Logs:"
echo "  - OCR Service: $SCRIPT_DIR/logs/ocr-service.log"
echo "  - Backend:     $SCRIPT_DIR/logs/backend.log"
echo ""
echo "To stop services:"
echo "  kill $OCR_PID $BACKEND_PID"
echo ""
echo "Or use: ./stop-services.sh"
