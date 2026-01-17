#!/usr/bin/env python3
"""
Parallel Tamil Vandi Scraper
Splits route pairs into chunks and runs multiple scraper instances in parallel.

Usage:
    python run_parallel_scraper.py --auth-token TOKEN --route-list routes.txt --workers 5 --output data/parallel_output
"""

import argparse
import subprocess
import logging
from pathlib import Path
from typing import List, Tuple
import json
from concurrent.futures import ProcessPoolExecutor, as_completed
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def load_route_pairs(route_file: str) -> List[Tuple[str, str]]:
    """Load route pairs from file"""
    routes = []
    with open(route_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            if ',' in line:
                parts = line.split(',')
                if len(parts) >= 2:
                    routes.append((parts[0].strip(), parts[1].strip()))
    
    return routes


def split_routes(routes: List[Tuple[str, str]], num_chunks: int) -> List[List[Tuple[str, str]]]:
    """Split routes into chunks for parallel processing"""
    chunk_size = len(routes) // num_chunks
    if len(routes) % num_chunks != 0:
        chunk_size += 1
    
    chunks = []
    for i in range(0, len(routes), chunk_size):
        chunks.append(routes[i:i + chunk_size])
    
    return chunks


def save_chunk_to_file(routes: List[Tuple[str, str]], filepath: str):
    """Save a chunk of routes to a file"""
    with open(filepath, 'w') as f:
        f.write("# Route pairs chunk\n")
        for from_city, to_city in routes:
            f.write(f"{from_city},{to_city}\n")


def run_scraper_worker(worker_id: int, chunk_file: str, auth_token: str, output_prefix: str, delay: float) -> dict:
    """Run a single scraper worker process"""
    logger.info(f"Worker {worker_id} starting...")
    
    try:
        # Run the API scraper
        cmd = [
            sys.executable,
            'scripts/tamilvandi_api_scraper.py',
            '--auth-token', auth_token,
            '--route-list', chunk_file,
            '--output', output_prefix,
            '--delay', str(delay)
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout per worker
        )
        
        if result.returncode == 0:
            logger.info(f"Worker {worker_id} completed successfully")
            return {
                'worker_id': worker_id,
                'success': True,
                'output': output_prefix
            }
        else:
            logger.error(f"Worker {worker_id} failed: {result.stderr}")
            return {
                'worker_id': worker_id,
                'success': False,
                'error': result.stderr
            }
    
    except Exception as e:
        logger.error(f"Worker {worker_id} error: {e}")
        return {
            'worker_id': worker_id,
            'success': False,
            'error': str(e)
        }


def merge_results(output_files: List[str], final_output: str):
    """Merge results from multiple workers into final output"""
    all_routes = []
    seen_routes = set()
    
    for output_file in output_files:
        json_file = Path(f"{output_file}.json")
        if not json_file.exists():
            logger.warning(f"Output file not found: {json_file}")
            continue
        
        with open(json_file, 'r') as f:
            routes = json.load(f)
            
        for route in routes:
            # Create unique key for deduplication
            route_key = f"{route['origin']}|{route['destination']}|{route['operator_name']}|{route['departure_time']}|{route['bus_type']}"
            
            if route_key not in seen_routes:
                seen_routes.add(route_key)
                all_routes.append(route)
    
    # Save merged results
    json_file = Path(f"{final_output}.json")
    json_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(all_routes, f, indent=2, ensure_ascii=False)
    
    logger.info(f"Merged {len(all_routes)} unique routes to {json_file}")
    
    # Also save as CSV
    import csv
    csv_file = Path(f"{final_output}.csv")
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        if all_routes:
            writer = csv.DictWriter(f, fieldnames=all_routes[0].keys())
            writer.writeheader()
            writer.writerows(all_routes)
    
    logger.info(f"Saved {len(all_routes)} routes to {csv_file}")


def main():
    parser = argparse.ArgumentParser(description='Parallel Tamil Vandi Scraper')
    parser.add_argument('--auth-token', required=True, help='Wix authentication token')
    parser.add_argument('--route-list', required=True, help='File with all route pairs')
    parser.add_argument('--workers', type=int, default=5, help='Number of parallel workers (default: 5)')
    parser.add_argument('--output', required=True, help='Output file prefix (without extension)')
    parser.add_argument('--delay', type=float, default=0.3, help='Delay between requests per worker (default: 0.3s)')
    
    args = parser.parse_args()
    
    # Load all routes
    logger.info(f"Loading routes from {args.route_list}...")
    all_routes = load_route_pairs(args.route_list)
    logger.info(f"Total routes to scrape: {len(all_routes)}")
    
    # Split into chunks
    chunks = split_routes(all_routes, args.workers)
    logger.info(f"Split into {len(chunks)} chunks for {args.workers} workers")
    
    # Save chunks to temporary files
    temp_dir = Path('temp_chunks')
    temp_dir.mkdir(exist_ok=True)
    
    chunk_files = []
    for i, chunk in enumerate(chunks):
        chunk_file = temp_dir / f"chunk_{i}.txt"
        save_chunk_to_file(chunk, str(chunk_file))
        chunk_files.append(str(chunk_file))
        logger.info(f"Chunk {i}: {len(chunk)} routes → {chunk_file}")
    
    # Run workers in parallel
    logger.info(f"\nStarting {args.workers} parallel workers...\n")
    
    output_files = []
    with ProcessPoolExecutor(max_workers=args.workers) as executor:
        futures = {}
        
        for i, chunk_file in enumerate(chunk_files):
            output_prefix = f"temp_chunks/worker_{i}_output"
            future = executor.submit(
                run_scraper_worker,
                i,
                chunk_file,
                args.auth_token,
                output_prefix,
                args.delay
            )
            futures[future] = (i, output_prefix)
        
        # Wait for completion
        for future in as_completed(futures):
            worker_id, output_prefix = futures[future]
            try:
                result = future.result()
                if result['success']:
                    output_files.append(output_prefix)
                    logger.info(f"✅ Worker {worker_id} done")
                else:
                    logger.error(f"❌ Worker {worker_id} failed: {result.get('error', 'Unknown')}")
            except Exception as e:
                logger.error(f"❌ Worker {worker_id} exception: {e}")
    
    # Merge results
    logger.info(f"\nMerging results from {len(output_files)} workers...")
    merge_results(output_files, args.output)
    
    logger.info("\n=== Parallel scraping complete! ===")


if __name__ == '__main__':
    main()
