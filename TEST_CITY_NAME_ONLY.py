#!/usr/bin/env python3
"""
Verify that extraction returns ONLY city names, not service types
==================================================================
"""

import sys
sys.path.insert(0, '/Users/mchand69/Documents/perundhu')

from scripts.google_image_bus_scraper import OriginDestinationDetector

def test_city_name_only():
    """Verify that ONLY city names are extracted, no service types."""
    
    test_cases = [
        ("ERODE Mandalam Express to BENGALURU", "ERODE", "BENGALURU"),
        ("SALEM Express to KRISHNAGIRI", "SALEM", "KRISHNAGIRI"),
        ("TRICHY DELUXE SERVICE to MADURAI", "TRICHY", "MADURAI"),
        ("COIMBATORE NON-STOP to BENGALURU", "COIMBATORE", "BENGALURU"),
        ("VELLORE SLEEPER to SALEM", "VELLORE", "SALEM"),
        ("TIRUPPUR ORDINARY to CHENNAI", "TIRUPPUR", "CHENNAI"),
        ("ERODE AC DELUXE to BENGALURU", "ERODE", "BENGALURU"),
    ]
    
    print("="*80)
    print("CITY NAME ONLY VALIDATION")
    print("="*80)
    print("\nVerifying that extracted names contain ONLY city names (no service types)\n")
    
    detector = OriginDestinationDetector()
    all_passed = True
    
    for text, expected_origin, expected_dest in test_cases:
        origin, destination = detector.detect(text)
        
        # Check exact match
        origin_ok = (origin == expected_origin)
        dest_ok = (destination == expected_dest)
        
        # Check that origin doesn't contain service type words
        service_words = ['MANDALAM', 'EXPRESS', 'DELUXE', 'ORDINARY', 'AC', 'SLEEPER', 'NON-STOP', 'SEMI-EXPRESS']
        origin_clean = True
        dest_clean = True
        
        if origin:
            for word in service_words:
                if word in origin:
                    origin_clean = False
                    break
        
        if destination:
            for word in service_words:
                if word in destination:
                    dest_clean = False
                    break
        
        status = "✓" if (origin_ok and dest_ok and origin_clean and dest_clean) else "✗"
        
        if status == "✗":
            all_passed = False
        
        print(f"{status} Input: {text}")
        print(f"  Expected: {expected_origin} → {expected_dest}")
        print(f"  Got:      {origin} → {destination}")
        
        if not origin_ok or not dest_ok:
            print(f"  ⚠ Mismatch in extracted values")
        if not origin_clean:
            print(f"  ⚠ Origin contains service type words: {origin}")
        if not dest_clean:
            print(f"  ⚠ Destination contains service type words: {destination}")
        
        print()
    
    print("="*80)
    if all_passed:
        print("✓ ALL TESTS PASSED - Only city names extracted!")
        print("\nConfirmed:")
        print("  • Origin = City name only (no service types)")
        print("  • Destination = City name only (no service types)")
        print("  • Service type words (MANDALAM, EXPRESS, etc.) are correctly filtered out")
        return 0
    else:
        print("✗ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(test_city_name_only())
