#!/bin/bash

# Quick application health check script
echo "=== Perundhu Backend Health Check ==="

# Check if MySQL is running
if pgrep -x "mysqld" > /dev/null; then
    echo "✅ MySQL is running"
else
    echo "❌ MySQL is not running. Please start MySQL first:"
    echo "   brew services start mysql"
    exit 1
fi

# Check if port 8080 is available
if lsof -i :8080 > /dev/null 2>&1; then
    echo "⚠️  Port 8080 is already in use. You may need to stop other applications."
    lsof -i :8080
else
    echo "✅ Port 8080 is available"
fi

# Check Gradle wrapper
if [ -f "./gradlew" ]; then
    echo "✅ Gradle wrapper found"
else
    echo "❌ Gradle wrapper not found"
    exit 1
fi

# Test Gradle compilation
echo "🔄 Testing compilation..."
./gradlew compileJava --no-configuration-cache -q
if [ $? -eq 0 ]; then
    echo "✅ Code compiles successfully"
else
    echo "❌ Compilation failed"
    exit 1
fi

echo ""
echo "🚀 Backend health check completed!"
echo "Next steps:"
echo "1. Run: ./setup-database.sh (to set up database)"
echo "2. Run: ./gradlew bootRun (to start the application)"