#!/usr/bin/env python3
"""
Test the Image 8812 fix: ERODE Mandalam Express bus
======================================================
Verifies that origin/destination detection now correctly handles:
- ERODE (origin) is not confused with MANDALAM (service name)
- Proper extraction of ERODE → BENGALURU route
"""

import sys
sys.path.insert(0, '/Users/mchand69/Documents/perundhu')

from scripts.google_image_bus_scraper import OriginDestinationDetector, BusImageAnalyzer

def test_image_8812_erode():
    """Test the specific Image 8812 case."""
    
    # Simulated OCR output from Image 8812
    test_cases = [
        # Format 1: "ERODE Mandalam Express to BENGALURU"
        ("ERODE Mandalam Express\nTO BENGALURU\n14:00 - 18:45\nNON-STOP",
         ("ERODE", "BENGALURU"),
         "ERODE Mandalam Express"),
        
        # Format 2: With fare/details
        ("ERODE Mandalam Bus Service TN05AC8812\nTo Bengaluru\nDepart: 2:00 PM\nArrive: 6:45 PM\nFare: 200",
         ("ERODE", "BENGALURU"),
         "ERODE to BENGALURU"),
        
        # Format 3: Arrow notation
        ("ERODE → BENGALURU\nMandalam Express Service",
         ("ERODE", "BENGALURU"),
         "Arrow notation"),
        
        # Format 4: From X To Y
        ("From ERODE to BENGALURU\nMandalam\n14:00 hrs",
         ("ERODE", "BENGALURU"),
         "From X To Y"),
        
        # Format 5: Complex with multiple service types
        ("ERODE\nDELUXE SERVICE\nDestination: BENGALURU",
         ("ERODE", "BENGALURU"),
         "ERODE DELUXE SERVICE to BENGALURU"),
    ]
    
    print("="*80)
    print("IMAGE 8812 FIX VALIDATION")
    print("="*80)
    print("\nTesting improved origin/destination detection for ERODE services\n")
    
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
        print(f"  Input: {text[:60].replace(chr(10), ' / ')}...")
        print(f"  Expected: {expected_origin} → {expected_dest}")
        print(f"  Got: {origin} → {destination}")
        print()
    
    print("="*80)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("="*80)
    
    if failed == 0:
        print("\n✓ ALL TESTS PASSED!")
        print("  The ERODE Mandalam Express fix is working correctly.")
        print("  'Mandalam' is now recognized as a service type, not origin/destination.")
        return True
    else:
        print(f"\n✗ {failed} test(s) failed. Please review the extraction logic.")
        return False


def test_other_mandalam_services():
    """Test other service types don't break existing extraction."""
    
    print("\n" + "="*80)
    print("REGRESSION TEST: Other Service Types")
    print("="*80 + "\n")
    
    test_cases = [
        ("SALEM Express to KRISHNAGIRI", ("SALEM", "KRISHNAGIRI")),
        ("TRICHY DELUXE SERVICE to MADURAI", ("TRICHY", "MADURAI")),
        ("COIMBATORE NON-STOP to BENGALURU", ("COIMBATORE", "BENGALURU")),
        ("VELLORE SLEEPER to SALEM", ("VELLORE", "SALEM")),
    ]
    
    detector = OriginDestinationDetector()
    passed = 0
    
    for text, expected in test_cases:
        origin, destination = detector.detect(text)
        expected_origin, expected_dest = expected
        
        if origin == expected_origin and destination == expected_dest:
            print(f"✓ {text}")
            passed += 1
        else:
            print(f"✗ {text}")
            print(f"  Expected: {expected_origin} → {expected_dest}, Got: {origin} → {destination}")
    
    print(f"\nRegression Test: {passed}/{len(test_cases)} passed")
    return passed == len(test_cases)


if __name__ == "__main__":
    # Run all tests
    test1 = test_image_8812_erode()
    test2 = test_other_mandalam_services()
    
    print("\n" + "="*80)
    if test1 and test2:
        print("✓ ALL VALIDATIONS PASSED - Image 8812 fix is ready!")
        sys.exit(0)
    else:
        print("✗ SOME TESTS FAILED - Please review")
        sys.exit(1)
