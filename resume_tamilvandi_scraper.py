#!/usr/bin/env python3
"""
Resume Tamil Vandi Scraper
Resumes scraping from the checkpoint and continues with remaining city pairs.
Uses multi-worker approach for faster data collection.

Usage:
    python resume_tamilvandi_scraper.py --workers 3 --output data/tamilvandi_all
    python resume_tamilvandi_scraper.py --workers 5 --output data/tamilvandi_batch
"""

import json
import logging
import argparse
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Tuple, Set
import subprocess
import time

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def load_cities(cities_file: str) -> List[str]:
    """Load cities from JSON file"""
    try:
        with open(cities_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            cities = data.get('cities', [])
            # Remove duplicates (case-insensitive) while preserving order
            seen = set()
            unique_cities = []
            for city in cities:
                city_lower = city.lower()
                if city_lower not in seen:
                    seen.add(city_lower)
                    unique_cities.append(city)
            logger.info(f"✅ Loaded {len(unique_cities)} unique cities from {cities_file}")
            return unique_cities
    except Exception as e:
        logger.error(f"❌ Failed to load cities: {e}")
        sys.exit(1)


def generate_city_pairs(cities: List[str]) -> List[Tuple[str, str]]:
    """Generate all unique city pairs (excluding self-pairs)"""
    pairs = []
    for i, from_city in enumerate(cities):
        for to_city in cities[i+1:]:  # Only pairs where from < to (avoid duplicates and self-pairs)
            pairs.append((from_city, to_city))
    logger.info(f"📊 Generated {len(pairs)} unique city pairs")
    return pairs


def get_completed_pairs(output_dir: Path) -> Set[Tuple[str, str]]:
    """Get set of city pairs that have been successfully scraped"""
    completed = set()
    
    try:
        # Look for JSON files in output directory
        json_files = list(output_dir.glob("*_to_*.json"))
        
        for json_file in json_files:
            # Skip checkpoint files
            if "checkpoint" in json_file.name:
                continue
            
            # Try to extract city pair from filename
            # Format: FROM_to_TO.json
            filename = json_file.stem
            if "_to_" in filename:
                parts = filename.split("_to_")
                if len(parts) == 2:
                    from_city = parts[0].replace("_", " ")
                    to_city = parts[1].replace("_", " ")
                    
                    # Check if file has valid data
                    try:
                        with open(json_file) as f:
                            data = json.load(f)
                            # If it's a non-empty list with route data, it's completed
                            if isinstance(data, list) and len(data) > 0:
                                completed.add((from_city, to_city))
                                logger.debug(f"  ✓ Found completed: {from_city} → {to_city} ({len(data)} routes)")
                            elif isinstance(data, list) and len(data) == 0:
                                # Empty file - needs retry but don't mark as complete
                                logger.debug(f"  ⚠ Empty file: {from_city} → {to_city}")
                    except:
                        pass
    except Exception as e:
        logger.warning(f"⚠️  Error getting completed pairs: {e}")
    
    if completed:
        logger.info(f"📋 Found {len(completed)} previously completed pairs")
    
    return completed


def get_remaining_pairs(all_pairs: List[Tuple[str, str]], completed: Set[Tuple[str, str]]) -> List[Tuple[str, str]]:
    """Get remaining pairs to scrape"""
    remaining = []
    
    for pair in all_pairs:
        # Normalize pair format (handle case-insensitive matching)
        from_city, to_city = pair
        
        # Check if this exact pair was completed
        if pair in completed:
            logger.debug(f"  ✓ Skipping completed: {from_city} → {to_city}")
            continue
        
        remaining.append(pair)
    
    return remaining


def scrape_single_pair(from_city: str, to_city: str, output_dir: Path, delay: float = 2.0) -> bool:
    """
    Scrape a single city pair using the main scraper
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Create output filename for this route pair
        safe_from = from_city.replace(' ', '_').replace('/', '_')
        safe_to = to_city.replace(' ', '_').replace('/', '_')
        output_path = output_dir / f"{safe_from}_to_{safe_to}"
        
        # Skip if already has valid data
        json_file = output_path.parent / f"{output_path.name}.json"
        if json_file.exists():
            try:
                with open(json_file) as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        logger.info(f"  ✓ Already has {len(data)} routes, skipping")
                        return True
            except:
                pass
        
        logger.info(f"🔄 Scraping: {from_city} → {to_city}")
        
        # Run the scraper for this route pair
        cmd = [
            sys.executable,
            'scripts/tamilvandi_scraper_selenium.py',
            '--from', from_city,
            '--to', to_city,
            '--output', str(output_path),
            '--delay', str(delay)
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout per route pair
        )
        
        if result.returncode == 0:
            # Check if JSON was created
            if json_file.exists():
                try:
                    with open(json_file) as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            logger.info(f"  ✅ Completed: {len(data)} routes found")
                            return True
                except:
                    pass
            
            logger.info(f"  ✅ Scraper completed (check output)")
            return True
        else:
            logger.warning(f"  ❌ Scraper failed (exit code: {result.returncode})")
            if result.stderr:
                logger.debug(f"Error: {result.stderr[:200]}")
            return False
            
    except subprocess.TimeoutExpired:
        logger.warning(f"  ⏱️  Timeout on {from_city} → {to_city}")
        return False
    except Exception as e:
        logger.error(f"  ❌ Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Resume Tamil Vandi Scraper from checkpoint',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Resume with 3 sequential scrapers
  python resume_tamilvandi_scraper.py --workers 3
  
  # Resume with 5 workers
  python resume_tamilvandi_scraper.py --workers 5 --output data/tamilvandi_all
  
  # Resume with custom delay between requests
  python resume_tamilvandi_scraper.py --workers 3 --delay 1.5
  
  # Test run (limit to 10 city pairs)
  python resume_tamilvandi_scraper.py --workers 1 --limit 10
        '''
    )
    
    parser.add_argument('--cities', default='data/tamilvandi_cities.json', 
                       help='Path to cities JSON file')
    parser.add_argument('--output', default='data/tamilvandi_all', 
                       help='Output directory for scraped data')
    parser.add_argument('--workers', type=int, default=1, 
                       help='Number of sequential workers (default: 1)')
    parser.add_argument('--delay', type=float, default=2.0, 
                       help='Delay between page requests in seconds (default: 2.0)')
    parser.add_argument('--limit', type=int, 
                       help='Limit number of city pairs to process (for testing)')
    parser.add_argument('--skip-completed', action='store_true', default=True,
                       help='Skip already completed pairs (default: True)')
    parser.add_argument('--retry-empty', action='store_true',
                       help='Retry empty JSON files')
    
    args = parser.parse_args()
    
    # Load cities
    cities = load_cities(args.cities)
    if len(cities) < 2:
        logger.error("❌ Need at least 2 cities to create pairs")
        sys.exit(1)
    
    # Generate all city pairs
    all_pairs = generate_city_pairs(cities)
    
    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"📁 Output directory: {output_dir}")
    
    # Get completed pairs
    completed = get_completed_pairs(output_dir)
    
    # Get remaining pairs
    remaining = get_remaining_pairs(all_pairs, completed)
    
    logger.info(f"\n{'='*70}")
    logger.info(f"📊 SCRAPING STATUS")
    logger.info(f"{'='*70}")
    logger.info(f"Total city pairs: {len(all_pairs)}")
    logger.info(f"Completed: {len(completed)}")
    logger.info(f"Remaining: {len(remaining)}")
    logger.info(f"Progress: {len(completed)}/{len(all_pairs)} ({100*len(completed)//len(all_pairs)}%)")
    
    if not remaining:
        logger.info(f"\n✅ All {len(all_pairs)} city pairs have been scraped!")
        sys.exit(0)
    
    # Apply limit if specified
    if args.limit:
        remaining = remaining[:args.limit]
        logger.info(f"📌 Limited to first {len(remaining)} remaining pairs for testing")
    
    logger.info(f"Starting scraper with {args.workers} worker(s)...")
    logger.info(f"{'='*70}\n")
    
    # Start timer
    start_time = time.time()
    
    # Process pairs sequentially or with multiple workers
    if args.workers == 1:
        # Single worker - sequential processing
        completed_in_run = 0
        failed_in_run = 0
        
        for idx, (from_city, to_city) in enumerate(remaining, 1):
            logger.info(f"\n[{idx}/{len(remaining)}] Processing: {from_city} → {to_city}")
            
            if scrape_single_pair(from_city, to_city, output_dir, args.delay):
                completed_in_run += 1
            else:
                failed_in_run += 1
            
            # Small delay between requests
            if idx < len(remaining):
                time.sleep(1)
        
        elapsed = time.time() - start_time
        logger.info(f"\n{'='*70}")
        logger.info(f"🎉 Batch completed!")
        logger.info(f"⏱️  Time: {elapsed:.1f}s ({elapsed/60:.1f} min)")
        logger.info(f"✅ Completed: {completed_in_run}")
        logger.info(f"❌ Failed: {failed_in_run}")
        logger.info(f"{'='*70}\n")
        
    else:
        # Multiple workers - use batch scraper
        logger.info(f"Using multi-worker batch scraper with {args.workers} workers...")
        
        # Create temporary route pairs file
        temp_routes_file = output_dir / "remaining_routes.txt"
        with open(temp_routes_file, 'w') as f:
            for from_city, to_city in remaining:
                f.write(f"{from_city},{to_city}\n")
        
        # Run batch scraper
        cmd = [
            sys.executable,
            'scripts/tamilvandi_batch_scraper_workers.py',
            '--cities', args.cities,
            '--workers', str(args.workers),
            '--output', args.output,
            '--delay', str(args.delay),
            '--limit', str(len(remaining))
        ]
        
        try:
            result = subprocess.run(cmd, check=False)
            elapsed = time.time() - start_time
            
            logger.info(f"\n{'='*70}")
            if result.returncode == 0:
                logger.info(f"🎉 Batch processing completed!")
            else:
                logger.warning(f"⚠️  Batch processing completed with issues (exit code: {result.returncode})")
            
            logger.info(f"⏱️  Total time: {elapsed:.1f}s ({elapsed/60:.1f} min)")
            logger.info(f"{'='*70}\n")
            
        except Exception as e:
            logger.error(f"❌ Error running batch scraper: {e}")
            sys.exit(1)


if __name__ == '__main__':
    main()
