#!/usr/bin/env python3
"""
Generate Tamil voice-over for enhanced 60-second app walkthrough video
Uses Google Cloud Text-to-Speech with better pacing and natural speech
"""

import os
from pathlib import Path
from google.cloud import texttospeech

# Output directory
OUTPUT_DIR = Path(__file__).parent / "output" / "audio_v2"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Enhanced Tamil script with better pacing (60 seconds total)
SCENES = [
    {
        "id": "scene1",
        "text": "தமிழ்நாட்டில் பேருந்து எப்படி கண்டுபிடிப்பது? Perundhu-வுடன் வாங்க பார்க்கலாம்.",
        "duration": 5,
        "speaking_rate": 1.0
    },
    {
        "id": "scene2",
        "text": "முதலில், நீங்கள் எங்கிருந்து எங்கு போக வேண்டும் என்பதை தேர்ந்தெடுக்கவும். எடுத்துக்காட்டாக, Chennai-லிருந்து Madurai-க்கு.",
        "duration": 10,
        "speaking_rate": 0.95
    },
    {
        "id": "scene3",
        "text": "உடனே நிறைய பேருந்து விபரங்கள் காண்பிக்கும். நேரம், வகை, எல்லாம் தெளிவாக இருக்கும். காலை, மதியம், மாலை என்று தேவைக்கேற்ப filter செய்யலாம். வேகமான பேருந்தை முதலில் பார்க்க sort செய்யலாம்.",
        "duration": 13,
        "speaking_rate": 0.95
    },
    {
        "id": "scene4",
        "text": "ஒரு பேருந்தை தேர்ந்தெடுத்தால், அதன் எல்லா நிறுத்தங்களும் நேரத்துடன் காண்பிக்கும். எந்த இடத்தில் ஏறலாம், எங்கே இறங்கலாம் என்று தெளிவாக தெரியும்.",
        "duration": 12,
        "speaking_rate": 0.95
    },
    {
        "id": "scene5",
        "text": "உங்களுக்கு தெரிந்த பேருந்து தகவல் இல்லையா? நீங்களே சேர்க்கலாம்! எந்த route, எந்த நேரம், எந்த bus number - எல்லாத்தையும் எளிதாக add செய்யலாம். உங்கள் ஒரு பங்களிப்பு ஆயிரம் பேருக்கு உதவும்.",
        "duration": 12,
        "speaking_rate": 0.95
    },
    {
        "id": "scene6",
        "text": "Perundhu - தமிழ்நாடு மக்களுக்காக, மக்களால் உருவாக்கப்பட்ட app. இப்பவே download செய்து உங்கள் பயணத்தை எளிதாக்குங்கள்!",
        "duration": 8,
        "speaking_rate": 0.95
    }
]


def generate_tamil_voiceover():
    """Generate Tamil voice-over for each scene with optimized settings"""
    
    print("🎙️  Generating Enhanced Tamil Voice-overs (60-second version)")
    print(f"📁 Output directory: {OUTPUT_DIR}\n")
    
    # Initialize the Text-to-Speech client
    client = texttospeech.TextToSpeechClient()
    
    total_duration = 0
    
    # Generate voice-over for each scene
    for i, scene in enumerate(SCENES):
        scene_id = scene["id"]
        text = scene["text"]
        duration = scene["duration"]
        speaking_rate = scene.get("speaking_rate", 1.0)
        
        print(f"{'─' * 60}")
        print(f"🔊 Scene {i+1}/6: {scene_id}")
        print(f"   Duration: {duration}s | Speaking Rate: {speaking_rate}")
        print(f"   Text: {text[:60]}{'...' if len(text) > 60 else ''}")
        
        # Voice configuration
        voice = texttospeech.VoiceSelectionParams(
            language_code="ta-IN",
            name="ta-IN-Standard-A",  # Female voice
            # Alternative: "ta-IN-Standard-B" for male voice
        )
        
        # Audio configuration with scene-specific settings
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speaking_rate,
            pitch=0.0,
            effects_profile_id=["small-bluetooth-speaker-class-device"]
        )
        
        # Create synthesis input
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Perform text-to-speech request
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        # Save audio file
        output_file = OUTPUT_DIR / f"{scene_id}.mp3"
        with open(output_file, "wb") as out:
            out.write(response.audio_content)
        
        file_size = output_file.stat().st_size / 1024  # KB
        print(f"   ✅ Saved: {output_file.name} ({file_size:.1f} KB)")
        
        total_duration += duration
    
    print(f"\n{'=' * 60}")
    print("✨ All voice-overs generated successfully!")
    print(f"{'=' * 60}")
    print(f"📊 Total scenes: {len(SCENES)}")
    print(f"⏱️  Total duration: {total_duration} seconds")
    print(f"📦 Audio files location: {OUTPUT_DIR}")
    print(f"\n💡 Next step: Record app screens and run create_video_v2.py\n")


def generate_combined_voiceover():
    """Generate a single combined voice-over (alternative approach)"""
    
    print("\n🎙️  Generating combined Tamil voice-over...")
    
    client = texttospeech.TextToSpeechClient()
    
    # Combine all scene texts with natural pauses
    combined_text = " ... ".join([scene["text"] for scene in SCENES])
    
    voice = texttospeech.VoiceSelectionParams(
        language_code="ta-IN",
        name="ta-IN-Standard-A",
    )
    
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=0.95,
        pitch=0.0,
        effects_profile_id=["small-bluetooth-speaker-class-device"]
    )
    
    synthesis_input = texttospeech.SynthesisInput(text=combined_text)
    
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )
    
    output_file = OUTPUT_DIR / "combined_voiceover_60s.mp3"
    with open(output_file, "wb") as out:
        out.write(response.audio_content)
    
    file_size = output_file.stat().st_size / 1024  # KB
    print(f"✅ Combined voice-over saved: {output_file.name} ({file_size:.1f} KB)\n")


if __name__ == "__main__":
    print("=" * 60)
    print("🎬 Perundhu Enhanced Video - Tamil Voice-over Generation")
    print("=" * 60 + "\n")
    
    # Check for GCP credentials
    if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        print("⚠️  Note: Using Application Default Credentials")
        print("   If you encounter errors, run:")
        print("   gcloud auth application-default login\n")
    
    # Generate voice-overs
    generate_tamil_voiceover()
    
    # Also generate combined version
    generate_combined_voiceover()
    
    print("=" * 60)
    print("🎉 Voice-over generation complete!")
    print("=" * 60)
