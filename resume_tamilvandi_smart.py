#!/usr/bin/env python3
"""
Resume Tamil Vandi Scraper with Smart Retry
Resumes scraping from checkpoint, skips unresponsive routes, and continues with remaining pairs.

Usage:
    python resume_tamilvandi_smart.py
    python resume_tamilvandi_smart.py --workers 3
    python resume_tamilvandi_smart.py --limit 100
"""

import json
import logging
import argparse
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Tuple, Set, Dict
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
            logger.info(f"✅ Loaded {len(unique_cities)} unique cities")
            return unique_cities
    except Exception as e:
        logger.error(f"❌ Failed to load cities: {e}")
        sys.exit(1)


def generate_city_pairs(cities: List[str]) -> List[Tuple[str, str]]:
    """Generate all unique city pairs"""
    pairs = []
    for i, from_city in enumerate(cities):
        for to_city in cities[i+1:]:
            pairs.append((from_city, to_city))
    logger.info(f"📊 Generated {len(pairs)} unique city pairs")
    return pairs


def get_scraping_status(output_dir: Path) -> Dict[str, Set[Tuple[str, str]]]:
    """Get status of all scraped pairs"""
    completed = set()
    failed = set()
    empty = set()
    
    try:
        json_files = list(output_dir.glob("*_to_*.json"))
        
        for json_file in json_files:
            if "checkpoint" in json_file.name:
                continue
            
            filename = json_file.stem
            if "_to_" in filename:
                parts = filename.split("_to_", 1)
                if len(parts) == 2:
                    from_city = parts[0].replace("_", " ")
                    to_city = parts[1].replace("_", " ")
                    pair = (from_city, to_city)
                    
                    try:
                        with open(json_file) as f:
                            data = json.load(f)
                            if isinstance(data, list) and len(data) > 0:
                                completed.add(pair)
                                logger.debug(f"  ✓ {from_city} → {to_city}: {len(data)} routes")
                            elif isinstance(data, list) and len(data) == 0:
                                empty.add(pair)
                                logger.debug(f"  ⚠ {from_city} → {to_city}: empty")
                    except:
                        failed.add(pair)
                        logger.debug(f"  ✗ {from_city} → {to_city}: corrupted")
    except Exception as e:
        logger.warning(f"⚠️  Error reading status: {e}")
    
    return {"completed": completed, "empty": empty, "failed": failed}


def scrape_single_pair(from_city: str, to_city: str, output_dir: Path, delay: float = 2.0, timeout: int = 300) -> Tuple[bool, str]:
    """
    Scrape a single city pair
    
    Returns:
        (success, message) tuple
    """
    try:
        safe_from = from_city.replace(' ', '_').replace('/', '_')
        safe_to = to_city.replace(' ', '_').replace('/', '_')
        output_path = output_dir / f"{safe_from}_to_{safe_to}"
        json_file = output_dir / f"{safe_from}_to_{safe_to}.json"
        
        # Skip if already has valid data
        if json_file.exists():
            try:
                with open(json_file) as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        return True, f"Already has {len(data)} routes"
            except:
                pass
        
        # Run scraper
        cmd = [
            '/Users/mchand69/Documents/perundhu/.venv/bin/python',
            'scripts/tamilvandi_scraper_selenium.py',
            '--from', from_city,
            '--to', to_city,
            '--output', str(output_path),
            '--delay', str(delay)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        
        if result.returncode == 0 and json_file.exists():
            try:
                with open(json_file) as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        return True, f"Collected {len(data)} routes"
                    elif isinstance(data, list):
                        return False, "Empty results"
            except:
                return False, "Invalid JSON"
        
        return False, f"Exit code {result.returncode}"
        
    except subprocess.TimeoutExpired:
        return False, "Timeout"
    except Exception as e:
        return False, str(e)


def main():
    parser = argparse.ArgumentParser(
        description='Resume Tamil Vandi Scraper with Smart Retry',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Resume with sequential processing
  python resume_tamilvandi_smart.py
  
  # Resume with 3 workers
  python resume_tamilvandi_smart.py --workers 3
  
  # Test with first 10 pairs
  python resume_tamilvandi_smart.py --limit 10
  
  # Retry empty pairs
  python resume_tamilvandi_smart.py --retry-empty
        '''
    )
    
    parser.add_argument('--cities', default='data/tamilvandi_cities.json', help='Cities file')
    parser.add_argument('--output', default='data/tamilvandi_all', help='Output directory')
    parser.add_argument('--workers', type=int, default=1, help='Number of workers (not used yet)')
    parser.add_argument('--delay', type=float, default=2.0, help='Delay between requests')
    parser.add_argument('--limit', type=int, help='Limit pairs to process')
    parser.add_argument('--retry-empty', action='store_true', help='Retry empty pairs')
    
    args = parser.parse_args()
    
    # Load data
    cities = load_cities(args.cities)
    all_pairs = generate_city_pairs(cities)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Get current status
    status = get_scraping_status(output_dir)
    completed = status["completed"]
    empty = status["empty"]
    failed = status["failed"]
    
    logger.info(f"\n{'='*70}")
    logger.info(f"📊 SCRAPING STATUS")
    logger.info(f"{'='*70}")
    logger.info(f"Total pairs: {len(all_pairs)}")
    logger.info(f"✅ Completed: {len(completed)}")
    logger.info(f"⚠️  Empty: {len(empty)}")
    logger.info(f"❌ Failed: {len(failed)}")
    
    progress_pct = 100 * len(completed) // len(all_pairs) if all_pairs else 0
    logger.info(f"Progress: {len(completed)}/{len(all_pairs)} ({progress_pct}%)")
    logger.info(f"{'='*70}\n")
    
    # Determine which pairs to process
    to_process = []
    for pair in all_pairs:
        if pair in completed:
            continue  # Already done
        if pair in empty and not args.retry_empty:
            continue  # Skip empty unless retry requested
        to_process.append(pair)
    
    if not to_process:
        logger.info("✅ All pairs processed!")
        sys.exit(0)
    
    logger.info(f"Starting processing of {len(to_process)} pairs...")
    if args.limit:
        to_process = to_process[:args.limit]
        logger.info(f"Limited to {len(to_process)} pairs")
    
    logger.info(f"{'='*70}\n")
    
    # Process pairs
    start_time = time.time()
    stats = {"success": 0, "empty": 0, "failed": 0}
    
    for idx, (from_city, to_city) in enumerate(to_process, 1):
        pair_label = f"[{idx}/{len(to_process)}] {from_city} → {to_city}"
        
        success, message = scrape_single_pair(from_city, to_city, output_dir, args.delay)
        
        if success:
            logger.info(f"✅ {pair_label}: {message}")
            stats["success"] += 1
        elif message == "Empty results":
            logger.warning(f"⚠️  {pair_label}: {message}")
            stats["empty"] += 1
        else:
            logger.error(f"❌ {pair_label}: {message}")
            stats["failed"] += 1
        
        if idx < len(to_process):
            time.sleep(1)
    
    # Final report
    elapsed = time.time() - start_time
    logger.info(f"\n{'='*70}")
    logger.info(f"🎉 BATCH COMPLETE")
    logger.info(f"{'='*70}")
    logger.info(f"⏱️  Time: {elapsed:.0f}s ({elapsed/60:.1f} min)")
    logger.info(f"✅ Success: {stats['success']}")
    logger.info(f"⚠️  Empty: {stats['empty']}")
    logger.info(f"❌ Failed: {stats['failed']}")
    logger.info(f"{'='*70}\n")
    
    # Final status
    final_status = get_scraping_status(output_dir)
    final_completed = final_status["completed"]
    final_pct = 100 * len(final_completed) // len(all_pairs) if all_pairs else 0
    logger.info(f"📊 Final status: {len(final_completed)}/{len(all_pairs)} pairs ({final_pct}%)")


if __name__ == '__main__':
    main()
