#!/usr/bin/env python3

"""
Web Scraper for vlist.in - Complete Hierarchical Data
Fetches: Districts → Taluks → Villages (all 31 Tamil Nadu districts)

Data Source: https://vlist.in/state/33.html
License: ODbL (Open Data Commons)

Output: JSON file with complete hierarchical structure
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from typing import Dict, List
from pathlib import Path
import re

class VlistHierarchicalScraper:
    """Scrape vlist.in for complete district/taluk/village hierarchy"""
    
    def __init__(self):
        self.base_url = "https://vlist.in"
        self.state_url = f"{self.base_url}/state/33.html"  # Tamil Nadu
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.data = {}
        self.stats = {
            'districts': 0,
            'taluks': 0,
            'villages': 0,
            'errors': 0
        }
    
    def fetch_page(self, url: str, retry=3) -> BeautifulSoup:
        """Fetch and parse a page with retry logic"""
        for attempt in range(retry):
            try:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                return BeautifulSoup(response.content, 'html.parser')
            except Exception as e:
                if attempt < retry - 1:
                    wait_time = 2 ** attempt
                    print(f"   ⚠️  Retry {attempt + 1}/{retry} after {wait_time}s (Error: {str(e)[:50]})")
                    time.sleep(wait_time)
                else:
                    print(f"   ❌ Failed to fetch {url}: {str(e)[:100]}")
                    self.stats['errors'] += 1
                    return None
    
    def extract_district_links(self) -> Dict[str, str]:
        """Extract all district links from main page"""
        print("\n📍 STEP 1: Extracting District Links...")
        print(f"   URL: {self.state_url}\n")
        
        soup = self.fetch_page(self.state_url)
        if not soup:
            return {}
        
        districts = {}
        
        # Find the table with districts
        table = soup.find('table')
        if table:
            rows = table.find_all('tr')[1:]  # Skip header
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 2:
                    district_link = cols[1].find('a')
                    if district_link:
                        district_name = district_link.text.strip()
                        district_href = district_link.get('href', '')
                        if district_href:
                            full_url = f"{self.base_url}/{district_href}" if not district_href.startswith('http') else district_href
                            districts[district_name] = full_url
                            print(f"   ✅ {district_name:20} → {full_url}")
        
        self.stats['districts'] = len(districts)
        print(f"\n✅ Found {len(districts)} districts\n")
        return districts
    
    def extract_taluk_links(self, district_name: str, district_url: str) -> Dict[str, str]:
        """Extract taluks for a specific district"""
        print(f"   📍 {district_name}...", end=" ", flush=True)
        
        soup = self.fetch_page(district_url)
        if not soup:
            return {}
        
        taluks = {}
        
        # Find the table with taluks
        table = soup.find('table')
        if table:
            rows = table.find_all('tr')[1:]  # Skip header
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 2:
                    taluk_link = cols[1].find('a')
                    if taluk_link:
                        taluk_name = taluk_link.text.strip()
                        taluk_href = taluk_link.get('href', '')
                        if taluk_href:
                            full_url = f"{self.base_url}/{taluk_href}" if not taluk_href.startswith('http') else taluk_href
                            taluks[taluk_name] = full_url
        
        time.sleep(0.5)  # Rate limiting
        print(f"✅ {len(taluks)} taluks")
        return taluks
    
    def extract_villages(self, taluk_name: str, taluk_url: str) -> List[str]:
        """Extract villages for a specific taluk"""
        soup = self.fetch_page(taluk_url)
        if not soup:
            return []
        
        villages = []
        
        # Find the table with villages
        table = soup.find('table')
        if table:
            rows = table.find_all('tr')[1:]  # Skip header
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 2:
                    village_link = cols[1].find('a')
                    if village_link:
                        village_name = village_link.text.strip()
                        if village_name:
                            villages.append(village_name)
        
        time.sleep(0.3)  # Rate limiting
        return villages
    
    def scrape_all_data(self):
        """Main scraping method - Districts → Taluks → Villages"""
        print("\n" + "=" * 70)
        print("🚀 VLIST.IN HIERARCHICAL DATA SCRAPER")
        print("=" * 70)
        
        # Step 1: Get all districts
        districts = self.extract_district_links()
        if not districts:
            print("❌ Failed to extract districts")
            return False
        
        # Step 2: For each district, get taluks and villages
        print("📊 STEP 2: Extracting Taluks & Villages...")
        print(f"   Processing {len(districts)} districts...\n")
        
        for idx, (district_name, district_url) in enumerate(districts.items(), 1):
            print(f"[{idx}/{len(districts)}]", end=" ")
            
            # Extract taluks for this district
            taluks = self.extract_taluk_links(district_name, district_url)
            
            self.data[district_name] = {
                'url': district_url,
                'taluks': {},
                'total_villages': 0
            }
            
            # Extract villages for each taluk
            for taluk_name, taluk_url in taluks.items():
                villages = self.extract_villages(taluk_name, taluk_url)
                
                self.data[district_name]['taluks'][taluk_name] = {
                    'url': taluk_url,
                    'villages': villages,
                    'count': len(villages)
                }
                
                self.data[district_name]['total_villages'] += len(villages)
                self.stats['villages'] += len(villages)
            
            self.stats['taluks'] += len(taluks)
            print()
        
        return True
    
    def save_to_json(self):
        """Save extracted data to JSON file"""
        output_dir = Path(__file__).parent.parent / 'data'
        output_dir.mkdir(exist_ok=True)
        
        output_file = output_dir / 'vlist_hierarchical_tamil_nadu.json'
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Data saved to: {output_file}")
        return output_file
    
    def generate_python_script(self):
        """Generate Python script with the scraped data for use in migrations"""
        output_dir = Path(__file__).parent
        output_file = output_dir / 'vlist_hierarchical_data.py'
        
        # Convert data to Python dict
        python_code = '''#!/usr/bin/env python3
"""
Hierarchical Tamil Nadu Location Data from vlist.in
Auto-generated from web scraping
Source: https://vlist.in/state/33.html
"""

# Districts → Taluks → Villages
VLIST_TAMIL_NADU_DATA = '''
        
        python_code += repr(self.data)
        python_code += '''\n\nif __name__ == '__main__':
    print("✅ Hierarchical data loaded successfully")
    print(f"   Districts: {len(VLIST_TAMIL_NADU_DATA)}")
    print(f"   Total villages: {sum(d['total_villages'] for d in VLIST_TAMIL_NADU_DATA.values())}")
'''
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(python_code)
        
        print(f"✅ Python script generated: {output_file}")
        return output_file
    
    def print_summary(self):
        """Print detailed summary"""
        print("\n" + "=" * 70)
        print("📊 SCRAPING SUMMARY")
        print("=" * 70)
        
        print(f"\n📍 Statistics:")
        print(f"   Districts: {self.stats['districts']}")
        print(f"   Taluks: {self.stats['taluks']}")
        print(f"   Villages: {self.stats['villages']}")
        if self.stats['errors'] > 0:
            print(f"   Errors: {self.stats['errors']}")
        
        print(f"\n📌 Top Districts by Village Count:")
        top_districts = sorted(
            [(d, data['total_villages']) for d, data in self.data.items()],
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        for district, count in top_districts:
            taluk_count = len(self.data[district]['taluks'])
            print(f"   {district:20} : {count:4} villages in {taluk_count} taluks")
        
        print(f"\n📌 Sample District Detail (Ariyalur):")
        if 'Ariyalur' in self.data:
            ariyalur = self.data['Ariyalur']
            print(f"   Total Villages: {ariyalur['total_villages']}")
            print(f"   Taluks: {list(ariyalur['taluks'].keys())[:3]}")
        
        print("\n" + "=" * 70)
    
    def run(self):
        """Execute complete scraping workflow"""
        try:
            # Scrape data
            if self.scrape_all_data():
                # Save outputs
                self.save_to_json()
                self.generate_python_script()
                
                # Print summary
                self.print_summary()
                
                print("\n✅ All data extracted successfully!")
                print("\n📂 Output Files:")
                print("   1. data/vlist_hierarchical_tamil_nadu.json (raw data)")
                print("   2. scripts/vlist_hierarchical_data.py (Python format)")
                print("\n💡 Usage:")
                print("   from scripts.vlist_hierarchical_data import VLIST_TAMIL_NADU_DATA")
                print("   # Access: VLIST_TAMIL_NADU_DATA['Ariyalur']['taluks']['Ariyalur']['villages']")
                
                return True
        except Exception as e:
            print(f"\n❌ Scraping failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    scraper = VlistHierarchicalScraper()
    scraper.run()
