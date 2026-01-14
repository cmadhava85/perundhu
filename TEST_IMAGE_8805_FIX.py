#!/usr/bin/env python3
"""
Test the Image 8805 fix: TRICHY as origin with table destinations
==================================================================
Verifies that table format detection now correctly handles:
- TRICHY (origin) stated at top
- Table rows with destinations and departure times
"""

import sys
sys.path.insert(0, '/Users/mchand69/Documents/perundhu')

from scripts.google_image_bus_scraper import OriginDestinationDetector

def test_image_8805_trichy_table():
    """Test the Image 8805 table format case."""
    
    # Simulated OCR output from Image 8805 (table format)
    test_cases = [
        # Format 1: Simple table
        ("""TRICHY
SALEM        06:00
KRISHNAGIRI  08:30
BENGALURU    12:15""",
         ("TRICHY", "SALEM"),
         "TRICHY table - first destination is SALEM"),
        
        # Format 2: Table with multiple destinations
        ("""TRICHY Bus Services
MADURAI      05:30
THENI        07:45
DINDIGUL     09:20""",
         ("TRICHY", "MADURAI"),
         "TRICHY multiple destinations - first is MADURAI"),
        
        # Format 3: Explicit table header
        ("""From: TRICHY
To          Depart
SALEM       06:00
COIMBATORE  07:30""",
         ("TRICHY", "SALEM"),
         "TRICHY with explicit 'From' and 'To' headers"),
        
        # Format 4: Combined format
        ("""TRICHY to Multiple Cities
Destinations:
VELLORE      04:15
KANCHIPURAM  05:00""",
         ("TRICHY", "VELLORE"),
         "TRICHY with multi-city label"),
        
        # Format 5: Service from TRICHY
        ("""Services from TRICHY
BANGALORE    14:00
SALEM        14:30
KRISHNAGIRI  15:00""",
         ("TRICHY", "BANGALORE"),
         "TRICHY services list"),
    ]
    
    print("="*80)
    print("IMAGE 8805 FIX VALIDATION: Table Format Detection")
    print("="*80)
    print("\nTesting table format where origin is at top and table has destinations\n")
    
    detector = OriginDestinationDetector()
    passed = 0
    failed = 0
    
    for text, expected, description in test_cases:
        origin, destination = detector.detect(text)
        expected_origin, expected_dest = expected
        
        # Check result
        if origin == expected_origin and destination == expected_dest:
            status = "✓ PASS"
            passed += 1
        else:
            status = "✗ FAIL"
            failed += 1
        
        print(f"{status}: {description}")
        print(f"  Expected: {expected_origin} → {expected_dest}")
        print(f"  Got: {origin} → {destination}")
        if status == "✗ FAIL":
            print(f"  Input: {text[:50].replace(chr(10), ' / ')}...")
        print()
    
    print("="*80)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("="*80)
    
    return passed, failed


def test_explicit_vs_table_priority():
    """Test that explicit labels take priority over table format."""
    
    print("\n" + "="*80)
    print("PRIORITY TEST: Explicit Labels vs Table Format")
    print("="*80 + "\n")
    
    # When both explicit and table formats present, explicit should win
    test_cases = [
        # Explicit takes priority
        ("""From SALEM to KRISHNAGIRI
TRICHY       06:00
VELLORE      07:00""",
         ("SALEM", "KRISHNAGIRI"),
         "Explicit 'From X To Y' overrides table"),
        
        # Table format when no explicit
        ("""SALEM
KRISHNAGIRI  06:00
TRICHY       07:00""",
         ("SALEM", "KRISHNAGIRI"),
         "Table format used when no explicit labels"),
    ]
    
    detector = OriginDestinationDetector()
    passed = 0
    
    for text, expected, description in test_cases:
        origin, destination = detector.detect(text)
        expected_origin, expected_dest = expected
        
        if origin == expected_origin and destination == expected_dest:
            print(f"✓ {description}")
            passed += 1
        else:
            print(f"✗ {description}")
            print(f"  Expected: {expected_origin} → {expected_dest}, Got: {origin} → {destination}")
    
    print(f"\nPriority Test: {passed}/{len(test_cases)} passed")
    return passed == len(test_cases)


def test_combined_formats():
    """Test that Image 8812 and 8805 formats both work."""
    
    print("\n" + "="*80)
    print("COMBINED FORMAT TEST: Both 8812 and 8805 styles")
    print("="*80 + "\n")
    
    test_cases = [
        # Image 8812 style: City ServiceType ... to Destination
        ("ERODE Mandalam Express to BENGALURU", ("ERODE", "BENGALURU"), "Image 8812 style"),
        
        # Image 8805 style: City at top with table
        ("""TRICHY
SALEM        06:00
BENGALURU    12:15""", ("TRICHY", "SALEM"), "Image 8805 style"),
        
        # Regular From-To style
        ("From SALEM to KRISHNAGIRI", ("SALEM", "KRISHNAGIRI"), "Standard From-To style"),
        
        # Arrow style
        ("SALEM → KRISHNAGIRI", ("SALEM", "KRISHNAGIRI"), "Arrow notation style"),
    ]
    
    detector = OriginDestinationDetector()
    passed = 0
    
    for text, expected, style in test_cases:
        origin, destination = detector.detect(text)
        expected_origin, expected_dest = expected
        
        if origin == expected_origin and destination == expected_dest:
            print(f"✓ {style}")
            passed += 1
        else:
            print(f"✗ {style}")
            print(f"  Expected: {expected_origin} → {expected_dest}, Got: {origin} → {destination}")
    
    print(f"\nCombined Format Test: {passed}/{len(test_cases)} passed")
    return passed == len(test_cases)


if __name__ == "__main__":
    # Run all tests
    passed, failed = test_image_8805_trichy_table()
    test2 = test_explicit_vs_table_priority()
    test3 = test_combined_formats()
    
    print("\n" + "="*80)
    if failed == 0 and test2 and test3:
        print("✓ ALL VALIDATIONS PASSED - Image 8805 table format fix is ready!")
        print("\nSupported formats:")
        print("  1. Image 8812: 'ERODE Mandalam Express to BENGALURU'")
        print("  2. Image 8805: 'TRICHY' at top with table destinations")
        print("  3. Standard: 'From X to Y' or 'X → Y'")
        sys.exit(0)
    else:
        print("✗ SOME TESTS FAILED - Please review")
        print(f"  Table format tests: {5-failed}/5 passed")
        sys.exit(1)
