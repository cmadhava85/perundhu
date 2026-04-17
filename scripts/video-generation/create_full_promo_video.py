#!/usr/bin/env python3
"""
Create Perundhu full promotional video combining:
  - Live Playwright recordings for search + contribution flows
  - Static screenshots for intro, closing, and CTA
  - Tamil voiceover from SOCIAL_MEDIA_VIDEO_SCRIPT.md (cached audio_script/)

Output: 390×844 portrait (iPhone 13 Pro mobile)

Usage:
  cd scripts/video-generation
  source venv/bin/activate
  python create_full_promo_video.py
"""

import subprocess
import sys
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
ASSETS_DIR   = SCRIPT_DIR / "assets" / "screens"
AUDIO_DIR    = SCRIPT_DIR / "output" / "audio_script"
SEGMENTS_DIR = SCRIPT_DIR / "output" / "segments_full_promo"
OUTPUT_DIR   = SCRIPT_DIR / "output"

PROJECT_ROOT = SCRIPT_DIR.parent.parent
TEST_RESULTS = PROJECT_ROOT / "frontend" / "test-results"

SEGMENTS_DIR.mkdir(parents=True, exist_ok=True)

FINAL_VIDEO = OUTPUT_DIR / "perundhu_full_promo_video.mp4"

# Portrait dimensions matching iPhone 13 Pro recording
WIDTH  = 390
HEIGHT = 844

# ── Find live recordings ───────────────────────────────────────────────────────

def find_recording(pattern: str) -> Path:
    """Find a video.webm recording in test-results matching the folder pattern."""
    matches = list(TEST_RESULTS.glob(f"{pattern}*/video.webm"))
    if not matches:
        print(f"  ❌ Recording not found for pattern: {pattern}*")
        print(f"     Expected in: {TEST_RESULTS}")
        sys.exit(1)
    # Pick newest if multiple
    match = sorted(matches, key=lambda p: p.stat().st_mtime)[-1]
    print(f"  📹 Found recording: {match.parent.name}/video.webm")
    return match

# ── FFprobe helpers ────────────────────────────────────────────────────────────

def get_duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())

# ── Segment builders ───────────────────────────────────────────────────────────

SCALE_FILTER = (
    f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
    f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,"
    f"format=yuv420p"
)

ENCODE_OPTS = [
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "192k",
    "-r", "30",
]


def build_static_segment(image: Path, audio: Path, out: Path):
    """Build a segment from a still image + audio track."""
    if not image.exists():
        print(f"  ❌ Screenshot not found: {image}")
        sys.exit(1)

    duration = get_duration(audio)
    print(f"  🖼️  Static segment  ({duration:.1f}s) ...")

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(image),
        "-i", str(audio),
        "-vf", SCALE_FILTER,
        *ENCODE_OPTS,
        "-tune", "stillimage",
        "-shortest",
        "-t", str(duration),
        str(out),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"  ✅ {out.name}")


def build_live_segment(recording: Path, audio: Path, out: Path):
    """Build a segment from a live Playwright recording + audio track.

    The recording is trimmed to the audio duration so the voiceover
    and the demo stay in sync.
    """
    audio_dur = get_duration(audio)
    rec_dur   = get_duration(recording)
    trim_dur  = min(audio_dur, rec_dur)

    print(f"  🎥  Live segment  (recording={rec_dur:.1f}s → trimmed to {trim_dur:.1f}s, audio={audio_dur:.1f}s) ...")

    cmd = [
        "ffmpeg", "-y",
        "-t", str(trim_dur), "-i", str(recording),
        "-i", str(audio),
        "-vf", SCALE_FILTER,
        *ENCODE_OPTS,
        "-shortest",
        str(out),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"  ✅ {out.name}")


def concatenate(segments: list[Path], output: Path):
    concat_list = SEGMENTS_DIR / "concat_list.txt"
    with concat_list.open("w") as f:
        for seg in segments:
            f.write(f"file '{seg.resolve()}'\n")

    print(f"\n🔗 Concatenating {len(segments)} segments ...")
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", str(concat_list),
        "-c", "copy",
        str(output),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"✅ Final video: {output}")

# ── Main ───────────────────────────────────────────────────────────────────────

def check_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    except FileNotFoundError:
        print("❌ ffmpeg not found. Install with: brew install ffmpeg")
        sys.exit(1)


def main():
    print("🎬 Perundhu Full Promo Video Generator")
    print("========================================")
    print(f"Viewport: {WIDTH}×{HEIGHT} (iPhone 13 Pro portrait)")
    print(f"Output:   {FINAL_VIDEO}\n")

    check_ffmpeg()

    # Discover live recordings
    print("── Locating live recordings ──")
    search_rec = find_recording("search-demo-Video-Demo-Sea")
    contrib_rec = find_recording("contribution-demo-Video-De")
    print()

    segments = []

    # ── Scene 1: Intro (static screenshot + voiceover) ────────────────────────
    print("── SCENE 1 : Intro ──")
    seg1 = SEGMENTS_DIR / "scene1_intro.mp4"
    build_static_segment(
        image=ASSETS_DIR / "scene1_home.png",
        audio=AUDIO_DIR / "scene1.mp3",
        out=seg1,
    )
    segments.append(seg1)

    # ── Scene 2: Search demo (live recording + voiceover) ─────────────────────
    print("\n── SCENE 2 : Search & Results (live recording) ──")
    seg2 = SEGMENTS_DIR / "scene2_search.mp4"
    build_live_segment(
        recording=search_rec,
        audio=AUDIO_DIR / "scene2.mp3",
        out=seg2,
    )
    segments.append(seg2)

    # ── Scene 3: Contribution demo (live recording + voiceover) ───────────────
    print("\n── SCENE 3 : Contribution (live recording) ──")
    seg3 = SEGMENTS_DIR / "scene3_contribution.mp4"
    build_live_segment(
        recording=contrib_rec,
        audio=AUDIO_DIR / "scene3.mp3",
        out=seg3,
    )
    segments.append(seg3)

    # ── Scene 4: Closing appeal (static screenshot + voiceover) ───────────────
    print("\n── SCENE 4 : Closing Appeal ──")
    seg4 = SEGMENTS_DIR / "scene4_closing.mp4"
    build_static_segment(
        image=ASSETS_DIR / "scene4_bus_cards.png",
        audio=AUDIO_DIR / "scene4.mp3",
        out=seg4,
    )
    segments.append(seg4)

    # ── Scene 5: CTA (static screenshot + voiceover) ──────────────────────────
    print("\n── SCENE 5 : CTA ──")
    seg5 = SEGMENTS_DIR / "scene5_cta.mp4"
    build_static_segment(
        image=ASSETS_DIR / "scene6_cta.png",
        audio=AUDIO_DIR / "scene5.mp3",
        out=seg5,
    )
    segments.append(seg5)

    # ── Concatenate ────────────────────────────────────────────────────────────
    concatenate(segments, FINAL_VIDEO)

    size_mb = FINAL_VIDEO.stat().st_size / (1024 * 1024)
    total_s = sum(get_duration(s) for s in segments)
    mins, secs = divmod(int(total_s), 60)

    print(f"\n🎉 Done!")
    print(f"   Duration: {mins}m {secs}s")
    print(f"   Size:     {size_mb:.1f} MB")
    print(f"   File:     {FINAL_VIDEO}")


if __name__ == "__main__":
    main()
