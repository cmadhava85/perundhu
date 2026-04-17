#!/usr/bin/env python3
"""
Capture screenshots using Android mobile device emulation
Like Chrome DevTools Device Mode
"""

import asyncio
from playwright.async_api import async_playwright
from pathlib import Path
import time

SCREENSHOTS_DIR = Path(__file__).parent / "assets" / "screens"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

# Available device profiles (like Chrome DevTools)
DEVICES = {
    'Pixel 5': 'Pixel 5',                    # 393x851
    'Pixel 4': 'Pixel 4',                    # 353x745
    'Galaxy S9+': 'Galaxy S9+',              # 320x658
    'Galaxy S8': 'Galaxy S8',                # 360x740
    'iPhone 12': 'iPhone 12',                # 390x844
    'iPhone 12 Pro': 'iPhone 12 Pro',        # 390x844
    'iPhone SE': 'iPhone SE',                # 375x667
    'iPhone 11': 'iPhone 11',                # 414x896
}

async def capture_screenshots(device_name='Pixel 5'):
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False)
        
        # Use device emulation (like Chrome DevTools)
        device = p.devices[device_name]
        context = await browser.new_context(
            **device,
            locale='en-US',
        )
        
        page = await context.new_page()
        
        viewport = device['viewport']
        print("=" * 70)
        print(f"Capturing screenshots with {device_name} emulation")
        print(f"Viewport: {viewport['width']}x{viewport['height']}")
        print(f"User Agent: {device['user_agent'][:60]}...")
        print("Device Scale Factor: " + str(device.get('device_scale_factor', 1)))
        print("Has Touch: " + str(device.get('has_touch', False)))
        print("=" * 70)
        print()
        
        # Scene 1: Home page
        print("Scene 1: Home page...")
        await page.goto('https://perundhu.com/', wait_until='networkidle')
        await page.wait_for_timeout(3000)
        await page.screenshot(path=str(SCREENSHOTS_DIR / 'scene1_home.png'))
        print("✓ Saved scene1_home.png")
        
        # Scene 2: Autocomplete
        print("\nScene 2: Search with autocomplete...")
        from_input = page.locator('input[placeholder*="departure"]')
        await from_input.click()
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(SCREENSHOTS_DIR / 'scene2_search_results.png'))
        print("✓ Saved scene2_search_results.png")
        
        # Scene 3: Search results with filters
        print("\nScene 3: Search results...")
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(500)
        search_button = page.locator('button:has-text("Search Buses")')
        await search_button.click()
        await page.wait_for_timeout(4000)
        await page.screenshot(path=str(SCREENSHOTS_DIR / 'scene3_filters.png'))
        print("✓ Saved scene3_filters.png")
        
        # Scene 4: Bus cards
        print("\nScene 4: Bus cards...")
        await page.evaluate('window.scrollBy(0, 300)')
        await page.wait_for_timeout(1000)
        await page.screenshot(path=str(SCREENSHOTS_DIR / 'scene4_bus_cards.png'))
        print("✓ Saved scene4_bus_cards.png")
        
        # Scene 5: Contribute page
        print("\nScene 5: Contribute page...")
        await page.goto('https://perundhu.com/contribute', wait_until='networkidle')
        await page.wait_for_timeout(2500)
        await page.evaluate('window.scrollBy(0, 100)')
        await page.wait_for_timeout(500)
        await page.screenshot(path=str(SCREENSHOTS_DIR / 'scene5_contribute.png'))
        print("✓ Saved scene5_contribute.png")
        
        # Scene 6: CTA
        print("\nScene 6: Call to action...")
        await page.goto('https://perundhu.com/', wait_until='networkidle')
        await page.wait_for_timeout(2500)
        await page.screenshot(path=str(SCREENSHOTS_DIR / 'scene6_cta.png'))
        print("✓ Saved scene6_cta.png")
        
        print()
        print("=" * 70)
        print("✓ All screenshots captured successfully!")
        print("=" * 70)
        
        await browser.close()

if __name__ == "__main__":
    import sys
    
    # Allow device selection via command line
    device = 'Pixel 5'  # Default
    if len(sys.argv) > 1:
        device = sys.argv[1]
        if device not in DEVICES:
            print(f"❌ Unknown device: {device}")
            print(f"\nAvailable devices:")
            for name, resolution in [
                ('Pixel 5', '393x851'),
                ('Pixel 4', '353x745'),
                ('Galaxy S9+', '320x658'),
                ('Galaxy S8', '360x740'),
                ('iPhone 12', '390x844'),
                ('iPhone SE', '375x667'),
            ]:
                print(f"  • {name:15} ({resolution})")
            sys.exit(1)
    
    print(f"\n🎬 Using device: {device}\n")
    asyncio.run(capture_screenshots(device))
