#!/usr/bin/env python3
"""
Merge specific duplicate location variants into a single canonical location
based on bus/stops usage, and optionally update location JSON files.

Usage:
  python3 scripts/merge_location_variants.py \
    --groups data/location_merge_groups.json \
    --apply \
    --update-json data/tamil_nadu_locations_enhanced.json
"""

import argparse
import json
import os
import sys
from typing import Dict, List, Tuple

import mysql.connector
from mysql.connector import Error as MySQLError


def normalize_name(name: str) -> str:
    return " ".join(name.strip().lower().split())


def get_db_config(args: argparse.Namespace) -> Dict:
    return {
        "host": args.host,
        "port": args.port,
        "user": args.user,
        "password": args.password,
        "database": args.database,
        "charset": "utf8mb4",
        "collation": "utf8mb4_unicode_ci",
    }


def load_groups(groups_path: str) -> List[Dict]:
    with open(groups_path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError("Groups file must be a JSON array")
    return data


def fetch_locations(cursor, variants: List[str]) -> List[Dict]:
    normalized_variants = [normalize_name(v) for v in variants]
    placeholders = ",".join(["%s"] * len(normalized_variants))
    query = f"""
        SELECT id, name
        FROM locations
        WHERE LOWER(TRIM(name)) IN ({placeholders})
    """
    cursor.execute(query, normalized_variants)
    return cursor.fetchall()


def fetch_usage_counts(cursor, location_id: int) -> Dict[str, int]:
    cursor.execute("SELECT COUNT(*) as count FROM buses WHERE from_location_id = %s", (location_id,))
    buses_from = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM buses WHERE to_location_id = %s", (location_id,))
    buses_to = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM stops WHERE location_id = %s", (location_id,))
    stops = cursor.fetchone()["count"]
    return {
        "buses_from": buses_from,
        "buses_to": buses_to,
        "stops": stops,
        "total": buses_from + buses_to + stops,
    }


def choose_primary(locations: List[Dict], counts: Dict[int, Dict[str, int]], canonical_name: str) -> Dict:
    canonical_normalized = normalize_name(canonical_name)
    canonical_candidates = [loc for loc in locations if normalize_name(loc["name"]) == canonical_normalized]
    if canonical_candidates:
        canonical = canonical_candidates[0]
        if counts[canonical["id"]]["total"] > 0:
            return canonical
    # Otherwise pick the one with max total usage; tie-break by lowest ID
    return max(
        locations,
        key=lambda loc: (counts[loc["id"]]["total"], -loc["id"])
    )


def column_exists(cursor, database: str, table: str, column: str, cache: Dict[Tuple[str, str], bool]) -> bool:
    key = (table, column)
    if key in cache:
        return cache[key]
    cursor.execute(
        """
        SELECT COUNT(*) as count
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s
        """,
        (database, table, column),
    )
    exists = cursor.fetchone()["count"] > 0
    cache[key] = exists
    return exists


def merge_location(
    cursor,
    connection,
    database: str,
    primary_id: int,
    secondary_id: int,
    dry_run: bool,
    column_cache: Dict[Tuple[str, str], bool],
) -> Dict[str, int]:
    updates = {}
    tables = [
        ("buses", "from_location_id"),
        ("buses", "to_location_id"),
        ("stops", "location_id"),
        ("connecting_routes", "from_location_id"),
        ("connecting_routes", "to_location_id"),
    ]

    for table, column in tables:
        if not column_exists(cursor, database, table, column, column_cache):
            updates[f"{table}.{column}"] = 0
            continue
        cursor.execute(f"SELECT COUNT(*) as count FROM {table} WHERE {column} = %s", (secondary_id,))
        count = cursor.fetchone()["count"]
        updates[f"{table}.{column}"] = count
        if not dry_run and count > 0:
            cursor.execute(
                f"UPDATE {table} SET {column} = %s WHERE {column} = %s",
                (primary_id, secondary_id),
            )

    # translations
    cursor.execute(
        "SELECT COUNT(*) as count FROM translations WHERE entity_type = 'location' AND entity_id = %s",
        (secondary_id,),
    )
    trans_count = cursor.fetchone()["count"]
    updates["translations.entity_id"] = trans_count
    if not dry_run and trans_count > 0:
        cursor.execute(
            "UPDATE translations SET entity_id = %s WHERE entity_type = 'location' AND entity_id = %s",
            (primary_id, secondary_id),
        )

    # parent references in locations
    cursor.execute("SELECT COUNT(*) as count FROM locations WHERE parent_id = %s", (secondary_id,))
    parent_count = cursor.fetchone()["count"]
    updates["locations.parent_id"] = parent_count
    if not dry_run and parent_count > 0:
        cursor.execute(
            "UPDATE locations SET parent_id = %s WHERE parent_id = %s",
            (primary_id, secondary_id),
        )

    if not dry_run:
        cursor.execute("DELETE FROM locations WHERE id = %s", (secondary_id,))

    if not dry_run:
        connection.commit()

    return updates


def update_json_file(json_path: str, groups: List[Dict]) -> None:
    with open(json_path, "r", encoding="utf-8") as handle:
        locations = json.load(handle)

    if not isinstance(locations, list):
        raise ValueError(f"{json_path} is not a JSON array")

    removed_total = 0

    for group in groups:
        canonical = group["canonical_name"]
        variants = group.get("variants", [])
        if canonical not in variants:
            variants = [canonical] + variants

        normalized_variants = {normalize_name(v) for v in variants}
        normalized_canonical = normalize_name(canonical)

        matches = [loc for loc in locations if normalize_name(loc.get("name", "")) in normalized_variants]
        if not matches:
            continue

        canonical_matches = [loc for loc in matches if normalize_name(loc.get("name", "")) == normalized_canonical]

        if canonical_matches:
            keep = canonical_matches[0]
        else:
            keep = matches[0]
            keep["name"] = canonical

        keep_id = id(keep)
        new_locations = []
        removed = 0
        for loc in locations:
            if normalize_name(loc.get("name", "")) in normalized_variants and id(loc) != keep_id:
                removed += 1
                continue
            new_locations.append(loc)

        locations = new_locations
        removed_total += removed
        print(f"✅ JSON: kept '{keep['name']}', removed {removed} duplicates")

    if removed_total == 0:
        print(f"ℹ️  JSON: no changes for {json_path}")
        return

    with open(json_path, "w", encoding="utf-8") as handle:
        json.dump(locations, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    print(f"✅ JSON updated: {json_path} (removed {removed_total} entries)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Merge specific duplicate location variants")
    parser.add_argument("--groups", required=True, help="Path to JSON file with merge groups")
    parser.add_argument("--apply", action="store_true", help="Apply DB updates (default: dry-run)")
    parser.add_argument("--update-json", action="append", default=[], help="Location JSON file to update")

    parser.add_argument("--host", default=os.getenv("DB_HOST_PREPROD") or os.getenv("DB_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("DB_PORT_PREPROD") or os.getenv("DB_PORT", "3306")))
    parser.add_argument("--user", default=os.getenv("DB_USER_PREPROD") or os.getenv("DB_USER", "root"))
    parser.add_argument("--password", default=os.getenv("DB_PASSWORD_PREPROD") or os.getenv("DB_PASSWORD", ""))
    parser.add_argument("--database", default=os.getenv("DB_NAME_PREPROD") or os.getenv("DB_NAME", "perundhu"))

    args = parser.parse_args()
    dry_run = not args.apply

    groups = load_groups(args.groups)

    if dry_run:
        print("⚠️  DRY RUN: No database changes will be applied")
    else:
        print("🚨 APPLY MODE: Database updates will be applied")

    try:
        connection = mysql.connector.connect(**get_db_config(args))
        cursor = connection.cursor(dictionary=True)
    except MySQLError as exc:
        print(f"❌ Database connection failed: {exc}")
        sys.exit(1)

    try:
        for group in groups:
            canonical_name = group.get("canonical_name")
            variants = group.get("variants", [])
            if not canonical_name or not variants:
                print("❌ Each group needs canonical_name and variants")
                continue

            if canonical_name not in variants:
                variants = [canonical_name] + variants

            locations = fetch_locations(cursor, variants)
            if len(locations) < 2:
                print(f"ℹ️  Skipping '{canonical_name}': found {len(locations)} location(s)")
                continue

            counts = {loc["id"]: fetch_usage_counts(cursor, loc["id"]) for loc in locations}
            primary = choose_primary(locations, counts, canonical_name)
            duplicates = [loc for loc in locations if loc["id"] != primary["id"]]

            print("\n" + "=" * 80)
            print(f"Group: {canonical_name}")
            for loc in locations:
                usage = counts[loc["id"]]
                marker = "(PRIMARY)" if loc["id"] == primary["id"] else ""
                print(
                    f"- {loc['id']}: {loc['name']} {marker}"
                    f" | buses_from={usage['buses_from']} buses_to={usage['buses_to']} stops={usage['stops']}"
                )

            column_cache: Dict[Tuple[str, str], bool] = {}
            for dup in duplicates:
                updates = merge_location(
                    cursor,
                    connection,
                    args.database,
                    primary["id"],
                    dup["id"],
                    dry_run,
                    column_cache,
                )
                print(f"  ✅ Merged {dup['id']} -> {primary['id']} (dry-run={dry_run})")
                for key, value in updates.items():
                    if value:
                        print(f"     - {key}: {value}")

        if args.update_json:
            for json_path in args.update_json:
                update_json_file(json_path, groups)

    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    main()
