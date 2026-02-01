#!/usr/bin/env python3
import mysql.connector

conn = mysql.connector.connect(
    host='127.0.0.1', port=3307,
    user='perundhu_user', password='PerundhuTest123456',
    database='perundhu'
)
cursor = conn.cursor()

# Overall counts
cursor.execute('SELECT COUNT(*) FROM locations')
print(f'📍 Total locations: {cursor.fetchone()[0]:,}')

cursor.execute('SELECT COUNT(*) FROM buses')
print(f'🚌 Total buses: {cursor.fetchone()[0]:,}')

cursor.execute('SELECT COUNT(*) FROM translations WHERE language_code="ta"')
print(f'🇮🇳 Tamil translations: {cursor.fetchone()[0]:,}')

# Sample translations
print('\n📋 Sample Tamil translations:')
cursor.execute('''
    SELECT l.name, t.translated_value 
    FROM locations l 
    JOIN translations t ON t.entity_type="location" AND t.entity_id=l.id 
    WHERE t.language_code="ta" 
    LIMIT 10
''')
for english, tamil in cursor.fetchall():
    print(f'   {english} → {tamil}')

conn.close()
