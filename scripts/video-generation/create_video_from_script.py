#!/usr/bin/env python3
"""
Create Perundhu promotional video from SOCIAL_MEDIA_VIDEO_SCRIPT.md

Pipeline:
  1. Generate Tamil voiceover for each scene via Google Cloud Text-to-Speech
  2. Build per-scene video segments (still image + audio) with ffmpeg
  3. Concatenate all segments → output/perundhu_social_media_video.mp4

Usage:
  cd scripts/video-generation
  source venv/bin/activate          # or: pip install -r requirements.txt
  export GOOGLE_APPLICATION_CREDENTIALS=~/perundhu-video-key.json
  python create_video_from_script.py

Output:
  output/perundhu_social_media_video.mp4   (1080×1920, 9:16 portrait)
"""

import os
import subprocess
import sys
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
ASSETS_DIR   = SCRIPT_DIR / "assets" / "screens"
AUDIO_DIR    = SCRIPT_DIR / "output" / "audio_script"
SEGMENTS_DIR = SCRIPT_DIR / "output" / "segments_script"
OUTPUT_DIR   = SCRIPT_DIR / "output"

AUDIO_DIR.mkdir(parents=True, exist_ok=True)
SEGMENTS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FINAL_VIDEO = OUTPUT_DIR / "perundhu_desktop_video.mp4"

# ── Scene definitions ──────────────────────────────────────────────────────────
# Text taken verbatim from SOCIAL_MEDIA_VIDEO_SCRIPT.md (Tamil voiceover lines)
SCENES = [
    {
        "id": "scene1",
        "image": ASSETS_DIR / "scene1_home.png",
        "tamil": (
            "வணக்கம் நண்பர்களே! "
            "தமிழ்நாட்டில், குறிப்பாக சிறு நகரங்களிலும் கிராமங்களிலும், "
            "சரியான பேருந்து நேரத்தை தெரிந்துகொள்வது மிகவும் கடினமாக இருக்கிறது. "
            "பலரும் பேருந்து நேரம் தெரியாமல் திண்டாடுகிறார்கள். "
            "இந்தப் பிரச்சனையை தீர்க்கவே 'பேருந்து' website உருவாக்கப்பட்டது. "
            "இந்த website மூலம் எந்த இடத்திலிருந்தும் எந்த இடத்திற்கும் "
            "பேருந்து நேரத்தை எளிதாக தெரிந்துகொள்ளலாம். "
            "தற்போது எங்கள் குழுவினர் பல இடங்களுக்கான பேருந்து நேர தகவல்களை "
            "சேகரித்து வருகிறோம். ஆனால், நீங்கள் அறிந்திருக்கும் பேருந்து நேரங்களை "
            "இங்கே பகிர்ந்துகொண்டால், அது இன்னும் பலருக்கு மிகவும் உதவியாக இருக்கும்."
        ),
        "speaking_rate": 0.90,
        "fallback_audio": SCRIPT_DIR / "output" / "audio_v2" / "scene1.mp3",
    },
    {
        "id": "scene2",
        "image": ASSETS_DIR / "scene2_search_results.png",
        "tamil": (
            "முதலில் browser-ல் website-ஐ திறந்து, "
            "புறப்படும் இடம் மற்றும் சேரும் இடத்தை உள்ளிட்டு தேடுங்கள். "
            "முடிவுகளில் பேருந்துகளின் பட்டியல் தெரியும். "
            "கீழே scroll செய்து அனைத்து பேருந்துகளையும் பார்க்கலாம். "
            "ஒரு பேருந்தை கிளிக் செய்தால் அதன் நிறுத்தங்களையும் விரிவாக பார்க்கலாம்."
        ),
        "speaking_rate": 0.92,
        "fallback_audio": SCRIPT_DIR / "output" / "audio_v2" / "scene2.mp3",
    },
    {
        "id": "scene3",
        "image": ASSETS_DIR / "scene5_contribute.png",
        "tamil": (
            "இப்போது Contribution பக்கத்திற்கு செல்லுங்கள். "
            "பேருந்து எண் அல்லது route-ஐ தேர்வு செய்யுங்கள். "
            "புறப்படும் இடம், சேரும் இடம் மற்றும் நேரத்தை உள்ளிட்டு Submit செய்யுங்கள். "
            "உங்கள் பங்களிப்பு வெற்றிகரமாக சேர்க்கப்பட்டது என்ற செய்தி தெரியும். "
            "இவ்வளவு எளிது!"
        ),
        "speaking_rate": 0.92,
        "fallback_audio": SCRIPT_DIR / "output" / "audio_v2" / "scene5.mp3",
    },
    {
        "id": "scene4",
        "image": ASSETS_DIR / "scene4_bus_cards.png",
        "tamil": (
            "நீங்கள் ஒரு மாணவராக இருந்தாலும், தினசரி பயணியாக இருந்தாலும், "
            "அல்லது ஒரே route-ல் தினமும் வேலைக்குச் செல்பவராக இருந்தாலும் — "
            "நீங்கள் பயணிக்கும் பேருந்தின் நேரம் உங்களுக்கு நன்றாக தெரியும். "
            "அந்த தகவலை இங்கே பகிர்ந்துகொண்டால், மற்றவர்கள் தங்கள் பயணத்தை "
            "சரியாக திட்டமிட்டுக் கொள்ள உதவலாம். "
            "உங்கள் ஒரு சிறிய பங்களிப்பு ஆயிரக்கணக்கான பயணிகளுக்கு வழிகாட்டலாம். "
            "வாருங்கள் — சேர்ந்து இந்த சமூக முயற்சியில் பங்கு கொள்வோம்!"
        ),
        "speaking_rate": 0.90,
        "fallback_audio": SCRIPT_DIR / "output" / "audio_v2" / "scene4.mp3",
    },
    {
        "id": "scene5",
        "image": ASSETS_DIR / "scene6_cta.png",
        "tamil": (
            "Perundhu — தமிழ்நாடு பயணிகளுக்காக, உங்களின் பங்களிப்பால் வளர்கிறது."
        ),
        "speaking_rate": 0.85,
        "fallback_audio": SCRIPT_DIR / "output" / "audio_v2" / "scene6.mp3",
    },
]


# ── Step 1: Generate voiceover audio ──────────────────────────────────────────

def generate_audio_gcp(text: str, output_path: Path, speaking_rate: float) -> bool:
    """Generate Tamil MP3 via Google Cloud Text-to-Speech. Returns True on success."""
    try:
        from google.cloud import texttospeech  # type: ignore

        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code="ta-IN",
            name="ta-IN-Standard-A",
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speaking_rate,
            pitch=0.0,
            effects_profile_id=["handset-class-device"],
        )
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        output_path.write_bytes(response.audio_content)
        return True
    except Exception as exc:
        print(f"  ⚠️  GCP TTS failed: {exc}")
        return False


def resolve_audio(scene: dict) -> Path:
    """Return path to audio for a scene — generate via GCP or use fallback."""
    audio_path = AUDIO_DIR / f"{scene['id']}.mp3"

    if audio_path.exists():
        print(f"  ✅ Using cached audio: {audio_path.name}")
        return audio_path

    print(f"  🎙️  Generating voiceover for {scene['id']} ...")
    success = generate_audio_gcp(scene["tamil"], audio_path, scene["speaking_rate"])

    if success:
        print(f"  ✅ Generated: {audio_path.name}")
        return audio_path

    # Fall back to existing audio from audio_v2/
    fallback = scene.get("fallback_audio")
    if fallback and Path(fallback).exists():
        print(f"  ↩️  Using fallback audio: {Path(fallback).name}")
        return Path(fallback)

    print(f"  ❌ No audio available for {scene['id']} — aborting.")
    sys.exit(1)


# ── Step 2: Build per-scene video segments ─────────────────────────────────────

def get_audio_duration(audio_path: Path) -> float:
    """Return audio duration in seconds via ffprobe."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(audio_path),
        ],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


def build_segment(scene: dict, audio_path: Path, segment_path: Path):
    """Create a 1080×1920 video segment from a still image + audio."""
    if not scene["image"].exists():
        print(f"  ❌ Screenshot not found: {scene['image']}")
        sys.exit(1)

    duration = get_audio_duration(audio_path)
    print(f"  🎬 Building segment {scene['id']}  ({duration:.1f}s) ...")

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", str(scene["image"]),
        "-i", str(audio_path),
        "-vf", (
            "scale=1920:1080:force_original_aspect_ratio=decrease,"
            "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,"
            "format=yuv420p"
        ),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-tune", "stillimage",
        "-c:a", "aac",
        "-b:a", "192k",
        "-r", "30",
        "-shortest",
        "-t", str(duration),
        str(segment_path),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"  ✅ Segment saved: {segment_path.name}")


# ── Step 3: Concatenate segments ───────────────────────────────────────────────

def concatenate_segments(segment_paths: list[Path], output_path: Path):
    """Concatenate all segments into the final video using ffmpeg concat demuxer."""
    concat_list = SEGMENTS_DIR / "concat_list.txt"
    with concat_list.open("w") as f:
        for seg in segment_paths:
            f.write(f"file '{seg.resolve()}'\n")

    print(f"\n🔗 Concatenating {len(segment_paths)} segments ...")
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list),
        "-c", "copy",
        str(output_path),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"✅ Final video: {output_path}")


# ── Main ───────────────────────────────────────────────────────────────────────

def check_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    except FileNotFoundError:
        print("❌ ffmpeg not found. Install with: brew install ffmpeg")
        sys.exit(1)


def main():
    print("🎬 Perundhu Social Media Video Generator")
    print("==========================================")
    print(f"Script: SOCIAL_MEDIA_VIDEO_SCRIPT.md  ({len(SCENES)} scenes)")
    print(f"Output: {FINAL_VIDEO}\n")

    check_ffmpeg()

    credential = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not credential:
        print(
            "⚠️  GOOGLE_APPLICATION_CREDENTIALS not set.\n"
            "   Will use existing fallback audio files from output/audio_v2/.\n"
            "   To generate fresh Tamil voiceover, set credentials and re-run.\n"
        )

    segment_paths = []
    for scene in SCENES:
        print(f"\n── {scene['id'].upper()} ──")
        audio  = resolve_audio(scene)
        seg    = SEGMENTS_DIR / f"{scene['id']}.mp4"
        build_segment(scene, audio, seg)
        segment_paths.append(seg)

    concatenate_segments(segment_paths, FINAL_VIDEO)

    size_mb = FINAL_VIDEO.stat().st_size / (1024 * 1024)
    print(f"\n🎉 Done!  Size: {size_mb:.1f} MB")
    print(f"📁 {FINAL_VIDEO}")
    print("\nNext steps:")
    print("  • Review the video and trim/re-order if needed")
    print("  • Upload to Instagram Reels / YouTube Shorts / Facebook Reels")
    print("  • Add captions from SOCIAL_MEDIA_VIDEO_SCRIPT.md")


if __name__ == "__main__":
    main()
