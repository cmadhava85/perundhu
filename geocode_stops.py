#!/usr/bin/env python3
"""
Geocode placeholder locations (lat=0, lng=0) using Overpass API (OpenStreetMap).

Run AFTER fast_prod_upload.py. Queries Overpass for each location name,
first within Tamil Nadu, then all India as fallback.

Usage:
    ./cloud_sql_proxy --port=3307 "perundhu-prod-001:us-central1:perundhu-db" &
    python3 geocode_stops.py
"""
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

import mysql.connector

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
RATE_LIMIT_SEC = 1.5  # Overpass fair-use: ~1 req/sec
MAX_RETRIES = 3


def query_overpass(name: str):
    """Return (lat, lng) for a place name, searching Tamil Nadu first then India."""
    searches = [
        'area["name"="Tamil Nadu"]["admin_level"="4"]->.searcharea;',
        'area["name"="India"]["admin_level"="2"]->.searcharea;',
    ]
    safe_name = name.replace('"', '\\"').replace("\\", "\\\\")
    for area_filter in searches:
        query = f"""
[out:json][timeout:15];
{area_filter}
(
  node["place"]["name"~"^{safe_name}$","i"](area.searcharea);
  way["place"]["name"~"^{safe_name}$","i"](area.searcharea);
  relation["place"]["name"~"^{safe_name}$","i"](area.searcharea);
);
out center 1;
"""
        for attempt in range(1, MAX_RETRIES + 1):
            encoded = urllib.parse.urlencode({"data": query}).encode()
            req = urllib.request.Request(
                OVERPASS_URL,
                data=encoded,
                headers={"User-Agent": "perundhu-geocoder/1.0 (admin@perundhu.com)"},
            )
            try:
                with urllib.request.urlopen(req, timeout=20) as resp:
                    result = json.loads(resp.read())
                elements = result.get("elements", [])
                if elements:
                    el = elements[0]
                    if el["type"] == "node":
                        return round(el["lat"], 6), round(el["lon"], 6)
                    if "center" in el:
                        return round(el["center"]["lat"], 6), round(el["center"]["lon"], 6)
                # No results in this search area — try the next one
                break
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    wait = 30 * attempt
                    print(f"\n   ⏳ Rate limited (attempt {attempt}), sleeping {wait}s...", flush=True)
                    time.sleep(wait)
                else:
                    print(f"\n   ⚠️  HTTP {e.code} for '{name}'", flush=True)
                    break
            except Exception as e:
                print(f"\n   ⚠️  Error for '{name}': {e}", flush=True)
                break
    return None, None


def geocode_placeholder_locations():
    db_config = {
        "host": "127.0.0.1",
        "port": 3307,
        "user": "perundhu_user",
        "password": os.popen(
            "gcloud secrets versions access latest --secret=db-password --project=perundhu-prod-001 2>/dev/null"
        ).read().strip(),
        "database": "perundhu",
        "autocommit": False,
    }

    print("🔌 Connecting to database...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    print(f"   ✓ Connected")

    cursor.execute(
        "SELECT id, name FROM locations WHERE latitude = 0 AND longitude = 0 ORDER BY name"
    )
    rows = cursor.fetchall()
    total = len(rows)
    print(f"\n📍 Found {total:,} locations with placeholder coordinates (0, 0)\n")

    if total == 0:
        print("Nothing to geocode.")
        cursor.close()
        conn.close()
        return

    updated = 0
    not_found = []

    for i, (loc_id, name) in enumerate(rows, 1):
        print(f"[{i:>{len(str(total))}/{total}}] {name:<40}", end=" ... ", flush=True)
        lat, lng = query_overpass(name)

        if lat is not None and lng is not None:
            cursor.execute(
                "UPDATE locations SET latitude = %s, longitude = %s WHERE id = %s",
                (lat, lng, loc_id),
            )
            if i % 10 == 0:
                conn.commit()
            print(f"✓ ({lat}, {lng})")
            updated += 1
        else:
            not_found.append(name)
            print("✗ not found")

        time.sleep(RATE_LIMIT_SEC)

    conn.commit()
    cursor.close()
    conn.close()

    print(f"\n{'=' * 60}")
    print(f"✅ Updated:   {updated:,} / {total:,}")
    print(f"❌ Not found: {len(not_found):,}")
    if not_found:
        print("\nLocations not found on Overpass:")
        for n in not_found:
            print(f"   - {n}")
    print()


if __name__ == "__main__":
    geocode_placeholder_locations()
