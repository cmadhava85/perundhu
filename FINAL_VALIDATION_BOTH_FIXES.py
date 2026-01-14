#!/usr/bin/env python3
"""
Final Validation: Both Image 8812 and 8805 fixes working together
==================================================================
Demonstrates the improved origin/destination detection handles
multiple real-world image formats from bus schedules.
"""

import sys
sys.path.insert(0, '/Users/mchand69/Documents/perundhu')

from scripts.google_image_bus_scraper import OriginDestinationDetector

# Real-world examples from actual bus schedule images
REAL_WORLD_TEST_CASES = [
    # Image 8812 - ERODE Mandalam Express (service type between origin and destination)
    {
        "description": "Image 8812: ERODE Mandalam Express",
        "text": "ERODE Mandalam Express\nTN05AC8812\nTO BENGALURU\nDeparture: 14:00\nArrival: 18:45",
        "expected": ("ERODE", "BENGALURU")
    },
    
    # Image 8805 - TRICHY with table format (origin as header)
    {
        "description": "Image 8805: TRICHY Table Format",
        "text": "Services from TRICHY\nSALEM        06:00\nKRISHNAGIRI  08:30\nBENGALURU    12:15",
        "expected": ("TRICHY", "SALEM")
    },
    
    # Standard format - From X To Y
    {
        "description": "Standard: From X To Y",
        "text": "From SALEM to KRISHNAGIRI\nDeparture: 06:30\nArrival: 09:15",
        "expected": ("SALEM", "KRISHNAGIRI")
    },
    
    # Arrow notation
    {
        "description": "Arrow: CITY → CITY",
        "text": "COIMBATORE → BENGALURU\nNON-STOP EXPRESS\n18:00 - 22:30",
        "expected": ("COIMBATORE", "BENGALURU")
    },
    
    # Other service type format
    {
        "description": "DELUXE Service",
        "text": "VELLORE DELUXE BUS SERVICE\nDestination: SALEM\nTime: 07:30",
        "expected": ("VELLORE", "SALEM")
    },
    
    # Multi-city origin label
    {
        "description": "Multi-city Services",
        "text": "Services from MADURAI\nTRICHY         04:30\nDINDIGUL       05:15\nTHENI          06:00",
        "expected": ("MADURAI", "TRICHY")
    },
    
    # Complex format with both service type and table
    {
        "description": "Complex: Service + Table",
        "text": "TIRUVALLUR TRANSPORT CORPORATION\nServices from TIRUVALLUR\nCHENNAI         05:30\nKANCHIPURAM     06:15",
        "expected": ("TIRUVALLUR", "CHENNAI")
    },
    
    # Fully explicit labels
    {
        "description": "Explicit Labels",
        "text": "Origin: TIRUPPUR\nDestination: SALEM\nDeparture: 08:00",
        "expected": ("TIRUPPUR", "SALEM")
    }
]


def main():
    detector = OriginDestinationDetector()
    
    print("="*80)
    print("FINAL VALIDATION: Multiple Real-World Image Formats")
    print("="*80)
    print()
    
    passed = 0
    failed = 0
    
    for test in REAL_WORLD_TEST_CASES:
        origin, destination = detector.detect(test["text"])
        expected_origin, expected_dest = test["expected"]
        
        is_pass = (origin == expected_origin and destination == expected_dest)
        
        status = "✓ PASS" if is_pass else "✗ FAIL"
        if is_pass:
            passed += 1
        else:
            failed += 1
        
        print(f"{status}: {test['description']}")
        print(f"  Expected: {expected_origin} → {expected_dest}")
        print(f"  Got:      {origin} → {destination}")
        
        if not is_pass:
            print(f"  Input snippet: {test['text'][:60].replace(chr(10), ' / ')}...")
        print()
    
    # Summary
    print("="*80)
    print(f"RESULTS: {passed}/{len(REAL_WORLD_TEST_CASES)} tests passed")
    print("="*80)
    print()
    
    if failed == 0:
        print("✓ ALL TESTS PASSED!")
        print()
        print("Summary of supported formats:")
        print("  • Image 8812: 'ERODE Mandalam Express to BENGALURU' (service type format)")
        print("  • Image 8805: 'TRICHY' at top with table of destinations")
        print("  • Standard: 'From X To Y' explicit labels")
        print("  • Arrow: 'X → Y' notation")
        print("  • Service + Table: Combined format with service type and table rows")
        print("  • Explicit: 'Origin: X, Destination: Y' labeled format")
        print()
        print("The extraction pipeline now correctly:")
        print("  1. Distinguishes service names from origin/destination cities")
        print("  2. Handles table-format schedules with origin as header")
        print("  3. Supports multi-line text with flexible whitespace")
        print("  4. Validates cities against known Tamil Nadu locations")
        print()
        return 0
    else:
        print(f"✗ {failed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
