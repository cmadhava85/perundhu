#!/usr/bin/env python3
"""
Complete location cleanup: Remove unused AND deduplicate.
1. Removes locations with no bus routes
2. For duplicate names, keeps only the one with most routes
"""

import mysql.connector
import sys
import argparse
import subprocess

def get_db_password(project_id):
    """Get database password from Secret Manager"""
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', 
         '--secret=db-password', f'--project={project_id}'],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise Exception(f"Failed to get password: {result.stderr}")
    return result.stdout.strip()

def cleanup_and_deduplicate(skip_confirmation=False, environment='production'):
    """Remove unused locations and deduplicate by name"""
    
    # Environment configuration
    env_config = {
        'production': {
            'project_id': 'perundhu-prod-001',
            'db_name': 'RECOVER_YOUR_DATA'
        },
        'preprod': {
            'project_id': 'astute-strategy-406601',
            'db_name': 'perundhu'
        }
    }
    
    if environment not in env_config:
        raise ValueError(f"Invalid environment: {environment}")
    
    config = env_config[environment]
    
    print(f"🔍 Complete cleanup for {environment} database...")
    print(f"   1. Remove locations with no routes")
    print(f"   2. Deduplicate locations (keep one with most routes)")
    
    print("\n🔑 Getting database password...")
    password = get_db_password(config['project_id'])
    
    print(f"🔌 Connecting to {environment} database...")
    connection = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=password,
        database=config['db_name'],
        auth_plugin='mysql_native_password'
    )
    
    cursor = connection.cursor()
    
    try:
        # Get initial counts
        cursor.execute("SELECT COUNT(*) FROM locations")
        initial_count = cursor.fetchone()[0]
        print(f"\n📊 Initial location count: {initial_count}")
        
        # STEP 1: Find and delete locations with NO routes
        print("\n" + "="*80)
        print("STEP 1: Removing locations with no routes")
        print("="*80)
        
        cursor.execute("""
            SELECT COUNT(*)
            FROM locations l
            WHERE NOT EXISTS (
                SELECT 1 FROM buses b 
                WHERE b.from_location_id = l.id OR b.to_location_id = l.id
            )
            AND NOT EXISTS (
                SELECT 1 FROM stops s
                WHERE s.location_id = l.id
            )
        """)
        unused_count = cursor.fetchone()[0]
        print(f"   Locations with no routes: {unused_count}")
        
        if unused_count > 0:
            cursor.execute("""
                DELETE FROM locations
                WHERE NOT EXISTS (
                    SELECT 1 FROM buses b 
                    WHERE b.from_location_id = locations.id OR b.to_location_id = locations.id
                )
                AND NOT EXISTS (
                    SELECT 1 FROM stops s
                    WHERE s.location_id = locations.id
                )
            """)
            print(f"   ✅ Deleted {cursor.rowcount} unused locations")
            connection.commit()
        
        # STEP 2: Find and remove duplicates
        print("\n" + "="*80)
        print("STEP 2: Deduplicating locations (keep one with most routes)")
        print("="*80)
        
        # Find duplicates and determine which ID to keep
        cursor.execute("""
            SELECT 
                LOWER(TRIM(name)) as name_key,
                COUNT(*) as dup_count,
                GROUP_CONCAT(id ORDER BY id) as all_ids,
                (
                    SELECT l2.id
                    FROM locations l2
                    WHERE LOWER(TRIM(l2.name)) = LOWER(TRIM(l.name))
                    ORDER BY (
                        SELECT COUNT(*) 
                        FROM buses b 
                        WHERE b.from_location_id = l2.id OR b.to_location_id = l2.id
                    ) DESC, l2.id ASC
                    LIMIT 1
                ) as id_to_keep
            FROM locations l
            GROUP BY LOWER(TRIM(name))
            HAVING COUNT(*) > 1
        """)
        
        duplicates = cursor.fetchall()
        print(f"   Found {len(duplicates)} sets of duplicates")
        
        if duplicates:
            # Show sample
            print("\n   Sample duplicates (first 10):")
            for i, (name_key, dup_count, all_ids, id_to_keep) in enumerate(duplicates[:10]):
                print(f"     {i+1}. '{name_key}' - {dup_count} duplicates")
                print(f"        IDs: {all_ids}")
                print(f"        Keeping: {id_to_keep} (has most routes)")
            
            if len(duplicates) > 10:
                print(f"     ... and {len(duplicates) - 10} more")
            
            # Count total duplicates to delete
            total_dup_to_delete = sum(dup_count - 1 for _, dup_count, _, _ in duplicates)
            
            if not skip_confirmation:
                print(f"\n⚠️  WARNING: This will:")
                print(f"   - Delete {unused_count} locations with no routes")
                print(f"   - Delete {total_dup_to_delete} duplicate locations")
                print(f"   - Keep {len(duplicates)} best locations from duplicates")
                response = input(f"\nProceed? (yes/no): ")
                if response.lower() != 'yes':
                    print("❌ Cleanup cancelled")
                    return False
            else:
                print(f"\n✅ Auto-confirmed (--confirm flag used)")
            
            # Delete duplicates (keep the one with most routes)
            deleted_count = 0
            for name_key, dup_count, all_ids, id_to_keep in duplicates:
                cursor.execute("""
                    DELETE FROM locations
                    WHERE LOWER(TRIM(name)) = %s AND id != %s
                """, (name_key, id_to_keep))
                deleted_count += cursor.rowcount
            
            connection.commit()
            print(f"   ✅ Deleted {deleted_count} duplicate locations")
        else:
            print("   ✅ No duplicates found!")
        
        # Final counts
        cursor.execute("SELECT COUNT(*) FROM locations")
        final_count = cursor.fetchone()[0]
        
        print("\n" + "="*80)
        print("CLEANUP COMPLETE!")
        print("="*80)
        print(f"   Initial locations: {initial_count}")
        print(f"   Final locations:   {final_count}")
        print(f"   Total deleted:     {initial_count - final_count}")
        print("="*80)
        
        # Verify no duplicates remain
        cursor.execute("""
            SELECT COUNT(*)
            FROM locations
            GROUP BY LOWER(TRIM(name))
            HAVING COUNT(*) > 1
        """)
        remaining_dups = cursor.rowcount
        
        if remaining_dups > 0:
            print(f"\n⚠️  Warning: {remaining_dups} duplicate sets still remain")
        else:
            print(f"\n✅ All duplicates removed! Each location name is unique.")
        
        return True
        
    except Exception as e:
        connection.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        cursor.close()
        connection.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Complete location cleanup and deduplication")
    parser.add_argument("--confirm", action="store_true", help="Skip confirmation prompt")
    parser.add_argument("--env", choices=['production', 'preprod'], default='production',
                      help="Target environment (default: production)")
    args = parser.parse_args()
    
    success = cleanup_and_deduplicate(skip_confirmation=args.confirm, environment=args.env)
    sys.exit(0 if success else 1)
