#!/bin/bash
# Quick restart script for applying AdSense configuration changes

echo "════════════════════════════════════════════════════════════════"
echo "  RESTARTING FRONTEND WITH NEW ADSENSE CONFIGURATION"
echo "════════════════════════════════════════════════════════════════"
echo ""

cd frontend || exit 1

echo "✅ Updated configurations:"
echo "   • Ad Slot IDs: 9202659090, 8194827621"
echo "   • Format: Auto-responsive (matches AdSense dashboard)"
echo "   • CSP: Updated with all required domains"
echo ""

echo "🛑 Stopping existing dev server..."
pkill -f "vite" 2>/dev/null || true

echo ""
echo "🔄 Rebuilding with new configuration..."
echo ""

# Clear Vite cache to ensure new env vars are loaded
rm -rf node_modules/.vite 2>/dev/null || true

# Start dev server
echo "🚀 Starting dev server..."
npm run dev

# Note: Keep this terminal open, dev server will run here
