#!/usr/bin/env python3
"""
Interactive Location Deduplication Runner
Prompts for database password and runs analysis
"""

import sys
import os
import getpass

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(__file__))

def main():
    print("=" * 60)
    print("Location Deduplication Analysis")
    print("=" * 60)
    print()
    
    # Get database password
    db_password = getpass.getpass("Enter database password: ")
    
    if not db_password:
        print("❌ Password is required")
        sys.exit(1)
    
    # Set environment variables
    os.environ['DB_HOST'] = '127.0.0.1'
    os.environ['DB_PORT'] = '3307'  # Cloud SQL Proxy port
    os.environ['DB_USER'] = 'perundhu_user'
    os.environ['DB_PASSWORD'] = db_password
    os.environ['DB_NAME'] = 'perundhu'
    
    print()
    print("Connecting to database via Cloud SQL Proxy...")
    print(f"Host: {os.environ['DB_HOST']}:{os.environ['DB_PORT']}")
    print(f"Database: {os.environ['DB_NAME']}")
    print()
    
    # Import and run deduplicator
    try:
        # Import here after environment is set
        import mysql.connector
        
        # Import the deduplicator class
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "deduplicate_locations",
            os.path.join(os.path.dirname(__file__), "deduplicate-locations.py")
        )
        deduplicate_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(deduplicate_module)
        LocationDeduplicator = deduplicate_module.LocationDeduplicator
        
        deduplicator = LocationDeduplicator()
        deduplicator.connect()
        
        # Get duplicates
        print("\n📊 Analyzing database for duplicates...")
        duplicates = deduplicator.get_duplicate_locations()
        
        if not duplicates:
            print("✅ No exact duplicates found!")
        else:
            print(f"\n⚠️  Found {len(duplicates)} location names with duplicates:\n")
            for dup in duplicates[:20]:  # Show first 20
                actual_names = dup['names'].split(',') if 'names' in dup else [dup.get('name_lower', 'Unknown')]
                display_name = actual_names[0] if actual_names else dup.get('name_lower', 'Unknown')
                print(f"  • {display_name}: {dup['count']}x (IDs: {dup.get('ids', 'N/A')[:50]}...)")
            
            if len(duplicates) > 20:
                print(f"  ... and {len(duplicates) - 20} more")
        
        # Get fuzzy duplicates
        print("\n🔍 Searching for fuzzy duplicates (similar names)...")
        fuzzy_dups = deduplicator.get_similar_locations(threshold=0.9)
        
        if fuzzy_dups:
            print(f"\n⚠️  Found {len(fuzzy_dups)} fuzzy duplicate groups:\n")
            for group in fuzzy_dups[:10]:  # Show first 10 groups
                print(f"\n  Similar locations:")
                for loc in group:
                    print(f"    • {loc['name']} (ID: {loc['id']}, coords: {loc['latitude']:.4f}, {loc['longitude']:.4f})")
            
            if len(fuzzy_dups) > 10:
                print(f"\n  ... and {len(fuzzy_dups) - 10} more groups")
        
        # Print summary
        print("\n" + "=" * 60)
        deduplicator.print_summary()
        print("=" * 60)
        
        deduplicator.disconnect()
        
        print("\n✅ Analysis complete!")
        print("\nNext steps:")
        print("  1. Review the duplicates above")
        print("  2. Run enhanced-fetch-locations.py to regenerate clean data")
        print("  3. Apply the generated migration file")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("\nMake sure mysql-connector-python is installed:")
        print("  pip install mysql-connector-python")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
