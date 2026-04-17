#!/bin/bash
# Complete automation script for video generation

set -e  # Exit on error

echo "========================================"
echo "🎬 Perundhu Video Generation Pipeline"
echo "========================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not found. Please install FFmpeg"
    echo "   macOS: brew install ffmpeg"
    echo "   Ubuntu: sudo apt-get install ffmpeg"
    exit 1
fi

# Check GCP credentials
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  Warning: GOOGLE_APPLICATION_CREDENTIALS not set"
    echo "   Looking for credentials in default locations..."
    
    # Try to find credentials
    if [ -f "$HOME/.config/gcloud/application_default_credentials.json" ]; then
        export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/gcloud/application_default_credentials.json"
        echo "✅ Found credentials: $GOOGLE_APPLICATION_CREDENTIALS"
    else
        echo "❌ No credentials found. Please set:"
        echo "   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json"
        exit 1
    fi
fi

echo ""
echo "✅ Prerequisites check passed"
echo ""

# Install dependencies if needed
if ! python3 -c "import moviepy" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    pip3 install -r requirements.txt
    echo ""
fi

# Step 1: Generate voice-overs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Generating Tamil voice-overs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python3 generate_voiceover.py

if [ $? -ne 0 ]; then
    echo "❌ Voice-over generation failed"
    exit 1
fi

echo ""

# Step 2: Create video
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Creating promotional video..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python3 create_video.py

if [ $? -ne 0 ]; then
    echo "❌ Video creation failed"
    exit 1
fi

echo ""
echo "========================================"
echo "✨ Video generation complete!"
echo "========================================"
echo ""
echo "📹 Video location: output/perundhu_promo.mp4"
echo "🎤 Audio files: output/audio/*.mp3"
echo ""
echo "🚀 Next steps:"
echo "   1. Preview the video"
echo "   2. Upload to Instagram Reels / YouTube Shorts"
echo "   3. Share on social media!"
echo ""

# Open video if on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🎥 Opening video preview..."
    open output/perundhu_promo.mp4
fi
