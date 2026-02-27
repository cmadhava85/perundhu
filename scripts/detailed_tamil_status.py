#!/usr/bin/env python3
"""
Detailed Tamil translation status report
"""

import subprocess
import mysql.connector

# Get database password from Secret Manager
password = subprocess.check_output(
    ['gcloud', 'secrets', 'versions', 'access', 'latest', 
     '--secret=db-password', '--project=perundhu-prod-001'],
    text=True
).strip()

# Connect to database
conn = mysql.connector.connect(
    host='127.0.0.1',
    port=3307,
    user='perundhu_user',
    password=password,
    database='RECOVER_YOUR_DATA'
)
cursor = conn.cursor()

print('='*70)
print('TAMIL TRANSLATION - DETAILED STATUS')
print('='*70)

# Count Tamil translations
cursor.execute('''
    SELECT COUNT(*) 
    FROM translations 
    WHERE entity_type='location' AND language_code='ta'
''')
tamil_count = cursor.fetchone()[0]
print(f'\n✅ Total Tamil translations: {tamil_count}')

# Count active locations
cursor.execute('''
    SELECT COUNT(DISTINCT l.id)
    FROM locations l
    LEFT JOIN (
        SELECT DISTINCT from_location_id AS location_id FROM buses
        UNION
        SELECT DISTINCT to_location_id AS location_id FROM buses
        UNION
        SELECT DISTINCT location_id FROM stops
    ) active_locs ON active_locs.location_id = l.id
    WHERE active_locs.location_id IS NOT NULL
''')
active_locations = cursor.fetchone()[0]
print(f'📍 Active locations (in routes): {active_locations}')

# Coverage
coverage = (tamil_count / active_locations * 100) if active_locations > 0 else 0
print(f'📊 Coverage: {coverage:.1f}%')

# Remaining locations
remaining = active_locations - tamil_count
print(f'⏳ Remaining to translate: {remaining}')

# Estimated Google Translate cost for remaining
chars_per_location = 30
total_chars = remaining * chars_per_location
cost_per_million = 20
estimated_cost = (total_chars / 1_000_000) * cost_per_million
print(f'💰 Estimated cost for remaining (Google Translate): ${estimated_cost:.2f}')

# Show samples
print(f'\n📝 Sample Tamil translations:')
cursor.execute('''
    SELECT l.name, t.translated_value
    FROM translations t
    JOIN locations l ON l.id = t.entity_id
    WHERE t.entity_type='location' AND t.language_code='ta'
    LIMIT 20
''')
for i, row in enumerate(cursor.fetchall(), 1):
    print(f'  {i:2}. {row[0]:30s} → {row[1]}')

cursor.close()
conn.close()

print(f'\n{'='*70}')
if tamil_count > 0:
    print(f'🎉 Script completed successfully!')
    print(f'💰 Cost so far: $0 (100% FREE using OpenStreetMap)')
    if coverage < 50:
        print(f'\n⚠️  Low coverage ({coverage:.1f}%). Consider:')
        print(f'   1. Install Google Translate for better coverage (${estimated_cost:.2f})')
        print(f'   2. Accept current OSM-only translations (FREE)')
else:
    print(f'⏳ No translations yet. Script may still be running...')
print(f'{'='*70}')
