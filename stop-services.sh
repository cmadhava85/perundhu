#!/bin/bash
# Stop all Perundhu services
# Usage: ./stop-services.sh

echo "=========================================="
echo "  Stopping Perundhu Services"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Stop OCR service
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Stopping OCR service on port 8081..."
    kill $(lsof -t -i:8081) 2>/dev/null
    echo -e "${GREEN}✓ OCR service stopped${NC}"
else
    echo -e "${RED}OCR service not running${NC}"
fi

# Stop backend
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Stopping backend on port 8080..."
    kill $(lsof -t -i:8080) 2>/dev/null
    echo -e "${GREEN}✓ Backend stopped${NC}"
else
    echo -e "${RED}Backend not running${NC}"
fi

# Kill any remaining Python OCR processes
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "gradlew.*bootRun" 2>/dev/null || true

echo ""
echo -e "${GREEN}All services stopped${NC}"
