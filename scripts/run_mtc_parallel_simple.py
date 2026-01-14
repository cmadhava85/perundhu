#!/usr/bin/env python3
"""
Simplified MTC Parallel Scraper
Runs multiple instances of the original scraper in parallel with better subprocess handling
"""

import json
import time
import logging
import argparse
import sys
import os
from pathlib import Path
from typing import List
from concurrent.futures import ProcessPoolExecutor, as_completed
import subprocess

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [Worker %(process)d] %(message)s'
)
logger = logging.getLogger(__name__)


def run_scraper_instance(worker_id: int, start_route: int, num_routes: int, output_dir: str) -> dict:
    """Run a single instance of the scraper"""
    
    output_file = Path(output_dir) / f"worker_{worker_id}_routes_{start_route}_{start_route + num_routes}"
    
    try:
        logger.info(f"[Worker {worker_id}] Starting (routes {start_route}-{start_route + num_routes - 1})")
        
        # Build command - call scraper directly
        cmd = [
            sys.executable,
            "scripts/mtc_bus_scraper_selenium.py",
            "--output", str(output_file),
            "--delay", "0.6"
        ]
        
        # Run from project root
        project_root = Path(__file__).parent.parent
        
        result = subprocess.run(
            cmd,
            cwd=str(project_root),
            capture_output=True,
            text=True,
            timeout=900  # 15 minute timeout
        )
        
        if result.returncode == 0:
            # Check for output file
            json_file = Path(f"{output_file}.json")
            if json_file.exists():
                with open(json_file, 'r') as f:
                    data = json.load(f)
                
                if isinstance(data, list):
                    count = len(data)
                else:
                    count = 1
                
                logger.info(f"✅ [Worker {worker_id}] SUCCESS - {count} timings scraped")
                return {
                    "worker_id": worker_id,
                    "success": True,
                    "timings_count": count,
                    "output_file": str(json_file)
                }
        
        logger.error(f"❌ [Worker {worker_id}] Failed with code {result.returncode}")
        logger.error(f"   STDERR: {result.stderr[:300]}")
        
        return {
            "worker_id": worker_id,
            "success": False,
            "timings_count": 0,
            "error": result.stderr[:200]
        }
        
    except subprocess.TimeoutExpired:
        logger.error(f"⏱️  [Worker {worker_id}] TIMEOUT after 15 minutes")
        return {
            "worker_id": worker_id,
            "success": False,
            "error": "Timeout"
        }
    except Exception as e:
        logger.error(f"❌ [Worker {worker_id}] Exception: {e}")
        return {
            "worker_id": worker_id,
            "success": False,
            "error": str(e)
        }


def main():
    parser = argparse.ArgumentParser(description='Simplified parallel MTC scraper')
    parser.add_argument('--workers', type=int, default=5, help='Number of workers')
    parser.add_argument('--output', default='data/mtc_parallel_v2', help='Output directory')
    args = parser.parse_args()
    
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info("=" * 60)
    logger.info(f"🚀 Starting Parallel MTC Scraper")
    logger.info(f"   Workers: {args.workers}")
    logger.info(f"   Output: {output_dir}")
    logger.info("=" * 60)
    
    successful = 0
    failed = 0
    total_timings = 0
    
    try:
        with ProcessPoolExecutor(max_workers=args.workers) as executor:
            # Submit tasks
            futures = []
            for worker_id in range(1, args.workers + 1):
                future = executor.submit(
                    run_scraper_instance,
                    worker_id=worker_id,
                    start_route=worker_id,
                    num_routes=10,
                    output_dir=str(output_dir)
                )
                futures.append(future)
            
            # Collect results
            logger.info("\n" + "=" * 60)
            logger.info("⏳ Waiting for workers to complete...")
            logger.info("=" * 60 + "\n")
            
            for future in as_completed(futures):
                result = future.result()
                if result['success']:
                    successful += 1
                    total_timings += result['timings_count']
                else:
                    failed += 1
    
    except KeyboardInterrupt:
        logger.warning("\n⚠️  Interrupted by user")
        sys.exit(1)
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("🏁 SCRAPING COMPLETE")
    logger.info(f"   ✅ Successful: {successful}")
    logger.info(f"   ❌ Failed: {failed}")
    logger.info(f"   📊 Total timings: {total_timings}")
    logger.info(f"   📁 Output: {output_dir}")
    logger.info("=" * 60)


if __name__ == '__main__':
    main()
