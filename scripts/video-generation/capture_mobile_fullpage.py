#!/usr/bin/env python3
"""
Capture full-page mobile screenshots showing all content
"""

import subprocess
import time
from pathlib import Path

SCREENSHOTS_DIR = Path(__file__).parent / "assets" / "screens"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

def capture_with_chrome_devtools():
    """
    Use Chrome command line to capture mobile screenshots
    """
    
    # Chrome flags for mobile emulation
    user_agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    
    print("=" * 70)
    print("Capturing mobile screenshots with Chrome DevTools")
    print("Mobile emulation: iPhone (390x844)")
    print("=" * 70)
    print()
    
    # Instructions for manual capture
    print("MANUAL CAPTURE INSTRUCTIONS:")
    print()
    print("1. Open Chrome and press F12 (DevTools)")
    print("2. Click 'Toggle device toolbar' (Ctrl+Shift+M / Cmd+Shift+M)")
    print("3. Select 'iPhone 12 Pro' from device dropdown")
    print("4. Navigate to https://perundhu.com/")
    print()
    print("5. For each scene, capture as follows:")
    print()
    print("   Scene 1 - HOME:")
    print("      - Show full home page with search form")
    print("      - Make sure 'Search Buses' button is visible")
    print(f"      - Save as: {SCREENSHOTS_DIR}/scene1_home.png")
    print()
    print("   Scene 2 - AUTOCOMPLETE:")
    print("      - Click FROM input to show suggestions")
    print(f"      - Save as: {SCREENSHOTS_DIR}/scene2_search_results.png")
    print()
    print("   Scene 3 - FILTERS:")
    print("      - Search for KCBT KILAMBAKKAM → Madurai")
    print("      - Show results page with time filters at top")
    print(f"      - Save as: {SCREENSHOTS_DIR}/scene3_filters.png")
    print()
    print("   Scene 4 - BUS CARDS:")
    print("      - Scroll down to show bus cards with timing")
    print(f"      - Save as: {SCREENSHOTS_DIR}/scene4_bus_cards.png")
    print()
    print("   Scene 5 - CONTRIBUTE:")
    print("      - Navigate to /contribute page")
    print(f"      - Save as: {SCREENSHOTS_DIR}/scene5_contribute.png")
    print()
    print("   Scene 6 - CTA:")
    print("      - Back to home page")
    print(f"      - Save as: {SCREENSHOTS_DIR}/scene6_cta.png")
    print()
    print("=" * 70)
    print("📸 In DevTools, use:")
    print("   - Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows)")
    print("   - Type 'screenshot'")
    print("   - Select 'Capture full size screenshot'")
    print("=" * 70)

if __name__ == "__main__":
    capture_with_chrome_devtools()
