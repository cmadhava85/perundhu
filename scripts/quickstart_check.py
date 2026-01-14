"""
Quick start script to test the Google Image Bus Scraper installation
"""

import sys
import subprocess
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_dependencies():
    """Check if all required dependencies are available."""
    logger.info("Checking dependencies...")
    
    required_packages = {
        'PIL': 'pillow',
        'cv2': 'opencv-python',
        'numpy': 'numpy',
        'requests': 'requests',
        'pytesseract': 'pytesseract',
    }
    
    missing = []
    
    for module, package in required_packages.items():
        try:
            __import__(module)
            logger.info(f"✓ {package}")
        except ImportError:
            logger.warning(f"✗ {package} - MISSING")
            missing.append(package)
    
    if missing:
        logger.error(f"\nMissing packages: {', '.join(missing)}")
        logger.error("Install with: pip install " + " ".join(missing))
        return False
    
    return True


def check_tesseract():
    """Check if Tesseract OCR is installed."""
    logger.info("\nChecking Tesseract OCR...")
    
    try:
        result = subprocess.run(['tesseract', '--version'], capture_output=True, text=True)
        logger.info(f"✓ Tesseract OCR found: {result.stdout.split()[1]}")
        return True
    except FileNotFoundError:
        logger.warning("✗ Tesseract OCR not found")
        logger.info("Install with:")
        logger.info("  macOS: brew install tesseract")
        logger.info("  Ubuntu: sudo apt-get install tesseract-ocr")
        logger.info("  Windows: https://github.com/UB-Mannheim/tesseract/wiki")
        return False


def test_imports():
    """Test importing main modules."""
    logger.info("\nTesting imports...")
    
    try:
        from google_image_bus_scraper import (
            OCRExtractor,
            DataExtractor,
            GoogleImageSearcher,
            BusImageAnalyzer
        )
        logger.info("✓ google_image_bus_scraper")
    except Exception as e:
        logger.error(f"✗ google_image_bus_scraper: {e}")
        return False
    
    try:
        from advanced_bus_image_processor import (
            SymbolDetector,
            MultiPageImageHandler,
            DataValidator,
            DataDeduplicator
        )
        logger.info("✓ advanced_bus_image_processor")
    except Exception as e:
        logger.error(f"✗ advanced_bus_image_processor: {e}")
        return False
    
    try:
        from integrate_google_data import BusDataIntegrator
        logger.info("✓ integrate_google_data")
    except Exception as e:
        logger.error(f"✗ integrate_google_data: {e}")
        return False
    
    return True


def run_quick_test():
    """Run a quick functionality test."""
    logger.info("\nRunning quick tests...")
    
    try:
        from google_image_bus_scraper import DataExtractor
        
        # Test time extraction
        text = "Departure at 09:30 AM, Arrival at 18:45 PM"
        times = DataExtractor.extract_times(text)
        
        if len(times) >= 2:
            logger.info(f"✓ Time extraction: {times[0]} and {times[1]}")
        else:
            logger.error(f"✗ Time extraction failed: {times}")
            return False
        
        # Test city extraction
        text = "Chennai to Madurai bus schedule"
        cities = DataExtractor.extract_cities(text)
        
        if "CHENNAI" in cities and "MADURAI" in cities:
            logger.info(f"✓ City extraction: {cities}")
        else:
            logger.error(f"✗ City extraction failed: {cities}")
            return False
        
        return True
    
    except Exception as e:
        logger.error(f"✗ Quick test failed: {e}")
        return False


def print_next_steps():
    """Print next steps for user."""
    logger.info("\n" + "=" * 60)
    logger.info("NEXT STEPS")
    logger.info("=" * 60)
    
    logger.info("""
1. Process a single local image:
   python google_image_bus_scraper.py --process-image ./bus_image.jpg

2. Search Google Images:
   python google_image_bus_scraper.py \\
     --search "Chennai to Madurai bus schedule" \\
     --limit 5

3. Validate and integrate with existing data:
   python integrate_google_data.py \\
     --extracted ./data/extracted_buses.json \\
     --existing ./data/existing_buses.json \\
     --output ./data/merged_buses.json

4. Run full test suite:
   python test_google_image_scraper.py

For detailed documentation, see: GOOGLE_IMAGE_EXTRACTOR_README.md
    """)


def main():
    """Main quick start check."""
    logger.info("=" * 60)
    logger.info("GOOGLE IMAGE BUS SCRAPER - QUICK START CHECK")
    logger.info("=" * 60 + "\n")
    
    all_ok = True
    
    # Check Python version
    if sys.version_info < (3, 8):
        logger.error(f"✗ Python 3.8+ required (you have {sys.version_info.major}.{sys.version_info.minor})")
        all_ok = False
    else:
        logger.info(f"✓ Python {sys.version_info.major}.{sys.version_info.minor}")
    
    # Check dependencies
    if not check_dependencies():
        all_ok = False
    
    # Check Tesseract
    if not check_tesseract():
        all_ok = False
    
    # Test imports
    if not test_imports():
        all_ok = False
    
    # Run quick test
    if not run_quick_test():
        all_ok = False
    
    # Print summary
    logger.info("\n" + "=" * 60)
    if all_ok:
        logger.info("✓ ALL CHECKS PASSED - Ready to use!")
    else:
        logger.error("✗ Some checks failed - Please fix issues above")
    logger.info("=" * 60)
    
    print_next_steps()
    
    return 0 if all_ok else 1


if __name__ == '__main__':
    sys.exit(main())
