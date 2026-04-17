#!/usr/bin/env python3
"""
List all available Playwright device profiles (like Chrome DevTools)
"""

from playwright.sync_api import sync_playwright

def list_devices():
    with sync_playwright() as p:
        devices = p.devices
        
        print("=" * 80)
        print("Available Mobile Device Profiles (Like Chrome DevTools)")
        print("=" * 80)
        print()
        
        # Group by type
        android_devices = []
        iphone_devices = []
        tablet_devices = []
        
        for name in sorted(devices.keys()):
            device = devices[name]
            viewport = device['viewport']
            
            info = f"{name:30} {viewport['width']:4}x{viewport['height']:<4}"
            
            if 'Android' in name or 'Pixel' in name or 'Galaxy' in name:
                android_devices.append(info)
            elif 'iPhone' in name or 'iPad' in name:
                iphone_devices.append(info)
            else:
                tablet_devices.append(info)
        
        print("📱 ANDROID DEVICES:")
        print("-" * 80)
        for device in android_devices:
            print(f"  {device}")
        
        print()
        print("🍎 APPLE DEVICES:")
        print("-" * 80)
        for device in iphone_devices:
            print(f"  {device}")
        
        if tablet_devices:
            print()
            print("📱 TABLETS:")
            print("-" * 80)
            for device in tablet_devices:
                print(f"  {device}")
        
        print()
        print("=" * 80)
        print("💡 Example Usage:")
        print("   device = p.devices['Pixel 5']")
        print("   context = browser.new_context(**device)")
        print("=" * 80)

if __name__ == "__main__":
    try:
        list_devices()
    except ImportError:
        print("❌ Playwright not installed. Run: pip install playwright")
        print("   Then: playwright install chromium")
