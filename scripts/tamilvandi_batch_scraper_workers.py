#!/usr/bin/env python3
"""
Tamil Vandi Multi-Worker Batch Scraper
Scrapes all city pairs using 3 parallel workers for faster data collection.

Usage:
    python scripts/tamilvandi_batch_scraper_workers.py --cities data/tamilvandi_cities.json --workers 3 --output data/tamilvandi_batch
"""

import json
import logging
import argparse
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Tuple
from multiprocessing import Process, Queue, current_process
import time

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(processName)s] - %(levelname)s - %(message)s'
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


def worker_process(worker_id: int, task_queue: Queue, output_dir: Path, delay: float):
    """Worker process that scrapes city pairs from the queue"""
    import subprocess
    
    process_name = f"Worker-{worker_id}"
    logger.info(f"🚀 {process_name} started")
    
    completed = 0
    failed = 0
    
    while True:
        try:
            # Get task from queue (non-blocking)
            if task_queue.empty():
                break
                
            task = task_queue.get_nowait()
            if task is None:  # Poison pill to stop worker
                break
                
            from_city, to_city = task
            logger.info(f"🔄 {process_name} processing: {from_city} → {to_city}")
            
            # Create output filename for this route pair
            safe_from = from_city.replace(' ', '_').replace('/', '_')
            safe_to = to_city.replace(' ', '_').replace('/', '_')
            output_path = output_dir / f"{safe_from}_to_{safe_to}"
            
            # Run the scraper for this route pair
            cmd = [
                sys.executable,
                'scripts/tamilvandi_scraper_selenium.py',
                '--from', from_city,
                '--to', to_city,
                '--output', str(output_path),
                '--delay', str(delay)
            ]
            
            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=600  # 10 minute timeout per route pair
                )
                
                if result.returncode == 0:
                    logger.info(f"✅ {process_name} completed: {from_city} → {to_city}")
                    completed += 1
                else:
                    logger.error(f"❌ {process_name} failed: {from_city} → {to_city} (exit code: {result.returncode})")
                    if result.stderr:
                        logger.error(f"Error output: {result.stderr[:500]}")
                    failed += 1
                    
            except subprocess.TimeoutExpired:
                logger.error(f"⏱️ {process_name} timeout: {from_city} → {to_city}")
                failed += 1
            except Exception as e:
                logger.error(f"❌ {process_name} error on {from_city} → {to_city}: {e}")
                failed += 1
                
        except Exception as e:
            if "Empty" not in str(e):  # Ignore empty queue exceptions
                logger.error(f"❌ {process_name} queue error: {e}")
            break
    
    logger.info(f"🏁 {process_name} finished - Completed: {completed}, Failed: {failed}")


def main():
    parser = argparse.ArgumentParser(
        description='Tamil Vandi Multi-Worker Batch Scraper',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Use 3 workers (default)
  python scripts/tamilvandi_batch_scraper_workers.py --cities data/tamilvandi_cities.json
  
  # Use 5 workers for faster scraping
  python scripts/tamilvandi_batch_scraper_workers.py --cities data/tamilvandi_cities.json --workers 5
  
  # Custom output directory and delay
  python scripts/tamilvandi_batch_scraper_workers.py --cities data/tamilvandi_cities.json --workers 3 --output data/tv_all --delay 1.5
        '''
    )
    
    parser.add_argument('--cities', required=True, help='Path to cities JSON file')
    parser.add_argument('--workers', type=int, default=3, help='Number of parallel workers (default: 3)')
    parser.add_argument('--output', default='data/tamilvandi_batch', help='Output directory for scraped data')
    parser.add_argument('--delay', type=float, default=2.0, help='Delay between page requests in seconds (default: 2.0)')
    parser.add_argument('--limit', type=int, help='Limit number of city pairs to process (for testing)')
    
    args = parser.parse_args()
    
    # Validate workers
    if args.workers < 1:
        logger.error("❌ Number of workers must be at least 1")
        sys.exit(1)
    if args.workers > 10:
        logger.warning("⚠️ Using more than 10 workers may overwhelm the target server")
    
    # Load cities
    cities = load_cities(args.cities)
    if len(cities) < 2:
        logger.error("❌ Need at least 2 cities to create pairs")
        sys.exit(1)
    
    # Generate city pairs
    city_pairs = generate_city_pairs(cities)
    
    # Apply limit if specified
    if args.limit:
        city_pairs = city_pairs[:args.limit]
        logger.info(f"📌 Limited to first {len(city_pairs)} pairs for testing")
    
    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"📁 Output directory: {output_dir}")
    
    # Create task queue
    task_queue = Queue()
    for pair in city_pairs:
        task_queue.put(pair)
    
    # Add poison pills for workers
    for _ in range(args.workers):
        task_queue.put(None)
    
    # Start timer
    start_time = time.time()
    logger.info(f"🚀 Starting {args.workers} workers to process {len(city_pairs)} city pairs...")
    
    # Start worker processes
    workers = []
    for i in range(args.workers):
        p = Process(
            target=worker_process,
            args=(i+1, task_queue, output_dir, args.delay),
            name=f"Worker-{i+1}"
        )
        p.start()
        workers.append(p)
    
    # Wait for all workers to complete
    for p in workers:
        p.join()
    
    # Calculate statistics
    elapsed_time = time.time() - start_time
    logger.info(f"")
    logger.info(f"{'='*70}")
    logger.info(f"🎉 All workers completed!")
    logger.info(f"⏱️  Total time: {elapsed_time:.1f} seconds ({elapsed_time/60:.1f} minutes)")
    logger.info(f"📊 Processed: {len(city_pairs)} city pairs")
    logger.info(f"⚡ Average: {elapsed_time/len(city_pairs):.1f} seconds per pair")
    logger.info(f"📁 Output: {output_dir}")
    logger.info(f"{'='*70}")
    
    # Count output files
    json_files = list(output_dir.glob("*.json"))
    csv_files = list(output_dir.glob("*.csv"))
    logger.info(f"📄 Generated files: {len(json_files)} JSON, {len(csv_files)} CSV")


if __name__ == '__main__':
    main()
