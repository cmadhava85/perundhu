#!/usr/bin/env python3
"""
Create final promotional video using actual app screenshots
"""

import subprocess
import os
from pathlib import Path

# Define paths
SCRIPT_DIR = Path(__file__).parent
ASSETS_DIR = SCRIPT_DIR / "assets"
SCREENS_DIR = ASSETS_DIR / "screens"
AUDIO_DIR = SCRIPT_DIR / "output" / "audio_v2"
OUTPUT_DIR = SCRIPT_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Scene configuration (image file, audio file, duration in seconds)
scenes = [
    {
        "image": SCREENS_DIR / "scene1_home.png",
        "audio": AUDIO_DIR / "scene1.mp3", 
        "duration": 5
    },
    {
        "image": SCREENS_DIR / "scene2_search_results.png",
        "audio": AUDIO_DIR / "scene2.mp3",
        "duration": 10
    },
    {
        "image": SCREENS_DIR / "scene3_filters.png",
        "audio": AUDIO_DIR / "scene3.mp3",
        "duration": 13
    },
    {
        "image": SCREENS_DIR / "scene4_bus_cards.png",
        "audio": AUDIO_DIR / "scene4.mp3",
        "duration": 12
    },
    {
        "image": SCREENS_DIR / "scene5_contribute.png",
        "audio": AUDIO_DIR / "scene5.mp3",
        "duration": 12
    },
    {
        "image": SCREENS_DIR / "scene6_cta.png",
        "audio": AUDIO_DIR / "scene6.mp3",
        "duration": 8
    }
]

def create_video_segment(image_path, audio_path, duration, output_path):
    """Create a video segment from an image and audio"""
    
    # Verify files exist
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio not found: {audio_path}")
    
    print(f"Creating segment: {output_path.name}")
    print(f"  Image: {image_path.name}")
    print(f"  Audio: {audio_path.name}")
    print(f"  Duration: {duration}s")
    
    cmd = [
        'ffmpeg', '-y',
        '-loop', '1',
        '-i', str(image_path),
        '-i', str(audio_path),
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
        '-r', '30',
        '-shortest',
        '-t', str(duration),
        str(output_path)
    ]
    
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr.decode()}")
        raise RuntimeError(f"Failed to create segment: {output_path}")
    
    print(f"✓ Created {output_path.name}\n")

def concatenate_videos(segment_paths, output_path):
    """Concatenate all video segments into final video"""
    
    # Create concat file
    concat_file = OUTPUT_DIR / "concat_list.txt"
    with open(concat_file, 'w') as f:
        for path in segment_paths:
            f.write(f"file '{path.absolute()}'\n")
    
    print(f"Concatenating {len(segment_paths)} segments...")
    
    cmd = [
        'ffmpeg', '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', str(concat_file),
        '-c', 'copy',
        str(output_path)
    ]
    
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr.decode()}")
        raise RuntimeError("Failed to concatenate videos")
    
    print(f"✓ Created final video: {output_path}")
    
    # Get file size
    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"  File size: {size_mb:.2f} MB")

def main():
    print("=" * 60)
    print("Creating Perundhu Promotional Video")
    print("Using actual app screenshots")
    print("=" * 60)
    print()
    
    # Create segments
    segment_paths = []
    for i, scene in enumerate(scenes, 1):
        segment_path = OUTPUT_DIR / f"segment_{i}.mp4"
        create_video_segment(
            scene["image"],
            scene["audio"],
            scene["duration"],
            segment_path
        )
        segment_paths.append(segment_path)
    
    # Concatenate
    final_output = OUTPUT_DIR / "perundhu_promo_final.mp4"
    concatenate_videos(segment_paths, final_output)
    
    print()
    print("=" * 60)
    print("✓ VIDEO GENERATION COMPLETE!")
    print("=" * 60)
    print(f"Output: {final_output}")
    print()
    print("Scene breakdown:")
    for i, scene in enumerate(scenes, 1):
        print(f"  Scene {i}: {scene['image'].name} ({scene['duration']}s)")
    
    total_duration = sum(s['duration'] for s in scenes)
    print(f"\nTotal duration: {total_duration}s")

if __name__ == "__main__":
    main()
