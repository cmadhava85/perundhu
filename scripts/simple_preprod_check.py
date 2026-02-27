#!/usr/bin/env python3
import subprocess
import mysql.connector
import sys

try:
    # Get password
    pwd = subprocess.check_output(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', 
         '--secret=db-password', '--project=astute-strategy-406601'],
        text=True
    ).strip()
    
    # Connect
    conn = mysql.connector.connect(
        host='127.0.0.1',
        port=3308,
        user='perundhu_user',
        password=pwd,
        database='RECOVER_YOUR_DATA'
    )
    
    c = conn.cursor()
    
    # Get stats
    c.execute('SELECT COUNT(*) FROM locations')
    total = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM (SELECT name FROM locations GROUP BY name HAVING COUNT(*) > 1) d')
    dup_names = c.fetchone()[0]
    
    c.execute('SELECT COUNT(*) FROM (SELECT latitude, longitude FROM locations WHERE latitude IS NOT NULL GROUP BY latitude, longitude HAVING COUNT(*) > 1) g')
    dup_gps = c.fetchone()[0]
    
    # Print results
    print(f"Total locations: {total}")
    print(f"Duplicate names: {dup_names}")
    print(f"Duplicate GPS: {dup_gps}")
    
    conn.close()
    sys.exit(0)
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
