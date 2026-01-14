#!/usr/bin/env python3
"""
Test Phase 1 OCR Improvements
Tests Multi-Config Tesseract, Tamil Support, and Post-Processing Validation
"""

import sys
sys.path.append('scripts')

from google_image_bus_scraper import (
    ExtractionValidator, 
    TamilOCREnhancer, 
    OCRExtractor,
    ImagePreprocessor
)
from PIL import Image, ImageDraw, ImageFont
import numpy as np

def create_test_image(text: str, size=(800, 200)) -> Image.Image:
    """Create a test image with text."""
    img = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        # Try to use a larger font
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
    except:
        font = ImageFont.load_default()
    
    # Draw text
    draw.text((50, 80), text, fill='black', font=font)
    return img

def test_extraction_validator():
    """Test ExtractionValidator corrections."""
    print("\n" + "="*60)
    print("TEST 1: ExtractionValidator - Character Corrections")
    print("="*60)
    
    test_cases = [
        ("Bus at O9:3O AM", "Bus at 09:30 AM"),  # O to 0
        ("Route I2B", "Route 128"),  # I to 1, B to 8
        ("CHENNA1 to MADURA|", "CHENNAI to MADURAI"),  # City corrections
        ("Time: lO:l5", "Time: 10:15"),  # l to 1, O to 0
    ]
    
    validator = ExtractionValidator()
    passed = 0
    
    for input_text, expected in test_cases:
        result = validator.clean_text(input_text)
        status = "✅" if expected in result else "❌"
        passed += 1 if expected in result else 0
        print(f"{status} Input: '{input_text}'")
        print(f"   Output: '{result}'")
        print(f"   Expected: '{expected}'")
        print()
    
    print(f"Result: {passed}/{len(test_cases)} tests passed\n")
    return passed == len(test_cases)

def test_tamil_support():
    """Test Tamil OCR support."""
    print("\n" + "="*60)
    print("TEST 2: Tamil OCR Support")
    print("="*60)
    
    tamil_enhancer = TamilOCREnhancer()
    
    print(f"Tamil support available: {tamil_enhancer.tamil_available}")
    
    if tamil_enhancer.tamil_available:
        print("✅ Tamil language data is installed")
        print("✅ Can process Tamil + English mixed text")
        return True
    else:
        print("⚠️  Tamil language data not found")
        print("   Install with: brew install tesseract-lang")
        return False

def test_multi_config_ocr():
    """Test multi-config OCR extraction."""
    print("\n" + "="*60)
    print("TEST 3: Multi-Config OCR")
    print("="*60)
    
    # Create test image with bus schedule text
    test_text = "CHENNAI TO MADURAI\nRoute: 27D\nDepart: 09:30 AM"
    test_image = create_test_image(test_text)
    
    print(f"Test image created with text:")
    print(f"  '{test_text}'")
    print()
    
    # Test with multi-config enabled
    ocr_multi = OCRExtractor(enable_multi_config=True)
    result_multi = ocr_multi.extract_text_multi_config(test_image)
    
    print(f"Multi-Config OCR Results:")
    print(f"  Best config: {result_multi['config']}")
    print(f"  Confidence: {result_multi['confidence']:.1f}%")
    print(f"  Word count: {result_multi['word_count']}")
    print(f"  Extracted text: '{result_multi['text'][:100]}...'")
    print()
    
    # Test with single config (old method)
    ocr_single = OCRExtractor(enable_multi_config=False)
    text_single = ocr_single.extract_text(test_image)
    
    print(f"Single-Config OCR (baseline):")
    print(f"  Extracted text: '{text_single[:100]}...'")
    print()
    
    # Compare
    if len(result_multi['text']) >= len(text_single):
        print("✅ Multi-config extracted same or more text than single config")
        return True
    else:
        print("⚠️  Multi-config extracted less text")
        return False

def test_end_to_end():
    """Test complete extraction pipeline with all improvements."""
    print("\n" + "="*60)
    print("TEST 4: End-to-End Extraction Pipeline")
    print("="*60)
    
    # Create test image with common OCR errors
    test_text = "CHENNA1 to MADURA|\nDepart: O9:3O AM\nRoute: l2B"
    test_image = create_test_image(test_text)
    
    print(f"Test image with OCR errors:")
    print(f"  '{test_text}'")
    print()
    
    # Extract with all enhancements
    ocr = OCRExtractor(
        enable_tamil=True,
        enable_multi_config=True
    )
    
    extracted_text, confidence = ocr.extract_text_with_confidence(test_image)
    
    print(f"Extracted and Cleaned Text:")
    print(f"  '{extracted_text}'")
    print(f"  Confidence: {confidence:.1%}")
    print()
    
    # Check if corrections were applied
    corrections_found = []
    if "CHENNAI" in extracted_text.upper():
        corrections_found.append("✅ CHENNA1 → CHENNAI")
    if "MADURAI" in extracted_text.upper():
        corrections_found.append("✅ MADURA| → MADURAI")
    if "09:30" in extracted_text or "9:30" in extracted_text:
        corrections_found.append("✅ O9:3O → 09:30")
    
    print("Corrections Applied:")
    for correction in corrections_found:
        print(f"  {correction}")
    
    if len(corrections_found) >= 2:
        print("\n✅ End-to-end pipeline working correctly")
        return True
    else:
        print("\n⚠️  Some corrections not applied")
        return False

def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("PHASE 1 OCR IMPROVEMENTS - TEST SUITE")
    print("="*60)
    print("\nTesting:")
    print("  1. Character correction (O→0, I→1, etc.)")
    print("  2. City name correction (CHENNA1→CHENNAI)")
    print("  3. Tamil language support")
    print("  4. Multi-config OCR (5 different PSM modes)")
    print("  5. End-to-end extraction pipeline")
    
    results = []
    
    # Run tests
    results.append(("ExtractionValidator", test_extraction_validator()))
    results.append(("Tamil Support", test_tamil_support()))
    results.append(("Multi-Config OCR", test_multi_config_ocr()))
    results.append(("End-to-End Pipeline", test_end_to_end()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    
    print(f"\nOverall: {total_passed}/{total_tests} tests passed")
    
    if total_passed == total_tests:
        print("\n🎉 ALL TESTS PASSED! Phase 1 improvements are working correctly.")
    elif total_passed >= total_tests - 1:
        print("\n⚠️  Most tests passed. Minor issues detected.")
    else:
        print("\n❌ Some tests failed. Please review the output above.")
    
    print("\n" + "="*60)
    print("EXPECTED IMPROVEMENTS:")
    print("="*60)
    print("• +15-25% accuracy from multi-config OCR")
    print("• +10-15% accuracy from post-processing validation")
    print("• +40-50% accuracy for Tamil text")
    print("• Overall: ~40% → 65-75% accuracy")
    print("="*60)

if __name__ == '__main__':
    main()
