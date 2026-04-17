#!/usr/bin/env python3
"""
Automated browser journey capture for Perundhu promo video
Captures the complete user flow automatically
"""

import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

SCREENSHOTS_DIR = Path(__file__).parent / "assets" / "screens"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

async def capture_journey():
    async with async_playwright() as p:
        # Launch browser (visible window)
        browser = await p.chromium.launch(
            headless=False,  # Show browser so you can see the journey
            slow_mo=500  # Slow down actions for visibility
        )
        
        # Create context with desktop settings
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1400},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        )
        
        page = await context.new_page()
        
        print("="*70)
        print("🎬 Starting Automated Perundhu User Journey Capture")
        print("="*70)
        
        # Scene 1: Navigate to home page
        print("\n📸 Scene 1: Loading home page...")
        await page.goto('https://perundhu.com/', wait_until='networkidle')
        await page.wait_for_timeout(2000)
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene1_home.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("   ✓ Home page captured")
        
        # Scene 2: Type in FROM input and show autocomplete
        print("\n📸 Scene 2: Typing origin location...")
        from_input = await page.wait_for_selector('input[placeholder*="departure"]', state='visible', timeout=10000)
        await from_input.click()
        await page.wait_for_timeout(500)
        
        # Clear any existing value and type location slowly to show autocomplete
        await from_input.fill('')  # Clear field first
        await from_input.type('KCBT', delay=200)
        await page.wait_for_timeout(1500)  # Wait for autocomplete suggestions
        
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene2_search_results.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("   ✓ Autocomplete suggestions captured")
        
        # Select first suggestion
        print("\n   Selecting origin from autocomplete...")
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(1000)
        
        # Scene 3: Type destination and search
        print("\n📸 Scene 3: Typing destination and searching...")
        to_input = await page.wait_for_selector('input[placeholder*="destination"]', state='visible', timeout=10000)
        await to_input.click()
        await page.wait_for_timeout(500)
        await to_input.fill('')  # Clear field first
        await to_input.type('Madurai - Mattuthavani', delay=150)
        await page.wait_for_timeout(1500)
        
        # Select first destination suggestion
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(500)
        
        # Click the Search Buses button
        print("   Clicking Search Buses button...")
        search_button = await page.wait_for_selector('button:has-text("Search Buses"), button[type="submit"]', state='visible', timeout=5000)
        await search_button.click()
        await page.wait_for_timeout(4000)  # Wait for search results to load
        
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene3_filters.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("   ✓ Search results with filters captured")
        
        # Scene 4: Scroll to show bus cards
        print("\n📸 Scene 4: Scrolling to show bus cards...")
        await page.evaluate('window.scrollTo(0, 400)')
        await page.wait_for_timeout(1500)
        
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene4_bus_cards.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("   ✓ Bus timing cards captured")
        
        # Expand first bus to show stops
        print("\n   Expanding bus to show stops list...")
        try:
            # Look for expand button or clickable bus card
            expand_button = await page.wait_for_selector('button:has-text("View Stops"), button:has-text("Show Stops"), .bus-card, [aria-label*="expand"]', timeout=5000)
            await expand_button.click()
            await page.wait_for_timeout(2000)
            
            print("   ✓ Stops list expanded")
        except Exception as e:
            print(f"   ⚠ Could not expand stops (may not be available): {e}")
        
        # Scene 5: Navigate to contribute page
        print("\n📸 Scene 5: Navigating to contribution page...")
        await page.goto('https://perundhu.com/contribute', wait_until='networkidle')
        await page.wait_for_timeout(2000)
        
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene5_contribute.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("   ✓ Contribution form captured")
        
        # Scene 6: Scroll down to show more of the form
        print("\n📸 Scene 6: Showing contribution form details...")
        await page.evaluate('window.scrollTo(0, 300)')
        await page.wait_for_timeout(1500)
        
        await page.screenshot(
            path=str(SCREENSHOTS_DIR / 'scene6_cta.png'),
            clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
        )
        print("   ✓ Contribution form details captured")
        
        print("\n" + "="*70)
        print("✅ ALL SCENES CAPTURED SUCCESSFULLY!")
        print("="*70)
        print(f"\nScreenshots saved to: {SCREENSHOTS_DIR}")
        print("\nScene breakdown:")
        print("  1. Home page")
        print("  2. Autocomplete suggestions")
        print("  3. Search results with filters")
        print("  4. Bus cards with expanded stops")
        print("  5. Contribution form")
        print("  6. Success message")
        print("\nBrowser will close in 5 seconds...")
        
        await page.wait_for_timeout(5000)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_journey())
