"""
Test suite and examples for Google Image Bus Scraper
======================================================
"""

import json
import logging
from pathlib import Path
from PIL import Image
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_data_extractor():
    """Test the DataExtractor class."""
    from google_image_bus_scraper import DataExtractor
    
    logger.info("Testing DataExtractor...")
    
    # Test time extraction
    text = "Chennai to Madurai bus departs at 09:30 AM and arrives at 18:45 PM"
    times = DataExtractor.extract_times(text)
    assert len(times) >= 2, "Should extract at least 2 times"
    assert times[0] == "09:30", f"Expected 09:30, got {times[0]}"
    assert times[1] == "18:45", f"Expected 18:45, got {times[1]}"
    logger.info("✓ Time extraction works")
    
    # Test city extraction
    cities = DataExtractor.extract_cities(text)
    assert "CHENNAI" in cities, "Should find Chennai"
    assert "MADURAI" in cities, "Should find Madurai"
    logger.info("✓ City extraction works")
    
    # Test bidirectional detection
    bi_text = "Chennai ↔ Madurai bus service (bidirectional)"
    is_bi = DataExtractor.detect_bidirectional(bi_text)
    assert is_bi, "Should detect bidirectional"
    logger.info("✓ Bidirectional detection works")
    
    # Test time normalization
    normalized = DataExtractor.normalize_time("9:30 AM")
    assert normalized == "09:30", f"Expected 09:30, got {normalized}"
    logger.info("✓ Time normalization works")


def test_symbol_detector():
    """Test symbol detection."""
    from advanced_bus_image_processor import SymbolDetector
    
    logger.info("\nTesting SymbolDetector...")
    
    detector = SymbolDetector()
    
    # Test Unicode detection
    text_with_arrow = "Chennai → Madurai → Trichy"
    result = detector.detect_unicode_symbols(text_with_arrow)
    
    assert result['symbols_found'], "Should find arrow symbols"
    assert result['arrow_type'] == 'forward', "Should detect forward arrow"
    logger.info("✓ Unicode arrow detection works")
    
    # Test bidirectional
    bi_text = "Chennai ↔ Madurai (both directions)"
    bi_result = detector.detect_unicode_symbols(bi_text)
    
    assert bi_result['is_bidirectional'], "Should detect bidirectional"
    logger.info("✓ Bidirectional detection works")


def test_data_validator():
    """Test data validation."""
    from advanced_bus_image_processor import DataValidator
    
    logger.info("\nTesting DataValidator...")
    
    # Test time validation
    assert DataValidator.validate_time_format("09:30"), "Valid time should pass"
    assert not DataValidator.validate_time_format("9:30"), "Invalid time should fail"
    assert not DataValidator.validate_time_format("25:00"), "Invalid hour should fail"
    logger.info("✓ Time validation works")
    
    # Test city validation
    assert DataValidator.validate_city_name("CHENNAI"), "Valid city should pass"
    assert DataValidator.validate_city_name("New Delhi"), "City with space should pass"
    assert not DataValidator.validate_city_name("CH"), "Too short should fail"
    logger.info("✓ City validation works")
    
    # Test route validation
    valid_route = {
        'origin': 'CHENNAI',
        'destination': 'MADURAI',
        'departure_time': '09:30',
        'arrival_time': '18:30',
        'stops': []
    }
    
    is_valid, errors = DataValidator.validate_bus_route(valid_route)
    assert is_valid, f"Valid route should pass: {errors}"
    logger.info("✓ Route validation works")
    
    # Test invalid route
    invalid_route = {
        'origin': 'CHENNAI',
        'destination': 'CHENNAI',  # Same as origin
        'departure_time': '09:30',
        'arrival_time': '18:30',
        'stops': []
    }
    
    is_valid, errors = DataValidator.validate_bus_route(invalid_route)
    assert not is_valid, "Same origin/destination should fail"
    logger.info("✓ Invalid route detection works")


def test_data_deduplicator():
    """Test deduplication logic."""
    from advanced_bus_image_processor import DataDeduplicator
    
    logger.info("\nTesting DataDeduplicator...")
    
    # Create test routes
    route1 = {
        'origin': 'CHENNAI',
        'destination': 'MADURAI',
        'departure_time': '09:30',
        'stops': [],
        'confidence_score': 0.9
    }
    
    route2 = {
        'origin': 'CHENNAI',
        'destination': 'MADURAI',
        'departure_time': '09:30',
        'stops': [],
        'confidence_score': 0.85
    }
    
    route3 = {
        'origin': 'TRICHY',
        'destination': 'COIMBATORE',
        'departure_time': '14:00',
        'stops': [],
        'confidence_score': 0.88
    }
    
    routes = [route1, route2, route3]
    
    # Test hash generation
    hash1 = DataDeduplicator.generate_route_hash(route1)
    hash2 = DataDeduplicator.generate_route_hash(route2)
    hash3 = DataDeduplicator.generate_route_hash(route3)
    
    assert hash1 == hash2, "Same routes should have same hash"
    assert hash1 != hash3, "Different routes should have different hash"
    logger.info("✓ Hash generation works")
    
    # Test similarity score
    similarity = DataDeduplicator.similarity_score(route1, route2)
    assert similarity > 0.8, "Very similar routes should have high similarity"
    logger.info("✓ Similarity scoring works")
    
    # Test deduplication
    dedup = DataDeduplicator.deduplicate_routes(routes)
    assert len(dedup) == 2, f"Should reduce to 2 unique routes, got {len(dedup)}"
    logger.info("✓ Deduplication works")


def test_bus_data_processor():
    """Test data processing and normalization."""
    from google_image_bus_scraper import BusDataProcessor, BusRoute
    
    logger.info("\nTesting BusDataProcessor...")
    
    # Test service code generation
    code = BusDataProcessor.generate_service_code("CHENNAI", "MADURAI", "09:30")
    assert "CHE" in code and "MAD" in code and "0930" in code, "Service code should contain components"
    logger.info("✓ Service code generation works")
    
    # Test normalization
    raw_text = """
    Chennai to Madurai Bus Schedule
    
    Bus Type: AC Sleeper
    Departure: 09:30 AM
    Arrival: 18:45 PM
    Fare: Rs 450
    
    Stops:
    Villupuram - 11:30
    Trichy - 14:00
    Madurai - 18:45
    """
    
    route = BusDataProcessor.normalize_route(raw_text, image_source="test_image.jpg")
    
    assert route is not None, "Should normalize successfully"
    assert route.origin == "MADURAI" or route.origin == "CHENNAI", "Should extract origin"
    assert len(route.stops) > 0, "Should extract stops"
    logger.info("✓ Data normalization works")
    
    # Test TNSTC format conversion
    tnstc_data = BusDataProcessor.to_tnstc_format(route)
    assert 'service_code' in tnstc_data, "Should have service_code"
    assert 'stops' in tnstc_data, "Should have stops"
    assert 'confidence_score' in tnstc_data, "Should have confidence"
    logger.info("✓ TNSTC format conversion works")


def test_image_preprocessor():
    """Test image preprocessing functions."""
    from google_image_bus_scraper import ImagePreprocessor
    
    logger.info("\nTesting ImagePreprocessor...")
    
    # Create a test image
    img_array = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
    image = Image.fromarray(img_array.astype('uint8'), 'RGB')
    
    # Test grayscale conversion
    gray = ImagePreprocessor.convert_to_grayscale(image)
    assert gray.mode == 'L', "Should be grayscale"
    logger.info("✓ Grayscale conversion works")
    
    # Test resizing
    resized = ImagePreprocessor.resize_image(image, scale=2.0)
    assert resized.size[0] == 200, "Should be 2x larger"
    logger.info("✓ Image resizing works")
    
    # Test enhancement
    enhanced = ImagePreprocessor.enhance_image(image)
    assert enhanced.size == image.size, "Enhanced image should have same size"
    logger.info("✓ Image enhancement works")
    
    # Test full preprocessing
    processed = ImagePreprocessor.preprocess_for_ocr(image)
    assert processed.mode == 'L', "Should be grayscale after full processing"
    assert processed.size[0] > image.size[0], "Should be resized"
    logger.info("✓ Full preprocessing pipeline works")


def test_multi_page_handler():
    """Test multi-page image handling."""
    from advanced_bus_image_processor import MultiPageImageHandler
    
    logger.info("\nTesting MultiPageImageHandler...")
    
    # Create a test image with clear structure
    img_array = np.ones((400, 400), dtype=np.uint8) * 255
    
    # Draw page boundaries (dark lines)
    img_array[100:110, :] = 0
    img_array[200:210, :] = 0
    
    image = Image.fromarray(img_array.astype('uint8'), 'L')
    
    # Test page boundary detection
    # Note: In real scenario with actual content, this would detect pages
    logger.info("✓ Page detection ready (requires actual bus schedules for testing)")


def create_test_output_example():
    """Create example output to show expected format."""
    logger.info("\nCreating example output...")
    
    example_output = [
        {
            "service_code": "IMGCHNMAD0930",
            "route_number": "",
            "corporation": "UNKNOWN",
            "origin": "CHENNAI",
            "destination": "MADURAI",
            "departure_time": "09:30",
            "arrival_time": "18:30",
            "duration": "9 hours",
            "available_seats": "UNKNOWN",
            "bus_type": "AC Sleeper",
            "fare": "Rs 450",
            "journey_date": "13/01/2026",
            "stops": [
                {
                    "city": "VILLUPURAM",
                    "landmark": "VILLUPURAM BUS STAND",
                    "time": "11:30"
                },
                {
                    "city": "TIRUPATI",
                    "landmark": "TIRUPATI",
                    "time": "14:00"
                },
                {
                    "city": "MADURAI",
                    "landmark": "MATTUTHAVANI BUS STAND",
                    "time": "18:30"
                }
            ],
            "extracted_at": "2026-01-13T10:30:45.123456",
            "source": "Google Images",
            "image_source": "https://example.com/bus_schedule.jpg",
            "confidence_score": 0.87,
            "bidirectional": False
        }
    ]
    
    output_path = Path('./data/google_images_bus/example_output.json')
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(example_output, f, indent=2)
    
    logger.info(f"✓ Example output saved to {output_path}")


def run_all_tests():
    """Run all tests."""
    logger.info("=" * 60)
    logger.info("RUNNING TEST SUITE")
    logger.info("=" * 60)
    
    try:
        test_data_extractor()
        test_symbol_detector()
        test_data_validator()
        test_data_deduplicator()
        test_bus_data_processor()
        test_image_preprocessor()
        test_multi_page_handler()
        create_test_output_example()
        
        logger.info("\n" + "=" * 60)
        logger.info("ALL TESTS PASSED ✓")
        logger.info("=" * 60)
        
    except AssertionError as e:
        logger.error(f"\n❌ TEST FAILED: {e}")
        raise
    except Exception as e:
        logger.error(f"\n❌ ERROR: {e}")
        raise


if __name__ == '__main__':
    run_all_tests()
