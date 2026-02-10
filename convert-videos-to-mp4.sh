#!/bin/bash

###############################################################################
# Video Conversion Script
# Converts WebM videos to MP4 format suitable for Instagram/Facebook
# Requires: ffmpeg (install with: brew install ffmpeg)
###############################################################################

set -e

echo "🎥 Video Conversion to MP4 (Instagram/Facebook Ready)"
echo "====================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ ffmpeg is not installed${NC}"
    echo ""
    echo "Install ffmpeg:"
    echo "  macOS:   brew install ffmpeg"
    echo "  Ubuntu:  sudo apt install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org/download.html"
    echo ""
    exit 1
fi

VIDEO_DIR="demo-videos"
OUTPUT_DIR="demo-videos/mp4"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if input directory exists
if [ ! -d "$VIDEO_DIR" ]; then
    echo -e "${RED}❌ Video directory not found: $VIDEO_DIR${NC}"
    echo "Run ./record-demo-videos.sh first to record videos"
    exit 1
fi

# Function to convert video
convert_video() {
    local input=$1
    local output=$2
    local title=$3
    
    echo -e "${BLUE}🎬 Converting: $title${NC}"
    echo "   Input:  $input"
    echo "   Output: $output"
    
    ffmpeg -i "$input" \
        -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" \
        -c:v libx264 \
        -preset slow \
        -crf 18 \
        -c:a aac \
        -b:a 192k \
        -movflags +faststart \
        -y \
        "$output" 2>&1 | grep -E "frame=|time=|bitrate=|size=" || true
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Converted successfully${NC}"
        
        # Get file size
        size=$(du -h "$output" | cut -f1)
        echo -e "   File size: $size"
        echo ""
    else
        echo -e "${RED}❌ Conversion failed${NC}"
        echo ""
        return 1
    fi
}

echo -e "${YELLOW}Converting videos to MP4 format...${NC}"
echo ""

# Convert all WebM files
video_count=0
for webm_file in "$VIDEO_DIR"/*.webm; do
    if [ -f "$webm_file" ]; then
        filename=$(basename "$webm_file" .webm)
        mp4_file="$OUTPUT_DIR/${filename}.mp4"
        
        ((video_count++))
        convert_video "$webm_file" "$mp4_file" "$filename"
    fi
done

if [ $video_count -eq 0 ]; then
    echo -e "${RED}❌ No WebM videos found in $VIDEO_DIR${NC}"
    echo "Run ./record-demo-videos.sh first"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All videos converted successfully!${NC}"
echo ""
echo -e "${BLUE}📁 MP4 videos saved to: $OUTPUT_DIR${NC}"
echo ""
ls -lh "$OUTPUT_DIR"/*.mp4

echo ""
echo -e "${YELLOW}📝 Video Specs (optimized for Instagram/Facebook):${NC}"
echo "   Resolution: 1080x1920 (9:16 vertical)"
echo "   Format: MP4 (H.264)"
echo "   Audio: AAC, 192kbps"
echo "   Quality: High (CRF 18)"
echo "   Compatible: Instagram Reels, Facebook Reels, Stories"
echo ""
echo -e "${GREEN}🎉 Videos are ready to upload!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review videos in $OUTPUT_DIR"
echo "2. (Optional) Edit with CapCut/InShot for text overlays"
echo "3. Upload to Instagram & Facebook"
echo "4. Use captions from VIDEO_RECORDING_SCRIPT.md"
echo ""
