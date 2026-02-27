#!/usr/bin/env python3
"""Check ALL duplicate locations in production and preprod"""
import mysql.connector
import subprocess
import sys

def check_duplicates(env_name, project_id, db_name):
    print("\n" + "="*100)
    print(f"CHECKING DUPLICATES IN {env_name.upper()}")
    print("="*100)
    
    # Get password
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', 
         '--secret=db-password', f'--project={project_id}'],
        capture_output=True, text=True
    )
    password = result.stdout.strip()
    
    # Connect
    try:
        conn = mysql.connector.connect(
            host='127.0.0.1',
            port=3307,
            user='perundhu_user',
            password=password,
            database=db_name,
            auth_plugin='mysql_native_password'
        )
        cursor = conn.cursor()
        
        # Get total locations
        cursor.execute("SELECT COUNT(*) FROM locations")
        total = cursor.fetchone()[0]
        print(f"\nTotal locations: {total}")
        
        # Find duplicates
        cursor.execute("""
            SELECT 
                LOWER(TRIM(name)) as name_key,
                COUNT(*) as dup_count,
                GROUP_CONCAT(
                    CONCAT(
                        'ID:', id, 
                        ' (', 
                        (SELECT COUNT(*) FROM buses b WHERE b.from_location_id = l.id OR b.to_location_id = l.id),
                        ' routes)'
                    ) 
                    ORDER BY id 
                    SEPARATOR ' | '
                ) as details
            FROM locations l
            GROUP BY LOWER(TRIM(name))
            HAVING COUNT(*) > 1
            ORDER BY dup_count DESC
        """)
        
        duplicates = cursor.fetchall()
        
        if not duplicates:
            print("\n✅ No duplicates found!")
            cursor.close()
            conn.close()
            return 0
        
        print(f"\n⚠️  Found {len(duplicates)} sets of duplicate location names")
        total_dup_entries = sum(count - 1 for _, count, _ in duplicates)
        print(f"   Total duplicate entries to remove: {total_dup_entries}")
        
        print("\n" + "-"*100)
        print("DUPLICATE LOCATIONS:")
        print("-"*100)
        
        for name, count, details in duplicates[:50]:  # Show first 50
            print(f"\n📍 {name.upper()}")
            print(f"   Duplicates: {count}")
            print(f"   Details: {details}")
        
        if len(duplicates) > 50:
            print(f"\n... and {len(duplicates) - 50} more duplicate sets")
        
        cursor.close()
        conn.close()
        
        return total_dup_entries
        
    except Exception as e:
        print(f"\n❌ Error connecting to {env_name}: {e}")
        return 0

if __name__ == "__main__":
    print("\n" + "="*100)
    print("COMPREHENSIVE DUPLICATE LOCATION CHECK")
    print("="*100)
    
    # Check production
    prod_dups = check_duplicates(
        "Production",
        "perundhu-prod-001",
        "RECOVER_YOUR_DATA"
    )
    
    # Check preprod
    preprod_dups = check_duplicates(
        "Preprod",
        "astute-strategy-406601",
        "perundhu"
    )
    
    print("\n" + "="*100)
    print("SUMMARY")
    print("="*100)
    print(f"Production duplicate entries to remove: {prod_dups}")
    print(f"Preprod duplicate entries to remove: {preprod_dups}")
    print(f"Total across both environments: {prod_dups + preprod_dups}")
    print("="*100)
