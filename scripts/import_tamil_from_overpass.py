#!/usr/bin/env python3
"""
Import Tamil translations from Overpass (OpenStreetMap) into translations table.
- Fetches Tamil names (name:ta) for places (city/town/village), bus stations, and bus stops in Tamil Nadu.
- Maps OSM features to existing DB rows by exact English name match and coordinate proximity.
- Upserts translations: entity_type in {'location','stop'}, language_code='ta', field_name='name'.
"""

import sys
import time
import json
from typing import Dict, List, Tuple
import requests
import mysql.connector
from getpass import getpass

PASSWORD='OkG2+j#7vW(:?:4eFeouUFG_iPty*}BX'
DBCFG=dict(host='127.0.0.1',port=3307,user='root',password=PASSWORD,database='perundhu')
OVERPASS_URLS=[
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter'
]

# Haversine for proximity matching (meters)
from math import radians, cos, sin, asin, sqrt

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return R * c

def fetch_overpass():
    """Fetch Tamil names for target features in Tamil Nadu."""
    q = r"""
    [out:json][timeout:180];
    area[name="Tamil Nadu"]->.a;
    (
      nwr[place~"^(city|town|village)$"]["name:ta"](area.a);
      nwr[amenity=bus_station]["name:ta"](area.a);
      nwr[highway=bus_stop]["name:ta"](area.a);
    );
    out center tags;
    """
    last_err=None
    for url in OVERPASS_URLS:
        try:
            resp = requests.post(url, data={'data': q}, timeout=180)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            last_err=e
            time.sleep(1)
            continue
    raise last_err

def get_db_rows(cursor) -> Tuple[List[Tuple], List[Tuple]]:
    """Fetch locations and stops rows from DB."""
    cursor.execute("SELECT id, name, latitude, longitude FROM locations")
    locs = cursor.fetchall()
    cursor.execute("SELECT id, name, location_id FROM stops")
    stops = cursor.fetchall()
    return locs, stops

def build_name_index(rows):
    idx = {}
    for r in rows:
        rid, name = r[0], r[1]
        key = name.strip().lower()
        idx.setdefault(key, []).append(r)
    return idx

def map_osm_to_db(osm_elements, locs, stops):
    loc_idx = build_name_index(locs)
    stop_idx = build_name_index(stops)
    updates = { 'location': [], 'stop': [] }  # list of (entity_id, ta_name)
    
    for el in osm_elements:
        tags = el.get('tags', {})
        name_en = tags.get('name')
        name_ta = tags.get('name:ta')
        lat = (el.get('lat') or (el.get('center') or {}).get('lat'))
        lon = (el.get('lon') or (el.get('center') or {}).get('lon'))
        
        if not name_ta:
            continue
        if not name_en and not (lat and lon):
            continue
        
        # Decide target type by tags
        etype = None
        if 'place' in tags:
            etype = 'location'
        elif tags.get('amenity') == 'bus_station':
            etype = 'location'  # bus stations are modeled as locations in our schema
        elif tags.get('highway') == 'bus_stop':
            etype = 'stop'
        else:
            continue
        
        matched = False
        if name_en:
            key = name_en.strip().lower()
            idx = loc_idx if etype=='location' else stop_idx
            if key in idx:
                # Use first match
                entity_id = idx[key][0][0]
                updates[etype].append((entity_id, name_ta))
                matched = True
        
        # Fallback proximity for locations when lat/lon present
        if not matched and etype=='location' and lat and lon:
            # Find closest location within 300m
            best = None
            for rid, nm, rlat, rlon in locs:
                if rlat is None or rlon is None:
                    continue
                d = haversine(lat, lon, rlat, rlon)
                if d <= 300 and (best is None or d < best[0]):
                    best = (d, rid)
            if best:
                updates['location'].append((best[1], name_ta))
                matched = True
        
        # If stop by name failed, we will skip proximity (stops lack coords)
    return updates

def upsert_translations(cursor, updates, dry_run=False, batch_size=500):
    """Upsert translations in batches; de-duplicate per entity_id and use ON DUPLICATE KEY UPDATE."""
    total = 0
    for etype in ['location','stop']:
        items = updates[etype]
        # Deduplicate per entity_id, prefer longest Tamil name
        unique = {}
        for entity_id, ta_name in items:
            if entity_id not in unique or (ta_name and len(ta_name) > len(unique[entity_id])):
                unique[entity_id] = ta_name
        pairs = list(unique.items())
        
        for i in range(0, len(pairs), batch_size):
            batch = pairs[i:i+batch_size]
            total += len(batch)
            if dry_run or not batch:
                continue
            # executemany with upsert
            sql = (
                "INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value, created_at, updated_at) "
                "VALUES (%s, %s, 'ta', 'name', %s, NOW(), NOW()) "
                "ON DUPLICATE KEY UPDATE translated_value=VALUES(translated_value), updated_at=NOW()"
            )
            data = [(etype, eid, name) for eid, name in batch]
            cursor.executemany(sql, data)
    return total

def main():
    print("="*60)
    print("Import Tamil from Overpass")
    print("="*60)
    print()
    
    # Connect DB
    conn = mysql.connector.connect(**DBCFG)
    cursor = conn.cursor()
    
    # Fetch DB rows
    print("Fetching DB rows...")
    locs, stops = get_db_rows(cursor)
    print(f" - locations: {len(locs)}")
    print(f" - stops: {len(stops)}")
    
    # Fetch Overpass
    print("Querying Overpass (Tamil Nadu)...")
    data = fetch_overpass()
    elements = data.get('elements', [])
    print(f" - OSM features with name:ta: {len(elements)}")
    
    # Map
    print("Mapping OSM features to DB...")
    updates = map_osm_to_db(elements, locs, stops)
    print(f" - location matches: {len(updates['location'])}")
    print(f" - stop matches: {len(updates['stop'])}")
    
    # Confirm
    resp = input("Proceed to upsert translations now? (yes/no): ").strip().lower()
    if resp != 'yes':
        print("Cancelled.")
        cursor.close(); conn.close()
        return
    
    print("Upserting translations...")
    total = upsert_translations(cursor, updates, dry_run=False)
    conn.commit()
    print(f"✅ Upsert complete. Total rows affected: {total}")
    
    # Verify sample: Madurai
    cursor.execute("SELECT id FROM locations WHERE LOWER(name)='madurai' LIMIT 1")
    row = cursor.fetchone()
    if row:
        mid = row[0]
        cursor.execute("SELECT language_code, field_name, translated_value FROM translations WHERE entity_type='location' AND entity_id=%s ORDER BY language_code", (mid,))
        rows = cursor.fetchall()
        print("Madurai translations after import:")
        for lc, fn, tv in rows:
            print(f" - {lc} {fn}: {tv}")
    
    cursor.close(); conn.close()
    print("\nDone.")

if __name__=='__main__':
    main()
