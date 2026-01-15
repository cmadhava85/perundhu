#!/usr/bin/env python3
"""
Quick script to process local images for bus timing extraction
"""
import subprocess
import sys
from pathlib import Path

def main():
    image_dir = Path("/Users/mchand69/Downloads/tnstc bus time table - Google Search")
    output_dir = "tnstc_local_extraction"
    
    # Get first 10 jpg images
    images = sorted(image_dir.glob("*.jpg"))[:10]
    
    print(f"🖼️  Found {len(images)} images to process")
    
    for i, img_path in enumerate(images, 1):
        print(f"\n📸 [{i}/10] Processing: {img_path.name}")
        
        cmd = [
            sys.executable,
            "scripts/google_image_bus_scraper.py",
            "--process-image", str(img_path),
            "--output", output_dir
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"   ✅ Success")
        else:
            print(f"   ⚠️  Error: {result.stderr[:200]}")
    
    print(f"\n✨ Completed! Check results in: {output_dir}/")

if __name__ == "__main__":
    main()
