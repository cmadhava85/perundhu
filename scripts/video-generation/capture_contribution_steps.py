#!/usr/bin/env python3
"""
Capture Contribution Flow Screenshots for Video Generation

Captures three stages:
  scene5b_contribute_filled.png  — form with all fields filled
  scene5c_contribute_success.png — success/confirmation page after submit

Usage:
  cd scripts/video-generation
  source venv/bin/activate
  python capture_contribution_steps.py
"""

import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

SCREENSHOTS_DIR = Path(__file__).parent / "assets" / "screens"
SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)

VIEWPORT = {'width': 1920, 'height': 1080}
CLIP     = {'x': 0, 'y': 0, 'width': 1920, 'height': 1080}

async def capture_steps():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport=VIEWPORT,
            user_agent=(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/131.0.0.0 Safari/537.36'
            ),
        )
        page = await context.new_page()

        print("🌐 Loading /contribute ...")
        await page.goto('https://perundhu.com/contribute', wait_until='networkidle')
        await page.wait_for_timeout(2000)

        # ── Fill Bus Number ────────────────────────────────────────────────────
        print("✏️  Filling bus number ...")
        bus_input = await page.wait_for_selector('#busNumber', state='visible', timeout=15000)
        await bus_input.click()
        await page.wait_for_timeout(300)
        await bus_input.fill('TN 71')
        await page.wait_for_timeout(500)

        # ── Fill FROM location ─────────────────────────────────────────────────
        print("✏️  Filling FROM location ...")
        from_input = await page.wait_for_selector('#fromLocationName', state='visible', timeout=10000)
        await from_input.click()
        await page.wait_for_timeout(300)
        await from_input.fill('KCBT')
        await page.wait_for_timeout(1500)

        # Click first suggestion
        try:
            suggestion = page.locator('ul li button').filter(has_text='KCBT').first()
            await suggestion.wait_for(state='visible', timeout=8000)
            await suggestion.click()
            print("   ✓ KCBT selected from dropdown")
        except Exception:
            print("   ⚠️  No KCBT dropdown — proceeding anyway")
        await page.wait_for_timeout(800)

        # ── Fill departure time ────────────────────────────────────────────────
        print("✏️  Filling departure time ...")
        try:
            dep_time = page.locator('input[placeholder="HH:MM"]').first()
            await dep_time.fill('06:30')
        except Exception:
            print("   ⚠️  Departure time input not found")
        await page.wait_for_timeout(500)

        # ── Fill TO location ───────────────────────────────────────────────────
        print("✏️  Filling TO location ...")
        to_input = await page.wait_for_selector('#toLocationName', state='visible', timeout=10000)
        await to_input.click()
        await page.wait_for_timeout(300)
        await to_input.fill('Madurai')
        await page.wait_for_timeout(1500)

        # Click Mattuthavani suggestion
        try:
            suggestion = page.locator('ul li button').filter(has_text='Mattuthavani').first()
            await suggestion.wait_for(state='visible', timeout=8000)
            await suggestion.click()
            print("   ✓ Mattuthavani selected from dropdown")
        except Exception:
            print("   ⚠️  No Mattuthavani dropdown — proceeding anyway")
        await page.wait_for_timeout(800)

        # ── Fill arrival time ──────────────────────────────────────────────────
        print("✏️  Filling arrival time ...")
        try:
            arr_time = page.locator('input[placeholder="HH:MM"]').nth(1)
            await arr_time.fill('11:30')
        except Exception:
            print("   ⚠️  Arrival time input not found")
        await page.wait_for_timeout(500)

        # ── Scroll to show the filled form ─────────────────────────────────────
        await page.evaluate("window.scrollTo(0, 300)")
        await page.wait_for_timeout(500)

        # ── Screenshot: Filled form ────────────────────────────────────────────
        filled_path = SCREENSHOTS_DIR / 'scene5b_contribute_filled.png'
        await page.screenshot(path=str(filled_path), clip=CLIP)
        print(f"📸 Saved: {filled_path.name}")

        # ── Click Submit ───────────────────────────────────────────────────────
        print("🚀 Submitting form ...")
        try:
            submit_btn = page.get_by_role('button', name='Submit Route')
            await submit_btn.wait_for(state='visible', timeout=5000)
            await submit_btn.click()
        except Exception:
            # Fallback: look for any submit button
            submit_btn = page.locator('button[type="submit"]')
            await submit_btn.first().click()

        await page.wait_for_timeout(3000)

        # ── Screenshot: Success/confirmation page ──────────────────────────────
        # Scroll back to top to show the success banner/message
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(800)
        success_path = SCREENSHOTS_DIR / 'scene5c_contribute_success.png'
        await page.screenshot(path=str(success_path), clip=CLIP)
        print(f"📸 Saved: {success_path.name}")

        await browser.close()
        print("\n✅ Contribution screenshots captured!")


if __name__ == '__main__':
    asyncio.run(capture_steps())
