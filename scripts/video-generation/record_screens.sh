#!/bin/bash
# Quick screen recording script for Perundhu app
# This will help you record your deployed frontend

echo "🎬 Perundhu App Screen Recording Helper"
echo "========================================"
echo ""
echo "This script will guide you through recording your app screens."
echo ""

# Check if frontend is running
echo "Step 1: Start your frontend"
echo "----------------------------"
echo "Run this command in a new terminal:"
echo "  cd ~/Documents/project/perundhu/frontend && npm run dev"
echo ""
read -p "Is your frontend running? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please start the frontend first!"
    exit 1
fi

echo ""
echo "Step 2: Open Browser in Mobile Mode"
echo "------------------------------------"
echo "1. Open Chrome/Safari"
echo "2. Go to: http://localhost:5173 (or your frontend URL)"
echo "3. Open DevTools: ⌘+⌥+I (Mac) or F12 (Windows)"
echo "4. Toggle device toolbar: ⌘+⇧+M (Mac) or Ctrl+Shift+M (Windows)"
echo "5. Select device: iPhone 14 Pro (390x844)"
echo ""
read -p "Browser ready in mobile mode? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please set up browser first!"
    exit 1
fi

echo ""
echo "Step 3: Record Your Screen"
echo "--------------------------"
echo "🎥 On macOS:"
echo "   1. Press: ⌘+⇧+5"
echo "   2. Click 'Record Selected Portion'"
echo "   3. Select the mobile browser window"
echo "   4. Click 'Record'"
echo "   5. Perform the walkthrough (see below)"
echo "   6. Press 'Stop' in menu bar when done"
echo ""
echo "📱 Walkthrough Actions (60 seconds):"
echo "   0-5s:  Show home page"
echo "   5-15s: Type Chennai → Madurai and search"
echo "   15-28s: View results, try filters, try sorting"
echo "   28-40s: Click a bus to see stops"
echo "   40-52s: Navigate to Contribute, fill form"
echo "   52-60s: Back to home, show overview"
echo ""
read -p "Ready to start recording? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🎬 Recording in 3... 2... 1... GO!"
    echo ""
    echo "⏱️  Keep your recording around 60 seconds"
    echo ""
fi

echo ""
echo "Step 4: After Recording"
echo "-----------------------"
echo "Your video was saved to ~/Desktop/Screen Recording [date].mov"
echo ""
echo "Run this to split it into scenes:"
echo ""
echo "  cd ~/Documents/project/perundhu/scripts/video-generation"
echo "  ./process_recording.sh ~/Desktop/Screen\ Recording*.mov"
echo ""

echo "💡 Or if you prefer, just save as:"
echo "   ~/Documents/project/perundhu/scripts/video-generation/assets/screens/full_recording.mp4"
echo "   And I'll help you split it!"
