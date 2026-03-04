#!/usr/bin/env python3
"""
Fix missing stops in production DB.

Root cause: bus_id_map was keyed only by bus_number, so when 15 buses share
bus_number='137NS', only the last bus_id survived and got all the stops.

This script:
  1. Deletes ALL existing stops (they were mis-assigned anyway)
  2. Matches each JSON bus to the correct DB bus via composite key
     (bus_number, departure_time, from_location name)
  3. Re-inserts all stops correctly
"""
import json
import os
import sys
import mysql.connector

# --------------------------------------------------------------------------- #
# DB CONNECTION
# --------------------------------------------------------------------------- #
db_config = {
    'host': '127.0.0.1',
    'port': 3307,
    'user': 'perundhu_user',
    'password': os.popen(
        'gcloud secrets versions access latest --secret=db-password '
        '--project=perundhu-prod-001 2>/dev/null'
    ).read().strip(),
    'database': 'perundhu',
    'autocommit': False,
}

print("=" * 70)
print("FIX MISSING STOPS — PROD")
print("=" * 70)

# --------------------------------------------------------------------------- #
# LOAD JSON
# --------------------------------------------------------------------------- #
print("\n📂 Loading consolidated_buses.json …")
with open('data/consolidated_buses.json') as f:
    data = json.load(f)
buses = data.get('buses', [])
buses_with_stops = [b for b in buses if b.get('stops')]
print(f"   Total buses in JSON : {len(buses):,}")
print(f"   Buses that have stops: {len(buses_with_stops):,}")

# --------------------------------------------------------------------------- #
# CONNECT
# --------------------------------------------------------------------------- #
print("\n🔌 Connecting to production database …")
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()
print(f"   ✓ Connected to {db_config['database']} @ {db_config['host']}:{db_config['port']}")

# --------------------------------------------------------------------------- #
# LOAD LOCATION MAP  (name.lower() -> id)
# --------------------------------------------------------------------------- #
print("\n📍 Loading locations …")
cursor.execute("SELECT id, name FROM locations")
location_id_map = {name.lower(): loc_id for loc_id, name in cursor.fetchall()}
print(f"   ✓ {len(location_id_map):,} locations loaded")

# --------------------------------------------------------------------------- #
# LOAD DB BUSES WITH THEIR DEPARTURE TIME + FROM-LOCATION NAME
# (composite key: bus_number, HH:MM departure, from_location name.lower())
# --------------------------------------------------------------------------- #
print("\n🚌 Loading DB buses …")
cursor.execute("""
    SELECT b.id, b.bus_number,
           TIME_FORMAT(b.departure_time, '%H:%i') AS dep_str,
           l.name AS from_name,
           b.from_location_id
    FROM buses b
    LEFT JOIN locations l ON l.id = b.from_location_id
""")
db_bus_rows = cursor.fetchall()
print(f"   ✓ {len(db_bus_rows):,} buses in DB")

# Build maps
db_bus_map = {}       # (bus_number, dep_hhmm, from_name.lower()) -> bus_id
db_bus_num_map = {}   # bus_number -> bus_id  (fallback, last-wins — only for true uniques)
for bus_id, bus_num, dep_str, from_name, from_loc_id in db_bus_rows:
    from_key = (from_name or '').strip().lower()
    dep_key  = (dep_str or '').strip()[:5]
    composite = (bus_num, dep_key, from_key)
    db_bus_map[composite] = bus_id
    db_bus_num_map[bus_num] = bus_id   # will be overwritten if duplicates exist

# --------------------------------------------------------------------------- #
# ENSURE ALL STOP LANDMARK NAMES EXIST IN locations TABLE
# --------------------------------------------------------------------------- #
print("\n🔍 Checking for missing stop location names …")
missing_names = set()
for bus in buses_with_stops:
    for stop in bus.get('stops', []):
        raw = (stop.get('landmark') or stop.get('location') or stop.get('name') or '').strip()
        if raw and raw.lower() not in location_id_map:
            missing_names.add(raw)

if missing_names:
    print(f"   ➕ Inserting {len(missing_names):,} new stop locations …")
    vals = []
    for nm in missing_names:
        safe = nm.replace("'", "''").replace("\\", "\\\\")
        vals.append(f"('{safe}', 0.0, 0.0, '', 'Tamil Nadu', NULL, 'City')")
    for i in range(0, len(vals), 500):
        chunk = vals[i:i + 500]
        cursor.execute(
            "INSERT INTO locations (name, latitude, longitude, district, state, osm_id, type) "
            f"VALUES {','.join(chunk)} ON DUPLICATE KEY UPDATE name = VALUES(name)"
        )
    conn.commit()
    # Refresh map
    cursor.execute(
        "SELECT id, name FROM locations WHERE name IN ({})".format(
            ','.join(f"'{n.replace(chr(39), chr(39)+chr(39))}'" for n in missing_names)
        )
    )
    for loc_id, loc_name in cursor.fetchall():
        location_id_map[loc_name.lower()] = loc_id
    print(f"   ✓ Inserted {len(missing_names):,} locations")
else:
    print("   ✓ All stop names already in locations table")

# --------------------------------------------------------------------------- #
# BUILD STOP ROWS
# --------------------------------------------------------------------------- #
print("\n🛑 Building stop rows …")
all_stops = []
unmatched = []

for bus in buses_with_stops:
    bus_num  = (bus.get('bus_number') or '').strip()
    dep_time = (bus.get('departure_time') or '').strip()[:5]   # HH:MM
    origin   = (bus.get('origin') or bus.get('from_location') or '').strip().lower()

    composite = (bus_num, dep_time, origin)
    bus_db_id = db_bus_map.get(composite)

    if not bus_db_id:
        # Try partial matches: same bus_number + same departure
        candidates = [
            (k, v) for k, v in db_bus_map.items()
            if k[0] == bus_num and k[1] == dep_time
        ]
        if len(candidates) == 1:
            bus_db_id = candidates[0][1]
        elif not candidates:
            # Last resort: bus_number only
            bus_db_id = db_bus_num_map.get(bus_num)

    if not bus_db_id:
        unmatched.append(f"  {bus_num} dep={dep_time} origin={origin}")
        continue

    for stop_order, stop in enumerate(bus.get('stops', [])):
        raw_name = (stop.get('landmark') or stop.get('location') or stop.get('name') or '').strip()
        if not raw_name:
            continue
        stop_loc_id = location_id_map.get(raw_name.lower())
        if not stop_loc_id:
            continue
        t = stop.get('time') or stop.get('arrival_time')
        all_stops.append((
            bus_db_id,
            raw_name,
            stop_loc_id,
            stop.get('stop_order', stop_order),
            t,
            stop.get('departure_time', t),
        ))

print(f"   ✓ {len(all_stops):,} stop rows ready for {len(buses_with_stops) - len(unmatched):,} buses")
if unmatched:
    print(f"   ⚠ {len(unmatched):,} JSON buses could not be matched to a DB row:")
    for u in unmatched[:20]:
        print(u)
    if len(unmatched) > 20:
        print(f"   … and {len(unmatched) - 20} more")

# --------------------------------------------------------------------------- #
# DELETE ALL EXISTING STOPS & RE-INSERT
# --------------------------------------------------------------------------- #
print("\n🗑  Deleting all existing stops …")
cursor.execute("SELECT COUNT(*) FROM stops")
old_count = cursor.fetchone()[0]
cursor.execute("DELETE FROM stops")
conn.commit()
print(f"   ✓ Deleted {old_count:,} old stop rows")

print(f"\n✍️  Inserting {len(all_stops):,} corrected stop rows …")
insert_sql = """
    INSERT INTO stops (bus_id, name, location_id, stop_order, arrival_time, departure_time)
    VALUES (%s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        location_id = VALUES(location_id),
        arrival_time = VALUES(arrival_time),
        departure_time = VALUES(departure_time)
"""
batch_size = 500
for i in range(0, len(all_stops), batch_size):
    cursor.executemany(insert_sql, all_stops[i:i + batch_size])
    conn.commit()
    print(f"   … {min(i + batch_size, len(all_stops)):,} / {len(all_stops):,}", end='\r')

print(f"\n   ✓ Inserted {len(all_stops):,} stop rows")

# --------------------------------------------------------------------------- #
# VERIFY
# --------------------------------------------------------------------------- #
print("\n🔎 Verifying …")
cursor.execute("SELECT COUNT(*) FROM stops")
new_total = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(DISTINCT bus_id) FROM stops")
buses_covered = cursor.fetchone()[0]

# Spot-check 137NS
cursor.execute("""
    SELECT b.bus_number, TIME_FORMAT(b.departure_time,'%H:%i') dep,
           COUNT(s.id) stop_cnt
    FROM buses b
    LEFT JOIN stops s ON s.bus_id = b.id
    WHERE b.bus_number IN ('137NS','137AB')
    GROUP BY b.id, b.bus_number, b.departure_time
    ORDER BY b.bus_number, b.departure_time
""")
rows = cursor.fetchall()
print(f"   Total stops in DB : {new_total:,}")
print(f"   Buses with stops  : {buses_covered:,}")
print(f"\n   Spot-check 137NS / 137AB:")
for bus_num, dep, cnt in rows:
    tick = "✓" if cnt > 0 else "✗"
    print(f"     {tick} {bus_num}  dep={dep}  stops={cnt}")

cursor.close()
conn.close()
print("\n✅ Done.")
