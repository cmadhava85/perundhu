#!/usr/bin/env python3
"""
Generate Tamil voice-over using Google Cloud Text-to-Speech
Uses existing GCP credentials from perundhu-prod-001 project
"""

import os
from pathlib import Path
from google.cloud import texttospeech

# Output directory
OUTPUT_DIR = Path(__file__).parent / "output" / "audio"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Tamil script from SOCIAL_MEDIA_VIDEO_SCRIPT.md
SCENES = [
    {
        "id": "scene1",
        "text": "எனக்கு சரியான பேருந்து தகவல் கிடைக்கவில்லை.",
        "duration": 4
    },
    {
        "id": "scene2",
        "text": "நீங்கள் மாணவரா, தினசரி பயணியா, அல்லது வேலைக்கு போகிறவரா?",
        "duration": 6
    },
    {
        "id": "scene3",
        "text": "Perundhu-வில் பேருந்து routes தேடலாம், முடிவுகளை உடனே பார்க்கலாம், இல்லாத தகவல்களை நீங்களே சேர்க்கலாம்.",
        "duration": 8
    },
    {
        "id": "scene4",
        "text": "நீங்கள் தினமும் பயன்படுத்தும் route தகவல், இன்னும் ஆயிரக்கணக்கான பயணிகளுக்கு உதவலாம். உங்கள் ஒரு பங்களிப்பு மிகவும் முக்கியம்.",
        "duration": 7
    },
    {
        "id": "scene5",
        "text": "Perundhu — தமிழ்நாடு பயணிகளுக்காக, மக்களின் பங்களிப்பால் வளர்கிறது.",
        "duration": 5
    }
]


def generate_tamil_voiceover():
    """Generate Tamil voice-over for each scene"""
    
    print("🎙️  Generating Tamil voice-overs with Google Cloud TTS...")
    print(f"📁 Output directory: {OUTPUT_DIR}\n")
    
    # Initialize the Text-to-Speech client
    client = texttospeech.TextToSpeechClient()
    
    # Voice configuration
    voice = texttospeech.VoiceSelectionParams(
        language_code="ta-IN",  # Tamil (India)
        name="ta-IN-Standard-A",  # Female voice (natural sounding)
        # Alternative: "ta-IN-Standard-B" for male voice
    )
    
    # Audio configuration
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=0.95,  # Slightly slower for clarity
        pitch=0.0,
        effects_profile_id=["small-bluetooth-speaker-class-device"]
    )
    
    # Generate voice-over for each scene
    for scene in SCENES:
        scene_id = scene["id"]
        text = scene["text"]
        
        print(f"🔊 Generating {scene_id}...")
        print(f"   Text: {text[:50]}{'...' if len(text) > 50 else ''}")
        
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
        
        print(f"   ✅ Saved to: {output_file.name}\n")
    
    print("✨ All voice-overs generated successfully!")
    print(f"📊 Total scenes: {len(SCENES)}")
    print(f"📦 Audio files location: {OUTPUT_DIR}\n")


def generate_combined_voiceover():
    """Generate a single combined voice-over (alternative approach)"""
    
    print("🎙️  Generating combined Tamil voice-over...")
    
    client = texttospeech.TextToSpeechClient()
    
    # Combine all scene texts with pauses
    combined_text = " ... ".join([scene["text"] for scene in SCENES])
    
    voice = texttospeech.VoiceSelectionParams(
        language_code="ta-IN",
        name="ta-IN-Standard-A",
    )
    
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=0.95,
        pitch=0.0,
    )
    
    synthesis_input = texttospeech.SynthesisInput(text=combined_text)
    
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )
    
    output_file = OUTPUT_DIR / "combined_voiceover.mp3"
    with open(output_file, "wb") as out:
        out.write(response.audio_content)
    
    print(f"✅ Combined voice-over saved to: {output_file}\n")


if __name__ == "__main__":
    print("=" * 60)
    print("🎬 Perundhu Video Generation - Tamil Voice-over")
    print("=" * 60 + "\n")
    
    # Check for GCP credentials
    if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        print("⚠️  Warning: GOOGLE_APPLICATION_CREDENTIALS not set")
        print("   Ensure you have GCP credentials configured:")
        print("   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json\n")
    
    # Generate voice-overs
    generate_tamil_voiceover()
    
    print("\n" + "=" * 60)
    print("🎉 Voice-over generation complete!")
    print("=" * 60)
