#!/usr/bin/env python3
"""
Parallel TNSTC Scraper Runner with Checkpoint Support
Runs multiple TNSTC scrapers in parallel (5 workers) with automatic resume capability.

Usage:
    python scripts/run_tnstc_parallel.py --source-list sources.txt --dest-list destinations.txt
    python scripts/run_tnstc_parallel.py --source "MADURAI" --dest "CHENNAI"
"""

import json
import time
import logging
import argparse
import sys
from pathlib import Path
from typing import List, Tuple, Set
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass
import subprocess

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [Worker %(process)d] %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class CheckpointData:
    """Checkpoint data structure"""
    completed_pairs: List[Tuple[str, str]]
    failed_pairs: List[Tuple[str, str]]
    total_routes_scraped: int
    last_updated: str


class TNSTCParallelRunner:
    """Parallel runner for TNSTC scraper with checkpoint support"""
    
    def __init__(self, output_dir: str, num_workers: int = 5):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.num_workers = num_workers
        self.checkpoint_file = self.output_dir / "parallel_checkpoint.json"
        self.completed_pairs: Set[Tuple[str, str]] = set()
        self.failed_pairs: Set[Tuple[str, str]] = set()
        
    def load_checkpoint(self) -> bool:
        """Load checkpoint if exists"""
        if not self.checkpoint_file.exists():
            logger.info("No checkpoint found, starting fresh")
            return False
            
        try:
            with open(self.checkpoint_file, 'r') as f:
                data = json.load(f)
            
            self.completed_pairs = set(tuple(pair) for pair in data['completed_pairs'])
            self.failed_pairs = set(tuple(pair) for pair in data['failed_pairs'])
            
            logger.info(f"✅ Loaded checkpoint: {len(self.completed_pairs)} completed, "
                       f"{len(self.failed_pairs)} failed")
            return True
        except Exception as e:
            logger.warning(f"Could not load checkpoint: {e}")
            return False
    
    def save_checkpoint(self):
        """Save current progress to checkpoint"""
        try:
            data = {
                'completed_pairs': list(self.completed_pairs),
                'failed_pairs': list(self.failed_pairs),
                'total_routes_scraped': len(self.completed_pairs),
                'last_updated': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            with open(self.checkpoint_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.debug(f"Checkpoint saved: {len(self.completed_pairs)} completed")
        except Exception as e:
            logger.error(f"Failed to save checkpoint: {e}")
    
    def scrape_pair(self, source: str, dest: str, worker_id: int) -> Tuple[bool, str, str, int]:
        """
        Scrape a single source-destination pair
        
        Returns:
            (success, source, dest, routes_count)
        """
        output_file = self.output_dir / f"worker_{worker_id}_{source}_{dest}"
        
        cmd = [
            sys.executable,
            "scripts/tnstc_bus_scraper_selenium.py",
            "--source", source,
            "--dest", dest,
            "--output", str(output_file),
            "--headless",
            "--delay", "2.0",
            "--rate-limit", "1.5"
        ]
        
        try:
            logger.info(f"[Worker {worker_id}] Starting: {source} -> {dest}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout per pair
            )
            
            if result.returncode == 0:
                # Count routes from JSON file
                json_file = Path(f"{output_file}.json")
                if json_file.exists():
                    with open(json_file, 'r') as f:
                        routes = json.load(f)
                    routes_count = len(routes)
                    logger.info(f"✅ [Worker {worker_id}] {source} -> {dest}: "
                               f"{routes_count} routes")
                    return (True, source, dest, routes_count)
                else:
                    logger.warning(f"[Worker {worker_id}] No output file for {source} -> {dest}")
                    return (False, source, dest, 0)
            else:
                logger.error(f"❌ [Worker {worker_id}] Failed: {source} -> {dest}")
                logger.debug(f"Error: {result.stderr[:200]}")
                return (False, source, dest, 0)
                
        except subprocess.TimeoutExpired:
            logger.error(f"⏱️ [Worker {worker_id}] Timeout: {source} -> {dest}")
            return (False, source, dest, 0)
        except Exception as e:
            logger.error(f"❌ [Worker {worker_id}] Error {source} -> {dest}: {e}")
            return (False, source, dest, 0)
    
    def run(self, route_pairs: List[Tuple[str, str]]):
        """
        Run parallel scraping with checkpoint support
        
        Args:
            route_pairs: List of (source, destination) tuples
        """
        # Load checkpoint
        self.load_checkpoint()
        
        # Filter out already completed pairs
        pending_pairs = [
            pair for pair in route_pairs 
            if pair not in self.completed_pairs
        ]
        
        if not pending_pairs:
            logger.info("✅ All pairs already completed!")
            return
        
        logger.info(f"\n{'='*60}")
        logger.info(f"🚀 Starting parallel TNSTC scraper")
        logger.info(f"   Workers: {self.num_workers}")
        logger.info(f"   Total pairs: {len(route_pairs)}")
        logger.info(f"   Already completed: {len(self.completed_pairs)}")
        logger.info(f"   Pending: {len(pending_pairs)}")
        logger.info(f"{'='*60}\n")
        
        total_routes = 0
        
        try:
            with ProcessPoolExecutor(max_workers=self.num_workers) as executor:
                # Submit all tasks
                future_to_pair = {}
                for idx, (source, dest) in enumerate(pending_pairs):
                    worker_id = (idx % self.num_workers) + 1
                    future = executor.submit(self.scrape_pair, source, dest, worker_id)
                    future_to_pair[future] = (source, dest)
                
                # Process completed tasks
                completed_count = 0
                for future in as_completed(future_to_pair):
                    source, dest = future_to_pair[future]
                    
                    try:
                        success, src, dst, routes_count = future.result()
                        
                        completed_count += 1
                        pair = (src, dst)
                        
                        if success:
                            self.completed_pairs.add(pair)
                            total_routes += routes_count
                        else:
                            self.failed_pairs.add(pair)
                        
                        # Save checkpoint every 5 completions
                        if completed_count % 5 == 0:
                            self.save_checkpoint()
                            logger.info(f"\n📊 Progress: {completed_count}/{len(pending_pairs)} "
                                       f"({completed_count/len(pending_pairs)*100:.1f}%) | "
                                       f"Total routes: {total_routes}\n")
                    
                    except Exception as e:
                        logger.error(f"Error processing {source} -> {dest}: {e}")
                        self.failed_pairs.add((source, dest))
        
        except KeyboardInterrupt:
            logger.warning("\n⚠️  Interrupted by user. Saving checkpoint...")
            self.save_checkpoint()
            raise
        
        # Final checkpoint save
        self.save_checkpoint()
        
        # Summary
        logger.info(f"\n{'='*60}")
        logger.info(f"🏁 SCRAPING COMPLETE")
        logger.info(f"   Total pairs processed: {len(self.completed_pairs) + len(self.failed_pairs)}")
        logger.info(f"   ✅ Successful: {len(self.completed_pairs)}")
        logger.info(f"   ❌ Failed: {len(self.failed_pairs)}")
        logger.info(f"   📦 Total routes scraped: {total_routes}")
        logger.info(f"   📁 Output directory: {self.output_dir}")
        logger.info(f"{'='*60}\n")
        
        if self.failed_pairs:
            logger.warning("Failed pairs:")
            for src, dst in sorted(self.failed_pairs):
                logger.warning(f"  ❌ {src} -> {dst}")


def load_city_list(filepath: str) -> List[str]:
    """Load city list from file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            cities = [line.strip() for line in f if line.strip()]
        logger.info(f"Loaded {len(cities)} cities from {filepath}")
        return cities
    except FileNotFoundError:
        logger.error(f"File not found: {filepath}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='Run TNSTC scrapers in parallel with checkpoint support',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape all combinations from lists (5 parallel workers)
  python scripts/run_tnstc_parallel.py --source-list sources.txt --dest-list destinations.txt

  # Single pair
  python scripts/run_tnstc_parallel.py --source "MADURAI" --dest "CHENNAI"

  # Custom output and workers
  python scripts/run_tnstc_parallel.py --source-list sources.txt --dest-list destinations.txt \\
      --output data/tnstc_parallel --workers 10

The script will:
  1. Resume from last checkpoint if exists
  2. Run 5 parallel workers by default
  3. Save progress every 5 completed pairs
  4. Handle interruptions gracefully
        """
    )
    
    parser.add_argument('--source', help='Source city')
    parser.add_argument('--dest', help='Destination city')
    parser.add_argument('--source-list', help='File with source cities (one per line)')
    parser.add_argument('--dest-list', help='File with destination cities (one per line)')
    parser.add_argument('--output', default='data/tnstc_parallel',
                       help='Output directory (default: data/tnstc_parallel)')
    parser.add_argument('--workers', type=int, default=5,
                       help='Number of parallel workers (default: 5)')
    parser.add_argument('--verbose', action='store_true', help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Validate
    if not args.source and not args.source_list:
        parser.error("Either --source or --source-list required")
    if not args.dest and not args.dest_list:
        parser.error("Either --dest or --dest-list required")
    
    # Build route pairs
    route_pairs = []
    
    if args.source and args.dest:
        route_pairs = [(args.source, args.dest)]
    else:
        sources = load_city_list(args.source_list) if args.source_list else []
        destinations = load_city_list(args.dest_list) if args.dest_list else []
        
        for source in sources:
            for dest in destinations:
                if source.upper() != dest.upper():
                    route_pairs.append((source, dest))
    
    if not route_pairs:
        logger.error("No valid route pairs")
        sys.exit(1)
    
    # Run parallel scraper
    runner = TNSTCParallelRunner(args.output, num_workers=args.workers)
    
    try:
        runner.run(route_pairs)
    except KeyboardInterrupt:
        logger.info("\nExiting...")
        sys.exit(0)


if __name__ == '__main__':
    main()
