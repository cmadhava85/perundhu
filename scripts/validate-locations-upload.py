#!/usr/bin/env python3

"""
Post-Upload Location Validation Script
Validates data integrity after locations upload
"""

import mysql.connector
from typing import Dict, List, Tuple
import sys

class LocationUploadValidator:
    """Validate locations upload integrity"""
    
    def __init__(self, db_config: Dict = None):
        """Initialize database connection"""
        self.db_config = db_config or self._get_db_config()
        self.conn = None
        self.cursor = None
        self.issues = []
        self.warnings = []
    
    def _get_db_config(self) -> Dict:
        """Get database config from environment or defaults"""
        import os
        return {
            'host': os.getenv('DB_HOST', '127.0.0.1'),
            'user': os.getenv('DB_USER', 'perundhu_user'),
            'password': os.getenv('DB_PASSWORD', 'perundhu_password'),
            'database': os.getenv('DB_NAME', 'perundhu'),
            'port': int(os.getenv('DB_PORT', '3307'))
        }
    
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
    
    def validate_coordinates(self) -> bool:
        """Check all coordinates are within Tamil Nadu bounds"""
        print("\n📍 Validating coordinates...")
        
        query = """
        SELECT COUNT(*) as count FROM locations 
        WHERE latitude < 8.0 OR latitude > 13.5 
           OR longitude < 76.0 OR longitude > 80.5
        """
        self.cursor.execute(query)
        result = self.cursor.fetchone()
        
        invalid_count = result['count']
        if invalid_count > 0:
            self.issues.append(f"❌ {invalid_count} locations have invalid coordinates (outside Tamil Nadu bounds)")
            return False
        
        print("✅ All coordinates are within valid Tamil Nadu bounds")
        return True
    
    def validate_names(self) -> bool:
        """Check for empty or invalid names"""
        print("\n📝 Validating location names...")
        
        query = "SELECT COUNT(*) as count FROM locations WHERE name IS NULL OR TRIM(name) = ''"
        self.cursor.execute(query)
        result = self.cursor.fetchone()
        
        blank_count = result['count']
        if blank_count > 0:
            self.issues.append(f"❌ {blank_count} locations have blank names")
            return False
        
        print("✅ All locations have valid names")
        return True
    
    def validate_foreign_keys(self) -> bool:
        """Check for orphaned foreign key references"""
        print("\n🔗 Validating foreign key references...")
        
        queries = [
            ("buses", "from_location_id", "SELECT COUNT(*) as count FROM buses WHERE from_location_id NOT IN (SELECT id FROM locations)"),
            ("buses", "to_location_id", "SELECT COUNT(*) as count FROM buses WHERE to_location_id NOT IN (SELECT id FROM locations)"),
            ("stops", "location_id", "SELECT COUNT(*) as count FROM stops WHERE location_id NOT IN (SELECT id FROM locations)"),
        ]
        
        all_valid = True
        for table, column, query in queries:
            self.cursor.execute(query)
            result = self.cursor.fetchone()
            orphaned = result['count']
            
            if orphaned > 0:
                self.issues.append(f"❌ {orphaned} orphaned records in {table}.{column}")
                all_valid = False
            else:
                print(f"✅ {table}.{column}: All references valid")
        
        return all_valid
    
    def check_duplicates(self) -> bool:
        """Check for duplicate locations"""
        print("\n🔍 Checking for duplicates...")
        
        query = """
        SELECT name, COUNT(*) as dup_count FROM locations 
        GROUP BY LOWER(name) HAVING COUNT(*) > 1 
        ORDER BY dup_count DESC
        """
        self.cursor.execute(query)
        duplicates = self.cursor.fetchall()
        
        if duplicates:
            self.warnings.append(f"⚠️  Found {len(duplicates)} duplicate location names:")
            for dup in duplicates[:10]:
                self.warnings.append(f"   - '{dup['name']}' appears {dup['dup_count']} times")
            if len(duplicates) > 10:
                self.warnings.append(f"   ... and {len(duplicates)-10} more")
            return False
        
        print("✅ No duplicate locations found")
        return True
    
    def check_data_distribution(self):
        """Show data distribution by type"""
        print("\n📊 Data distribution by location type:")
        
        query = """
        SELECT type, COUNT(*) as count FROM locations 
        GROUP BY type ORDER BY count DESC
        """
        self.cursor.execute(query)
        results = self.cursor.fetchall()
        
        total = 0
        for row in results:
            count = row['count']
            total += count
            print(f"   {row['type'].replace('_', ' ').title():20} : {count:6} locations")
        
        print(f"   {'TOTAL':20} : {total:6} locations")
    
    def check_location_coverage(self):
        """Show coverage of major cities"""
        print("\n🏙️  Coverage of major cities:")
        
        major_cities = [
            'Chennai', 'Madurai', 'Coimbatore', 'Trichy', 'Salem',
            'Erode', 'Tiruppur', 'Nagercoil', 'Vellore', 'Kanchipuram'
        ]
        
        for city in major_cities:
            query = "SELECT COUNT(*) as count FROM locations WHERE name LIKE %s"
            self.cursor.execute(query, (f"%{city}%",))
            result = self.cursor.fetchone()
            count = result['count']
            
            if count > 0:
                print(f"   ✅ {city:20} : {count:3} locations")
            else:
                self.warnings.append(f"⚠️  No locations found for {city}")
                print(f"   ❌ {city:20} : {count:3} locations")
    
    def validate_all(self) -> bool:
        """Run all validations"""
        print("\n" + "="*70)
        print("🧪 LOCATION UPLOAD VALIDATION")
        print("="*70)
        
        try:
            self.connect()
            
            # Run validations
            coord_valid = self.validate_coordinates()
            names_valid = self.validate_names()
            fk_valid = self.validate_foreign_keys()
            dup_valid = self.check_duplicates()
            
            # Show distribution
            self.check_data_distribution()
            self.check_location_coverage()
            
            # Print summary
            print("\n" + "="*70)
            if self.issues:
                print("❌ VALIDATION FAILED - CRITICAL ISSUES FOUND:")
                for issue in self.issues:
                    print(f"   {issue}")
                print("="*70)
                return False
            
            if self.warnings:
                print("⚠️  VALIDATION PASSED - WITH WARNINGS:")
                for warning in self.warnings:
                    print(f"   {warning}")
            else:
                print("✅ VALIDATION PASSED - ALL CHECKS SUCCESSFUL!")
            
            print("="*70)
            return True
        
        finally:
            self.disconnect()

def main():
    """Main execution"""
    validator = LocationUploadValidator()
    success = validator.validate_all()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
