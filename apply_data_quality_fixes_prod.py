#!/usr/bin/env python3
"""
Apply data quality fixes to PRODUCTION database:
1. Remove non-TN interstate locations (10 small villages)
2. Standardize district names (2,009 locations)

Requires Cloud SQL Proxy running on port 3306
"""
import mysql.connector
import subprocess
import sys
from typing import Dict, List, Tuple

def get_db_credentials():
    """Retrieve database credentials from Secret Manager"""
    print("🔐 Retrieving credentials from Secret Manager...")
    try:
        username = subprocess.check_output([
            'gcloud', 'secrets', 'versions', 'access', 'latest',
            '--secret=db-username',
            '--project=perundhu-prod-001'
        ], text=True).strip()
        
        password = subprocess.check_output([
            'gcloud', 'secrets', 'versions', 'access', 'latest',
            '--secret=db-password',
            '--project=perundhu-prod-001'
        ], text=True).strip()
        
        print("✅ Credentials retrieved")
        return username, password
    except subprocess.CalledProcessError as e:
        print(f"❌ Error retrieving credentials: {e}")
        sys.exit(1)


# District name standardization mapping
DISTRICT_NORMALIZATION = {
    'Trichy': 'Tiruchirappalli',
    'Kanniyakumari': 'Kanyakumari',
    'Thirupathur': 'Tirupathur',
    'Thiruvannamalai': 'Tiruvannamalai',
    'Villupuram': 'Viluppuram',
    'Nellai': 'Tirunelveli',
    'Tuticorin': 'Thoothukudi',
    'Dharmapuri': 'Dharmapuri',
}

# Locations to remove (identified as non-TN villages with misleading names)
LOCATIONS_TO_REMOVE = [
    'Hale Keralapura',
    'Kerala State Electricity Board',
    'Kerala State Road Transport Corperation, Mananthavadi',
    'Keraladhithyapuram',
    'Keralalusandra',
    'Keralapura',
    'Keralapuram',
    'Keralassery',
    'Raidco Kerala Ltd',
    'Veerakeralampudur',
]


def cleanup_interstate_locations(cursor, dry_run=True):
    """Remove non-TN locations identified in analysis"""
    print("\n" + "=" * 80)
    print("STEP 1: CLEANUP INTERSTATE LOCATIONS")
    print("=" * 80)
    
    removed_count = 0
    
    for name in LOCATIONS_TO_REMOVE:
        # Check if location exists
        cursor.execute("SELECT id, name, district FROM locations WHERE name = %s", (name,))
        result = cursor.fetchone()
        
        if result:
            loc_id, loc_name, district = result
            
            # Check if it's used by any routes
            cursor.execute("SELECT COUNT(*) FROM stops WHERE location_id = %s", (loc_id,))
            stop_count = cursor.fetchone()[0]
            
            if stop_count > 0:
                print(f"  ⚠️  Skipping '{loc_name}' - used by {stop_count} stops")
            else:
                print(f"  {'[DRY RUN]' if dry_run else '✅'} Remove: {loc_name} ({district or 'Unknown'})")
                
                if not dry_run:
                    # Delete translations first (foreign key)
                    cursor.execute(
                        "DELETE FROM translations WHERE entity_type = 'location' AND entity_id = %s",
                        (loc_id,)
                    )
                    # Delete location
                    cursor.execute("DELETE FROM locations WHERE id = %s", (loc_id,))
                    removed_count += 1
        else:
            print(f"  ℹ️  '{name}' - not found (already cleaned?)")
    
    if not dry_run and removed_count > 0:
        print(f"\n  ✅ Removed {removed_count} non-TN locations")
    elif removed_count > 0:
        print(f"\n  🔍 DRY RUN - Would remove {removed_count} locations")
    
    return removed_count


def standardize_district_names(cursor, dry_run=True):
    """Standardize district names to official Tamil Nadu names"""
    print("\n" + "=" * 80)
    print("STEP 2: STANDARDIZE DISTRICT NAMES")
    print("=" * 80)
    
    total_updated = 0
    
    for old_name, official_name in DISTRICT_NORMALIZATION.items():
        cursor.execute("SELECT COUNT(*) FROM locations WHERE district = %s", (old_name,))
        count = cursor.fetchone()[0]
        
        if count > 0:
            print(f"  {'[DRY RUN]' if dry_run else '✅'} '{old_name}' → '{official_name}' ({count} locations)")
            
            if not dry_run:
                cursor.execute(
                    "UPDATE locations SET district = %s WHERE district = %s",
                    (official_name, old_name)
                )
                total_updated += count
    
    if not dry_run and total_updated > 0:
        print(f"\n  ✅ Updated {total_updated} locations with standardized district names")
    elif total_updated > 0:
        print(f"\n  🔍 DRY RUN - Would update {total_updated} locations")
    
    return total_updated


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Apply data quality fixes to production database',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Prerequisites:
  1. Cloud SQL Proxy must be running:
     ./cloud_sql_proxy -instances=perundhu-prod-001:us-central1:perundhu-production-mysql-us=tcp:3307
  
  2. Authenticated with gcloud:
     gcloud auth application-default login --project perundhu-prod-001

Examples:
  # Preview changes (safe - no changes made)
  python3 apply_data_quality_fixes_prod.py
  
  # Apply fixes to production
  python3 apply_data_quality_fixes_prod.py --execute
        """
    )
    
    parser.add_argument('--execute', action='store_true',
                        help='Execute fixes (default is dry-run)')
    
    args = parser.parse_args()
    
    print("=" * 80)
    print(f"DATA QUALITY FIXES - PRODUCTION - {'EXECUTING' if args.execute else 'DRY RUN'}")
    print("=" * 80)
    print()
    
    # Get credentials
    db_user, db_password = get_db_credentials()
    
    # Connect to database via Cloud SQL Proxy
    print("🔗 Connecting to production database via Cloud SQL Proxy...")
    print("   Host: 127.0.0.1:3307")
    print("   Database: perundhu")
    print()
    
    try:
        conn = mysql.connector.connect(
            host='127.0.0.1',
            port=3307,
            user=db_user,
            password=db_password,
            database='perundhu',
            charset='utf8mb4'
        )
        
        cursor = conn.cursor()
        print("✅ Connected to production database")
        
        # Step 1: Cleanup interstate locations
        removed = cleanup_interstate_locations(cursor, dry_run=not args.execute)
        
        # Step 2: Standardize district names
        updated = standardize_district_names(cursor, dry_run=not args.execute)
        
        # Commit if executing
        if args.execute:
            if removed > 0 or updated > 0:
                print("\n💾 Committing changes to production...")
                conn.commit()
                print("✅ Changes committed successfully")
            else:
                print("\nℹ️  No changes to commit")
        
        cursor.close()
        conn.close()
        
        # Summary
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Interstate locations removed: {removed}")
        print(f"District names standardized:  {updated}")
        
        if args.execute:
            print("\n✅ Production database updated successfully!")
        else:
            print("\n🔍 DRY RUN - No changes made to production")
            print("    Run with --execute flag to apply changes")
        
        print("=" * 80)
        
    except mysql.connector.Error as e:
        print(f"\n❌ Database Error: {e}")
        print("\nTroubleshooting:")
        print("  1. Ensure Cloud SQL Proxy is running:")
        print("     ./cloud_sql_proxy -instances=perundhu-prod-001:us-central1:perundhu-production-mysql-us=tcp:3307")
        print("  2. Check gcloud authentication:")
        print("     gcloud auth application-default login --project perundhu-prod-001")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
