#!/usr/bin/env python3
import mysql.connector
import os

password = os.popen('gcloud secrets versions access latest --secret="db-password"').read().strip()
conn = mysql.connector.connect(host='127.0.0.1', port=3307, user='perundhu_user', password=password, database='RECOVER_YOUR_DATA')
c = conn.cursor()

# Sample stops to verify correct names
c.execute('SELECT name, bus_id, stop_order FROM stops ORDER BY bus_id, stop_order LIMIT 10')
print('📋 Sample stops (now using landmark field):')
for name, bus_id, order in c.fetchall():
    print(f'  Stop {order}: {name} (Bus {bus_id})')

# Check for duplicates
c.execute('''
    SELECT COUNT(*) FROM (
        SELECT bus_id, stop_order, COUNT(*) as cnt 
        FROM stops 
        GROUP BY bus_id, stop_order 
        HAVING cnt > 1
    ) as dups
''')
dups = c.fetchone()[0]
print(f'\n✅ Duplicate groups: {dups}')

# Total stops
c.execute('SELECT COUNT(*) FROM stops')
print(f'✅ Total stops: {c.fetchone()[0]:,}')

conn.close()
