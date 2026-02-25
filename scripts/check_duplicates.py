#!/usr/bin/env python3
import mysql.connector
import os

password = os.popen('gcloud secrets versions access latest --secret="db-password"').read().strip()
conn = mysql.connector.connect(host='127.0.0.1', port=3307, user='perundhu_user', password=password, database='RECOVER_YOUR_DATA')
c = conn.cursor()

# Find similar location names (Kilambakkam example)
c.execute("""
    SELECT id, name, district, latitude, longitude 
    FROM locations 
    WHERE UPPER(name) LIKE '%KILAMBAKKAM%'
    ORDER BY name
    LIMIT 20
""")

print("🔍 Duplicate Kilambakkam locations:")
print("=" * 80)
kilambakkam_locs = c.fetchall()
for loc_id, name, district, lat, lon in kilambakkam_locs:
    print(f"ID: {loc_id:6} | {name:40} | {district or 'N/A':15} | {lat:.6f}, {lon:.6f}")

# Check how many total duplicates by normalized name
c.execute("""
    SELECT 
        TRIM(UPPER(REGEXP_REPLACE(REGEXP_REPLACE(name, '\\(\\d+\\)', ''), 'KCBT ', ''))) as normalized,
        COUNT(*) as cnt
    FROM locations
    GROUP BY normalized
    HAVING cnt > 1
    ORDER BY cnt DESC
    LIMIT 20
""")

print("\n📊 Top 20 duplicate location names (normalized):")
print("=" * 80)
for norm_name, count in c.fetchall():
    print(f"{norm_name:50} | Count: {count}")

conn.close()
