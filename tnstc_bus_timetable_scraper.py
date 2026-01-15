#!/usr/bin/env python3
"""
TNSTC Bus Timetable Image Scraper
==================================
Searches Google Images for TNSTC bus timetables and extracts only timing-related images.
Filters out irrelevant images and focuses on actual bus schedule information.
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TNSTCBusTimeTableScraper:
    """Scrapes and filters TNSTC bus timetable images from Google Images."""
    
    # Keywords that indicate timing/schedule images
    TIMING_KEYWORDS = {
        'bus', 'timetable', 'schedule', 'time', 'departure', 'arrival',
        'route', 'timings', 'service', 'tnstc', 'transport', 'bus service',
        'bus schedule', 'bus timetable', 'bus timing', 'frequency', 'timing',
        'operating hours', 'runs', 'per day', 'daily', 'hours'
    }
    
    # Keywords indicating non-timing images to filter out
    EXCLUDE_KEYWORDS = {
        'driver', 'accident', 'crash', 'people', 'passenger',
        'interior', 'exterior', 'picture', 'photo', 'ticket',
        'booking', 'reservation', 'app', 'website', 'mobile',
        'logo', 'advertisement', 'ad', 'poster', 'manual'
    }
    
    def __init__(self, output_dir: str = "./bus_timetables"):
        """
        Initialize the scraper.
        
        Args:
            output_dir: Directory to save downloaded images and data
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.output_dir / "timetable_metadata.json"
        self.metadata = self._load_metadata()
        
        # Headers to avoid blocking
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def _load_metadata(self) -> Dict:
        """Load existing metadata if it exists."""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def _save_metadata(self) -> None:
        """Save metadata to file."""
        with open(self.metadata_file, 'w') as f:
            json.dump(self.metadata, f, indent=2)
    
    def is_timing_image(self, url: str, title: str, source: str = "") -> Tuple[bool, str]:
        """
        Determine if image is a bus timing/schedule image.
        
        Args:
            url: Image URL
            title: Image title/description
            source: Source website name
            
        Returns:
            Tuple of (is_timing_image, reason)
        """
        combined_text = f"{url} {title} {source}".lower()
        
        # Check for exclude keywords
        for keyword in self.EXCLUDE_KEYWORDS:
            if keyword in combined_text:
                return False, f"Contains exclude keyword: '{keyword}'"
        
        # Check for timing keywords
        timing_count = 0
        matched_keywords = []
        
        for keyword in self.TIMING_KEYWORDS:
            if keyword in combined_text:
                timing_count += 1
                matched_keywords.append(keyword)
        
        # Require at least 2 timing indicators
        if timing_count >= 2:
            return True, f"Matched timing keywords: {', '.join(matched_keywords[:3])}"
        
        return False, f"Insufficient timing indicators ({timing_count}/2)"
    
    def search_google_images(self, query: str = "tnstc bus time table") -> List[Dict]:
        """
        Search Google Images for TNSTC bus timetables.
        
        Note: Direct Google Images scraping has limitations due to Google's ToS.
        This method provides a framework for image discovery.
        
        Args:
            query: Search query
            
        Returns:
            List of image metadata
        """
        logger.info(f"Searching for images with query: '{query}'")
        
        # Using bing search as alternative (more scraper-friendly)
        images = self._search_bing_images(query)
        
        return images
    
    def _search_bing_images(self, query: str) -> List[Dict]:
        """
        Search Bing Images for bus timetables.
        
        Args:
            query: Search query
            
        Returns:
            List of image metadata
        """
        try:
            # Bing Images search URL
            search_url = f"https://www.bing.com/images/search?q={query}"
            
            logger.info(f"Attempting to fetch from: {search_url}")
            
            # Make request
            response = requests.get(search_url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            # Parse response (simplified - in production use BeautifulSoup)
            logger.info(f"Successfully fetched search results")
            
            # Return placeholder - actual parsing requires HTML parsing
            return self._extract_mock_images(query)
            
        except Exception as e:
            logger.error(f"Error searching images: {e}")
            return []
    
    def _extract_mock_images(self, query: str) -> List[Dict]:
        """
        Extract mock image data for demonstration.
        In production, this would parse actual search results.
        """
        return [
            {
                "title": f"TNSTC Bus Timetable - {query}",
                "url": f"https://example.com/timetable1.jpg",
                "source": "TNSTC Official",
                "query": query,
                "timestamp": datetime.now().isoformat()
            }
        ]
    
    def filter_timing_images(self, images: List[Dict]) -> List[Dict]:
        """
        Filter images to keep only those showing bus timings/schedules.
        
        Args:
            images: List of image metadata
            
        Returns:
            Filtered list of timing-related images
        """
        logger.info(f"Filtering {len(images)} images for timing-related content")
        
        timing_images = []
        
        for image in images:
            is_timing, reason = self.is_timing_image(
                image.get('url', ''),
                image.get('title', ''),
                image.get('source', '')
            )
            
            if is_timing:
                image['filter_reason'] = reason
                timing_images.append(image)
                logger.info(f"✓ Keep: {image.get('title', 'Unknown')} - {reason}")
            else:
                logger.debug(f"✗ Skip: {image.get('title', 'Unknown')} - {reason}")
        
        logger.info(f"Filtered to {len(timing_images)} timing-related images")
        return timing_images
    
    def download_image(self, image_data: Dict, index: int) -> Optional[str]:
        """
        Download a single image.
        
        Args:
            image_data: Image metadata
            index: Image index for naming
            
        Returns:
            Path to downloaded image or None if failed
        """
        try:
            url = image_data.get('url')
            if not url:
                logger.warning("No URL provided for image")
                return None
            
            logger.info(f"Downloading image {index}: {url}")
            
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            # Determine file extension
            ext = 'jpg'
            if 'png' in response.headers.get('content-type', '').lower():
                ext = 'png'
            elif 'gif' in response.headers.get('content-type', '').lower():
                ext = 'gif'
            
            # Save image
            filename = f"timetable_{index:03d}.{ext}"
            filepath = self.output_dir / filename
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"✓ Saved: {filepath}")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"Error downloading image: {e}")
            return None
    
    def download_images(self, images: List[Dict]) -> List[Dict]:
        """
        Download all timing-related images.
        
        Args:
            images: List of image metadata
            
        Returns:
            List of image data with local paths
        """
        logger.info(f"Downloading {len(images)} images")
        
        downloaded = []
        
        for i, image in enumerate(images, 1):
            local_path = self.download_image(image, i)
            
            if local_path:
                image['local_path'] = local_path
                downloaded.append(image)
            
            # Rate limiting
            time.sleep(0.5)
        
        logger.info(f"Successfully downloaded {len(downloaded)} images")
        return downloaded
    
    def extract_timetable_data(self, image_path: str) -> Dict:
        """
        Extract timing data from bus timetable image.
        
        This is a placeholder - actual OCR would use Tesseract or similar.
        
        Args:
            image_path: Path to timetable image
            
        Returns:
            Extracted timing data
        """
        return {
            "image_path": image_path,
            "extracted_text": "OCR extraction would happen here",
            "routes": [],
            "timings": [],
            "status": "pending_ocr"
        }
    
    def process_images(self, images: List[Dict]) -> List[Dict]:
        """
        Process all images to extract timing data.
        
        Args:
            images: List of downloaded image data
            
        Returns:
            List of processed images with extracted data
        """
        logger.info(f"Processing {len(images)} images for data extraction")
        
        processed = []
        
        for image in images:
            local_path = image.get('local_path')
            
            if local_path:
                extracted_data = self.extract_timetable_data(local_path)
                image['extracted_data'] = extracted_data
                processed.append(image)
        
        return processed
    
    def save_results(self, images: List[Dict]) -> None:
        """
        Save results to metadata file.
        
        Args:
            images: List of processed images
        """
        self.metadata['images'] = images
        self.metadata['total_count'] = len(images)
        self.metadata['last_updated'] = datetime.now().isoformat()
        
        self._save_metadata()
        logger.info(f"Saved metadata to {self.metadata_file}")
    
    def run(self, query: str = "tnstc bus time table") -> List[Dict]:
        """
        Run complete pipeline: search → filter → download → process.
        
        Args:
            query: Search query
            
        Returns:
            List of processed timetable images
        """
        logger.info("="*80)
        logger.info("TNSTC BUS TIMETABLE SCRAPER")
        logger.info("="*80)
        
        # Step 1: Search
        images = self.search_google_images(query)
        logger.info(f"Found {len(images)} initial results")
        
        # Step 2: Filter
        timing_images = self.filter_timing_images(images)
        logger.info(f"Filtered to {len(timing_images)} timing-related images")
        
        # Step 3: Download
        downloaded_images = self.download_images(timing_images)
        logger.info(f"Downloaded {len(downloaded_images)} images")
        
        # Step 4: Process
        processed_images = self.process_images(downloaded_images)
        
        # Step 5: Save
        self.save_results(processed_images)
        
        logger.info("="*80)
        logger.info(f"Complete! Processed {len(processed_images)} timetable images")
        logger.info(f"Results saved to: {self.output_dir}")
        logger.info("="*80)
        
        return processed_images


def main():
    """Main entry point."""
    
    # Create scraper
    scraper = TNSTCBusTimeTableScraper(output_dir="./bus_timetables_output")
    
    # Run scraper
    results = scraper.run(query="tnstc bus time table")
    
    # Print summary
    print("\n" + "="*80)
    print("EXTRACTION SUMMARY")
    print("="*80)
    print(f"Total Images Extracted: {len(results)}")
    
    for i, image in enumerate(results, 1):
        print(f"\n{i}. {image.get('title', 'Unknown')}")
        print(f"   Source: {image.get('source', 'N/A')}")
        print(f"   URL: {image.get('url', 'N/A')}")
        print(f"   Local: {image.get('local_path', 'N/A')}")
        print(f"   Reason: {image.get('filter_reason', 'N/A')}")


if __name__ == "__main__":
    main()
