#!/usr/bin/env python3
import pymysql
import subprocess

# Get password
pw_result = subprocess.run(['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password', '--project=astute-strategy-406601'], capture_output=True, text=True)
password = pw_result.stdout.strip()

try:
    # Connect
    conn = pymysql.connect(host='127.0.0.1', port=3307, user='perundhu_user', password=password, database='perundhu')
    cursor = conn.cursor()
    cursor.execute('SELECT DATABASE() as db, VERSION() as version')
    result = cursor.fetchone()
    print(f'✅ CONNECTION SUCCESSFUL!')
    print(f'   Connected to: {result[0]}')
    print(f'   MySQL Version: {result[1]}')
    
    # Get table count
    cursor.execute('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = "perundhu"')
    table_count = cursor.fetchone()[0]
    print(f'   Tables in database: {table_count}')
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f'❌ Connection failed: {e}')
