#!/usr/bin/env python3
"""
Delete all data from production database tables.
WARNING: This will delete ALL data - buses, stops, locations, translations, etc.
"""

import mysql.connector
import os
import sys
import argparse

def get_db_password():
    """Get database password from Secret Manager"""
    import subprocess
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        raise Exception(f"Failed to get password: {result.stderr}")
    return result.stdout.strip()

def cleanup_database(skip_confirmation=False):
    """Delete all data from production database"""
    
    print("⚠️  WARNING: About to delete ALL data from production database!")
    print("This will remove:")
    print("  - All buses")
    print("  - All stops")
    print("  - All locations")
    print("  - All translations")
    print("  - All route mappings")
    
    if not skip_confirmation:
        response = input("\nType 'DELETE ALL DATA' to confirm: ")
        if response != "DELETE ALL DATA":
            print("❌ Cleanup cancelled")
            return False
    else:
        print("\n✅ Confirmation skipped (--confirm flag used)")
    
    print("\n🔑 Getting database password from Secret Manager...")
    password = get_db_password()
    
    print("🔌 Connecting to production database...")
    connection = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu-admin',
        password=password,
        database='RECOVER_YOUR_DATA'
    )
    
    cursor = connection.cursor()
    
    try:
        # Disable foreign key checks to allow deletion
        print("\n🔓 Disabling foreign key checks...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        
        # List of tables to truncate (in order to respect dependencies)
        tables = [
            'bus_stops',
            'bus_routes', 
            'route_locations',
            'buses',
            'stops',
            'translations',
            'locations'
        ]
        
        for table in tables:
            print(f"🗑️  Deleting data from {table}...")
            cursor.execute(f"DELETE FROM {table}")
            deleted = cursor.rowcount
            print(f"   ✅ Deleted {deleted} rows from {table}")
        
        # Re-enable foreign key checks
        print("\n🔒 Re-enabling foreign key checks...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        
        # Commit the changes
        connection.commit()
        print("\n✅ All data deleted successfully!")
        
        # Show final counts
        print("\n📊 Final table counts:")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   {table}: {count} rows")
        
        return True
        
    except Exception as e:
        connection.rollback()
        print(f"\n❌ Error during cleanup: {e}")
        return False
    finally:
        cursor.close()
        connection.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Delete all data from production database")
    parser.add_argument("--confirm", action="store_true", help="Skip confirmation prompt")
    args = parser.parse_args()
    
    success = cleanup_database(skip_confirmation=args.confirm)
    sys.exit(0 if success else 1)
