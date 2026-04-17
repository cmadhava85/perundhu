#!/usr/bin/env python3
"""
Create enhanced 60-second promotional video with real app screen recordings
Combines screen recordings, Tamil voice-over, and text overlays
"""

import os
import subprocess
from pathlib import Path

# Directories
SCRIPT_DIR = Path(__file__).parent
AUDIO_DIR = SCRIPT_DIR / "output" / "audio_v2"
SCREENS_DIR = SCRIPT_DIR / "assets" / "screens"
OUTPUT_DIR = SCRIPT_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Video settings
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920  # 9:16 vertical format
FPS = 30

# Scenes configuration with screen recordings
SCENES = [
    {
        "id": "scene1",
        "duration": 5,
        "screen": "scene1_launch.mp4",  # App launch screen
        "fallback_color": "#6366F1"  # Indigo
    },
    {
        "id": "scene2",
        "duration": 10,
        "screen": "scene2_search.mp4",  # Search page walkthrough
        "fallback_color": "#8B5CF6"  # Purple
    },
    {
        "id": "scene3",
        "duration": 13,
        "screen": "scene3_results.mp4",  # Search results with filters
        "fallback_color": "#10B981"  # Green
    },
    {
        "id": "scene4",
        "duration": 12,
        "screen": "scene4_stops.mp4",  # Bus stops timeline
        "fallback_color": "#3B82F6"  # Blue
    },
    {
        "id": "scene5",
        "duration": 12,
        "screen": "scene5_contribute.mp4",  # Contribution form
        "fallback_color": "#F59E0B"  # Amber
    },
    {
        "id": "scene6",
        "duration": 8,
        "screen": "scene6_cta.mp4",  # Call to action
        "fallback_color": "#EF4444"  # Red
    }
]


def check_screen_recordings():
    """Check if screen recording files exist"""
    missing_files = []
    for scene in SCENES:
        screen_file = SCREENS_DIR / scene["screen"]
        if not screen_file.exists():
            missing_files.append(scene["screen"])
    
    return missing_files


def create_solid_color_video(color, duration, output_file):
    """Create a solid color video using FFmpeg as fallback"""
    
    # Convert hex color to RGB
    color = color.lstrip('#')
    
    cmd = [
        'ffmpeg', '-y',
        '-f', 'lavfi',
        '-i', f'color=c=0x{color}:s={VIDEO_WIDTH}x{VIDEO_HEIGHT}:d={duration}:r={FPS}',
        '-pix_fmt', 'yuv420p',
        output_file
    ]
    
    subprocess.run(cmd, check=True, capture_output=True)


def trim_and_resize_screen(screen_file, duration, output_file):
    """Trim screen recording to exact duration and resize to 9:16"""
    
    cmd = [
        'ffmpeg', '-y',
        '-i', str(screen_file),
        '-t', str(duration),  # Trim to exact duration
        '-vf', f'scale={VIDEO_WIDTH}:{VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad={VIDEO_WIDTH}:{VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black',
        '-r', str(FPS),
        '-c:v', 'libx264',
        '-preset', 'fast',
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
    concat_file = OUTPUT_DIR / 'concat_list_v2.txt'
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
    """Create the complete promotional video with screen recordings"""
    
    print("=" * 70)
    print("🎬 Creating Enhanced Perundhu Promotional Video (60 seconds)")
    print("=" * 70)
    
    # Check if audio files exist
    audio_files = list(AUDIO_DIR.glob("*.mp3"))
    if not audio_files:
        print("\n❌ No audio files found!")
        print(f"   Run generate_voiceover_v2.py first to create audio files")
        print(f"   Expected location: {AUDIO_DIR}\n")
        return
    
    print(f"\n✅ Found {len(audio_files)} audio file(s)")
    
    # Check for screen recordings
    missing_screens = check_screen_recordings()
    
    if missing_screens:
        print(f"\n⚠️  Warning: {len(missing_screens)} screen recording(s) not found:")
        for screen in missing_screens:
            print(f"     • {screen}")
        print(f"\n   Expected location: {SCREENS_DIR}")
        print("   Using colored backgrounds as fallback...")
        print("\n💡 To add real app screens:")
        print("   1. Record your app screen (iOS/Android screen recording)")
        print("   2. Split recording into 6 scenes")
        print(f"   3. Save to: {SCREENS_DIR}/")
        print("      - scene1_launch.mp4 (5s)")
        print("      - scene2_search.mp4 (10s)")
        print("      - scene3_results.mp4 (13s)")
        print("      - scene4_stops.mp4 (12s)")
        print("      - scene5_contribute.mp4 (12s)")
        print("      - scene6_cta.mp4 (8s)\n")
    else:
        print(f"✅ Found all {len(SCENES)} screen recordings!")
    
    # Create screens directory if it doesn't exist
    SCREENS_DIR.mkdir(parents=True, exist_ok=True)
    
    print("\n🎥 Creating video scenes...\n")
    
    # Create each scene
    scene_videos = []
    for i, scene in enumerate(SCENES):
        scene_id = scene["id"]
        duration = scene["duration"]
        screen_file = SCREENS_DIR / scene["screen"]
        
        print(f"{'─' * 60}")
        print(f"📹 Scene {i+1}/6: {scene_id} ({duration}s)")
        
        # Create base video
        temp_video = OUTPUT_DIR / f"temp_{scene_id}.mp4"
        
        if screen_file.exists():
            print(f"   📱 Using screen recording: {scene['screen']}")
            trim_and_resize_screen(screen_file, duration, str(temp_video))
        else:
            print(f"   🎨 Using fallback color: {scene['fallback_color']}")
            create_solid_color_video(scene["fallback_color"], duration, str(temp_video))
        
        # Add audio if available
        audio_file = AUDIO_DIR / f"{scene_id}.mp3"
        if audio_file.exists():
            scene_video = OUTPUT_DIR / f"{scene_id}_final.mp4"
            print(f"   🔊 Adding audio: {audio_file.name}")
            combine_video_with_audio(str(temp_video), str(audio_file), str(scene_video))
            temp_video.unlink()  # Remove temp file
            scene_videos.append(str(scene_video))
            print(f"   ✅ {scene_id} complete")
        else:
            print(f"   ⚠️  Audio not found: {audio_file.name}")
            scene_videos.append(str(temp_video))
    
    print(f"\n{'─' * 60}")
    print("🎞️  Concatenating all scenes into final video...")
    
    # Concatenate all scenes
    output_file = OUTPUT_DIR / "perundhu_promo_60s.mp4"
    concatenate_videos(scene_videos, str(output_file))
    
    # Clean up individual scene files
    print("🧹 Cleaning up temporary files...")
    for video in scene_videos:
        Path(video).unlink()
    
    # Get file size
    file_size = output_file.stat().st_size / (1024 * 1024)  # MB
    
    print("\n" + "=" * 70)
    print("✨ Video creation complete!")
    print("=" * 70)
    print(f"\n📹 Video file: {output_file}")
    print(f"📊 Duration: {sum(s['duration'] for s in SCENES)} seconds")
    print(f"🎨 Resolution: {VIDEO_WIDTH}x{VIDEO_HEIGHT} (9:16)")
    print(f"💾 File size: {file_size:.2f} MB")
    print(f"🔊 Audio: Tamil voice-over (Google Cloud TTS)")
    
    if missing_screens:
        print(f"\n💡 Current version uses colored backgrounds for missing screens.")
        print("   Add screen recordings to get the full app walkthrough!")
    else:
        print(f"\n🎉 Full app walkthrough with real screen recordings!")
    
    print("\n🚀 Ready to upload to:")
    print("   • Instagram Reels (9:16 ✓)")
    print("   • YouTube Shorts (9:16 ✓)")
    print("   • Facebook Reels (9:16 ✓)")
    print("   • TikTok (9:16 ✓)\n")


if __name__ == "__main__":
    try:
        create_video()
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error running FFmpeg: {e}")
        print("   Ensure FFmpeg is installed: brew install ffmpeg")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
