#!/bin/bash
# Quick status check

echo "Checking if rebuild script is running..."
ps aux | grep "[p]ython3.*rebuild" && echo "✅ Script is running" || echo "❌ No rebuild script running"

echo -e "\nChecking if cloud-sql-proxy is running..."
ps aux | grep "[c]loud-sql-proxy.*perundhu-production" && echo "✅ Proxy is running" || echo "❌ No proxy running"

echo -e "\nChecking rebuild output file..."
if [ -f rebuild_output.txt ]; then
    SIZE=$(wc -c < rebuild_output.txt)
    LINES=$(wc -l < rebuild_output.txt)
    echo "File exists: $LINES lines, $SIZE bytes"
    if [ $SIZE -gt 0 ]; then
        echo -e "\n=== Last 30 lines ==="
        tail -30 rebuild_output.txt
    else
        echo "File is empty - script may not have started"
    fi
else
    echo "File does not exist yet"
fi

echo -e "\n=== Checking for backup tables in database ==="
if ps aux | grep -q "[c]loud-sql-proxy.*perundhu-production"; then
    python3 -c "
import mysql.connector
import subprocess
password = subprocess.run(['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password', '--project=perundhu-prod-001'], capture_output=True, text=True).stdout.strip()
conn = mysql.connector.connect(host='127.0.0.1', port=3307, user='perundhu_user', password=password, database='RECOVER_YOUR_DATA', auth_plugin='mysql_native_password')
cursor = conn.cursor()
cursor.execute(\"SHOW TABLES LIKE 'locations_backup_%'\")
backups = cursor.fetchall()
if backups:
    print(f'Found {len(backups)} backup table(s):')
    for (table,) in backups:
        cursor.execute(f'SELECT COUNT(*) FROM {table}')
        print(f'  {table}: {cursor.fetchone()[0]:,} rows')
else:
    print('No backup tables found - rebuild may not have started')
cursor.execute('SELECT COUNT(*) FROM locations')
print(f'Current locations count: {cursor.fetchone()[0]:,}')
conn.close()
"
else
    echo "Proxy not running - cannot check database"
fi
