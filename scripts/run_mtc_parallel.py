#!/usr/bin/env python3
"""
Parallel MTC Bus Scraper with Checkpoint Support
Runs 5 parallel workers to speed up MTC scraping while keeping the original process alive.

Usage:
    python scripts/run_mtc_parallel.py
    python scripts/run_mtc_parallel.py --workers 10
"""

import json
import time
import logging
import argparse
import sys
from pathlib import Path
from typing import List, Tuple, Set, Dict
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
    completed_routes: List[str]
    total_routes_scraped: int
    last_updated: str


class MTCParallelRunner:
    """Parallel runner for MTC scraper with checkpoint support"""
    
    def __init__(self, output_dir: str, num_workers: int = 5):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.num_workers = num_workers
        self.checkpoint_file = self.output_dir / "parallel_checkpoint.json"
        self.completed_routes: Set[str] = set()
        self.failed_routes: Set[str] = set()
        self.all_timings = []
        
    def load_checkpoint(self) -> bool:
        """Load checkpoint if exists"""
        if not self.checkpoint_file.exists():
            logger.info("No checkpoint found, starting fresh")
            return False
            
        try:
            with open(self.checkpoint_file, 'r') as f:
                data = json.load(f)
            
            self.completed_routes = set(data.get('completed_routes', []))
            self.failed_routes = set(data.get('failed_routes', []))
            self.all_timings = data.get('all_timings', [])
            
            logger.info(f"✅ Loaded checkpoint: {len(self.completed_routes)} completed, "
                       f"{len(self.failed_routes)} failed, {len(self.all_timings)} timings")
            return True
        except Exception as e:
            logger.warning(f"Could not load checkpoint: {e}")
            return False
    
    def save_checkpoint(self):
        """Save current progress to checkpoint"""
        try:
            data = {
                'completed_routes': list(self.completed_routes),
                'failed_routes': list(self.failed_routes),
                'all_timings': self.all_timings,
                'total_routes_scraped': len(self.all_timings),
                'last_updated': time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            with open(self.checkpoint_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.debug(f"Checkpoint saved: {len(self.completed_routes)} completed, "
                        f"{len(self.all_timings)} timings")
        except Exception as e:
            logger.error(f"Failed to save checkpoint: {e}")
    
    def scrape_route_batch(self, routes: List[str], worker_id: int) -> Tuple[bool, int, List[str]]:
        """
        Scrape a batch of routes
        
        Returns:
            (success, routes_scraped, failed_routes)
        """
        output_file = self.output_dir / f"worker_{worker_id}_batch.json"
        
        # Create routes.txt temp file for this worker
        routes_file = self.output_dir / f"worker_{worker_id}_routes.txt"
        with open(routes_file, 'w') as f:
            f.write('\n'.join(routes))
        
        cmd = [
            sys.executable,
            "scripts/mtc_bus_scraper_selenium.py",
            "--output", str(output_file),
            "--delay", "0.6",
            "--limit-routes", str(len(routes))
        ]
        
        try:
            logger.info(f"[Worker {worker_id}] Starting batch of {len(routes)} routes")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600,  # 10 minute timeout per batch
                cwd=Path.cwd()  # Run from project root
            )
            
            if result.returncode == 0:
                # Read the output JSON
                json_file = Path(f"{output_file}.json")
                if json_file.exists():
                    with open(json_file, 'r') as f:
                        timings = json.load(f)
                    
                    routes_count = len(set(t.get('route_number', 'unknown') for t in timings if isinstance(t, dict)))
                    logger.info(f"✅ [Worker {worker_id}] Scraped {routes_count} routes, "
                               f"{len(timings)} timings")
                    return (True, len(timings), [])
                else:
                    logger.warning(f"[Worker {worker_id}] No output file generated")
                    logger.warning(f"[Worker {worker_id}] STDOUT: {result.stdout[:300]}")
                    logger.warning(f"[Worker {worker_id}] STDERR: {result.stderr[:300]}")
                    return (False, 0, routes)
            else:
                logger.error(f"❌ [Worker {worker_id}] Failed with code {result.returncode}")
                logger.error(f"[Worker {worker_id}] STDOUT: {result.stdout[:500]}")
                logger.error(f"[Worker {worker_id}] STDERR: {result.stderr[:500]}")
                return (False, 0, routes)
                
        except subprocess.TimeoutExpired:
            logger.error(f"⏱️ [Worker {worker_id}] Timeout on batch")
            return (False, 0, routes)
        except Exception as e:
            logger.error(f"❌ [Worker {worker_id}] Error: {e}")
            return (False, 0, routes)
        finally:
            # Cleanup temp file
            routes_file.unlink(missing_ok=True)
    
    def get_all_routes(self) -> List[str]:
        """Get all available MTC routes by running single query"""
        logger.info("Fetching all available routes...")
        
        try:
            # Run a quick route fetch
            result = subprocess.run(
                [sys.executable, "scripts/mtc_bus_scraper_selenium.py", "--limit-routes", "1"],
                capture_output=True,
                text=True,
                timeout=120
            )
            
            # For now, return a range - the actual scraper will discover all routes
            # This is a simplified approach; in production you'd parse the dropdowns
            return [str(i) for i in range(1, 100)]  # Placeholder
            
        except Exception as e:
            logger.warning(f"Could not pre-fetch routes: {e}")
            return []
    
    def run(self, num_route_batches: int = 20):
        """
        Run parallel scraping with checkpoint support
        
        Args:
            num_route_batches: Number of batches to create
        """
        # Load checkpoint
        self.load_checkpoint()
        
        logger.info(f"\n{'='*60}")
        logger.info(f"🚀 Starting parallel MTC scraper")
        logger.info(f"   Workers: {self.num_workers}")
        logger.info(f"   Batches: {num_route_batches}")
        logger.info(f"   Already completed routes: {len(self.completed_routes)}")
        logger.info(f"   Already scraped timings: {len(self.all_timings)}")
        logger.info(f"{'='*60}\n")
        
        total_timings = 0
        
        # Create route batches (simplified - assign routes to workers)
        routes_per_batch = max(1, 50 // num_route_batches)
        batches = [list(range(i, min(i + routes_per_batch, 100))) 
                   for i in range(0, 100, routes_per_batch)]
        
        try:
            with ProcessPoolExecutor(max_workers=self.num_workers) as executor:
                # Submit all batch tasks
                future_to_batch = {}
                for batch_idx, batch_routes in enumerate(batches):
                    worker_id = (batch_idx % self.num_workers) + 1
                    future = executor.submit(
                        self.scrape_route_batch, 
                        [str(r) for r in batch_routes], 
                        worker_id
                    )
                    future_to_batch[future] = batch_idx
                
                # Process completed tasks
                completed_count = 0
                for future in as_completed(future_to_batch):
                    batch_idx = future_to_batch[future]
                    
                    try:
                        success, timings_count, failed_routes = future.result()
                        
                        completed_count += 1
                        
                        if success:
                            total_timings += timings_count
                        else:
                            self.failed_routes.update(failed_routes)
                        
                        # Save checkpoint every 5 completions
                        if completed_count % 5 == 0:
                            self.save_checkpoint()
                            logger.info(f"\n📊 Progress: {completed_count}/{len(batches)} "
                                       f"({completed_count/len(batches)*100:.1f}%) | "
                                       f"Total timings: {total_timings}\n")
                    
                    except Exception as e:
                        logger.error(f"Error processing batch {batch_idx}: {e}")
                        self.failed_routes.add(f"batch_{batch_idx}")
        
        except KeyboardInterrupt:
            logger.warning("\n⚠️  Interrupted by user. Saving checkpoint...")
            self.save_checkpoint()
            raise
        
        # Final checkpoint save
        self.save_checkpoint()
        
        # Summary
        logger.info(f"\n{'='*60}")
        logger.info(f"🏁 SCRAPING COMPLETE")
        logger.info(f"   Total batches processed: {completed_count}")
        logger.info(f"   ✅ Successful batches: {len(self.completed_routes)}")
        logger.info(f"   ❌ Failed batches: {len(self.failed_routes)}")
        logger.info(f"   📦 Total timings scraped: {total_timings}")
        logger.info(f"   📁 Output directory: {self.output_dir}")
        logger.info(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(
        description='Run MTC scrapers in parallel with checkpoint support',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run with 5 parallel workers (default)
  python scripts/run_mtc_parallel.py

  # Run with 10 parallel workers
  python scripts/run_mtc_parallel.py --workers 10

  # Custom output directory
  python scripts/run_mtc_parallel.py --output data/mtc_parallel --workers 5

The script will:
  1. Resume from last checkpoint if exists
  2. Run 5 parallel workers by default
  3. Save progress every 5 completed batches
  4. Handle interruptions gracefully
        """
    )
    
    parser.add_argument('--output', default='data/mtc_parallel',
                       help='Output directory (default: data/mtc_parallel)')
    parser.add_argument('--workers', type=int, default=5,
                       help='Number of parallel workers (default: 5)')
    parser.add_argument('--verbose', action='store_true', help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Run parallel scraper
    runner = MTCParallelRunner(args.output, num_workers=args.workers)
    
    try:
        runner.run()
    except KeyboardInterrupt:
        logger.info("\nExiting...")
        sys.exit(0)


if __name__ == '__main__':
    main()
