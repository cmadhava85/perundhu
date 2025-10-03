#!/bin/bash

echo "🔧 Fixing page rerendering issue..."

# Kill multiple Vite processes to prevent conflicts
echo "🛑 Stopping multiple Vite instances..."
pkill -f "vite" || true

# Wait a moment for processes to terminate
sleep 2

# Clear Vite cache
echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf dist

# Clear browser cache for localhost
echo "🌐 Instructions to clear browser cache:"
echo "  1. Open DevTools (F12)"
echo "  2. Right-click on refresh button"
echo "  3. Select 'Empty Cache and Hard Reload'"
echo "  4. Or use Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)"

# Restart single Vite instance
echo "🚀 Starting single Vite development server..."
npm run dev

echo "✅ Reload issue fix applied!"
echo "📍 Server should now be running on http://localhost:5173"
echo "🔍 Monitor reload-debug.html at: http://localhost:5173/reload-debug.html"