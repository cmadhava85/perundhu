#!/usr/bin/env python3
"""
TNSTC Bus Timetable Image Search with Multiple Queries
========================================================
Uses the existing google_image_bus_scraper to search for and extract
TNSTC bus timetable images from multiple different search queries.

Usage:
    python search_tnstc_bus_timetables.py                    # Run all default searches
    python search_tnstc_bus_timetables.py --output ./results  # Specify output directory
    python search_tnstc_bus_timetables.py --limit 20         # Increase image limit per search
"""

import sys
import os
import json
import logging
from pathlib import Path
from datetime import datetime

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))

from google_image_bus_scraper import BusImageAnalyzer, logger as base_logger

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TNSTCSearchEngine:
    """Manages multiple search queries for TNSTC bus timetables."""
    
    # Different search strategies to capture various timetable formats
    SEARCH_QUERIES = {
        # Direct searches
        "tnstc_basic": "tnstc bus time table",
        "tnstc_timing": "tnstc bus timing schedule",
        "tnstc_routes": "tnstc bus routes time",
        
        # City-specific routes
        "chennai_madurai": "Chennai to Madurai TNSTC bus timetable",
        "salem_bangalore": "Salem to Bangalore TNSTC bus schedule",
        "trichy_salem": "Trichy to Salem TNSTC bus timing",
        "coimbatore_bangalore": "Coimbatore to Bangalore TNSTC timetable",
        "erode_salem": "Erode to Salem TNSTC bus timing",
        
        # Alternative keywords
        "tnstc_schedule": "TNSTC bus schedule table",
        "tnstc_departure": "TNSTC bus departure arrival times",
        "tnstc_frequency": "TNSTC bus frequency daily schedule",
        
        # Tamil Nadu regional searches
        "tamil_bus_timing": "Tamil Nadu bus timetable schedule",
        "tamil_bus_routes": "Tamil Nadu TNSTC routes timing",
        
        # Common routes
        "tiruppur_salem": "Tiruppur to Salem bus timetable",
        "vellore_chennai": "Vellore to Chennai TNSTC bus timing",
        "dindigul_madurai": "Dindigul to Madurai bus schedule",
        
        # General format searches
        "bus_schedule_format": "bus time table schedule format Tamil Nadu",
        "bus_timing_table": "bus schedule timing table image",
    }
    
    def __init__(self, output_dir: str = "./tnstc_timetable_results", limit_per_search: int = 10):
        """
        Initialize search engine.
        
        Args:
            output_dir: Directory to save results
            limit_per_search: Number of images per search query
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.limit_per_search = limit_per_search
        self.analyzer = BusImageAnalyzer(output_dir=str(self.output_dir))
        
        # Results tracking
        self.search_results = {}
        self.total_extracted = 0
        self.results_file = self.output_dir / "all_results.json"
        self.summary_file = self.output_dir / "search_summary.json"
        self.search_log = self.output_dir / "search_log.txt"
    
    def run_all_searches(self, use_dedup: bool = True) -> None:
        """
        Execute all search queries.
        
        Args:
            use_dedup: Enable duplicate image detection
        """
        logger.info("=" * 80)
        logger.info("TNSTC BUS TIMETABLE IMAGE SEARCH - MULTIPLE QUERIES")
        logger.info("=" * 80)
        logger.info(f"Output directory: {self.output_dir}")
        logger.info(f"Queries to execute: {len(self.SEARCH_QUERIES)}")
        logger.info(f"Limit per query: {self.limit_per_search}")
        logger.info("=" * 80)
        
        # Set dedup option
        self.analyzer.searcher.enable_dedup = use_dedup
        
        with open(self.search_log, 'w') as log_file:
            log_file.write(f"TNSTC Bus Timetable Search Log\n")
            log_file.write(f"Started: {datetime.now().isoformat()}\n")
            log_file.write(f"Deduplication enabled: {use_dedup}\n")
            log_file.write("=" * 80 + "\n\n")
            
            for idx, (search_key, query) in enumerate(self.SEARCH_QUERIES.items(), 1):
                logger.info(f"\n[{idx}/{len(self.SEARCH_QUERIES)}] Searching: {search_key}")
                logger.info(f"Query: {query}")
                
                log_file.write(f"\n[{idx}/{len(self.SEARCH_QUERIES)}] {search_key}\n")
                log_file.write(f"Query: {query}\n")
                log_file.write("-" * 60 + "\n")
                
                try:
                    routes = self.analyzer.search_and_process_enhanced(
                        query=query,
                        limit=self.limit_per_search,
                        enhance_query=False  # Don't double-enhance
                    )
                    
                    extracted_count = len(routes)
                    self.search_results[search_key] = {
                        'query': query,
                        'extracted_count': extracted_count,
                        'routes': [
                            self.analyzer.processor.to_tnstc_format(route)
                            for route in routes
                        ]
                    }
                    
                    self.total_extracted += extracted_count
                    
                    logger.info(f"✓ Extracted {extracted_count} routes")
                    log_file.write(f"Status: Extracted {extracted_count} routes\n")
                    
                except Exception as e:
                    logger.error(f"✗ Search failed: {e}")
                    log_file.write(f"Status: FAILED - {str(e)}\n")
                    self.search_results[search_key] = {
                        'query': query,
                        'extracted_count': 0,
                        'error': str(e),
                        'routes': []
                    }
            
            log_file.write("\n" + "=" * 80 + "\n")
            log_file.write(f"Completed: {datetime.now().isoformat()}\n")
            log_file.write(f"Total routes extracted: {self.total_extracted}\n")
        
        # Save results
        self._save_results()
    
    def run_custom_searches(self, queries: list, use_dedup: bool = True) -> None:
        """
        Execute custom search queries.
        
        Args:
            queries: List of search queries
            use_dedup: Enable duplicate image detection
        """
        logger.info("=" * 80)
        logger.info("TNSTC BUS TIMETABLE IMAGE SEARCH - CUSTOM QUERIES")
        logger.info("=" * 80)
        logger.info(f"Custom queries: {len(queries)}")
        logger.info("=" * 80)
        
        self.analyzer.searcher.enable_dedup = use_dedup
        
        for idx, query in enumerate(queries, 1):
            logger.info(f"\n[{idx}/{len(queries)}] Searching: {query}")
            
            try:
                routes = self.analyzer.search_and_process_enhanced(
                    query=query,
                    limit=self.limit_per_search,
                    enhance_query=False
                )
                
                extracted_count = len(routes)
                self.search_results[query] = {
                    'query': query,
                    'extracted_count': extracted_count,
                    'routes': [
                        self.analyzer.processor.to_tnstc_format(route)
                        for route in routes
                    ]
                }
                
                self.total_extracted += extracted_count
                logger.info(f"✓ Extracted {extracted_count} routes")
                
            except Exception as e:
                logger.error(f"✗ Search failed: {e}")
                self.search_results[query] = {
                    'query': query,
                    'extracted_count': 0,
                    'error': str(e),
                    'routes': []
                }
        
        self._save_results()
    
    def _save_results(self) -> None:
        """Save all search results to files."""
        # Save detailed results
        with open(self.results_file, 'w', encoding='utf-8') as f:
            json.dump(self.search_results, f, indent=2, ensure_ascii=False)
        logger.info(f"✓ Detailed results saved to: {self.results_file}")
        
        # Save summary
        summary = self._generate_summary()
        with open(self.summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        logger.info(f"✓ Summary saved to: {self.summary_file}")
    
    def _generate_summary(self) -> dict:
        """Generate search summary."""
        summary = {
            'timestamp': datetime.now().isoformat(),
            'total_queries': len(self.search_results),
            'total_routes_extracted': self.total_extracted,
            'queries_successful': 0,
            'queries_failed': 0,
            'queries': {}
        }
        
        for search_key, result in self.search_results.items():
            if result.get('extracted_count', 0) > 0:
                summary['queries_successful'] += 1
            else:
                summary['queries_failed'] += 1
            
            summary['queries'][search_key] = {
                'query': result['query'],
                'extracted': result['extracted_count'],
                'has_error': 'error' in result
            }
        
        return summary
    
    def print_summary(self) -> None:
        """Print search summary to console."""
        logger.info("\n" + "=" * 80)
        logger.info("SEARCH SUMMARY")
        logger.info("=" * 80)
        
        summary = self._generate_summary()
        
        logger.info(f"Total Queries: {summary['total_queries']}")
        logger.info(f"Successful: {summary['queries_successful']}")
        logger.info(f"Failed: {summary['queries_failed']}")
        logger.info(f"Total Routes Extracted: {summary['total_routes_extracted']}")
        
        logger.info("\nResults by Query:")
        logger.info("-" * 80)
        
        for search_key, query_info in summary['queries'].items():
            status = "✓" if not query_info['has_error'] else "✗"
            logger.info(f"{status} {search_key}")
            logger.info(f"   Query: {query_info['query']}")
            logger.info(f"   Extracted: {query_info['extracted']}")
        
        logger.info("=" * 80)
        logger.info(f"\nResults saved to: {self.output_dir}/")
        logger.info(f"  • Detailed results: {self.results_file.name}")
        logger.info(f"  • Summary: {self.summary_file.name}")
        logger.info(f"  • Search log: {self.search_log.name}")
        logger.info("=" * 80)


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Search and extract TNSTC bus timetable images using multiple queries'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        default='./tnstc_timetable_results',
        help='Output directory for results'
    )
    
    parser.add_argument(
        '--limit',
        type=int,
        default=10,
        help='Maximum images per search query'
    )
    
    parser.add_argument(
        '--custom-queries',
        type=str,
        help='File with custom search queries (one per line)'
    )
    
    parser.add_argument(
        '--query',
        type=str,
        help='Single custom search query'
    )
    
    parser.add_argument(
        '--no-dedup',
        action='store_true',
        help='Disable duplicate detection'
    )
    
    args = parser.parse_args()
    
    # Initialize search engine
    engine = TNSTCSearchEngine(
        output_dir=args.output,
        limit_per_search=args.limit
    )
    
    use_dedup = not args.no_dedup
    
    # Run searches
    if args.custom_queries:
        # Load queries from file
        with open(args.custom_queries, 'r') as f:
            queries = [line.strip() for line in f if line.strip()]
        engine.run_custom_searches(queries, use_dedup=use_dedup)
    
    elif args.query:
        # Single custom query
        engine.run_custom_searches([args.query], use_dedup=use_dedup)
    
    else:
        # Run all default searches
        engine.run_all_searches(use_dedup=use_dedup)
    
    # Print summary
    engine.print_summary()


if __name__ == '__main__':
    main()
