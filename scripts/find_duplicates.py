#!/usr/bin/env python3
"""
Find all duplicate locations in the database
"""
import mysql.connector
import subprocess
import sys

def get_db_password():
    """Get database password from GCP Secret Manager"""
    try:
        password = subprocess.check_output([
            'gcloud', 'secrets', 'versions', 'access', 'latest',
            '--secret=db-password', '--project=perundhu-prod-001'
        ]).decode('utf-8').strip()
        return password
    except Exception as e:
        print(f"Error getting password: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    password = get_db_password()
    
    # Connect to database via Cloud SQL Proxy
    conn = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=password,
        database='perundhu'
    )
    
    cursor = conn.cursor()
    
    # Find top duplicate locations
    query = """
    SELECT 
        LOWER(name) as normalized_name,
        COUNT(*) as duplicate_count,
        GROUP_CONCAT(id ORDER BY id) as all_ids,
        GROUP_CONCAT(DISTINCT name ORDER BY id SEPARATOR ' | ') as all_names
    FROM locations
    GROUP BY LOWER(name)
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC
    LIMIT 30
    """
    
    cursor.execute(query)
    results = cursor.fetchall()
    
    print(f"\n{'Normalized Name':<50} {'Duplicates':<12} {'Sample IDs'}")
    print("=" * 120)
    
    total_duplicates = 0
    for row in results:
        normalized, count, ids, names = row
        total_duplicates += count
        
        # Show first 5 IDs
        id_list = ids.split(',')
        sample_ids = ','.join(id_list[:5])
        if len(id_list) > 5:
            sample_ids += f'... (+{len(id_list)-5} more)'
        
        # Truncate name if too long
        display_name = normalized[:47] + '...' if len(normalized) > 50 else normalized
        
        print(f"{display_name:<50} {count:<12} {sample_ids}")
    
    print(f"\n{'-' * 120}")
    print(f"Total duplicate groups: {len(results)}")
    print(f"Total duplicate location records: {total_duplicates}")
    print(f"Estimated waste: {total_duplicates - len(results)} unnecessary records")
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    main()
