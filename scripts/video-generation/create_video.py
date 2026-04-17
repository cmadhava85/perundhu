#!/usr/bin/env python3
"""
Create promotional video with Tamil voice-over
Combines images, text overlays, and audio to create final video
"""

import os
from pathlib import Path
from moviepy.editor import (
    ImageClip, TextClip, CompositeVideoClip, 
    AudioFileClip, concatenate_videoclips
)
from moviepy.video.fx.resize import resize
from moviepy.video.fx.fadein import fadein
from moviepy.video.fx.fadeout import fadeout

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
BACKGROUND_COLOR = "#1E3A8A"  # Deep blue

# Scenes configuration
SCENES = [
    {
        "id": "scene1",
        "duration": 4,
        "text": "எனக்கு சரியான பேருந்து தகவல்\nகிடைக்கவில்லை…",
        "text_size": 70,
        "background": "bus_stop.jpg",  # Will use placeholder if not found
        "background_blur": True
    },
    {
        "id": "scene2",
        "duration": 6,
        "text": "மாணவரா?\nதினசரி பயணியா?\nவேலைக்கு போகிறவரா?",
        "text_size": 65,
        "background": "commuters.jpg",
        "background_blur": False
    },
    {
        "id": "scene3",
        "duration": 8,
        "text": "Perundhu\n\n1. பேருந்து routes தேடுங்கள்\n2. முடிவுகளை உடனே பாருங்கள்\n3. இல்லாத தகவல் சேருங்கள்",
        "text_size": 55,
        "background": "app_screenshot.jpg",
        "background_blur": False
    },
    {
        "id": "scene4",
        "duration": 7,
        "text": "நீங்கள் அறிந்த ஒரு தகவல்\nஆயிரம் பேருக்கு உதவலாம்",
        "text_size": 65,
        "background": "helping.jpg",
        "background_blur": True
    },
    {
        "id": "scene5",
        "duration": 5,
        "text": "Perundhu\n\nதேடுங்கள். சேருங்கள். உதவுங்கள்.\n\nperundhu.app",
        "text_size": 60,
        "background": "logo.jpg",
        "background_blur": False
    }
]


def create_text_clip(text, duration, size=60, color='white'):
    """Create a text clip with Tamil font support"""
    
    # Try to use Tamil font, fallback to Arial if not available
    try:
        txt_clip = TextClip(
            text,
            fontsize=size,
            color=color,
            font='Noto-Sans-Tamil-Bold',  # Tamil font
            method='caption',
            size=(VIDEO_WIDTH - 100, None),
            align='center'
        )
    except:
        # Fallback to system font
        txt_clip = TextClip(
            text,
            fontsize=size,
            color=color,
            font='Arial-Bold',
            method='caption',
            size=(VIDEO_WIDTH - 100, None),
            align='center'
        )
    
    return txt_clip.set_duration(duration).set_position('center')


def create_background_clip(image_name, duration, blur=False):
    """Create background image/color clip"""
    
    image_path = ASSETS_DIR / image_name
    
    # Use solid color if image not found
    if not image_path.exists():
        print(f"   ⚠️  Image not found: {image_name}, using solid color")
        from moviepy.editor import ColorClip
        bg_clip = ColorClip(
            size=(VIDEO_WIDTH, VIDEO_HEIGHT),
            color=(30, 58, 138),  # Deep blue RGB
            duration=duration
        )
    else:
        # Load and resize image
        bg_clip = ImageClip(str(image_path))
        bg_clip = resize(bg_clip, height=VIDEO_HEIGHT)
        
        # Center crop if wider than needed
        if bg_clip.w > VIDEO_WIDTH:
            x_center = bg_clip.w / 2
            bg_clip = bg_clip.crop(
                x_center=x_center,
                width=VIDEO_WIDTH,
                y_center=bg_clip.h / 2,
                height=VIDEO_HEIGHT
            )
        
        bg_clip = bg_clip.set_duration(duration)
    
    return bg_clip


def create_scene(scene_config):
    """Create a single video scene"""
    
    scene_id = scene_config["id"]
    duration = scene_config["duration"]
    
    print(f"\n📹 Creating {scene_id}...")
    
    # Background
    bg_clip = create_background_clip(
        scene_config["background"],
        duration,
        blur=scene_config.get("background_blur", False)
    )
    
    # Text overlay
    text_clip = create_text_clip(
        scene_config["text"],
        duration,
        size=scene_config.get("text_size", 60)
    )
    
    # Add semi-transparent background behind text for readability
    from moviepy.editor import ColorClip
    text_bg = ColorClip(
        size=(VIDEO_WIDTH, text_clip.h + 60),
        color=(0, 0, 0),
        duration=duration
    ).set_opacity(0.6)
    text_bg = text_bg.set_position(('center', 'center'))
    
    # Composite video
    video = CompositeVideoClip([bg_clip, text_bg, text_clip])
    
    # Add audio if available
    audio_path = AUDIO_DIR / f"{scene_id}.mp3"
    if audio_path.exists():
        audio = AudioFileClip(str(audio_path))
        video = video.set_audio(audio)
        print(f"   🔊 Audio added: {audio_path.name}")
    else:
        print(f"   ⚠️  Audio not found: {audio_path.name}")
    
    # Add fade effects
    video = fadein(video, 0.5)
    video = fadeout(video, 0.5)
    
    print(f"   ✅ {scene_id} created ({duration}s)")
    
    return video


def create_video():
    """Create the complete promotional video"""
    
    print("=" * 60)
    print("🎬 Creating Perundhu Promotional Video")
    print("=" * 60)
    
    # Check if audio files exist
    audio_files = list(AUDIO_DIR.glob("*.mp3"))
    if not audio_files:
        print("\n⚠️  No audio files found!")
        print(f"   Run generate_voiceover.py first to create audio files")
        print(f"   Expected location: {AUDIO_DIR}\n")
        return
    
    print(f"\n📦 Found {len(audio_files)} audio file(s)")
    
    # Create assets directory if it doesn't exist
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create each scene
    clips = []
    for scene in SCENES:
        clip = create_scene(scene)
        clips.append(clip)
    
    # Concatenate all scenes
    print("\n🎞️  Concatenating scenes...")
    final_video = concatenate_videoclips(clips, method="compose")
    
    # Export video
    output_file = OUTPUT_DIR / "perundhu_promo.mp4"
    print(f"\n📦 Exporting video to: {output_file}")
    print("   This may take a few minutes...\n")
    
    final_video.write_videofile(
        str(output_file),
        fps=FPS,
        codec='libx264',
        audio_codec='aac',
        preset='medium',  # balance between speed and quality
        bitrate='5000k',
        threads=4
    )
    
    print("\n" + "=" * 60)
    print("✨ Video creation complete!")
    print("=" * 60)
    print(f"\n📹 Video file: {output_file}")
    print(f"📊 Duration: {sum(s['duration'] for s in SCENES)} seconds")
    print(f"🎨 Resolution: {VIDEO_WIDTH}x{VIDEO_HEIGHT} (9:16)")
    print("\n🚀 Ready to upload to Instagram Reels, YouTube Shorts, or Facebook!")


if __name__ == "__main__":
    create_video()
