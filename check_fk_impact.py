import mysql.connector, subprocess
result = subprocess.run(['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password'], capture_output=True, text=True)
pwd = result.stdout.strip()
conn = mysql.connector.connect(host='127.0.0.1', port=3307, user='perundhu_user', password=pwd, database='perundhu')
cursor = conn.cursor()

# Count buses that reference duplicate location IDs
cursor.execute('''
    SELECT COUNT(DISTINCT b.id)
    FROM buses b
    WHERE b.from_location_id IN (
        SELECT l.id FROM locations l 
        WHERE l.name IN (
            SELECT name FROM locations GROUP BY name HAVING COUNT(*) > 1
        )
        AND l.id NOT IN (
            SELECT MIN(id) FROM locations GROUP BY name HAVING COUNT(*) > 1
        )
    )
    OR b.to_location_id IN (
        SELECT l.id FROM locations l 
        WHERE l.name IN (
            SELECT name FROM locations GROUP BY name HAVING COUNT(*) > 1
        )
        AND l.id NOT IN (
            SELECT MIN(id) FROM locations GROUP BY name HAVING COUNT(*) > 1
        )
    )
''')

affected_buses = cursor.fetchone()[0]
print(f'Buses that reference duplicate locations: {affected_buses:,}')

conn.close()
