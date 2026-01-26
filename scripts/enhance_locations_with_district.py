#!/usr/bin/env python3

"""
Enhance locations with district and state information
Uses Nominatim reverse geocoding + coordinate-based district mapping
"""

import json
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Dict, Optional, List
from collections import defaultdict

class LocationEnhancer:
    """Add district and state info to locations"""
    
    # Tamil Nadu district boundaries (approximate lat/lon centers)
    DISTRICTS = {
        'Ariyalur': {'lat': 11.14, 'lon': 79.06, 'bounds': {'lat_min': 10.95, 'lat_max': 11.4, 'lon_min': 78.75, 'lon_max': 79.5}},
        'Chengalpattu': {'lat': 12.67, 'lon': 79.96, 'bounds': {'lat_min': 12.45, 'lat_max': 12.85, 'lon_min': 79.65, 'lon_max': 80.2}},
        'Chindwara': {'lat': 11.69, 'lon': 79.28, 'bounds': {'lat_min': 11.5, 'lat_max': 11.85, 'lon_min': 79.0, 'lon_max': 79.65}},
        'Coimbatore': {'lat': 11.00, 'lon': 76.96, 'bounds': {'lat_min': 10.7, 'lat_max': 11.5, 'lon_min': 76.5, 'lon_max': 77.5}},
        'Cuddalore': {'lat': 11.75, 'lon': 79.77, 'bounds': {'lat_min': 11.5, 'lat_max': 12.0, 'lon_min': 79.5, 'lon_max': 80.15}},
        'Dharmapuri': {'lat': 12.16, 'lon': 78.56, 'bounds': {'lat_min': 11.95, 'lat_max': 12.45, 'lon_min': 78.2, 'lon_max': 79.0}},
        'Dindigul': {'lat': 10.37, 'lon': 77.96, 'bounds': {'lat_min': 10.0, 'lat_max': 10.75, 'lon_min': 77.5, 'lon_max': 78.5}},
        'Erode': {'lat': 11.34, 'lon': 77.72, 'bounds': {'lat_min': 11.1, 'lat_max': 11.6, 'lon_min': 77.3, 'lon_max': 78.3}},
        'Kanchipuram': {'lat': 12.84, 'lon': 79.70, 'bounds': {'lat_min': 12.6, 'lat_max': 13.0, 'lon_min': 79.3, 'lon_max': 80.1}},
        'Kanniyakumari': {'lat': 8.08, 'lon': 77.57, 'bounds': {'lat_min': 8.0, 'lat_max': 8.3, 'lon_min': 77.2, 'lon_max': 77.9}},
        'Karur': {'lat': 10.96, 'lon': 78.08, 'bounds': {'lat_min': 10.7, 'lat_max': 11.25, 'lon_min': 77.7, 'lon_max': 78.45}},
        'Krishnagiri': {'lat': 12.51, 'lon': 78.21, 'bounds': {'lat_min': 12.25, 'lat_max': 12.9, 'lon_min': 77.85, 'lon_max': 78.7}},
        'Madurai': {'lat': 9.92, 'lon': 78.12, 'bounds': {'lat_min': 9.5, 'lat_max': 10.3, 'lon_min': 77.7, 'lon_max': 78.5}},
        'Nagapattinam': {'lat': 11.06, 'lon': 79.86, 'bounds': {'lat_min': 10.75, 'lat_max': 11.35, 'lon_min': 79.5, 'lon_max': 80.2}},
        'Namakkal': {'lat': 11.73, 'lon': 78.18, 'bounds': {'lat_min': 11.45, 'lat_max': 11.95, 'lon_min': 77.9, 'lon_max': 78.5}},
        'Nilgiris': {'lat': 11.40, 'lon': 76.70, 'bounds': {'lat_min': 11.1, 'lat_max': 11.65, 'lon_min': 76.3, 'lon_max': 77.1}},
        'Perambalur': {'lat': 11.29, 'lon': 78.88, 'bounds': {'lat_min': 11.0, 'lat_max': 11.6, 'lon_min': 78.5, 'lon_max': 79.3}},
        'Puducherry': {'lat': 12.07, 'lon': 79.86, 'bounds': {'lat_min': 11.8, 'lat_max': 12.35, 'lon_min': 79.5, 'lon_max': 80.2}},
        'Ramanathapuram': {'lat': 9.37, 'lon': 78.84, 'bounds': {'lat_min': 9.0, 'lat_max': 9.7, 'lon_min': 78.4, 'lon_max': 79.3}},
        'Ranipet': {'lat': 12.96, 'lon': 79.35, 'bounds': {'lat_min': 12.75, 'lat_max': 13.15, 'lon_min': 79.0, 'lon_max': 79.7}},
        'Salem': {'lat': 11.67, 'lon': 78.15, 'bounds': {'lat_min': 11.3, 'lat_max': 12.0, 'lon_min': 77.7, 'lon_max': 78.6}},
        'Sivaganga': {'lat': 9.84, 'lon': 78.48, 'bounds': {'lat_min': 9.5, 'lat_max': 10.2, 'lon_min': 78.0, 'lon_max': 78.95}},
        'Tenkasi': {'lat': 8.96, 'lon': 77.30, 'bounds': {'lat_min': 8.6, 'lat_max': 9.25, 'lon_min': 77.0, 'lon_max': 77.7}},
        'Thanjavur': {'lat': 10.79, 'lon': 79.14, 'bounds': {'lat_min': 10.5, 'lat_max': 11.1, 'lon_min': 78.75, 'lon_max': 79.5}},
        'Theni': {'lat': 10.01, 'lon': 77.48, 'bounds': {'lat_min': 9.65, 'lat_max': 10.35, 'lon_min': 77.1, 'lon_max': 77.85}},
        'Thirupathur': {'lat': 12.23, 'lon': 79.46, 'bounds': {'lat_min': 12.0, 'lat_max': 12.45, 'lon_min': 79.2, 'lon_max': 79.7}},
        'Thiruvannamalai': {'lat': 12.23, 'lon': 79.13, 'bounds': {'lat_min': 12.0, 'lat_max': 12.45, 'lon_min': 78.85, 'lon_max': 79.4}},
        'Tiruppur': {'lat': 11.11, 'lon': 77.35, 'bounds': {'lat_min': 10.8, 'lat_max': 11.4, 'lon_min': 77.0, 'lon_max': 77.7}},
        'Tiruvannamalai': {'lat': 12.23, 'lon': 79.13, 'bounds': {'lat_min': 12.0, 'lat_max': 12.45, 'lon_min': 78.85, 'lon_max': 79.4}},
        'Trichy': {'lat': 10.78, 'lon': 78.71, 'bounds': {'lat_min': 10.5, 'lat_max': 11.0, 'lon_min': 78.4, 'lon_max': 79.05}},
        'Vellore': {'lat': 12.97, 'lon': 79.13, 'bounds': {'lat_min': 12.75, 'lat_max': 13.2, 'lon_min': 78.85, 'lon_max': 79.4}},
        'Villupuram': {'lat': 12.96, 'lon': 79.50, 'bounds': {'lat_min': 12.7, 'lat_max': 13.2, 'lon_min': 79.2, 'lon_max': 79.8}},
        'Virudhunagar': {'lat': 9.59, 'lon': 77.96, 'bounds': {'lat_min': 9.25, 'lat_max': 9.95, 'lon_min': 77.55, 'lon_max': 78.45}},
        'Chennai': {'lat': 13.06, 'lon': 80.24, 'bounds': {'lat_min': 12.8, 'lat_max': 13.3, 'lon_min': 79.9, 'lon_max': 80.6}},
    }
    
    def __init__(self):
        self.nominatim_url = "https://nominatim.openstreetmap.org/reverse"
        self.request_count = 0
        self.cache = {}
    
    def _get_district_from_coords(self, lat: float, lon: float) -> Optional[str]:
        """Get district based on coordinates"""
        min_distance = float('inf')
        closest_district = None
        
        for district, info in self.DISTRICTS.items():
            bounds = info['bounds']
            # Check if in bounds
            if (bounds['lat_min'] <= lat <= bounds['lat_max'] and 
                bounds['lon_min'] <= lon <= bounds['lon_max']):
                return district
            
            # Calculate distance to center as backup
            lat_diff = abs(lat - info['lat'])
            lon_diff = abs(lon - info['lon'])
            distance = (lat_diff ** 2 + lon_diff ** 2) ** 0.5
            
            if distance < min_distance:
                min_distance = distance
                closest_district = district
        
        return closest_district if min_distance < 0.5 else None
    
    def _reverse_geocode(self, lat: float, lon: float) -> Optional[Dict]:
        """Reverse geocode coordinates using Nominatim"""
        cache_key = f"{lat:.4f},{lon:.4f}"
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # Rate limit to 1 request per second
            time.sleep(1)
            
            params = urllib.parse.urlencode({
                'lat': lat,
                'lon': lon,
                'format': 'json',
                'addressdetails': 1
            })
            
            url = f"{self.nominatim_url}?{params}"
            
            request = urllib.request.Request(url)
            request.add_header('User-Agent', 'PerundhuLocationEnhancer/1.0')
            
            with urllib.request.urlopen(request, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                self.request_count += 1
                if self.request_count % 100 == 0:
                    print(f"  📡 {self.request_count} geocoding requests made")
                
                self.cache[cache_key] = data
                return data
        except Exception as e:
            print(f"  ⚠️  Geocoding error for ({lat}, {lon}): {e}")
            return None
    
    def _extract_district_from_address(self, address: Dict) -> Optional[str]:
        """Extract district from address data"""
        address_data = address.get('address', {})
        
        # Try various keys that might contain district
        for key in ['county', 'district', 'administrative']:
            if key in address_data:
                value = address_data[key]
                # Check if it matches a known district
                for district in self.DISTRICTS.keys():
                    if district.lower() in value.lower():
                        return district
        
        return None
    
    def enhance_locations(self, input_file: str, output_file: str = None, 
                         use_geocoding: bool = False) -> str:
        """Enhance locations with district and state"""
        
        if output_file is None:
            output_file = input_file.replace('.json', '_enhanced.json')
        
        print(f"\n📍 Enhancing locations with district and state information")
        print(f"   Input: {input_file}")
        print(f"   Output: {output_file}")
        print(f"   Using geocoding: {use_geocoding}\n")
        
        # Load locations
        with open(input_file, 'r') as f:
            locations = json.load(f)
        
        print(f"📊 Processing {len(locations):,} locations...\n")
        
        enhanced = []
        geocoded = 0
        coordinate_mapped = 0
        failed = 0
        
        for i, loc in enumerate(locations):
            enhanced_loc = loc.copy()
            enhanced_loc['state'] = 'Tamil Nadu'
            district = None
            
            # Try coordinate-based mapping first (fast)
            district = self._get_district_from_coords(loc['latitude'], loc['longitude'])
            if district:
                coordinate_mapped += 1
            
            # Fallback to reverse geocoding if enabled
            if not district and use_geocoding:
                geo_data = self._reverse_geocode(loc['latitude'], loc['longitude'])
                if geo_data:
                    district = self._extract_district_from_address(geo_data)
                    if district:
                        geocoded += 1
            
            # If still no district, try to extract from location name
            if not district:
                name_lower = loc['name'].lower()
                for dist in self.DISTRICTS.keys():
                    if dist.lower() in name_lower:
                        district = dist
                        break
            
            if not district:
                district = 'Unknown'
                failed += 1
            
            enhanced_loc['district'] = district
            enhanced.append(enhanced_loc)
            
            # Progress indicator
            if (i + 1) % 5000 == 0:
                print(f"   ✅ {i+1:,}/{len(locations):,} processed")
        
        # Save enhanced data
        with open(output_file, 'w') as f:
            json.dump(enhanced, f, indent=2, ensure_ascii=False)
        
        # Print summary
        print(f"\n✅ Enhancement complete!")
        print(f"   • Coordinate-based mapping: {coordinate_mapped:,}")
        print(f"   • Reverse geocoding: {geocoded:,}")
        print(f"   • Failed to determine: {failed:,}")
        print(f"   • Success rate: {((len(locations)-failed)/len(locations)*100):.1f}%")
        
        return output_file
    
    def save_as_csv_enhanced(self, input_json: str, output_csv: str):
        """Save enhanced locations as CSV"""
        import csv
        
        print(f"\n💾 Saving as CSV: {output_csv}")
        
        with open(input_json, 'r') as f:
            locations = json.load(f)
        
        with open(output_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['name', 'type', 'latitude', 'longitude', 'district', 'state', 'osm_id'])
            writer.writeheader()
            writer.writerows(locations)
        
        print(f"✅ CSV saved: {output_csv}")


def main():
    """Main execution"""
    import sys
    
    print("=" * 70)
    print("📊 LOCATION ENHANCER - Add District & State Information")
    print("=" * 70)
    
    input_file = Path('/Users/mchand69/Documents/perundhu/data/tamil_nadu_locations.json')
    
    if not input_file.exists():
        print(f"\n❌ File not found: {input_file}")
        return 1
    
    enhancer = LocationEnhancer()
    
    # Option: use reverse geocoding (slower but more accurate)
    use_geocoding = False
    if len(sys.argv) > 1 and sys.argv[1] == '--geocoding':
        use_geocoding = True
        print("\n⚠️  WARNING: Reverse geocoding is slow (1 req/sec)")
        print("   Estimated time: ~11 hours for 41,116 locations")
        print("   Consider using coordinate mapping only (default)\n")
        response = input("Continue with geocoding? (y/n): ").lower()
        if response != 'y':
            use_geocoding = False
    
    # Enhance locations
    output_json = enhancer.enhance_locations(
        str(input_file),
        use_geocoding=use_geocoding
    )
    
    # Also save as CSV
    output_csv = output_json.replace('.json', '.csv')
    enhancer.save_as_csv_enhanced(output_json, output_csv)
    
    # Show sample
    print("\n📋 Sample enhanced records:\n")
    with open(output_json, 'r') as f:
        data = json.load(f)
        for loc in data[:3]:
            print(f"   • {loc['name']}")
            print(f"     District: {loc['district']}, State: {loc['state']}")
            print(f"     Type: {loc['type']}, Coords: ({loc['latitude']}, {loc['longitude']})\n")
    
    print("=" * 70)
    print(f"✅ COMPLETE!")
    print(f"   JSON: {output_json}")
    print(f"   CSV:  {output_csv}")
    print("=" * 70)
    
    return 0


if __name__ == '__main__':
    import urllib.parse
    exit(main())
