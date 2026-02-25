#!/usr/bin/env python3
import mysql.connector
import subprocess

result = subprocess.run(['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password'], capture_output=True, text=True)
password = result.stdout.strip()

conn = mysql.connector.connect(host='127.0.0.1', port=3307, user='perundhu_user', password=password, database='RECOVER_YOUR_DATA', auth_plugin='mysql_native_password')
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM locations')
total = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(DISTINCT UPPER(TRIM(name))) FROM locations')
unique = cursor.fetchone()[0]

print(f'📊 Database Status:')
print(f'   Total locations: {total:,}')
print(f'   Unique names: {unique:,}')
print(f'   Duplicates: {total - unique:,}')

cursor.execute('''
    SELECT normalized_name, COUNT(*) as count
    FROM (
        SELECT UPPER(TRIM(name)) as normalized_name
        FROM locations
    ) as normalized
    GROUP BY normalized_name
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 5
''')

print(f'\n📋 Top 5 most duplicated names:')
for name, count in cursor.fetchall():
    print(f'   {name}: {count} entries')

conn.close()
