#!/usr/bin/env python3
import mysql.connector
import os

conn = mysql.connector.connect(
    host='127.0.0.1', 
    port=3307,
    user='perundhu_user', 
    password='PerundhuTest123456',
    database='perundhu'
)

cursor = conn.cursor()

# Count current translations
cursor.execute('SELECT COUNT(*) FROM translations WHERE language_code="ta" AND field_name="name"')
count = cursor.fetchone()[0]

# Count total locations
cursor.execute('SELECT COUNT(*) FROM locations WHERE name IS NOT NULL AND name != ""')
total = cursor.fetchone()[0]

remaining = total - count
progress_pct = (count / total) * 100 if total > 0 else 0

print(f'✅ Translated: {count:,}')
print(f'⏳ Remaining: {remaining:,}')
print(f'📊 Progress: {progress_pct:.1f}%')

if remaining > 0:
    # Estimate based on current speed (8 workers @ 0.2s = ~40/sec)
    estimated_seconds = remaining / 40
    if estimated_seconds < 60:
        print(f'⏱️  Estimated: {estimated_seconds:.0f} seconds')
    elif estimated_seconds < 3600:
        print(f'⏱️  Estimated: {estimated_seconds/60:.1f} minutes')
    else:
        print(f'⏱️  Estimated: {estimated_seconds/3600:.1f} hours')

conn.close()
