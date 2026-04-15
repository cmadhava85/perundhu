#!/bin/bash

###############################################################################
# Automated Demo Video Recording Script
# This script records all 3 promotional videos automatically
###############################################################################

set -e

echo "🎬 Perundhu Demo Video Recording Script"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from frontend directory${NC}"
    echo "Usage: cd frontend && ../record-demo-videos.sh"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check if Playwright browsers are installed
if [ ! -d "node_modules/.cache/ms-playwright" ]; then
    echo -e "${YELLOW}🌐 Installing Playwright browsers...${NC}"
    npx playwright install chromium
fi

# Create output directory for videos
VIDEO_OUTPUT_DIR="../scripts/video-generation/output"
mkdir -p "$VIDEO_OUTPUT_DIR"

echo ""
echo -e "${BLUE}📹 Starting video recording process...${NC}"
echo ""

# Function to extract and move video
extract_video() {
    local test_name=$1
    local output_name=$2
    
    echo -e "${YELLOW}🔍 Finding video for $test_name...${NC}"
    
    # Find the most recent video file
    video_file=$(find test-results -name "video.webm" -type f -print0 | xargs -0 ls -t | head -1)
    
    if [ -f "$video_file" ]; then
        echo -e "${GREEN}✅ Found video: $video_file${NC}"
        cp "$video_file" "$VIDEO_OUTPUT_DIR/$output_name.webm"
        echo -e "${GREEN}✅ Copied to: $VIDEO_OUTPUT_DIR/$output_name.webm${NC}"
        return 0
    else
        echo -e "${RED}❌ Video not found for $test_name${NC}"
        return 1
    fi
}

# Clean up old test results
echo -e "${YELLOW}🧹 Cleaning up old test results...${NC}"
rm -rf test-results playwright-report

echo ""
echo -e "${BLUE}🎬 Recording Video 1: Search & Results Demo${NC}"
echo "Duration: ~20-25 seconds"
echo "----------------------------------------"
npx playwright test search-demo.spec.ts --config=playwright.config.video.ts
extract_video "search-demo" "01-search-and-results"

echo ""
echo -e "${BLUE}🎬 Recording Video 2: Stop Details Demo${NC}"
echo "Duration: ~20-25 seconds"
echo "----------------------------------------"
npx playwright test stops-demo.spec.ts --config=playwright.config.video.ts
extract_video "stops-demo" "02-stop-details"

echo ""
echo -e "${BLUE}🎬 Recording Video 3: Contribution Demo${NC}"
echo "Duration: ~25-30 seconds"
echo "----------------------------------------"
npx playwright test contribution-demo.spec.ts --config=playwright.config.video.ts
extract_video "contribution-demo" "03-contribution"

echo ""
echo -e "${GREEN}✅ All videos recorded successfully!${NC}"
echo ""
echo -e "${BLUE}📁 Videos saved to: $VIDEO_OUTPUT_DIR${NC}"
echo ""
ls -lh "$VIDEO_OUTPUT_DIR"/*.webm 2>/dev/null

echo ""
echo -e "${BLUE}🎬 Converting videos to MP4 format for social media...${NC}"
echo ""

# Convert to MP4 using ffmpeg
cd ..
bash convert-videos-to-mp4.sh

echo ""
echo -e "${GREEN}🎉 Done! Videos are ready for social media!${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Review MP4 videos in: scripts/video-generation/output/mp4/"
echo "2. (Optional) Edit with CapCut/InShot for text overlays"
echo "3. Upload to Instagram Reels & Facebook Reels"
echo "4. Use captions from VIDEO_RECORDING_SCRIPT.md"
echo ""
