#!/usr/bin/env python3

"""
Enhanced vlist.in Scraper - Get Actual Village Names
Fetches: Districts → Taluks → Individual Village Names

Features:
- Intelligent rate limiting and retries
- Progressive saving to avoid data loss
- Detailed village name extraction
- Resume capability from last successful point
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class VlistDetailedScraper:
    """Scrape vlist.in to get actual village names for each taluk"""
    
    def __init__(self):
        self.base_url = "https://vlist.in"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.data = {}
        self.progress_file = Path(__file__).parent.parent / 'data' / 'vlist_scraping_progress.json'
        self.output_file = Path(__file__).parent.parent / 'data' / 'vlist_villages_detailed.json'
        self.load_progress()
    
    def load_progress(self):
        """Load previous scraping progress"""
        if self.progress_file.exists():
            with open(self.progress_file) as f:
                self.data = json.load(f)
            print(f"✅ Loaded previous progress: {len(self.data)} districts")
        else:
            self.data = {}
    
    def save_progress(self):
        """Save progress to file"""
        self.progress_file.parent.mkdir(exist_ok=True)
        with open(self.progress_file, 'w') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
    
    def fetch_page(self, url: str, retry=3, delay=2.5) -> Optional[BeautifulSoup]:
        """Fetch page with intelligent retry logic and configurable delays"""
        for attempt in range(retry):
            try:
                time.sleep(delay)  # Rate limiting (2.5 seconds default)
                response = self.session.get(url, timeout=15)
                response.raise_for_status()
                return BeautifulSoup(response.content, 'html.parser')
            except requests.exceptions.Timeout:
                if attempt < retry - 1:
                    wait = delay * (2 ** attempt)
                    logger.warning(f"Timeout on {url}, retrying in {wait}s...")
                    time.sleep(wait)
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 503:
                    if attempt < retry - 1:
                        wait = 10 * (2 ** attempt)  # Increased wait time for 503
                        logger.warning(f"Server busy (503), waiting {wait}s...")
                        time.sleep(wait)
                    else:
                        logger.error(f"Server rate limited: {url}")
                        return None
                else:
                    logger.error(f"HTTP Error {e.response.status_code}: {url}")
                    return None
            except Exception as e:
                logger.error(f"Error fetching {url}: {str(e)[:100]}")
                return None
        
        return None
    
    def get_districts(self) -> Dict[str, str]:
        """Get all district links"""
        print("\n📍 STEP 1: Fetching Districts...")
        url = f"{self.base_url}/state/33.html"
        soup = self.fetch_page(url)
        
        if not soup:
            return {}
        
        districts = {}
        table = soup.find('table')
        
        if table:
            rows = table.find_all('tr')[1:]
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 2:
                    link = cols[1].find('a')
                    if link:
                        name = link.text.strip()
                        href = link.get('href', '')
                        if href:
                            full_url = f"{self.base_url}/{href}" if not href.startswith('http') else href
                            districts[name] = full_url
        
        print(f"✅ Found {len(districts)} districts\n")
        return districts
    
    def get_taluks(self, district: str, url: str) -> Dict[str, str]:
        """Get taluk links for a district"""
        soup = self.fetch_page(url, delay=0.5)
        
        if not soup:
            return {}
        
        taluks = {}
        table = soup.find('table')
        
        if table:
            rows = table.find_all('tr')[1:]
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 2:
                    link = cols[1].find('a')
                    if link:
                        name = link.text.strip()
                        href = link.get('href', '')
                        if href:
                            full_url = f"{self.base_url}/{href}" if not href.startswith('http') else href
                            taluks[name] = full_url
        
        return taluks
    
    def get_villages(self, taluk: str, url: str) -> List[str]:
        """Get village names for a taluk"""
        soup = self.fetch_page(url, delay=2.5)  # 2.5 second delay
        
        if not soup:
            return []
        
        villages = []
        table = soup.find('table')
        
        if table:
            rows = table.find_all('tr')[1:]
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 2:
                    link = cols[1].find('a')
                    if link:
                        village_name = link.text.strip()
                        if village_name:
                            villages.append(village_name)
        
        return villages
    
    def scrape_all(self):
        """Main scraping method"""
        print("\n" + "=" * 70)
        print("🚀 VLIST.IN DETAILED VILLAGE SCRAPER")
        print("=" * 70)
        
        districts = self.get_districts()
        
        if not districts:
            print("❌ Failed to get districts")
            return False
        
        print("📍 STEP 2: Scraping Taluks & Villages...")
        print(f"Processing {len(districts)} districts\n")
        
        total = len(districts)
        
        for idx, (district_name, district_url) in enumerate(districts.items(), 1):
            # Skip if already done
            if district_name in self.data:
                print(f"[{idx}/{total}] ✅ {district_name:20} (already scraped)")
                continue
            
            print(f"[{idx}/{total}] 📍 {district_name:20}", end=" ", flush=True)
            
            taluks_dict = self.get_taluks(district_name, district_url)
            
            if not taluks_dict:
                print("⚠️  No taluks found")
                continue
            
            print(f"({len(taluks_dict)} taluks)", end="", flush=True)
            
            self.data[district_name] = {
                'taluks': {},
                'total_villages': 0
            }
            
            for taluk_name, taluk_url in taluks_dict.items():
                time.sleep(2.5)  # 2.5 second delay between taluk requests
                villages = self.get_villages(taluk_name, taluk_url)
                
                self.data[district_name]['taluks'][taluk_name] = {
                    'villages': villages,
                    'count': len(villages)
                }
                
                self.data[district_name]['total_villages'] += len(villages)
            
            print(" ✅")
            
            # Save progress after each district
            self.save_progress()
        
        return True
    
    def finalize(self):
        """Finalize and save complete data"""
        print("\n📊 Finalizing data...")
        
        # Save to final output
        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Saved to: {self.output_file}")
        
        # Print statistics
        print("\n" + "=" * 70)
        print("📊 SCRAPING COMPLETE")
        print("=" * 70)
        
        total_districts = len(self.data)
        total_taluks = sum(len(d['taluks']) for d in self.data.values())
        total_villages = sum(d['total_villages'] for d in self.data.values())
        
        print(f"\n✅ Coverage:")
        print(f"   Districts: {total_districts}")
        print(f"   Taluks: {total_taluks}")
        print(f"   Villages: {total_villages:,}")
        
        # Top districts
        top = sorted([(d, data['total_villages']) for d, data in self.data.items()],
                     key=lambda x: x[1], reverse=True)[:10]
        
        print(f"\n🏆 Top Districts:")
        for district, count in top:
            taluk_count = len(self.data[district]['taluks'])
            print(f"   {district:20} : {count:5,} villages in {taluk_count:2} taluks")
        
        print("\n" + "=" * 70)
    
    def run(self):
        """Execute scraping"""
        try:
            if self.scrape_all():
                self.finalize()
                return True
        except KeyboardInterrupt:
            print("\n\n⏸️  Scraping paused. Progress saved.")
            print(f"   Run again to continue from: {list(self.data.keys())[-1]}")
            return False
        except Exception as e:
            logger.error(f"Scraping failed: {str(e)}")
            return False

if __name__ == '__main__':
    scraper = VlistDetailedScraper()
    scraper.run()
