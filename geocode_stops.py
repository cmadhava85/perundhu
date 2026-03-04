#!/usr/bin/env python3
"""
Geocode placeholder locations (lat=0, lng=0) using Nominatim (OpenStreetMap).

Run AFTER fast_prod_upload.py. Queries Nominatim for each location name,
restricted to India, Tamil Nadu preferred.

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

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
RATE_LIMIT_SEC = 1.1  # Nominatim policy: max 1 req/sec
MAX_RETRIES = 3


def query_nominatim(name: str):
    """Return (lat, lng) for a name, searching Tamil Nadu then all India."""
    # Try with 'Tamil Nadu, India' suffix first, then just 'India'
    queries = [
        f"{name}, Tamil Nadu, India",
        f"{name}, India",
    ]
    for q in queries:
        params = urllib.parse.urlencode({
            "q": q,
            "format": "json",
            "limit": 1,
            "countrycodes": "in",
        })
        req = urllib.request.Request(
            f"{NOMINATIM_URL}?{params}",
            headers={"User-Agent": "perundhu-geocoder/1.0 (admin@perundhu.com)"},
        )
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    results = json.loads(resp.read())
                if results:
                    r = results[0]
                    return round(float(r["lat"]), 6), round(float(r["lon"]), 6)
                break  # no results — try next query suffix
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    wait = 30 * attempt
                    print(f"\n   ⏳ Rate limited (attempt {attempt}), sleeping {wait}s...", flush=True)
                    time.sleep(wait)
                else:
                    print(f"\n   ⚠️  HTTP {e.code} for '{name}'", flush=True)
                    break
            except Exception as exc:
                print(f"\n   ⚠️  Error for '{name}': {exc}", flush=True)
                break
        time.sleep(RATE_LIMIT_SEC)
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
        width = len(str(total))
        print(f"[{i:{width}}/{total}] {name:<40}", end=" ... ", flush=True)
        lat, lng = query_nominatim(name)

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
