#!/bin/bash
# Process a full app recording and split into 6 scenes

if [ $# -eq 0 ]; then
    echo "Usage: $0 <path-to-recording.mov>"
    echo ""
    echo "Example:"
    echo "  $0 ~/Desktop/Screen\ Recording\ 2026-04-06.mov"
    exit 1
fi

INPUT_VIDEO="$1"
OUTPUT_DIR="$(dirname "$0")/assets/screens"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 Processing: $INPUT_VIDEO"
echo "📁 Output: $OUTPUT_DIR"
echo ""

# Check if input file exists
if [ ! -f "$INPUT_VIDEO" ]; then
    echo "❌ Error: File not found: $INPUT_VIDEO"
    exit 1
fi

# Get video duration
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT_VIDEO")
echo "⏱️  Video duration: ${DURATION}s"
echo ""

if (( $(echo "$DURATION < 50" | bc -l) )); then
    echo "⚠️  Warning: Video is shorter than 60 seconds"
    echo "   Consider recording again for full walkthrough"
fi

echo "🎞️  Splitting into 6 scenes..."
echo ""

# Scene 1: 0-5s (Launch)
echo "📹 Scene 1: App Launch (0-5s)"
ffmpeg -i "$INPUT_VIDEO" -ss 0 -t 5 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -c:v libx264 -preset fast -y "$OUTPUT_DIR/scene1_launch.mp4" 2>&1 | grep -E "(Duration|time=)" | tail -1

# Scene 2: 5-15s (Search)
echo "📹 Scene 2: Search (5-15s)"
ffmpeg -i "$INPUT_VIDEO" -ss 5 -t 10 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -c:v libx264 -preset fast -y "$OUTPUT_DIR/scene2_search.mp4" 2>&1 | grep -E "(Duration|time=)" | tail -1

# Scene 3: 15-28s (Results)
echo "📹 Scene 3: Results (15-28s)"
ffmpeg -i "$INPUT_VIDEO" -ss 15 -t 13 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -c:v libx264 -preset fast -y "$OUTPUT_DIR/scene3_results.mp4" 2>&1 | grep -E "(Duration|time=)" | tail -1

# Scene 4: 28-40s (Stops)
echo "📹 Scene 4: Stops (28-40s)"
ffmpeg -i "$INPUT_VIDEO" -ss 28 -t 12 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -c:v libx264 -preset fast -y "$OUTPUT_DIR/scene4_stops.mp4" 2>&1 | grep -E "(Duration|time=)" | tail -1

# Scene 5: 40-52s (Contribute)
echo "📹 Scene 5: Contribute (40-52s)"
ffmpeg -i "$INPUT_VIDEO" -ss 40 -t 12 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -c:v libx264 -preset fast -y "$OUTPUT_DIR/scene5_contribute.mp4" 2>&1 | grep -E "(Duration|time=)" | tail -1

# Scene 6: 52-60s (CTA)
echo "📹 Scene 6: Call to Action (52-60s)"
ffmpeg -i "$INPUT_VIDEO" -ss 52 -t 8 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black" -c:v libx264 -preset fast -y "$OUTPUT_DIR/scene6_cta.mp4" 2>&1 | grep -E "(Duration|time=)" | tail -1

echo ""
echo "✅ All scenes created!"
echo ""
echo "📦 Created files:"
ls -lh "$OUTPUT_DIR"/*.mp4
echo ""
echo "🎬 Next step: Generate final video with screens"
echo "   cd ~/Documents/project/perundhu/scripts/video-generation"
echo "   source venv/bin/activate"
echo "   python create_video_v2.py"
