#!/usr/bin/env python3

"""
Enhanced Location Deduplication & Formatting Script
Removes duplicates and formats location names properly
Supports city/town + bus stand naming convention
"""

import mysql.connector
from typing import List, Dict, Tuple, Optional
from pathlib import Path
import sys
import re
from difflib import SequenceMatcher

class LocationDeduplicator:
    """Deduplicate and format locations with proper bus stand naming"""
    
    def __init__(self, db_config: Dict = None):
        """Initialize database connection"""
        self.db_config = db_config or self._get_db_config()
        self.conn = None
        self.cursor = None
    
    def _get_db_config(self) -> Dict:
        """Get database config from environment or defaults"""
        import os
        return {
            'host': os.getenv('DB_HOST', '127.0.0.1'),
            'user': os.getenv('DB_USER', 'perundhu_user'),
            'password': os.getenv('DB_PASSWORD', 'perundhu_password'),
            'database': os.getenv('DB_NAME', 'perundhu'),
            'port': int(os.getenv('DB_PORT', '3307'))  # Cloud SQL Proxy port
        }
    
    def _normalize_name(self, name: str) -> str:
        """Normalize location name for deduplication"""
        name = ' '.join(name.split())
        
        # Standardize bus-related keywords
        name = re.sub(r'bus\s+stop', 'bus stop', name, flags=re.IGNORECASE)
        name = re.sub(r'bus\s+station', 'bus station', name, flags=re.IGNORECASE)
        name = re.sub(r'bus\s+stand', 'bus stand', name, flags=re.IGNORECASE)
        name = re.sub(r'bus\s+terminal', 'bus terminal', name, flags=re.IGNORECASE)
        name = re.sub(r'bus\s+port', 'bus port', name, flags=re.IGNORECASE)
        name = re.sub(r'bus\s+garage', 'bus garage', name, flags=re.IGNORECASE)
        name = re.sub(r'mtc\s+terminus', 'mtc terminus', name, flags=re.IGNORECASE)
        name = re.sub(r'kkbt|kaliamman\s+karikkal\s+bhagavathi\s+temple', 'central bus terminal', name, flags=re.IGNORECASE)
        
        # Remove common abbreviations and prefixes
        name = re.sub(r'^(m\.g\.r|cmbt|dr\.)\s+', '', name, flags=re.IGNORECASE)
        
        # Remove common suffixes
        name = re.sub(r'\s+(bus\s+(stop|stand|station|terminal|port))\s*$', '', name, flags=re.IGNORECASE)
        
        # Handle modifiers
        name = re.sub(r'\s+(old|new|central|main)\s+bus', ' bus', name, flags=re.IGNORECASE)
        
        # Remove trailing punctuation
        name = re.sub(r'[,\-\.\s]+$', '', name).strip()
        
        return name.lower()
    
    def _extract_city_from_name(self, name: str) -> Optional[str]:
        """Extract city name from location string"""
        patterns = [
            r'^([A-Za-z\s]+?)\s*-\s*',
            r'^([A-Za-z\s]+?)\s+(central|old|new|main)\s+bus',
            r'^([A-Za-z\s]+?)\s+bus\s+(stand|station|stop|port|terminal)',
        ]
        
        for pattern in patterns:
            match = re.match(pattern, name, re.IGNORECASE)
            if match:
                return match.group(1).strip().lower()
        
        return None
    
    def connect(self):
        """Connect to database"""
        try:
            self.conn = mysql.connector.connect(**self.db_config)
            self.cursor = self.conn.cursor(dictionary=True)
            print("✅ Connected to database")
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
            sys.exit(1)
    
    def disconnect(self):
        """Disconnect from database"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
    
    def get_duplicate_locations(self) -> List[Dict]:
        """Find duplicate locations in database"""
        query = """
        SELECT 
            LOWER(name) as name_lower,
            COUNT(*) as count,
            GROUP_CONCAT(DISTINCT name ORDER BY name) as names,
            GROUP_CONCAT(DISTINCT id ORDER BY id) as ids,
            GROUP_CONCAT(DISTINCT type ORDER BY type) as types,
            ROUND(AVG(latitude), 6) as avg_lat,
            ROUND(AVG(longitude), 6) as avg_lon
        FROM locations
        GROUP BY LOWER(name)
        HAVING COUNT(*) > 1
        ORDER BY count DESC, name_lower
        """
        self.cursor.execute(query)
        return self.cursor.fetchall()
    
    def get_similar_locations(self, threshold: float = 0.85) -> List[Tuple]:
        """Find locations with similar names (likely duplicates)"""
        query = """
        SELECT 
            l1.id as id1,
            l1.name as name1,
            l1.type as type1,
            l1.latitude as lat1,
            l1.longitude as lon1,
            l2.id as id2,
            l2.name as name2,
            l2.type as type2,
            l2.latitude as lat2,
            l2.longitude as lon2,
            LEVENSHTEIN(LOWER(l1.name), LOWER(l2.name)) as distance
        FROM locations l1
        JOIN locations l2 ON l1.id < l2.id
        WHERE LEVENSHTEIN(LOWER(l1.name), LOWER(l2.name)) <= 3
        AND ABS(l1.latitude - l2.latitude) < 0.01
        AND ABS(l1.longitude - l2.longitude) < 0.01
        ORDER BY l1.name, distance
        LIMIT 100
        """
        try:
            self.cursor.execute(query)
            return self.cursor.fetchall()
        except:
            # LEVENSHTEIN may not be available, use simpler approach
            return self._find_fuzzy_duplicates()
    
    def _find_fuzzy_duplicates(self) -> List[Tuple]:
        """Find fuzzy duplicates using improved normalization"""
        from difflib import SequenceMatcher
        
        query = "SELECT id, name, type, latitude, longitude FROM locations ORDER BY name"
        self.cursor.execute(query)
        all_locs = self.cursor.fetchall()
        
        duplicates = []
        for i, loc1 in enumerate(all_locs):
            for loc2 in all_locs[i+1:]:
                # Normalize names
                norm1 = self._normalize_name(loc1['name'])
                norm2 = self._normalize_name(loc2['name'])
                
                # Check exact match on normalized names
                if norm1 == norm2:
                    lat_diff = abs(loc1['latitude'] - loc2['latitude'])
                    lon_diff = abs(loc1['longitude'] - loc2['longitude'])
                    
                    if lat_diff < 0.01 and lon_diff < 0.01:
                        duplicates.append({
                            'id1': loc1['id'],
                            'name1': loc1['name'],
                            'type1': loc1['type'],
                            'id2': loc2['id'],
                            'name2': loc2['name'],
                            'type2': loc2['type'],
                            'similarity': 1.0,
                            'lat1': loc1['latitude'],
                            'lon1': loc1['longitude'],
                            'lat2': loc2['latitude'],
                            'lon2': loc2['longitude'],
                            'reason': 'normalized_match'
                        })
                        continue
                
                # Extract cities
                city1 = self._extract_city_from_name(loc1['name'])
                city2 = self._extract_city_from_name(loc2['name'])
                
                # Check if same city bus stands
                if city1 and city2 and city1 == city2:
                    # Fuzzy match for same city locations
                    similarity = SequenceMatcher(None, norm1, norm2).ratio()
                    lat_diff = abs(loc1['latitude'] - loc2['latitude'])
                    lon_diff = abs(loc1['longitude'] - loc2['longitude'])
                    
                    if similarity > 0.75 and lat_diff < 0.01 and lon_diff < 0.01:
                        duplicates.append({
                            'id1': loc1['id'],
                            'name1': loc1['name'],
                            'type1': loc1['type'],
                            'id2': loc2['id'],
                            'name2': loc2['name'],
                            'type2': loc2['type'],
                            'similarity': similarity,
                            'lat1': loc1['latitude'],
                            'lon1': loc1['longitude'],
                            'lat2': loc2['latitude'],
                            'lon2': loc2['longitude'],
                            'reason': f'same_city_match ({city1})'
                        })
                        continue
                
                # General fuzzy match
                similarity = SequenceMatcher(None, norm1, norm2).ratio()
                lat_diff = abs(loc1['latitude'] - loc2['latitude'])
                lon_diff = abs(loc1['longitude'] - loc2['longitude'])
                
                if similarity > 0.85 and lat_diff < 0.005 and lon_diff < 0.005:
                    duplicates.append({
                        'id1': loc1['id'],
                        'name1': loc1['name'],
                        'type1': loc1['type'],
                        'id2': loc2['id'],
                        'name2': loc2['name'],
                        'type2': loc2['type'],
                        'similarity': similarity,
                        'lat1': loc1['latitude'],
                        'lon1': loc1['longitude'],
                        'lat2': loc2['latitude'],
                        'lon2': loc2['longitude'],
                        'reason': 'fuzzy_match'
                    })
        
        return duplicates
    
    def format_location_name(self, location: Dict) -> str:
        """
        Format location name with proper bus stand naming convention.
        
        Examples:
        - City + Bus Stand: "Madurai - Periyar Bus Stand", "Madurai - Mattuthavani Bus Stand"
        - Town: "Sivakasi", "Tiruppur"
        - Village: "Kamakshi Village" or just name
        - Bus Stop: Name as-is or with "Bus Stop" suffix
        """
        name = location.get('name', '').strip()
        loc_type = location.get('type', '').lower()
        
        # If already properly formatted, return as-is
        if ' - ' in name or 'Bus Stand' in name or 'Bus Stop' in name:
            return name
        
        # Bus stop/station formatting
        if loc_type in ['bus_stop', 'bus_station']:
            # If it looks like a proper bus station name, keep it
            if any(word in name for word in ['Bus', 'Terminus', 'Stand', 'Station', 'Stop']):
                return name
            # Otherwise add "Bus Stop" suffix
            return f"{name} Bus Stop"
        
        # Village formatting
        if loc_type == 'village' and 'village' not in name.lower():
            return f"{name}"  # Keep simple, but could add "Village" if needed
        
        # City/Town: will be combined with bus stand name in separate logic
        return name
    
    def merge_duplicate_locations(self, keep_id: int, merge_ids: List[int], merged_name: str = None):
        """
        Merge duplicate locations into one, keeping the specified ID.
        Deletes the merge_ids.
        """
        if not merge_ids:
            return
        
        try:
            # Get the location to keep
            query = "SELECT * FROM locations WHERE id = %s"
            self.cursor.execute(query, (keep_id,))
            keep_loc = self.cursor.fetchone()
            
            if not keep_loc:
                print(f"❌ Location {keep_id} not found")
                return
            
            # Update the name if provided
            if merged_name:
                update_query = "UPDATE locations SET name = %s WHERE id = %s"
                self.cursor.execute(update_query, (merged_name, keep_id))
                print(f"✅ Updated name: {merged_name} (ID: {keep_id})")
            
            # Remap foreign keys from merge_ids to keep_id
            tables_to_update = [
                ('buses', 'from_location_id'),
                ('buses', 'to_location_id'),
                ('stops', 'location_id'),
                ('connecting_routes', 'connection_point_id')
            ]
            
            for table, column in tables_to_update:
                for merge_id in merge_ids:
                    update_query = f"UPDATE {table} SET {column} = %s WHERE {column} = %s"
                    self.cursor.execute(update_query, (keep_id, merge_id))
                    affected = self.cursor.rowcount
                    if affected > 0:
                        print(f"   - Updated {affected} rows in {table}.{column}")
            
            # Delete the merged locations
            placeholders = ','.join(['%s'] * len(merge_ids))
            delete_query = f"DELETE FROM locations WHERE id IN ({placeholders})"
            self.cursor.execute(delete_query, merge_ids)
            affected = self.cursor.rowcount
            
            self.conn.commit()
            print(f"✅ Deleted {affected} duplicate locations")
            
        except Exception as e:
            self.conn.rollback()
            print(f"❌ Error merging locations: {e}")
    
    def deduplicate_all(self) -> Dict:
        """Find and report all duplicates"""
        print("\n" + "="*70)
        print("🔍 SCANNING FOR DUPLICATE LOCATIONS")
        print("="*70 + "\n")
        
        # First find exact duplicates
        exact_duplicates = self.get_duplicate_locations()
        
        # Then find fuzzy duplicates
        fuzzy_duplicates = self.get_similar_locations()
        
        all_dups = exact_duplicates or []
        
        if not all_dups and not fuzzy_duplicates:
            print("✅ No exact duplicates found")
        else:
            if exact_duplicates:
                print(f"Found {len(exact_duplicates)} exact duplicate location names:\n")
                for dup in exact_duplicates:
                    print(f"📍 {dup['name']} (x{dup['count']})")
                    print(f"   Type: {dup['type']}")
                    print(f"   Coordinates: ({dup['latitude']}, {dup['longitude']})")
                    
                    query = """
                    SELECT id, name, type, created_at FROM locations
                    WHERE LOWER(name) = LOWER(%s)
                    AND latitude = %s AND longitude = %s
                    ORDER BY created_at
                    """
                    self.cursor.execute(query, (dup['name'], dup['latitude'], dup['longitude']))
                    instances = self.cursor.fetchall()
                    
                    for i, inst in enumerate(instances):
                        mark = "🔴 DELETE" if i > 0 else "✅ KEEP"
                        print(f"   {mark}: ID {inst['id']} (created: {inst['created_at']})")
                    
                    print()
        
        if fuzzy_duplicates:
            print(f"\nFound {len(fuzzy_duplicates)} fuzzy duplicate pairs:\n")
            
            shown = set()
            for dup in fuzzy_duplicates:
                pair_id = tuple(sorted([dup['id1'], dup['id2']]))
                if pair_id in shown:
                    continue
                shown.add(pair_id)
                
                reason = dup.get('reason', 'similar_names')
                similarity = dup.get('similarity', 0)
                
                print(f"📍 Potential Duplicate [Reason: {reason}] ({similarity:.1%} similar)")
                print(f"   ID {dup['id1']}: {dup['name1']} ({dup['type1']})")
                print(f"   ID {dup['id2']}: {dup['name2']} ({dup['type2']})")
                print(f"   Coords: ({dup['lat1']:.4f}, {dup['lon1']:.4f}) vs ({dup['lat2']:.4f}, {dup['lon2']:.4f})")
                print()
        
        result = {}
        for dup in all_dups:
            result[dup['name']] = []
        
        return result
    
    def create_deduplication_migration(self, duplicates: Dict) -> str:
        """Create SQL migration to deduplicate"""
        sql_lines = [
            "-- Deduplication Migration",
            "-- Removes duplicate locations, keeping the oldest instance",
            "",
            "SET FOREIGN_KEY_CHECKS=0;",
            ""
        ]
        
        delete_ids = []
        for location_name, instances in duplicates.items():
            if len(instances) > 1:
                # Keep the first (oldest), delete the rest
                for inst in instances[1:]:
                    delete_ids.append(inst['id'])
        
        if delete_ids:
            placeholders = ','.join([str(id) for id in delete_ids])
            sql_lines.append(f"DELETE FROM locations WHERE id IN ({placeholders});")
            sql_lines.append("")
        
        sql_lines.append("SET FOREIGN_KEY_CHECKS=1;")
        
        return '\n'.join(sql_lines)
    
    def generate_tamil_translations(self) -> str:
        """Generate SQL for Tamil translations of locations"""
        # Common Tamil translations for location types
        tamil_names = {
            'Chennai': 'சென்னை',
            'Madurai': 'மதுரை',
            'Coimbatore': 'கோவை',
            'Trichy': 'திருச்சி',
            'Salem': 'சேலம்',
            'Erode': 'ஈரோடு',
            'Tiruppur': 'திருப்பூர்',
            'Nagercoil': 'நாகர்கோவில்',
            'Vellore': 'வேலூர்',
            'Kanchipuram': 'காஞ்சிபுரம்',
            'Sivakasi': 'சிவகாசி',
            'Kumbakonam': 'குंभகோணம்',
            'Villupuram': 'விழுப்புரம்',
            'Ranipet': 'ராணிப்பேட்',
            'Ariyalur': 'அரியலூர்',
            'Perambalur': 'பெரம்பலூர்',
        }
        
        sql_lines = [
            "-- Tamil Translations for Locations",
            "-- Adding Tamil names for major cities and towns",
            "",
            "INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value) VALUES"
        ]
        
        values = []
        for english_name, tamil_name in tamil_names.items():
            query = """
            SELECT id FROM locations 
            WHERE name = %s AND type IN ('city', 'town')
            LIMIT 1
            """
            self.cursor.execute(query, (english_name,))
            result = self.cursor.fetchone()
            
            if result:
                entity_id = result['id']
                tamil_name_escaped = tamil_name.replace("'", "''")
                values.append(f"('location', {entity_id}, 'ta', 'name', '{tamil_name_escaped}')")
        
        if values:
            sql_lines.append(",\n".join(values))
            sql_lines.append(";")
        
        return '\n'.join(sql_lines)
    
    def print_summary(self):
        """Print database summary"""
        query = """
        SELECT 
            type,
            COUNT(*) as count,
            GROUP_CONCAT(DISTINCT district) as districts
        FROM locations
        GROUP BY type
        ORDER BY count DESC
        """
        self.cursor.execute(query)
        results = self.cursor.fetchall()
        
        print("\n" + "="*70)
        print("📊 LOCATION DATABASE SUMMARY")
        print("="*70 + "\n")
        
        total = 0
        for row in results:
            count = row['count']
            total += count
            print(f"{row['type']:20} : {count:5} locations")
        
        print(f"\n{'TOTAL':20} : {total:5} locations")
        
        # Check for potential duplicates (by name only, different coords)
        query = """
        SELECT name, COUNT(*) as count FROM locations
        GROUP BY LOWER(name)
        HAVING count > 1
        """
        self.cursor.execute(query)
        name_dupes = self.cursor.fetchall()
        
        if name_dupes:
            print(f"\n⚠️  {len(name_dupes)} location names appear multiple times")
            print("    (might be different coordinates or different locations with same name)")
        
        print("\n")

def main():
    """Main execution"""
    dedup = LocationDeduplicator()
    
    try:
        dedup.connect()
        
        # Find and report duplicates
        duplicates = dedup.deduplicate_all()
        
        # Print summary
        dedup.print_summary()
        
        if duplicates:
            print("\n" + "="*70)
            print("⚙️ READY TO DEDUPLICATE")
            print("="*70)
            print("\nRun this to create deduplication migration:")
            print(f"   Number of locations to delete: {sum(len(v)-1 for v in duplicates.values())}")
            
            migration_sql = dedup.create_deduplication_migration(duplicates)
            print("\nGenerated SQL:")
            print(migration_sql)
        
        # Generate Tamil translations
        tamil_sql = dedup.generate_tamil_translations()
        if tamil_sql:
            print("\n" + "="*70)
            print("🇮🇳 TAMIL TRANSLATIONS")
            print("="*70)
            print(tamil_sql)
    
    finally:
        dedup.disconnect()

if __name__ == '__main__':
    main()
