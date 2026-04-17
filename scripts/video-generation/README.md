# Perundhu Video Generation

Automated video creation with Tamil voice-over for social media promotion.

## 🎯 Features

- Tamil voice-over using Google Cloud Text-to-Speech
- Vertical video format (9:16) for Reels/Shorts
- Automated scene generation
- Text overlays with Tamil font support
- Background images and effects
- Complete 30-second promotional video

## 📋 Prerequisites

1. **Google Cloud Project** (already set up: `perundhu-prod-001`)
2. **Python 3.9+**
3. **FFmpeg** (for video processing)
4. **GCP credentials** with Text-to-Speech API enabled

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd scripts/video-generation
pip install -r requirements.txt
```

### Step 2: Enable Google Cloud Text-to-Speech API

```bash
# Ensure you're in the perundhu-prod-001 project
gcloud config set project perundhu-prod-001

# Enable Text-to-Speech API
gcloud services enable texttospeech.googleapis.com

# Create service account (if not already exists)
gcloud iam service-accounts create video-generator \
  --display-name="Video Generation Service Account"

# Grant required permissions
gcloud projects add-iam-policy-binding perundhu-prod-001 \
  --member="serviceAccount:video-generator@perundhu-prod-001.iam.gserviceaccount.com" \
  --role="roles/cloudtexttospeech.user"

# Download credentials
gcloud iam service-accounts keys create ~/perundhu-video-key.json \
  --iam-account=video-generator@perundhu-prod-001.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS=~/perundhu-video-key.json
```

### Step 3: Generate Tamil Voice-Overs

```bash
python generate_voiceover.py
```

**Output:** 5 MP3 files in `output/audio/`:
- `scene1.mp3` - Hook (4s)
- `scene2.mp3` - Relate to audience (6s)
- `scene3.mp3` - Introduce app (8s)
- `scene4.mp3` - Emotional appeal (7s)
- `scene5.mp3` - Call to action (5s)

### Step 4: Prepare Background Images (Optional)

Place images in `assets/` directory:

```
assets/
  ├── bus_stop.jpg       # Busy bus stop scene
  ├── commuters.jpg      # People waiting/commuting
  ├── app_screenshot.jpg # Perundhu app screenshot
  ├── helping.jpg        # Community helping scene
  └── logo.jpg           # Perundhu branding
```

**Note:** If images are not provided, the script will use solid color backgrounds.

### Step 5: Create the Video

```bash
python create_video.py
```

**Output:** `output/perundhu_promo.mp4`

## 📦 Output

- **Format:** MP4 (H.264 + AAC)
- **Resolution:** 1080x1920 (9:16 vertical)
- **Duration:** 30 seconds
- **FPS:** 30
- **Bitrate:** 5000k (high quality)
- **File size:** ~15-25 MB

## 🎨 Customization

### Change Voice Gender

Edit `generate_voiceover.py`:

```python
voice = texttospeech.VoiceSelectionParams(
    language_code="ta-IN",
    name="ta-IN-Standard-B",  # Male voice (change from A to B)
)
```

### Adjust Speaking Speed

```python
audio_config = texttospeech.AudioConfig(
    audio_encoding=texttospeech.AudioEncoding.MP3,
    speaking_rate=1.1,  # 1.0 = normal, 0.8 = slower, 1.2 = faster
)
```

### Change Text or Duration

Edit `create_video.py` SCENES array:

```python
SCENES = [
    {
        "id": "scene1",
        "duration": 5,  # Change duration
        "text": "Your custom Tamil text",  # Change text
        "text_size": 80,  # Change font size
        # ...
    }
]
```

## 💰 Cost Analysis

### Google Cloud Text-to-Speech Pricing

- **Free Tier:** 4 million characters/month
- **Script Character Count:** ~500 characters (all 5 scenes)
- **Cost for this video:** **$0.00** (well within free tier)

Even if you generate 100 variations, you'll stay within the free tier.

## 🔧 Troubleshooting

### Error: "No audio files found"

Run `generate_voiceover.py` first before `create_video.py`.

### Error: "Could not find Tamil font"

The script will automatically fall back to Arial. For better Tamil rendering:

```bash
# macOS
brew tap homebrew/cask-fonts
brew install font-noto-sans-tamil

# Ubuntu/Debian
sudo apt-get install fonts-noto-tamil

# Windows
# Download from: https://fonts.google.com/noto/specimen/Noto+Sans+Tamil
```

### Error: "FFmpeg not found"

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
# Download from: https://ffmpeg.org/download.html
```

### Error: "GCP credentials not found"

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/key.json
```

## 📱 Post-Production

After generating the video:

1. **Preview:** Open `output/perundhu_promo.mp4` in any video player
2. **Minor edits:** Import into CapCut or Canva for final touches
3. **Add captions:** Use platform's auto-caption feature (Instagram/YouTube)
4. **Upload:** Direct upload to Instagram Reels, YouTube Shorts, Facebook Reels

## 🎯 Next Steps

1. Generate the video with your script
2. Preview and test on mobile device
3. Adjust text sizes/durations if needed
4. Add real images for better visual impact
5. Upload to social media platforms

## 📊 File Structure

```
video-generation/
├── README.md                 # This file
├── requirements.txt          # Python dependencies
├── generate_voiceover.py     # Step 1: Generate Tamil audio
├── create_video.py           # Step 2: Create final video
├── assets/                   # Background images (optional)
│   ├── bus_stop.jpg
│   ├── commuters.jpg
│   └── ...
└── output/
    ├── audio/                # Generated voice-overs
    │   ├── scene1.mp3
    │   └── ...
    └── perundhu_promo.mp4    # Final video output
```

## 🚀 One-Command Generation

Create a bash script for complete automation:

```bash
#!/bin/bash
# generate_all.sh

echo "🎬 Generating Perundhu promotional video..."

echo "1️⃣  Generating Tamil voice-overs..."
python generate_voiceover.py

echo "2️⃣  Creating video..."
python create_video.py

echo "✅ Done! Video saved to: output/perundhu_promo.mp4"
```

Run with:
```bash
chmod +x generate_all.sh
./generate_all.sh
```

## 📞 Support

If you encounter issues:
1. Check the error message carefully
2. Verify all prerequisites are installed
3. Ensure GCP credentials are set correctly
4. Review the troubleshooting section above
