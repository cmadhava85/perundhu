"""
Integration utilities for Google Image extracted data
=====================================================
Integrates extracted bus data with existing TNSTC/MTC database.
"""

import argparse
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import csv

from advanced_bus_image_processor import (
    DataValidator,
    DataDeduplicator,
    AdvancedImageProcessor
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BusDataIntegrator:
    """Integrates extracted Google Image data with existing database."""
    
    def __init__(self, validation_enabled: bool = True):
        self.validation_enabled = validation_enabled
        self.validator = DataValidator()
        self.deduplicator = DataDeduplicator()
        self.stats = {
            'total_processed': 0,
            'valid_routes': 0,
            'invalid_routes': 0,
            'deduplicated': 0,
            'merged': 0
        }
    
    def load_extracted_data(self, file_path: str) -> List[Dict[str, Any]]:
        """Load extracted data from JSON file."""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"Loaded {len(data)} routes from {file_path}")
        self.stats['total_processed'] = len(data)
        
        return data if isinstance(data, list) else [data]
    
    def load_existing_data(self, file_path: str) -> List[Dict[str, Any]]:
        """Load existing TNSTC/MTC data."""
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"Loaded {len(data)} existing routes from {file_path}")
        return data if isinstance(data, list) else [data]
    
    def validate_routes(self, routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate extracted routes."""
        if not self.validation_enabled:
            return routes
        
        valid_routes = []
        
        for route in routes:
            is_valid, errors = self.validator.validate_bus_route(route)
            
            if is_valid:
                valid_routes.append(route)
                self.stats['valid_routes'] += 1
            else:
                self.stats['invalid_routes'] += 1
                logger.warning(f"Invalid route skipped: {', '.join(errors[:2])}")
        
        logger.info(f"Validation complete: {self.stats['valid_routes']} valid, {self.stats['invalid_routes']} invalid")
        
        return valid_routes
    
    def deduplicate(self, routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicates within extracted data."""
        logger.info(f"Deduplicating {len(routes)} routes...")
        
        dedup = self.deduplicator.deduplicate_routes(routes, similarity_threshold=0.95)
        self.stats['deduplicated'] = len(routes) - len(dedup)
        
        logger.info(f"Removed {self.stats['deduplicated']} duplicates")
        return dedup
    
    def merge_with_existing(
        self,
        new_routes: List[Dict[str, Any]],
        existing_routes: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Merge new routes with existing data, avoiding duplicates."""
        logger.info(f"Merging {len(new_routes)} new routes with {len(existing_routes)} existing...")
        
        # Create hash map of existing routes for quick lookup
        existing_hashes = {
            self.deduplicator.generate_route_hash(r): r
            for r in existing_routes
        }
        
        merged = list(existing_routes)
        added = 0
        
        for new_route in new_routes:
            new_hash = self.deduplicator.generate_route_hash(new_route)
            
            if new_hash not in existing_hashes:
                merged.append(new_route)
                added += 1
            else:
                # Route already exists - update with higher confidence if available
                if new_route.get('confidence_score', 0) > existing_hashes[new_hash].get('confidence_score', 0):
                    # Replace with new route if confidence is higher
                    for i, route in enumerate(merged):
                        if self.deduplicator.generate_route_hash(route) == new_hash:
                            merged[i] = new_route
                            break
        
        self.stats['merged'] = added
        logger.info(f"Added {added} new routes, total now: {len(merged)}")
        
        return merged
    
    def clean_stops(self, routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean and validate stop data in all routes."""
        for route in routes:
            if 'stops' in route and isinstance(route['stops'], list):
                route['stops'] = self.validator.clean_stop_data(route['stops'])
        
        return routes
    
    def add_metadata(self, routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Add metadata to routes."""
        current_time = datetime.now().isoformat()
        
        for route in routes:
            if 'source' not in route:
                route['source'] = 'Google Images'
            
            if 'extracted_at' not in route:
                route['extracted_at'] = current_time
            
            # Ensure all required fields exist
            route.setdefault('route_number', '')
            route.setdefault('corporation', 'UNKNOWN')
            route.setdefault('available_seats', 'UNKNOWN')
            route.setdefault('bus_type', 'STANDARD')
            route.setdefault('fare', 'UNKNOWN')
            route.setdefault('duration', 'UNKNOWN')
            route.setdefault('journey_date', datetime.now().strftime('%d/%m/%Y'))
            route.setdefault('bidirectional', False)
            route.setdefault('confidence_score', 0.7)
        
        return routes
    
    def process_pipeline(
        self,
        extracted_file: str,
        existing_file: Optional[str] = None,
        output_file: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Run complete integration pipeline.
        
        Steps:
        1. Load extracted data
        2. Validate routes
        3. Clean stops
        4. Deduplicate
        5. Merge with existing (if provided)
        6. Add metadata
        7. Save results
        
        Returns:
            Final merged and processed routes
        """
        logger.info("Starting integration pipeline...")
        logger.info("=" * 60)
        
        # Step 1: Load
        routes = self.load_extracted_data(extracted_file)
        
        # Step 2: Validate
        routes = self.validate_routes(routes)
        
        # Step 3: Clean stops
        routes = self.clean_stops(routes)
        
        # Step 4: Deduplicate
        routes = self.deduplicate(routes)
        
        # Step 5: Merge with existing
        if existing_file and Path(existing_file).exists():
            existing = self.load_existing_data(existing_file)
            routes = self.merge_with_existing(routes, existing)
        
        # Step 6: Add metadata
        routes = self.add_metadata(routes)
        
        # Step 7: Save
        if output_file:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(routes, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(routes)} routes to {output_path}")
        
        logger.info("=" * 60)
        self.print_summary()
        
        return routes
    
    def print_summary(self):
        """Print processing statistics."""
        logger.info("\nPROCESSING SUMMARY")
        logger.info("-" * 60)
        logger.info(f"Total processed: {self.stats['total_processed']}")
        logger.info(f"Valid routes: {self.stats['valid_routes']}")
        logger.info(f"Invalid routes: {self.stats['invalid_routes']}")
        logger.info(f"Duplicates removed: {self.stats['deduplicated']}")
        logger.info(f"New routes added (merge): {self.stats['merged']}")
        
        if self.stats['total_processed'] > 0:
            valid_pct = (self.stats['valid_routes'] / self.stats['total_processed']) * 100
            logger.info(f"Valid rate: {valid_pct:.1f}%")


def export_to_csv(json_file: str, csv_file: str):
    """Export JSON routes to CSV format."""
    logger.info(f"Exporting to CSV: {csv_file}")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        routes = json.load(f)
    
    if not routes:
        logger.warning("No routes to export")
        return
    
    # Prepare CSV
    fieldnames = [
        'service_code', 'route_number', 'corporation', 'origin', 'destination',
        'departure_time', 'arrival_time', 'duration', 'available_seats',
        'bus_type', 'fare', 'journey_date', 'num_stops', 'confidence_score',
        'bidirectional', 'source', 'extracted_at'
    ]
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for route in routes:
            row = {field: route.get(field, '') for field in fieldnames}
            row['num_stops'] = len(route.get('stops', []))
            writer.writerow(row)
    
    logger.info(f"Exported {len(routes)} routes to {csv_file}")


def export_to_sql(json_file: str, sql_file: str, table_name: str = 'bus_routes'):
    """Export JSON routes to SQL INSERT statements."""
    logger.info(f"Exporting to SQL: {sql_file}")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        routes = json.load(f)
    
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write(f"-- Extracted bus routes from Google Images\n")
        f.write(f"-- Generated: {datetime.now().isoformat()}\n")
        f.write(f"-- Total routes: {len(routes)}\n\n")
        
        for route in routes:
            # Prepare SQL values
            cols = [
                'service_code', 'route_number', 'corporation', 'origin',
                'destination', 'departure_time', 'arrival_time', 'duration',
                'available_seats', 'bus_type', 'fare', 'journey_date',
                'confidence_score', 'bidirectional', 'source', 'extracted_at'
            ]
            
            values = []
            for col in cols:
                val = route.get(col, '')
                if val is None:
                    values.append('NULL')
                elif isinstance(val, bool):
                    values.append('1' if val else '0')
                elif isinstance(val, (int, float)):
                    values.append(str(val))
                else:
                    # Escape single quotes
                    escaped = str(val).replace("'", "''")
                    values.append(f"'{escaped}'")
            
            # Write INSERT statement
            sql = f"INSERT INTO {table_name} ({', '.join(cols)}) VALUES ({', '.join(values)});\n"
            f.write(sql)
    
    logger.info(f"Exported {len(routes)} routes to {sql_file}")


def compare_versions(
    original_file: str,
    updated_file: str,
    output_file: Optional[str] = None
) -> Dict[str, Any]:
    """Compare before and after integration."""
    logger.info("Comparing versions...")
    
    with open(original_file, 'r') as f:
        original = json.load(f)
    
    with open(updated_file, 'r') as f:
        updated = json.load(f)
    
    # Extract cities
    orig_cities = set()
    for route in original:
        orig_cities.add(route.get('origin', ''))
        orig_cities.add(route.get('destination', ''))
    
    new_cities = set()
    for route in updated:
        new_cities.add(route.get('origin', ''))
        new_cities.add(route.get('destination', ''))
    
    comparison = {
        'original_routes': len(original),
        'updated_routes': len(updated),
        'new_routes': len(updated) - len(original),
        'original_cities': len(orig_cities),
        'new_cities': len(new_cities),
        'new_city_pairs': list(new_cities - orig_cities)[:10]
    }
    
    logger.info("\nVERSION COMPARISON")
    logger.info("-" * 60)
    for key, value in comparison.items():
        logger.info(f"{key}: {value}")
    
    if output_file:
        with open(output_file, 'w') as f:
            json.dump(comparison, f, indent=2)
        logger.info(f"\nComparison saved to {output_file}")
    
    return comparison


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Integrate Google Image extracted bus data with existing database'
    )
    
    parser.add_argument(
        '--extracted',
        required=True,
        help='Path to extracted data JSON file (from google_image_bus_scraper.py)'
    )
    
    parser.add_argument(
        '--existing',
        help='Path to existing TNSTC/MTC data JSON file'
    )
    
    parser.add_argument(
        '--output',
        help='Output JSON file for merged data'
    )
    
    parser.add_argument(
        '--export-csv',
        help='Export results to CSV file'
    )
    
    parser.add_argument(
        '--export-sql',
        help='Export results to SQL file'
    )
    
    parser.add_argument(
        '--compare',
        help='Compare with this file to show differences'
    )
    
    parser.add_argument(
        '--no-validate',
        action='store_true',
        help='Skip validation step'
    )
    
    args = parser.parse_args()
    
    # Create integrator
    integrator = BusDataIntegrator(validation_enabled=not args.no_validate)
    
    # Run pipeline
    result = integrator.process_pipeline(
        extracted_file=args.extracted,
        existing_file=args.existing,
        output_file=args.output
    )
    
    # Export to other formats
    if args.output:
        if args.export_csv:
            export_to_csv(args.output, args.export_csv)
        
        if args.export_sql:
            export_to_sql(args.output, args.export_sql)
        
        if args.compare:
            compare_versions(args.compare, args.output)


if __name__ == '__main__':
    main()
