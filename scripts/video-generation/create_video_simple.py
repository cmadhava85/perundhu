#!/usr/bin/env python3
"""
Create promotional video using FFmpeg (simpler, no moviepy dependency)
Combines images, text overlays, and audio to create final video
"""

import os
import subprocess
from pathlib import Path

# Directories
SCRIPT_DIR = Path(__file__).parent
AUDIO_DIR = SCRIPT_DIR / "output" / "audio"
ASSETS_DIR = SCRIPT_DIR / "assets"
OUTPUT_DIR = SCRIPT_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Video settings
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920  # 9:16 vertical format
FPS = 30

# Scenes configuration (matching voice-over)
SCENES = [
    {"id": "scene1", "duration": 4, "color": "#1E40AF"},   # Dark blue
    {"id": "scene2", "duration": 6, "color": "#7C3AED"},   # Purple
    {"id": "scene3", "duration": 8, "color": "#059669"},   # Green
    {"id": "scene4", "duration": 7, "color": "#DC2626"},   # Red
    {"id": "scene5", "duration": 5, "color": "#EA580C"},   # Orange
]


def create_solid_color_video(color, duration, output_file):
    """Create a solid color video using FFmpeg"""
    
    # Convert hex color to RGB
    color = color.lstrip('#')
    r, g, b = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
    
    cmd = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', f'color=c=0x{color}:s={VIDEO_WIDTH}x{VIDEO_HEIGHT}:d={duration}:r={FPS}',
        '-pix_fmt', 'yuv420p',
        output_file
    ]
    
    subprocess.run(cmd, check=True, capture_output=True)


def combine_video_with_audio(video_file, audio_file, output_file):
    """Add audio track to video"""
    
    cmd = [
        'ffmpeg', '-y',
        '-i', video_file,
        '-i', audio_file,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-shortest',
        output_file
    ]
    
    subprocess.run(cmd, check=True, capture_output=True)


def concatenate_videos(video_files, output_file):
    """Concatenate multiple videos"""
    
    # Create concat list file
    concat_file = OUTPUT_DIR / 'concat_list.txt'
    with open(concat_file, 'w') as f:
        for video in video_files:
            f.write(f"file '{video}'\n")
    
    cmd = [
        'ffmpeg', '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', str(concat_file),
        '-c', 'copy',
        output_file
    ]
    
    subprocess.run(cmd, check=True, capture_output=True)
    concat_file.unlink()  # Clean up


def create_video():
    """Create the complete promotional video"""
    
    print("=" * 60)
    print("🎬 Creating Perundhu Promotional Video")
    print("=" * 60)
    
    # Check if audio files exist
    audio_files = list(AUDIO_DIR.glob("*.mp3"))
    if not audio_files:
        print("\n⚠️  No audio files found!")
        print("   Run generate_voiceover.py first to create audio files")
        print(f"   Expected location: {AUDIO_DIR}\n")
        return
    
    print(f"\n📦 Found {len(audio_files)} audio file(s)")
    print("\n🎥 Creating video scenes with FFmpeg...\n")
    
    # Create each scene
    scene_videos = []
    for i, scene in enumerate(SCENES):
        scene_id = scene["id"]
        duration = scene["duration"]
        color = scene["color"]
        
        print(f"{'─' * 50}")
        print(f"📹 Scene {i+1}/5: {scene_id}")
        print(f"   Duration: {duration}s | Color: {color}")
        
        # Create solid color video
        temp_video = OUTPUT_DIR / f"temp_{scene_id}.mp4"
        print(f"   Creating base video...")
        create_solid_color_video(color, duration, str(temp_video))
        
        # Add audio if available
        audio_file = AUDIO_DIR / f"{scene_id}.mp3"
        if audio_file.exists():
            scene_video = OUTPUT_DIR / f"{scene_id}.mp4"
            print(f"   Adding audio: {audio_file.name}")
            combine_video_with_audio(str(temp_video), str(audio_file), str(scene_video))
            temp_video.unlink()  # Remove temp file
            scene_videos.append(str(scene_video))
            print(f"   ✅ {scene_id} complete")
        else:
            print(f"   ⚠️  Audio not found: {audio_file.name}")
            scene_videos.append(str(temp_video))
    
    print(f"\n{'─' * 50}")
    print("🎞️  Concatenating all scenes...")
    
    # Concatenate all scenes
    output_file = OUTPUT_DIR / "perundhu_promo.mp4"
    concatenate_videos(scene_videos, str(output_file))
    
    # Clean up individual scene files
    print("🧹 Cleaning up temporary files...")
    for video in scene_videos:
        Path(video).unlink()
    
    print("\n" + "=" * 60)
    print("✨ Video creation complete!")
    print("=" * 60)
    print(f"\n📹 Video file: {output_file}")
    print(f"📊 Duration: {sum(s['duration'] for s in SCENES)} seconds")
    print(f"🎨 Resolution: {VIDEO_WIDTH}x{VIDEO_HEIGHT} (9:16)")
    print(f"🔊 Audio: Tamil voice-over from Google Cloud TTS")
    print("\n💡 Note: This version uses solid colors. For better visuals:")
    print("   1. Add images to assets/ folder")
    print("   2. Use video editing software (CapCut/Canva) to add text overlays")
    print("   3. Import this video and add text according to SOCIAL_MEDIA_VIDEO_SCRIPT.md")
    print("\n🚀 Ready to upload to Instagram Reels, YouTube Shorts, or Facebook!")


if __name__ == "__main__":
    try:
        create_video()
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error running FFmpeg: {e}")
        print("   Ensure FFmpeg is installed: brew install ffmpeg")
    except Exception as e:
        print(f"\n❌ Error: {e}")
