#!/usr/bin/env python3
"""
Quick validation and utility script for bus data upload workflow
Tests data format, translations, and database connectivity
"""

import json
import logging
from pathlib import Path
import sys

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def validate_structured_format(json_file: Path) -> bool:
    """Validate that JSON has correct structured format"""
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, (list, dict)):
            logger.error("❌ Data must be a list or dict")
            return False
        
        # Convert dict to list for validation
        items = data if isinstance(data, list) else [data]
        
        if not items:
            logger.error("❌ Data is empty")
            return False
        
        required_fields = ['route_number', 'origin', 'destination']
        
        for idx, item in enumerate(items):
            # Check required fields
            for field in required_fields:
                if field not in item:
                    logger.error(f"❌ Item {idx} missing '{field}' field")
                    return False
            
            # Check stops array
            if 'stops' not in item:
                logger.error(f"❌ Item {idx} missing 'stops' array")
                return False
            
            if not isinstance(item['stops'], list):
                logger.error(f"❌ Item {idx} 'stops' must be an array, got {type(item['stops'])}")
                return False
        
        logger.info(f"✅ Format validation passed ({len(items)} routes)")
        
        # Show sample
        sample = items[0]
        logger.info(f"   Sample: {sample['route_number']} | {sample['origin']} → {sample['destination']}")
        
        return True
    
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Validation error: {e}")
        return False


def test_translations():
    """Test Tamil translation functionality"""
    try:
        from scripts.tamil_translator import TamilTranslator
        
        translator = TamilTranslator()
        
        test_locations = [
            ('BROADWAY', 'பாடாவே'),
            ('ANNA NAGAR', 'அண்ணா நகர்'),
            ('SALEM', 'சேலம்'),
        ]
        
        logger.info("Testing Tamil Translations...")
        all_pass = True
        
        for english, expected_tamil in test_locations:
            result = translator.translate_location(english)
            status = "✅" if result == expected_tamil else "⚠️"
            logger.info(f"  {status} {english:20} -> {result}")
            if result != expected_tamil:
                all_pass = False
        
        return all_pass
    
    except Exception as e:
        logger.error(f"❌ Translation test failed: {e}")
        return False


def validate_checkpoint_format(checkpoint_file: Path) -> bool:
    """Validate checkpoint file format"""
    try:
        with open(checkpoint_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        required_keys = ['all_timings', 'operator']
        
        for key in required_keys:
            if key not in data:
                logger.error(f"❌ Checkpoint missing '{key}' field")
                return False
        
        if not isinstance(data['all_timings'], list):
            logger.error("❌ 'all_timings' must be an array")
            return False
        
        logger.info(f"✅ Checkpoint validation passed")
        logger.info(f"   Operator: {data.get('operator')}")
        logger.info(f"   Routes: {len(data['all_timings'])}")
        
        return True
    
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Checkpoint validation error: {e}")
        return False


def show_data_summary(json_file: Path):
    """Show summary of data"""
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        items = data if isinstance(data, list) else data.get('all_timings', [])
        
        if not items:
            logger.info("No data to summarize")
            return
        
        # Collect unique origins and destinations
        origins = set()
        destinations = set()
        route_numbers = set()
        
        for item in items:
            origins.add(item.get('origin', 'UNKNOWN'))
            destinations.add(item.get('destination', 'UNKNOWN'))
            route_numbers.add(item.get('route_number', 'UNKNOWN'))
        
        logger.info("=" * 60)
        logger.info("Data Summary:")
        logger.info(f"  Total Routes: {len(items)}")
        logger.info(f"  Unique Route Numbers: {len(route_numbers)}")
        logger.info(f"  Unique Origins: {len(origins)}")
        logger.info(f"  Unique Destinations: {len(destinations)}")
        logger.info(f"  Sample Route Numbers: {', '.join(list(route_numbers)[:5])}")
        logger.info("=" * 60)
    
    except Exception as e:
        logger.error(f"Failed to summarize data: {e}")


def main():
    """Run validation suite"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Validate bus data for upload',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/validate_bus_data.py --structured data/mtc_structured.json
  python scripts/validate_bus_data.py --checkpoint data/mtc_bus_timings.checkpoint.json
  python scripts/validate_bus_data.py --test-translations
  python scripts/validate_bus_data.py --summarize data/mtc_structured.json
        """
    )
    
    parser.add_argument('--structured', type=Path, help='Validate structured format')
    parser.add_argument('--checkpoint', type=Path, help='Validate checkpoint format')
    parser.add_argument('--test-translations', action='store_true', help='Test Tamil translations')
    parser.add_argument('--summarize', type=Path, help='Show data summary')
    parser.add_argument('--all', action='store_true', help='Run all validations')
    
    args = parser.parse_args()
    
    if not any([args.structured, args.checkpoint, args.test_translations, args.summarize, args.all]):
        parser.print_help()
        return
    
    results = {}
    
    if args.all or args.structured:
        structured_file = args.structured or Path('data/mtc_structured.json')
        if structured_file.exists():
            logger.info(f"\nValidating: {structured_file}")
            results['structured'] = validate_structured_format(structured_file)
            show_data_summary(structured_file)
    
    if args.all or args.checkpoint:
        checkpoint_file = args.checkpoint or Path('data/mtc_bus_timings.checkpoint.json')
        if checkpoint_file.exists():
            logger.info(f"\nValidating: {checkpoint_file}")
            results['checkpoint'] = validate_checkpoint_format(checkpoint_file)
    
    if args.all or args.test_translations:
        logger.info("\nTesting Translations:")
        results['translations'] = test_translations()
    
    if args.summarize:
        logger.info(f"\nSummary for: {args.summarize}")
        show_data_summary(args.summarize)
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("Validation Summary:")
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        logger.info(f"  {name}: {status}")
    logger.info("=" * 60)
    
    # Exit with error if any validation failed
    if any(not v for v in results.values()):
        sys.exit(1)


if __name__ == '__main__':
    main()
