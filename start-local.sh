#!/bin/bash

# =============================================================================
# Perundhu Local Development Startup Script
# =============================================================================
# This script starts/restarts all services for local development:
# - Backend (Spring Boot on port 8080)
# - Frontend (Vite on port 5173)
# - OCR Service (Python on port 8081)
# =============================================================================

# Don't exit on error - we want to continue even if some commands fail
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
OCR_DIR="$PROJECT_ROOT/ocr-service"
LOGS_DIR="$PROJECT_ROOT/logs"
PID_DIR="$PROJECT_ROOT/.pids"

# Ports
BACKEND_PORT=8080
FRONTEND_PORT=5173
OCR_PORT=8081

# Create directories if they don't exist
mkdir -p "$LOGS_DIR"
mkdir -p "$PID_DIR"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kill process on a specific port
kill_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        log_warning "Killing existing process(es) on port $port: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Kill processes by pattern
kill_pattern() {
    local pattern=$1
    pkill -9 -f "$pattern" 2>/dev/null || true
}

# Check if a port is in use
port_in_use() {
    lsof -ti :$1 >/dev/null 2>&1
}

# Wait for a service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=${3:-30}
    local attempt=1

    log_info "Waiting for $name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            log_success "$name is ready!"
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    log_error "$name failed to start within $((max_attempts * 2)) seconds"
    return 1
}

# =============================================================================
# Service Management Functions
# =============================================================================

stop_all_services() {
    log_info "Stopping all services..."
    
    # Kill backend
    kill_pattern "java.*perundhu"
    kill_pattern "gradlew"
    kill_port $BACKEND_PORT
    
    # Kill frontend
    kill_pattern "vite"
    kill_pattern "esbuild"
    kill_port $FRONTEND_PORT
    
    # Kill OCR service
    kill_pattern "ocr.*service"
    kill_pattern "paddleocr"
    kill_port $OCR_PORT
    
    sleep 2
    log_success "All services stopped"
}

start_ocr_service() {
    log_info "Starting OCR Service on port $OCR_PORT..."
    
    if [ -d "$OCR_DIR" ]; then
        (
            cd "$OCR_DIR"
            
            # Check if virtual environment exists
            if [ -d "venv" ]; then
                source venv/bin/activate
            elif [ -d ".venv" ]; then
                source .venv/bin/activate
            fi
            
            # Start OCR service with nohup and redirect all output
            nohup python app.py > "$LOGS_DIR/ocr-service.log" 2>&1 &
            echo $! > "$PID_DIR/ocr.pid"
        )
        log_info "OCR Service starting... (logs: $LOGS_DIR/ocr-service.log)"
    else
        log_warning "OCR Service directory not found at $OCR_DIR - skipping"
        log_info "OCR Service is optional. Backend will use mock data if OCR is unavailable."
    fi
}

start_backend() {
    log_info "Starting Backend on port $BACKEND_PORT..."
    
    (
        cd "$BACKEND_DIR"
        
        # Set environment variables
        export SPRING_PROFILES_ACTIVE=dev
        export OCR_SERVICE_ENABLED=true
        export OCR_SERVICE_URL=http://localhost:$OCR_PORT
        
        # Start backend with nohup - completely detached
        nohup ./gradlew bootRun > "$LOGS_DIR/backend.log" 2>&1 &
        echo $! > "$PID_DIR/backend.pid"
    )
    
    log_info "Backend starting... (logs: $LOGS_DIR/backend.log)"
}

start_frontend() {
    log_info "Starting Frontend on port $FRONTEND_PORT..."
    
    (
        cd "$FRONTEND_DIR"
        
        # Set environment variables
        export VITE_API_URL=http://localhost:$BACKEND_PORT
        export VITE_API_BASE_URL=http://localhost:$BACKEND_PORT
        
        # Start frontend with nohup - completely detached
        nohup npm run dev -- --port $FRONTEND_PORT > "$LOGS_DIR/frontend.log" 2>&1 &
        echo $! > "$PID_DIR/frontend.pid"
    )
    
    log_info "Frontend starting... (logs: $LOGS_DIR/frontend.log)"
}

check_services() {
    echo ""
    log_info "Checking service status..."
    echo "=================================="
    
    # Check OCR Service
    ocr_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://localhost:$OCR_PORT/health" 2>/dev/null || echo "000")
    if [ "$ocr_status" = "200" ]; then
        echo -e "OCR Service (port $OCR_PORT):     ${GREEN}✓ Running${NC}"
    else
        echo -e "OCR Service (port $OCR_PORT):     ${YELLOW}○ Not running (optional)${NC}"
    fi
    
    # Check Backend
    backend_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://localhost:$BACKEND_PORT/api/v1/bus-schedules/buses" 2>/dev/null || echo "000")
    if [ "$backend_status" = "200" ]; then
        echo -e "Backend (port $BACKEND_PORT):        ${GREEN}✓ Running${NC}"
    elif port_in_use $BACKEND_PORT; then
        echo -e "Backend (port $BACKEND_PORT):        ${YELLOW}○ Starting...${NC}"
    else
        echo -e "Backend (port $BACKEND_PORT):        ${RED}✗ Not running${NC}"
    fi
    
    # Check Frontend
    frontend_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "000")
    if [ "$frontend_status" = "200" ]; then
        echo -e "Frontend (port $FRONTEND_PORT):       ${GREEN}✓ Running${NC}"
    elif port_in_use $FRONTEND_PORT; then
        echo -e "Frontend (port $FRONTEND_PORT):       ${YELLOW}○ Starting...${NC}"
    else
        echo -e "Frontend (port $FRONTEND_PORT):       ${RED}✗ Not running${NC}"
    fi
    
    echo "=================================="
}

show_urls() {
    echo ""
    log_info "Access URLs:"
    echo "=================================="
    echo -e "  Frontend:    ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "  Backend API: ${GREEN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "  OCR Service: ${GREEN}http://localhost:$OCR_PORT${NC}"
    echo "=================================="
    echo ""
    echo "Logs are available at: $LOGS_DIR/"
    echo "  - backend.log"
    echo "  - frontend.log"
    echo "  - ocr-service.log"
    echo ""
}

# =============================================================================
# Main Script
# =============================================================================

main() {
    echo ""
    echo "=============================================="
    echo "  Perundhu Local Development Startup Script"
    echo "=============================================="
    echo ""
    
    # Parse command line arguments
    case "${1:-start}" in
        start|restart)
            stop_all_services
            
            echo ""
            log_info "Starting all services..."
            echo ""
            
            # Start services in subshells to avoid blocking
            start_ocr_service
            sleep 1
            
            start_backend
            sleep 1
            
            start_frontend
            
            echo ""
            log_success "All services launched in background!"
            echo ""
            
            # Show URLs immediately
            show_urls
            
            echo ""
            log_info "Services are starting up. Use './start-local.sh status' to check status."
            log_info "Backend typically takes 15-30 seconds to fully start."
            echo ""
            ;;
        
        stop)
            stop_all_services
            check_services
            ;;
        
        status)
            check_services
            show_urls
            ;;
        
        logs)
            log_info "Showing recent logs..."
            echo ""
            echo "=== Backend (last 20 lines) ==="
            tail -20 "$LOGS_DIR/backend.log" 2>/dev/null || echo "No backend logs found"
            echo ""
            echo "=== Frontend (last 10 lines) ==="
            tail -10 "$LOGS_DIR/frontend.log" 2>/dev/null || echo "No frontend logs found"
            echo ""
            echo "=== OCR Service (last 10 lines) ==="
            tail -10 "$LOGS_DIR/ocr-service.log" 2>/dev/null || echo "No OCR service logs found"
            ;;
        
        backend)
            log_info "Restarting backend only..."
            kill_pattern "java.*perundhu"
            kill_pattern "gradlew"
            kill_port $BACKEND_PORT
            sleep 2
            start_backend
            log_info "Backend restarting... Check status with './start-local.sh status'"
            ;;
        
        frontend)
            log_info "Restarting frontend only..."
            kill_pattern "vite"
            kill_pattern "esbuild"
            kill_port $FRONTEND_PORT
            sleep 2
            start_frontend
            log_info "Frontend restarting... Check status with './start-local.sh status'"
            ;;
        
        wait)
            log_info "Waiting for all services to be ready..."
            wait_for_service "http://localhost:$BACKEND_PORT/api/v1/bus-schedules/buses" "Backend" 60
            wait_for_service "http://localhost:$FRONTEND_PORT" "Frontend" 30
            check_services
            show_urls
            ;;
        
        help|--help|-h)
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  start     Start all services (default)"
            echo "  restart   Stop and restart all services"
            echo "  stop      Stop all services"
            echo "  status    Check status of all services"
            echo "  logs      Show recent logs from all services"
            echo "  backend   Restart backend only"
            echo "  frontend  Restart frontend only"
            echo "  wait      Start and wait for all services to be ready"
            echo "  help      Show this help message"
            echo ""
            ;;
        
        *)
            log_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
