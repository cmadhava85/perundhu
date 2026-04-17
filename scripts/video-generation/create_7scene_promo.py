#!/usr/bin/env python3
"""
Perundhu — 8-Scene Promo Video Generator
=========================================
Scenes:
  1. The Problem      — real bus-stop footage (attached MP4, portrait-cropped + looped)
  2. Logo Interstitial— Perundhu logo reveal with brand intro (Ken Burns)
  3. Search Demo      — live Playwright search walkthrough (homepage → results)
  4. Search Results   — scrolling results with stops expanded
  5. Stops Detail     — bus cards / stops scrolled
  6. The Gap          — no-results state + navigate to contribute
  7. How to Contribute— live Playwright contribution recording (nav → form → submit → confirmation)
  8. Call to Action   — Perundhu logo final CTA with Ken Burns zoom

Tamil voiceover generated via Google Cloud TTS (ta-IN-Wavenet-D).
Audio is cached in output/audio_7scene/ — delete a file to regenerate it.

Usage:
  cd scripts/video-generation
  source venv/bin/activate
  python create_7scene_promo.py

Output:
  output/perundhu_7scene_promo.mp4  (390×844 portrait, ~80s)
"""

import subprocess
import sys
from pathlib import Path

# ── Paths ───────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
ASSETS_DIR   = SCRIPT_DIR / "assets" / "screens"
AUDIO_DIR    = SCRIPT_DIR / "output" / "audio_7scene"
SEGMENTS_DIR = SCRIPT_DIR / "output" / "segments_7scene"
OUTPUT_DIR   = SCRIPT_DIR / "output"

PROJECT_ROOT = SCRIPT_DIR.parent.parent
TEST_RESULTS = PROJECT_ROOT / "frontend" / "test-results"

# Attached bus-stop footage
BUS_STOP_VIDEO = Path("/Users/mchand69/Downloads/AZ2NQkxwujUbSwBy5wMGVQ-AZ2NQkxwSM3A04zNgQJTFg.mp4")

AUDIO_DIR.mkdir(parents=True, exist_ok=True)
SEGMENTS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FINAL_VIDEO = OUTPUT_DIR / "perundhu_7scene_promo.mp4"

# Portrait dimensions matching the contribution recording
WIDTH  = 390
HEIGHT = 844

# ── Scene definitions ────────────────────────────────────────────────────────
# Tamil voiceovers aligned to the new 7-scene script
SCENES = [
    {
        "id": "scene1",
        "type": "video",   # real footage loop
        "source": BUS_STOP_VIDEO,
        "tamil": (
            "வணக்கம் நண்பர்களே! "
            "தமிழ்நாட்டில், குறிப்பாக சிறு நகரங்களிலும் கிராமங்களிலும், "
            "சரியான பேருந்து நேரத்தை தெரிந்துகொள்வது மிகவும் கடினமாக இருக்கிறது. "
            "பலரும் பேருந்து நேரம் தெரியாமல் திண்டாடுகிறார்கள். "
            "இந்தப் பிரச்சனையை தீர்க்கவே 'பேருந்து' website உருவாக்கப்பட்டது. "
            "இந்த website மூலம் எந்த இடத்திலிருந்தும் எந்த இடத்திற்கும் "
            "பேருந்து நேரத்தை எளிதாக தெரிந்துகொள்ளலாம்."
        ),
        "speaking_rate": 0.90,
    },
    {
        "id": "scene_logo",
        "type": "kenburns",   # Perundhu logo reveal — brand interstitial
        "source": ASSETS_DIR / "perundhu_logo.png",
        "tamil": (
            "அறிமுகப்படுத்துகிறோம் — பேருந்து! "
            "தமிழ்நாடு பேருந்து பயணிகளுக்கான இலவச தகவல் தளம். "
            "எந்த இடத்திலிருந்தும் எந்த இடத்திற்கும் "
            "பேருந்து நேரம் இப்போது உங்கள் கைகளில்!"
        ),
        "speaking_rate": 0.92,
    },
    {
        "id": "scene2",
        # Live walkthrough — offset=3: skip initial page-load blank state, starts when homepage is settled
        "type": "recording_offset",
        "pattern": "search-demo-Video-Demo-Sea",
        "offset": 3,
        "tamil": (
            "நகரங்களுக்கு இடையே பயணிக்கணும் என்றாலும் சரி, "
            "தொலைதூர கிராமங்களுக்கு செல்ல வேண்டும் என்றாலும் சரி — "
            "பேருந்து நேரம் இப்போது உங்கள் கைகளில் இருக்கும்."
        ),
        "speaking_rate": 0.90,
    },
    {
        "id": "scene3",
        # Live walkthrough — offset=15: search results visible + scrolling (shifted +3 from scene2)
        "type": "recording_offset",
        "pattern": "search-demo-Video-Demo-Sea",
        "offset": 15,
        "tamil": (
            "மிகவும் எளிது. "
            "website-ஐ திறந்து, புறப்படும் இடத்தையும் சேரும் இடத்தையும் உள்ளிட்டு "
            "Search பட்டனை தட்டுங்கள். "
            "உடனே கிடைக்கக்கூடிய பேருந்துகளின் பட்டியல் தெரியும்."
        ),
        "speaking_rate": 0.92,
    },
    {
        "id": "scene4",
        # Live walkthrough — offset=26: stops expanded and scrolled (shifted +3 from scene2)
        "type": "recording_offset",
        "pattern": "search-demo-Video-Demo-Sea",
        "offset": 26,
        "tamil": (
            "இன்னும் விவரம் வேணுமா? "
            "எந்த பேருந்தையும் தட்டினால், அதன் முழு நிறுத்தங்களும் நேரங்களும் காட்டும். "
            "உங்கள் பயணத்தை திட்டமிடுவது இப்போது மிகவும் எளிதாகிவிட்டது."
        ),
        "speaking_rate": 0.92,
    },
    {
        "id": "scene5",
        # Gap demo — no-results state + navigate to contribute
        "type": "recording_offset",
        "pattern": "gap-demo-Video-Demo-Gap",
        "offset": 0,
        "tamil": (
            "ஆனால் ஒரு route இல்லாமல் போனால்? "
            "அதுவே உங்களுக்கான வாய்ப்பு! "
            "பேருந்து website சமூகத்தின் பலத்தால் வளர்கிறது."
        ),
        "speaking_rate": 0.90,
    },
    {
        "id": "scene6",
        "type": "recording",   # live Playwright webm
        "pattern": "contribution-demo-Video-De",
        "tamil": (
            "இப்போது Contribution பக்கத்திற்கு செல்லுங்கள். "
            "பேருந்து எண்ணை உள்ளிடுங்கள். "
            "புறப்படும் இடம் மற்றும் நேரத்தை தேர்வு செய்யுங்கள். "
            "சேரும் இடம் மற்றும் வந்து சேரும் நேரத்தை உள்ளிட்டு, "
            "Submit பட்டனை அழுத்துங்கள். "
            "உங்கள் பங்களிப்பு வெற்றிகரமாக சேர்க்கப்பட்டது! "
            "எங்கள் குழு இதை ஆய்வு செய்து, "
            "விரைவில் தேடல் பட்டியலில் சேர்க்கும். "
            "இவ்வளவு எளிது!"
        ),
        "speaking_rate": 0.90,
    },
    {
        "id": "scene7",
        "type": "kenburns",    # Perundhu logo — final CTA
        "source": ASSETS_DIR / "perundhu_logo.png",
        "tamil": (
            "நீங்கள் மாணவரோ, தினசரி பயணியோ, "
            "அல்லது ஒரே route-ல் தினமும் வேலைக்குச் செல்பவரோ — "
            "நீங்கள் பயணிக்கும் பேருந்தின் நேரம் உங்களுக்கு நன்றாக தெரியும். "
            "அந்த தகவலை பகிர்ந்துகொண்டால், "
            "மற்றவர்கள் தங்கள் பயணத்தை சரியாகத் திட்டமிட்டுக் கொள்ள உதவலாம். "
            "பேருந்து — தமிழ்நாடு பயணிகளுக்காக, உங்களின் பங்களிப்பால் வளர்கிறது!"
        ),
        "speaking_rate": 0.88,
    },
]

# ── FFmpeg helpers ───────────────────────────────────────────────────────────

ENCODE_OPTS = [
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-bf", "0",           # disable B-frames → clean segment boundaries for concat
    "-c:a", "aac", "-b:a", "192k",
    "-r", "30",
]

# Standard portrait scale+pad filter for static sources
PORTRAIT_FILTER = (
    f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
    f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,"
    f"format=yuv420p"
)

# Landscape video → portrait: scale so height=844, centre-crop to 390 wide
CROP_PORTRAIT_FILTER = (
    f"scale=-2:{HEIGHT},"
    f"crop={WIDTH}:{HEIGHT}:(iw-{WIDTH})/2:0,"
    f"format=yuv420p"
)


def run(cmd: list, label=""):
    result = subprocess.run(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    if result.returncode != 0:
        print(f"\n❌ ffmpeg error in {label}:")
        print(result.stderr.decode()[-2000:])
        sys.exit(1)


def get_duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


def find_recording(pattern: str) -> Path:
    matches = list(TEST_RESULTS.glob(f"{pattern}*/video.webm"))
    if not matches:
        print(f"  ❌ Recording not found: {TEST_RESULTS}/{pattern}*/video.webm")
        sys.exit(1)
    return sorted(matches, key=lambda p: p.stat().st_mtime)[-1]


# ── TTS audio generation ─────────────────────────────────────────────────────

def generate_audio(scene_id: str, text: str, speaking_rate: float) -> Path:
    out = AUDIO_DIR / f"{scene_id}.mp3"
    if out.exists():
        print(f"  🎵 Using cached audio: {out.name}")
        return out

    print(f"  🗣️  Generating TTS: {out.name} ...")
    try:
        import asyncio
        import edge_tts

        # ta-IN-ValluvarNeural is the male Tamil voice in Microsoft Edge TTS
        VOICE = "ta-IN-ValluvarNeural"

        # edge-tts speaking_rate is a percentage offset, e.g. "-10%" slows down by 10%
        rate_pct = int((speaking_rate - 1.0) * 100)
        rate_str = f"{rate_pct:+d}%"

        async def _synthesize():
            communicate = edge_tts.Communicate(text, VOICE, rate=rate_str)
            await communicate.save(str(out))

        asyncio.run(_synthesize())
    except ImportError:
        print("  ❌ edge-tts not installed.")
        print("     Run: pip install edge-tts")
        sys.exit(1)

    dur = get_duration(out)
    print(f"  ✅ {out.name}  ({dur:.1f}s)")
    return out


# ── Segment builders ─────────────────────────────────────────────────────────

def build_static_segment(image: Path, audio: Path, out: Path):
    duration = get_duration(audio)
    print(f"  🖼  Static  {duration:.1f}s  → {out.name}")
    run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(image),
        "-i", str(audio),
        "-vf", PORTRAIT_FILTER,
        *ENCODE_OPTS,
        "-tune", "stillimage",
        "-t", str(duration),
        "-shortest",
        str(out),
    ], label=out.name)


def build_video_loop_segment(video: Path, audio: Path, out: Path):
    """Loop landscape footage full-frame with blurred background (no cropping).

    The full landscape clip is letterboxed in the center of the portrait frame.
    A blurred, zoomed copy fills the top/bottom bars so there are no black bars.
    """
    duration = get_duration(audio)
    print(f"  🎬 VideoLoop (full+blur)  {duration:.1f}s  → {out.name}")
    # filter_complex:
    #   [bg]  scale to fill 390×844, blur heavily → background layer
    #   [fg]  scale landscape to fit within 390px wide, keep full frame
    #   overlay fg centered on bg
    blur_fill = (
        f"[0:v]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,"
        f"crop={WIDTH}:{HEIGHT}:(iw-{WIDTH})/2:(ih-{HEIGHT})/2,"
        f"boxblur=25:5[bg];"
        f"[0:v]scale={WIDTH}:-2[fg];"
        f"[bg][fg]overlay=(W-w)/2:(H-h)/2,"
        f"format=yuv420p[out]"
    )
    run([
        "ffmpeg", "-y",
        "-stream_loop", "-1",
        "-t", str(duration),
        "-i", str(video),
        "-i", str(audio),
        "-filter_complex", blur_fill,
        "-map", "[out]",
        "-map", "1:a",
        *ENCODE_OPTS,
        "-t", str(duration),
        "-shortest",
        str(out),
    ], label=out.name)


def build_recording_segment(recording: Path, audio: Path, out: Path):
    """Trim Playwright recording to match audio duration."""
    audio_dur = get_duration(audio)
    rec_dur   = get_duration(recording)
    trim_dur  = min(audio_dur, rec_dur)
    print(f"  📹 Recording  rec={rec_dur:.1f}s → trimmed to {trim_dur:.1f}s  → {out.name}")
    run([
        "ffmpeg", "-y",
        "-t", str(trim_dur), "-i", str(recording),
        "-i", str(audio),
        "-vf", PORTRAIT_FILTER,
        *ENCODE_OPTS,
        "-shortest",
        str(out),
    ], label=out.name)


def build_recording_offset_segment(recording: Path, audio: Path, out: Path, offset: float):
    """Extract a time window from a long recording, starting at `offset` seconds."""
    audio_dur = get_duration(audio)
    rec_dur   = get_duration(recording)
    available = rec_dur - offset
    trim_dur  = min(audio_dur, available)
    print(f"  📹 Recording[{offset:.0f}s+{trim_dur:.1f}s]  → {out.name}")
    run([
        "ffmpeg", "-y",
        "-ss", str(offset),          # seek to offset in recording
        "-t", str(trim_dur),         # take only this many seconds
        "-i", str(recording),
        "-i", str(audio),
        "-vf", PORTRAIT_FILTER,
        *ENCODE_OPTS,
        "-shortest",
        str(out),
    ], label=out.name)


def build_kenburns_segment(image: Path, audio: Path, out: Path):
    """Zoom-in Ken Burns on a still image using the zoompan filter.

    The image is scaled to fill the portrait frame, then zoompan smoothly
    zooms from 1.0× to 1.25×, keeping the subject centred.  This is clearly
    visible even on flat/logo images (unlike the old horizontal pan).
    """
    duration = get_duration(audio)
    fps = 30
    total_frames = max(int(duration * fps), 1)
    print(f"  ✨ KenBurns  {duration:.1f}s  → {out.name}")
    # zoompan: d=1 re-evaluates z every output frame for a smooth animation
    vf = (
        f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
        f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=black,"
        f"zoompan="
        f"z='min(1+0.25*on/{total_frames},1.25)':"
        f"x='iw/2-(iw/zoom/2)':"
        f"y='ih/2-(ih/zoom/2)':"
        f"d=1:"
        f"s={WIDTH}x{HEIGHT}:"
        f"fps={fps},"
        f"format=yuv420p"
    )
    run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(image),
        "-i", str(audio),
        "-vf", vf,
        *ENCODE_OPTS,
        "-t", str(duration),
        "-shortest",
        str(out),
    ], label=out.name)


def concatenate(segments: list[Path], output: Path):
    """Join segments using the ffmpeg concat filter (re-encodes once).

    The concat FILTER (not the concat demuxer / -c copy) eliminates PTS
    discontinuities and B-frame reference issues at segment boundaries,
    which caused the brief audio dropout and video freeze at ~30s.
    """
    n = len(segments)
    inputs: list[str] = []
    for seg in segments:
        inputs += ["-i", str(seg)]

    fc_parts = []
    for i in range(n):
        fc_parts.append(f"[{i}:v]setsar=1[v{i}]")
    concat_in = "".join(f"[v{i}][{i}:a]" for i in range(n))
    filter_complex = ";".join(fc_parts) + ";" + concat_in + f"concat=n={n}:v=1:a=1[v][a]"

    print(f"\n🔗 Concatenating {n} segments (concat filter — seamless joins) ...")
    run([
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[v]", "-map", "[a]",
        *ENCODE_OPTS,
        str(output),
    ], label="concat")
    print(f"\n✅ Final video: {output}")
    size_mb = output.stat().st_size / 1_048_576
    dur = get_duration(output)
    print(f"   Size: {size_mb:.1f} MB  |  Duration: {dur:.1f}s")


# ── Main ─────────────────────────────────────────────────────────────────────

def check_prerequisites():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    except FileNotFoundError:
        print("❌ ffmpeg not found. Install: brew install ffmpeg")
        sys.exit(1)

    if not BUS_STOP_VIDEO.exists():
        print(f"❌ Bus stop video not found: {BUS_STOP_VIDEO}")
        sys.exit(1)


def main():
    print("🎬 Perundhu 7-Scene Promo Video Generator")
    print("==========================================")
    check_prerequisites()

    segments = []

    for i, scene in enumerate(SCENES, 1):
        sid = scene["id"]
        print(f"\n── Scene {i}/7 : {sid} ({scene['type']}) ──")

        # Generate / retrieve audio
        audio = generate_audio(sid, scene["tamil"], scene["speaking_rate"])

        out = SEGMENTS_DIR / f"{sid}.mp4"

        if scene["type"] == "video":
            build_video_loop_segment(scene["source"], audio, out)

        elif scene["type"] == "static":
            build_static_segment(scene["source"], audio, out)

        elif scene["type"] == "recording":
            rec = find_recording(scene["pattern"])
            print(f"  📂 {rec.parent.name}/video.webm")
            build_recording_segment(rec, audio, out)

        elif scene["type"] == "recording_offset":
            rec = find_recording(scene["pattern"])
            print(f"  📂 {rec.parent.name}/video.webm")
            build_recording_offset_segment(rec, audio, out, scene["offset"])

        elif scene["type"] == "kenburns":
            build_kenburns_segment(scene["source"], audio, out)

        segments.append(out)

    concatenate(segments, FINAL_VIDEO)
    print("\n▶  Open the video:")
    print(f"   open {FINAL_VIDEO}")


if __name__ == "__main__":
    main()
