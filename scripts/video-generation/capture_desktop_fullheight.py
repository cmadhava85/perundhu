#!/usr/bin/env python3
"""
Capture desktop screenshots with full height (no cutoff at bottom)
"""

import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

SCREENSHOTS_DIR = Path(__file__).parent / "assets" / "screens"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

async def capture_screenshots():
    async with async_playwright() as p:
        # Launch Chromium browser (visible window)
        browser = await p.chromium.launch(
            headless=False  # Show browser window so you can see what's being captured
        )
        
        # Create context with desktop settings
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1400},  # Taller viewport
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        )
        
        page = await context.new_page()
        
        print("🌐 Opening perundhu.com in Chrome...")
        
        print("\n🌐 Browser opened! Now manually interact with the site:")
        print("1. Current view will be Scene 1 (Home)")
        print("2. Click FROM input for Scene 2 (Autocomplete)")
        print("3. Press Enter for Scene 3 (Filters)")
        print("4. Scroll down for Scene 4 (Bus cards)")
        print("5. Navigate to /contribute for Scene 5")
        print("6. Go back home for Scene 6")
        print("\nPress Enter after each action, and I'll capture the screenshot...")
        
        # Scene 1: Current home page
        await asyncio.to_thread(input, "\nPress Enter to capture Scene 1 (Home page)...")
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene1_home.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("✓ Scene 1 saved")
        
        # Scene 2: Autocomplete
        await asyncio.to_thread(input, "\nClick the FROM input, then press Enter to capture Scene 2...")
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene2_search_results.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("✓ Scene 2 saved")
        
        # Scene 3: Search results
        await asyncio.to_thread(input, "\nPress Enter on search form, then press Enter here for Scene 3...")
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene3_filters.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("✓ Scene 3 saved")
        
        # Scene 4: Bus cards
        await asyncio.to_thread(input, "\nScroll down to show bus cards, then press Enter for Scene 4...")
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene4_bus_cards.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("✓ Scene 4 saved")
        
        # Scene 5: Contribute page
        await asyncio.to_thread(input, "\nNavigate to /contribute page, then press Enter for Scene 5...")
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene5_contribute.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("✓ Scene 5 saved")
        
        # Scene 6: Back to home
        await asyncio.to_thread(input, "\nGo back to home page, then press Enter for Scene 6...")
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene6_cta.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("✓ Scene 6 saved")
        
        print("\n" + "="*60)
        print("✅ ALL 6 SCENES CAPTURED SUCCESSFULLY!")
        print("="*60)
        print(f"Screenshots saved to: {SCREENSHOTS_DIR}")
        print("\nYou can close the Chrome window now.")
        print("Press Enter to close browser...")
        
        # Keep browser open for user to review
        await page.wait_for_timeout(5000)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_screenshots())
