#!/usr/bin/env python3
"""
Update existing location names to the standardized "City - Stand" format.

- Finds rows like "Periyar Bus Stand , Madurai" or "Chennai Koyambedu Bus Stand"
- Converts to "Madurai - Periyar" and "Chennai - Koyambedu"
- Handles Old/New/Central/Main variants: "Madurai - New Bus Stand"
- Dry-run by default; use --apply to perform updates

Environment variables (override with CLI args):
- DB_HOST (default 127.0.0.1)
- DB_PORT (default 3307 for Cloud SQL Proxy)
- DB_USER (default perundhu_user)
- DB_PASSWORD (required when applying)
- DB_NAME (default perundhu)

Examples:
  # Local DB
  python3 scripts/update_location_names.py --apply

  # Preprod via Cloud SQL Proxy (port 3307)
  cloud_sql_proxy -instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql=tcp:127.0.0.1:3307 &
  DB_PASSWORD="<secret>" python3 scripts/update_location_names.py --apply
"""

import os
import re
import csv
import sys
import time
import argparse
from typing import Tuple

try:
    import mysql.connector
except ImportError:
    print("mysql-connector-python not installed. Install with: pip install mysql-connector-python")
    sys.exit(1)


def format_location_name(name: str) -> str:
    """Format OSM/DB names to "City - Stand" for bus stands/stations."""
    if not name:
        return name
    name = name.strip()

    # Already formatted
    if " - " in name:
        return name

    def clean_stand(part: str) -> str:
        part = part.strip()
        part = re.sub(r"^(m\.g\.r\s+|cmbt\s+)", "", part, flags=re.IGNORECASE)
        part = re.sub(r"\s*bus\s+(stand|station)$", "", part, flags=re.IGNORECASE)
        return part.strip()

    # Pattern: "{Stand} , {City}" possibly with Bus Stand/Station
    m = re.match(r"^(.+?)\s*,\s*(.+)$", name)
    if m:
        stand = clean_stand(m.group(1))
        city = m.group(2).strip()
        if stand and city:
            return f"{city} - {stand}"

    # Pattern: "{City} {Old|New|Central|Main} Bus Stand"
    m2 = re.match(r"^(.+?)\s+(Old|New|Central|Main)\s+Bus\s+(Stand|Station)$", name, flags=re.IGNORECASE)
    if m2:
        city = m2.group(1).strip()
        modifier = m2.group(2).strip()
        return f"{city} - {modifier} Bus Stand"

    # Pattern: "{City} {Area} Bus Stand"
    m3 = re.match(r"^(.+?)\s+(.+?)\s+Bus\s+(Stand|Station)$", name, flags=re.IGNORECASE)
    if m3:
        city = m3.group(1).strip()
        area = clean_stand(m3.group(2))
        return f"{city} - {area}"

    return name


def connect_db(args) -> mysql.connector.MySQLConnection:
    host = args.host or os.getenv("DB_HOST", "127.0.0.1")
    port = int(args.port or os.getenv("DB_PORT", "3307"))
    user = args.user or os.getenv("DB_USER", "perundhu_user")
    password = args.password or os.getenv("DB_PASSWORD")
    database = args.database or os.getenv("DB_NAME", "perundhu")

    conn = mysql.connector.connect(host=host, port=port, user=user, password=password, database=database)
    return conn


def fetch_candidates(conn, limit: int = None) -> list:
    sql = (
        "SELECT id, name FROM locations "
        "WHERE name REGEXP '(,)|(bus\\s+(stand|station))' "
        "ORDER BY id ASC"
    )
    if limit:
        sql += f" LIMIT {int(limit)}"
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall()
    cur.close()
    return rows


def main():
    parser = argparse.ArgumentParser(description="Update existing location names to 'City - Stand' format")
    parser.add_argument("--apply", action="store_true", help="Apply updates (default is dry-run)")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of rows processed")
    parser.add_argument("--host", type=str, default=None)
    parser.add_argument("--port", type=str, default=None)
    parser.add_argument("--user", type=str, default=None)
    parser.add_argument("--password", type=str, default=None)
    parser.add_argument("--database", type=str, default=None)
    parser.add_argument("--backup", type=str, default=f"location_name_updates_{int(time.time())}.csv", help="Path to write CSV backup of changes")
    args = parser.parse_args()

    dry_run = not args.apply

    # Connect
    try:
        conn = connect_db(args)
    except Exception as e:
        print(f"❌ Failed to connect to DB: {e}")
        sys.exit(1)

    # Fetch candidates
    rows = fetch_candidates(conn, args.limit)
    print(f"🔎 Found {len(rows)} candidate rows to review")

    changes = []
    changed_count = 0

    for loc_id, name in rows:
        new_name = format_location_name(name)
        if new_name != name:
            changes.append((loc_id, name, new_name))

    print(f"✍️  Prepared {len(changes)} changes")

    # Backup CSV
    try:
        with open(args.backup, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["id", "old_name", "new_name"])
            for row in changes:
                writer.writerow(row)
        print(f"💾 Backup written: {args.backup}")
    except Exception as e:
        print(f"⚠️  Failed to write backup CSV: {e}")

    if dry_run:
        print("✅ Dry-run complete. No changes applied.")
        print("   Review the CSV, then re-run with --apply to apply updates.")
        conn.close()
        return 0

    # Apply updates
    try:
        cur = conn.cursor()
        for loc_id, old_name, new_name in changes:
            cur.execute("UPDATE locations SET name = %s WHERE id = %s", (new_name, loc_id))
            changed_count += 1
        conn.commit()
        cur.close()
        print(f"✅ Applied {changed_count} updates")
    except Exception as e:
        print(f"❌ Failed to apply updates: {e}")
        conn.rollback()
        conn.close()
        sys.exit(1)

    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
