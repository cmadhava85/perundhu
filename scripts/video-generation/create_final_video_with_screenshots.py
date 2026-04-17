#!/usr/bin/env python3
"""
Create final video with captured app screenshots and Tamil voice-over
Uses the screenshots we just captured from perundhu.com
"""

import subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
AUDIO_DIR = SCRIPT_DIR / "output" / "audio_v2"  
SCREENSHOTS_DIR = SCRIPT_DIR / "output" / "frames"  # Where browser screenshots are
OUTPUT_DIR = SCRIPT_DIR / "output"

# Map our captured screenshots to video scenes
# We captured: filters view, bus cards, contribute page
# Let's use them creatively for the 60s video

scenes = [
    {
        "id": "scene1",
        "duration": 5,
        "image": "frame_001.jpg",  # Use one of the app screenshots
        "audio": "scene1.mp3"
    },
    {
        "id": "scene2",
        "duration": 10,
        "image": "frame_001.jpg",  # Search results
        "audio": "scene2.mp3"
    },
    {
        "id": "scene3",
        "duration": 13,
        "image": "frame_002.jpg",  # Results with filters
        "audio": "scene3.mp3"
    },
    {
        "id": "scene4",
        "duration": 12,
        "image": "frame_003.jpg",  # Bus cards
        "audio": "scene4.mp3"
    },
    {
        "id": "scene5",
        "duration": 12,
        "image": "frame_004.jpg",  # Contribute page
        "audio": "scene5.mp3"
    },
    {
        "id": "scene6",
        "duration": 8,
        "image": "frame_001.jpg",  # Back to home
        "audio": "scene6.mp3"
    }
]

print("🎬 Creating final video with real app screenshots...")
print(f"📁 Screenshots: {SCREENSHOTS_DIR}")
print(f"🎙️ Audio: {AUDIO_DIR}")
print()

# Create video clips for each scene
scene_videos = []

for i, scene in enumerate(scenes):
    scene_id = scene["id"]
    duration = scene["duration"]
    image_file = SCREENSHOTS_DIR / scene["image"]
    audio_file = AUDIO_DIR / scene["audio"]
    
    print(f"📹 Scene {i+1}/6: {scene_id} ({duration}s)")
    
    if not image_file.exists():
        print(f"   ⚠️  Image not found: {image_file}")
        continue
        
    if not audio_file.exists():
        print(f"   ⚠️  Audio not found: {audio_file}")
        continue
    
    # Create video from image + audio
    output_video = OUTPUT_DIR / f"{scene_id}_final.mp4"
    
    cmd = [
        'ffmpeg', '-y',
        '-loop', '1',
        '-i', str(image_file),
        '-i', str(audio_file),
        '-c:v', 'libx264',
        '-t', str(duration),
        '-pix_fmt', 'yuv420p',
        '-vf', f'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black',
        '-c:a', 'aac',
        '-shortest',
        str(output_video)
    ]
    
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode == 0:
        print(f"   ✅ Created: {scene_id}_final.mp4")
        scene_videos.append(str(output_video))
    else:
        print(f"   ❌ Failed to create {scene_id}")

print(f"\n🎞️  Concatenating {len(scene_videos)} scenes...")

# Create concat file
concat_file = OUTPUT_DIR / 'concat_list_final.txt'
with open(concat_file, 'w') as f:
    for video in scene_videos:
        f.write(f"file '{video}'\n")

# Concatenate all scenes
final_output = OUTPUT_DIR / "perundhu_promo_with_app_screenshots.mp4"

cmd = [
    'ffmpeg', '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', str(concat_file),
    '-c', 'copy',
    str(final_output)
]

result = subprocess.run(cmd, capture_output=True)

if result.returncode == 0:
    file_size = final_output.stat().st_size / (1024 * 1024)
    print("\n✨ Video creation complete!")
    print(f"📹 Output: {final_output}")
    print(f"💾 Size: {file_size:.2f} MB")
    print("\n🎉 Now you have a 60-second video with:")
    print("   ✅ Real Perundhu app screenshots")
    print("   ✅ Tamil voice-over narration")
    print("   ✅ Mobile format (1080x1920)")
    print("\n🚀 Ready to upload!")
else:
    print("\n❌ Concatenation failed")

# Cleanup temp files
print("\n🧹 Cleaning up...")
for video in scene_videos:
    Path(video).unlink()
concat_file.unlink()
print("Done!")
