#!/bin/bash

# E2E Test Setup Script
# This script installs Playwright and sets up the E2E testing environment

set -e

echo "🚀 Setting up E2E Testing Environment for Perundhu..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🎭 Installing Playwright..."
npm install -D @playwright/test

echo "🌐 Installing Playwright browsers..."
npx playwright install

echo "🔧 Setting up test environment..."

# Create test results directory if it doesn't exist
mkdir -p test-results/screenshots

echo "✅ E2E testing environment setup complete!"
echo ""
echo "🎯 Available test commands:"
echo "  npm run test:e2e          - Run all E2E tests"
echo "  npm run test:e2e:ui       - Run tests with interactive UI"
echo "  npm run test:e2e:headed   - Run tests with browser visible"
echo "  npm run test:e2e:debug    - Debug tests"
echo "  npm run test:e2e:report   - View test reports"
echo ""
echo "📱 Test coverage includes:"
echo "  ✅ Search to bus list flow"
echo "  ✅ Mobile responsive design"
echo "  ✅ Cross-browser compatibility (Chrome, Firefox, Safari)"
echo "  ✅ Accessibility compliance"
echo "  ✅ Single-line layout verification"
echo "  ✅ All UI elements visibility"
echo ""
echo "🚀 Ready to run tests! Start your dev server first:"
echo "  npm run dev"
echo ""
echo "Then run tests in another terminal:"
echo "  npm run test:e2e"