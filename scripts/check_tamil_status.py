#!/usr/bin/env python3
"""Check if Tamil translations were inserted"""

import subprocess
import mysql.connector

# Get password
password = subprocess.check_output([
    'gcloud', 'secrets', 'versions', 'access', 'latest',
    '--secret=db-password', '--project=perundhu-prod-001'
], text=True).strip()

# Connect
conn = mysql.connector.connect(
    host='127.0.0.1',
    port=3307,
    user='perundhu_user',
    password=password,
    database='RECOVER_YOUR_DATA'
)
cursor = conn.cursor()

print("="*70)
print("TAMIL TRANSLATION STATUS CHECK")
print("="*70)

# Count Tamil translations
cursor.execute("""
    SELECT COUNT(*) 
    FROM translations 
    WHERE entity_type = 'location' AND language_code = 'ta'
""")
tamil_count = cursor.fetchone()[0]

print(f"\n✅ Tamil translations in database: {tamil_count:,}")

if tamil_count > 100:
    print(f"\n🎉 SUCCESS! {tamil_count:,} Tamil translations inserted!")
    
    # Show samples
    print(f"\n📍 Sample Tamil translations:")
    cursor.execute("""
        SELECT l.name, t.translated_value
        FROM translations t
        JOIN locations l ON l.id = t.entity_id
        WHERE t.entity_type = 'location' AND t.language_code = 'ta'
        LIMIT 20
    """)
    for row in cursor.fetchall():
        print(f"   • {row[0]} = {row[1]}")
else:
    print(f"\n⏳ Script may still be running or not started yet...")

cursor.close()
conn.close()
