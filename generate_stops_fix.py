"""
Generate fix_prod_stops.sql:
  - Ensures all landmark names exist in locations table
  - Updates stops.name + stops.location_id to use landmark (actual stop name)
    instead of location (route zone that repeats across many consecutive stops)
"""
import json

with open('data/consolidated_buses.json') as f:
    data = json.load(f)
buses = data.get('buses', [])

# Build set of all unique landmark names (the correct stop names)
# These are the names we need to ensure exist in locations and are used in stops.name
landmark_names = set()
for b in buses:
    for s in b.get('stops', []):
        lm = (s.get('landmark') or '').strip()
        if lm:
            landmark_names.add(lm)

# Build (bus_number, stop_order) -> correct landmark for rows where landmark != location
updates = []
for b in buses:
    bus_num = b.get('bus_number', '').strip()
    for idx, s in enumerate(b.get('stops', [])):
        lm  = (s.get('landmark') or '').strip()
        loc = (s.get('location') or '').strip()
        order = s.get('stop_order', idx)
        if lm and lm != loc:
            updates.append((bus_num, order, lm))

print(f"Unique landmark names : {len(landmark_names)}")
print(f"Stops needing fix     : {len(updates)}")

lines = []
lines.append("-- ============================================================")
lines.append("-- PROD SQL PATCH: Fix stops.name to use landmark (actual stop)")
lines.append("-- 'location' field repeats the route zone across many stops.")
lines.append("-- 'landmark' holds the real waypoint name (e.g. GUDUVANCHERY,")
lines.append("--  SRM UNIVERSITY, CHENGALPATTU TOLL, CHENNAI KALAIGNAR CBT).")
lines.append("-- Generated from data/consolidated_buses.json - March 2026")
lines.append("-- ============================================================")
lines.append("")
lines.append("START TRANSACTION;")
lines.append("")

# Step 1: ensure all landmark names exist in locations
lines.append("-- Step 1: Insert any landmark names missing from locations table")
lines.append("INSERT IGNORE INTO locations (name, latitude, longitude, district, state, type)")
lines.append("VALUES")
loc_vals = []
for nm in sorted(landmark_names):
    safe = nm.replace("'", "''")
    loc_vals.append(f"  ('{safe}', 0.0, 0.0, '', 'Tamil Nadu', 'City')")
lines.append(",\n".join(loc_vals) + ";")
lines.append("")

# Step 2: UPDATE in chunks of 500 using CASE expression (MySQL 8 safe)
lines.append("-- Step 2: Update stops.name and location_id to the correct landmark")
CHUNK = 500
chunks = [updates[i:i+CHUNK] for i in range(0, len(updates), CHUNK)]

for chunk_idx, chunk in enumerate(chunks, 1):
    when_clauses = []
    conditions = []
    for bus_num, order, lm in chunk:
        safe_bus = bus_num.replace("'", "''")
        safe_lm  = lm.replace("'", "''")
        when_clauses.append(
            f"    WHEN b.bus_number = '{safe_bus}' AND s.stop_order = {order} THEN '{safe_lm}'"
        )
        conditions.append(f"  (b.bus_number = '{safe_bus}' AND s.stop_order = {order})")

    case_expr = "  CASE\n" + "\n".join(when_clauses) + "\n  END"

    lines.append(f"-- Chunk {chunk_idx}/{len(chunks)} ({len(chunk)} rows)")
    lines.append("UPDATE stops s")
    lines.append("JOIN buses b ON s.bus_id = b.id")
    lines.append("JOIN locations l ON l.name =\n" + case_expr)
    lines.append("SET s.name = l.name,")
    lines.append("    s.location_id = l.id")
    lines.append("WHERE (")
    lines.append("\n  OR ".join(conditions))
    lines.append(");")
    lines.append("")

lines.append("COMMIT;")
lines.append("")
lines.append("-- ============================================================")
lines.append("-- Verify: bus 284KUD should now show distinct stop names")
lines.append("-- ============================================================")
lines.append("SELECT b.bus_number, s.stop_order, s.name, s.arrival_time")
lines.append("FROM stops s")
lines.append("JOIN buses b ON s.bus_id = b.id")
lines.append("WHERE b.bus_number = '284KUD'")
lines.append("ORDER BY s.stop_order;")

sql_text = '\n'.join(lines)
with open('fix_prod_stops.sql', 'w') as f:
    f.write(sql_text)

print(f"Written fix_prod_stops.sql  ({len(lines)} lines, {len(chunks)} UPDATE chunks)")
