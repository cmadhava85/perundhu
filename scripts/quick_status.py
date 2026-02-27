#!/usr/bin/env python3
"""Simple check - just show the numbers"""
import mysql.connector
import subprocess
import sys

try:
    password = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', 
         '--secret=db-password', '--project=perundhu-prod-001'],
        capture_output=True, text=True, timeout=10
    ).stdout.strip()
    
    conn = mysql.connector.connect(
        host='127.0.0.1', port=3307, user='perundhu_user',
        password=password, database='RECOVER_YOUR_DATA',
        auth_plugin='mysql_native_password', connection_timeout=10
    )
    
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM locations")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT LOWER(TRIM(name))) FROM locations")
    unique = cursor.fetchone()[0]
    
    print(f"\n{'='*50}")
    print(f"LOCATIONS TABLE STATUS")
    print(f"{'='*50}")
    print(f"Total locations:  {total:,}")
    print(f"Unique names:     {unique:,}")
    print(f"Duplicates:       {total - unique:,}")
    
    if total == unique:
        print(f"\n✅ SUCCESS! All duplicates removed!")
    else:
        print(f"\n⚠️  Still have {total - unique:,} duplicates")
    
    cursor.execute("SHOW TABLES LIKE 'locations_backup_%'")
    backups = cursor.fetchall()
    if backups:
        print(f"\n📦 Backup tables found: {len(backups)}")
        for (table,) in backups:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            print(f"   {table}: {cursor.fetchone()[0]:,} rows")
    
    print(f"{'='*50}\n")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
