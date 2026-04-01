#!/usr/bin/env python3
"""
Full sync: copy ALL tables from production to local database.
- Deletes all local data (except flyway_schema_history)
- Inserts prod data preserving original IDs (no remapping)

Requires:
  - Cloud SQL Proxy running on port 3307
    nohup ./cloud_sql_proxy -instances=perundhu-prod-001:us-central1:perundhu-production-mysql-us=tcp:3307 &> cloud_sql_proxy.log &
  - gcloud authenticated (for secret fetching)
"""

import os
import sys
import mysql.connector
from datetime import datetime

PROD_HOST = os.getenv("DB_HOST_PROD", "127.0.0.1")
PROD_PORT = int(os.getenv("DB_PORT_PROD", "3307"))
PROD_USER = os.getenv("DB_USER_PROD", "perundhu_user")
PROD_DB   = os.getenv("DB_NAME_PROD", "perundhu")

LOCAL_CONFIG = {
    "host":     "localhost",
    "port":     3306,
    "user":     "root",
    "password": "root",
    "database": "perundhu",
    "charset":  "utf8mb4",
}

# Tables to skip (schema tracking — Flyway owns this locally)
SKIP_TABLES = {"flyway_schema_history"}

BATCH_SIZE = 500


def get_prod_password() -> str:
    pw = os.getenv("DB_PASSWORD_PROD", "").strip()
    if pw:
        return pw
    pw = os.popen(
        "gcloud secrets versions access latest --secret=db-password --project=perundhu-prod-001 2>/dev/null"
    ).read().strip()
    if not pw:
        print("❌ Could not retrieve prod password from Secret Manager.")
        print("   Set DB_PASSWORD_PROD env var or ensure gcloud is authenticated.")
        sys.exit(1)
    return pw


def get_columns(cursor, table: str) -> list[str]:
    """Return only non-generated columns (generated columns can't be inserted)."""
    sql = (
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS"
        " WHERE TABLE_SCHEMA = DATABASE()"
        "   AND TABLE_NAME = %s"
        "   AND GENERATION_EXPRESSION = ''"
        " ORDER BY ORDINAL_POSITION"
    )
    cursor.execute(sql, (table,))
    return [row[0] for row in cursor.fetchall()]


def fetch_all_prod(cursor, table: str) -> tuple[list[str], list[tuple]]:
    cols = get_columns(cursor, table)
    col_list = ", ".join([f"`{c}`" for c in cols])
    cursor.execute(f"SELECT {col_list} FROM `{table}`")
    rows = cursor.fetchall()
    return cols, rows


def truncate_local(local_cur, tables: list[str]):
    print("\n🗑️  Truncating local tables...")
    local_cur.execute("SET FOREIGN_KEY_CHECKS = 0")
    for t in tables:
        local_cur.execute(f"TRUNCATE TABLE `{t}`")
        print(f"   truncated: {t}")
    local_cur.execute("SET FOREIGN_KEY_CHECKS = 1")


def insert_batch(local_cur, table: str, cols: list[str], rows: list[tuple]):
    if not rows:
        return
    placeholders = ", ".join(["%s"] * len(cols))
    col_list = ", ".join([f"`{c}`" for c in cols])
    sql = f"INSERT INTO `{table}` ({col_list}) VALUES ({placeholders})"
    local_cur.executemany(sql, rows)


def sync_table(prod_cur, local_cur, local_conn, table: str) -> int:
    cols, rows = fetch_all_prod(prod_cur, table)
    if not rows:
        print(f"   {table}: 0 rows (skipped insert)")
        return 0

    local_cur.execute("SET FOREIGN_KEY_CHECKS = 0")

    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        insert_batch(local_cur, table, cols, batch)
        local_conn.commit()

    local_cur.execute("SET FOREIGN_KEY_CHECKS = 1")
    print(f"   {table}: {len(rows):,} rows")
    return len(rows)


def main():
    start = datetime.now()
    print("=" * 70)
    print("SYNC PRODUCTION → LOCAL")
    print("=" * 70)

    # Confirm
    print("\n⚠️  This will DELETE all local data and replace with production data.")
    answer = input("Type 'yes' to continue: ").strip().lower()
    if answer != "yes":
        print("Aborted.")
        sys.exit(0)

    # Connect prod
    print("\n🔗 Connecting to production (Cloud SQL Proxy)...")
    prod_pw = get_prod_password()
    prod_conn = mysql.connector.connect(
        host=PROD_HOST, port=PROD_PORT,
        user=PROD_USER, password=prod_pw,
        database=PROD_DB, charset="utf8mb4",
        connection_timeout=30,
    )
    prod_cur = prod_conn.cursor()
    print("✅ Connected to production")

    # Connect local
    print("🔗 Connecting to local MySQL...")
    local_conn = mysql.connector.connect(**LOCAL_CONFIG)
    local_cur = local_conn.cursor()
    print("✅ Connected to local MySQL")

    # Get table list from prod
    prod_cur.execute("SHOW TABLES")
    all_tables = [r[0] for r in prod_cur.fetchall()]
    tables_to_sync = [t for t in all_tables if t not in SKIP_TABLES]

    print(f"\n📋 Tables to sync: {len(tables_to_sync)}  (skipping: {SKIP_TABLES})")

    # Show prod counts
    print("\n📊 Production row counts:")
    prod_counts = {}
    for t in tables_to_sync:
        prod_cur.execute(f"SELECT COUNT(*) FROM `{t}`")
        prod_counts[t] = prod_cur.fetchone()[0]
        if prod_counts[t] > 0:
            print(f"   {t:<40} {prod_counts[t]:>10,}")

    # Truncate local
    truncate_local(local_cur, tables_to_sync)
    local_conn.commit()

    # Sync each table
    print("\n📥 Syncing tables...")
    total_rows = 0
    for table in tables_to_sync:
        try:
            count = sync_table(prod_cur, local_cur, local_conn, table)
            total_rows += count
        except Exception as e:
            print(f"   ❌ {table}: ERROR — {e}")
            local_conn.rollback()

    # Cleanup
    prod_cur.close()
    prod_conn.close()
    local_cur.close()
    local_conn.close()

    elapsed = (datetime.now() - start).total_seconds()
    print("\n" + "=" * 70)
    print("✅ SYNC COMPLETE")
    print("=" * 70)
    print(f"Total rows synced: {total_rows:,}")
    print(f"Time elapsed:      {elapsed:.1f}s")
    print()
    print("Next step: restart your backend")
    print("  ./start-local.sh")


if __name__ == "__main__":
    main()
