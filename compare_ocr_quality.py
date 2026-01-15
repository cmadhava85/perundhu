#!/usr/bin/env python3
"""
Before/After Comparison Tool
============================
Compare old OCR extraction with improved extraction.

Usage:
    python compare_ocr_quality.py --image ./bus_timetable.jpg --show-debug
"""

import argparse
import cv2
import numpy as np
import pytesseract
from PIL import Image
from improved_ocr_preprocessing import ImprovedOCRProcessor
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


def old_ocr_method(image_path: str) -> str:
    """Simulate old OCR method (basic preprocessing)."""
    logger.info("\n" + "="*60)
    logger.info("OLD METHOD (Basic Preprocessing)")
    logger.info("="*60)
    
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
    # Very basic preprocessing
    _, thresh = cv2.threshold(image, 127, 255, cv2.THRESH_BINARY)
    
    pil_image = Image.fromarray(thresh)
    text = pytesseract.image_to_string(pil_image)
    
    logger.info(f"Text extracted ({len(text)} chars)")
    logger.info(f"Sample:\n{text[:300]}\n")
    
    return text


def new_ocr_method(image_path: str, debug: bool = False) -> str:
    """New improved OCR method."""
    processor = ImprovedOCRProcessor()
    text = processor.process_image(image_path, debug=debug)
    return text


def count_readability_metrics(text: str) -> dict:
    """Assess text readability."""
    import re
    
    # Count valid times
    time_pattern = r'\b([01]?[0-9]):([0-5][0-9])\b'
    times = re.findall(time_pattern, text)
    
    # Count recognizable words
    words = text.split()
    
    # Count garbled patterns (continuous non-alphabetic mixed with letters)
    garbled_pattern = r'[A-Z][\d\s]*[A-Z][\d\s]*[A-Z]'  # Multiple capitals with numbers
    garbled_count = len(re.findall(garbled_pattern, text))
    
    return {
        'times_found': len(times),
        'word_count': len(words),
        'total_chars': len(text),
        'garbled_patterns': garbled_count,
    }


def compare_extraction(image_path: str, show_debug: bool = False) -> None:
    """Compare old vs new extraction methods."""
    
    print("\n" + "="*70)
    print("OCR QUALITY COMPARISON")
    print("="*70)
    print(f"Image: {image_path}\n")
    
    # Extract with old method
    old_text = old_ocr_method(image_path)
    old_metrics = count_readability_metrics(old_text)
    
    # Extract with new method
    new_text = new_ocr_method(image_path, debug=show_debug)
    new_metrics = count_readability_metrics(new_text)
    
    # Comparison
    print("\n" + "="*70)
    print("COMPARISON RESULTS")
    print("="*70)
    
    metrics_comparison = [
        ("Times Found", old_metrics['times_found'], new_metrics['times_found']),
        ("Word Count", old_metrics['word_count'], new_metrics['word_count']),
        ("Total Characters", old_metrics['total_chars'], new_metrics['total_chars']),
        ("Garbled Patterns", old_metrics['garbled_patterns'], new_metrics['garbled_patterns']),
    ]
    
    print(f"\n{'Metric':<20} {'Old Method':<15} {'New Method':<15} {'Improvement':<15}")
    print("-" * 65)
    
    for metric_name, old_val, new_val in metrics_comparison:
        if old_val == 0:
            improvement = "N/A"
        else:
            improvement_pct = ((new_val - old_val) / abs(old_val) * 100) if old_val != 0 else 0
            improvement = f"{improvement_pct:+.1f}%"
        
        print(f"{metric_name:<20} {old_val:<15} {new_val:<15} {improvement:<15}")
    
    # Detailed comparison
    print(f"\n{'='*70}")
    print("DETAILED ANALYSIS")
    print(f"{'='*70}")
    
    print("\n📊 OLD METHOD TEXT SAMPLE (first 400 chars):")
    print("-" * 70)
    print(old_text[:400])
    
    print("\n\n📊 NEW METHOD TEXT SAMPLE (first 400 chars):")
    print("-" * 70)
    print(new_text[:400])
    
    # Quality assessment
    print(f"\n{'='*70}")
    print("QUALITY ASSESSMENT")
    print(f"{'='*70}")
    
    old_quality = (
        old_metrics['times_found'] * 2 +
        old_metrics['word_count'] * 0.5 -
        old_metrics['garbled_patterns'] * 5
    )
    
    new_quality = (
        new_metrics['times_found'] * 2 +
        new_metrics['word_count'] * 0.5 -
        new_metrics['garbled_patterns'] * 5
    )
    
    print(f"Old Method Quality Score: {old_quality:.1f}")
    print(f"New Method Quality Score: {new_quality:.1f}")
    print(f"Improvement: {((new_quality - old_quality) / abs(old_quality) * 100):.1f}%")
    
    print(f"\n{'='*70}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Compare OCR extraction quality")
    parser.add_argument("--image", required=True, help="Path to image file")
    parser.add_argument("--show-debug", action="store_true", help="Save debug images")
    
    args = parser.parse_args()
    
    try:
        compare_extraction(args.image, show_debug=args.show_debug)
    except FileNotFoundError:
        print(f"Error: Image not found at {args.image}")
    except Exception as e:
        print(f"Error: {e}")
        print("\nMake sure Tesseract is installed:")
        print("  - macOS: brew install tesseract")
        print("  - Ubuntu: apt-get install tesseract-ocr")
        print("  - Windows: choco install tesseract")
