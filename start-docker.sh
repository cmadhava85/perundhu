#!/bin/bash

#################################################################
# Docker Daemon Starter for macOS
# 
# Starts Docker daemon and waits for it to be ready
# Usage: bash start-docker.sh
#################################################################

set -e

echo ""
echo "🐳 Starting Docker daemon..."
echo ""

# Method 1: Try using launchctl if installed via Homebrew
if command -v colima &> /dev/null; then
    echo "📍 Starting Colima (Docker backend)..."
    colima start
elif [ -f /usr/local/bin/docker-app ]; then
    echo "📍 Starting Docker Desktop via launchctl..."
    launchctl start com.docker.vmnetd || true
else
    echo "📍 Starting Docker Desktop directly..."
    # Direct launch of Docker Desktop
    nohup /Applications/Docker.app/Contents/MacOS/Docker > /tmp/docker-daemon.log 2>&1 &
    sleep 5
fi

# Wait for Docker daemon to be ready
echo "⏳ Waiting for Docker daemon to start..."
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker ps > /dev/null 2>&1; then
        echo "✅ Docker daemon is ready!"
        echo ""
        docker --version
        echo ""
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    if [ $((ATTEMPT % 10)) -eq 0 ]; then
        echo "⏳ Still waiting... (${ATTEMPT}/${MAX_ATTEMPTS})"
    fi
    sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ Docker daemon failed to start after ${MAX_ATTEMPTS} seconds"
    echo "   Try manually: Open /Applications/Docker.app"
    exit 1
fi

echo "✅ Docker is ready to use!"
echo ""
