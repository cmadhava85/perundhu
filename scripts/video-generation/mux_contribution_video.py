#!/usr/bin/env python3
"""
Mux Tamil voiceover onto the Playwright contribution recording.

Pipeline:
  1. Find/generate the Tamil audio for the contribution scene (scene3)
  2. Convert webm → mp4 (landscape 390x844 → padded to 9:16 portrait or kept as-is)
  3. Overlay the Tamil audio (if video is shorter → slow down; if longer → loop video)
  4. Output: output/contribution_with_voiceover.mp4

Usage:
  cd scripts/video-generation
  source venv/bin/activate
  python mux_contribution_video.py
"""

import subprocess, sys
from pathlib import Path

SCRIPT_DIR   = Path(__file__).parent
OUTPUT_DIR   = SCRIPT_DIR / "output"
AUDIO_DIR    = OUTPUT_DIR / "audio_script"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

WEBM = (
    Path(__file__).parent.parent.parent
    / "frontend/test-results"
    / "contribution-demo-Video-De-6f378-on-record-contribution-flow-mobile-chrome"
    / "video.webm"
)
FINAL = OUTPUT_DIR / "contribution_with_voiceover.mp4"

# Tamil voiceover text for the contribution scene
CONTRIBUTION_TAMIL = (
    "இப்போது Contribution பக்கத்திற்கு செல்லுங்கள். "
    "பேருந்து எண் அல்லது route-ஐ தேர்வு செய்யுங்கள். "
    "புறப்படும் இடம், சேரும் இடம் மற்றும் நேரத்தை உள்ளிட்டு Submit செய்யுங்கள். "
    "உங்கள் பங்களிப்பு வெற்றிகரமாக சேர்க்கப்பட்டது என்ற செய்தி தெரியும். "
    "இவ்வளவு எளிது!"
)

def get_duration(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True
    )
    return float(r.stdout.strip())


def generate_audio(text: str, out: Path, rate: float = 0.92) -> bool:
    try:
        from google.cloud import texttospeech
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code="ta-IN",
            name="ta-IN-Standard-A",
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=rate,
        )
        resp = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        out.write_bytes(resp.audio_content)
        print(f"  ✅ Generated audio: {out.name}")
        return True
    except Exception as e:
        print(f"  ⚠️  GCP TTS failed: {e}")
        return False


def main():
    print("🎬 Contribution Video + Tamil Voiceover Muxer")
    print("=" * 50)

    if not WEBM.exists():
        print(f"❌ Recording not found: {WEBM}")
        print("   Run: cd frontend && npx playwright test e2e/video-demos/contribution-demo.spec.ts --config=playwright.config.video.ts")
        sys.exit(1)

    print(f"📹 Recording: {WEBM.name}")
    video_duration = get_duration(WEBM)
    print(f"   Duration: {video_duration:.1f}s  |  Resolution: 390×844 (mobile portrait)")

    # ── Step 1: Resolve audio ──────────────────────────────────────────────────
    audio_path = AUDIO_DIR / "scene3.mp3"
    if audio_path.exists():
        print(f"  ✅ Using cached audio: {audio_path.name}")
    else:
        fallback = SCRIPT_DIR / "output" / "audio_v2" / "scene5.mp3"
        print(f"  🎙️  Attempting GCP TTS ...")
        if not generate_audio(CONTRIBUTION_TAMIL, audio_path):
            if fallback.exists():
                audio_path = fallback
                print(f"  ↩️  Using fallback: {fallback.name}")
            else:
                print("❌ No audio available. Muxing with silence.")
                # Create silent audio matching video length
                audio_path = OUTPUT_DIR / "silent.mp3"
                subprocess.run([
                    "ffmpeg", "-y", "-f", "lavfi",
                    "-i", f"aevalsrc=0:s=44100:d={video_duration}",
                    "-c:a", "mp3", str(audio_path)
                ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    audio_duration = get_duration(audio_path)
    print(f"   Audio duration: {audio_duration:.1f}s")

    # ── Step 2: Mux video + audio ──────────────────────────────────────────────
    # Strategy: 
    #   - If audio is longer than video: loop the video frames to fill audio duration
    #   - If video is longer than audio: trim video to audio duration
    print(f"\n🔗 Muxing recording + voiceover ...")

    if audio_duration > video_duration:
        # Loop video to fill audio duration
        print(f"   Audio ({audio_duration:.1f}s) > Video ({video_duration:.1f}s) — looping video")
        cmd = [
            "ffmpeg", "-y",
            "-stream_loop", "-1",  # loop video indefinitely
            "-i", str(WEBM),
            "-i", str(audio_path),
            "-vf", (
                "scale=390:844:force_original_aspect_ratio=decrease,"
                "pad=390:844:(ow-iw)/2:(oh-ih)/2:color=black,"
                "format=yuv420p"
            ),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "192k",
            "-r", "30",
            "-shortest",  # stop when shortest (audio) ends
            str(FINAL),
        ]
    else:
        # Trim video to audio duration  
        print(f"   Video ({video_duration:.1f}s) >= Audio ({audio_duration:.1f}s) — trimming video")
        cmd = [
            "ffmpeg", "-y",
            "-i", str(WEBM),
            "-i", str(audio_path),
            "-vf", (
                "scale=390:844:force_original_aspect_ratio=decrease,"
                "pad=390:844:(ow-iw)/2:(oh-ih)/2:color=black,"
                "format=yuv420p"
            ),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "192k",
            "-r", "30",
            "-t", str(audio_duration),
            str(FINAL),
        ]

    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    size_mb = FINAL.stat().st_size / 1_000_000
    print(f"\n🎉 Done!")
    print(f"📁 {FINAL}")
    print(f"   Size: {size_mb:.1f} MB")

    # Open the video
    subprocess.run(["open", str(FINAL)])


if __name__ == "__main__":
    main()
