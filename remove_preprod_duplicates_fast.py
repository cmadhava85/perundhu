#!/usr/bin/env python3
"""
Fast duplicate cleanup for PREPROD:
- Builds a mapping of duplicate location IDs -> canonical ID (lowest ID per name)
- Updates FK references in buses (from_location_id, to_location_id) using a temp table
- Deletes duplicate location rows
- Verifies remaining duplicates
"""
import mysql.connector
import subprocess
from datetime import datetime

def main():
    # Fetch password from Secret Manager
    pw = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password'],
        capture_output=True, text=True, check=True
    ).stdout.strip()

    conn = mysql.connector.connect(
        host='127.0.0.1', port=3307,
        user='perundhu_user', password=pw,
        database='perundhu', autocommit=False
    )
    cur = conn.cursor()

    print('Loading duplicates...')
    cur.execute(
        """
        SELECT name, GROUP_CONCAT(id ORDER BY id) AS ids
        FROM locations
        GROUP BY name
        HAVING COUNT(*) > 1
        """
    )
    rows = cur.fetchall()
    mapping = []  # list of (old_id, new_id)
    for _name, ids_str in rows:
        ids = [int(x) for x in ids_str.split(',')]
        keep = ids[0]
        for old in ids[1:]:
            mapping.append((old, keep))

    print(f"Found {len(rows):,} names with duplicates; will delete {len(mapping):,} rows")
    if not mapping:
        print('No duplicates to process')
        return

    # Temp table
    print('Creating temp table dup_map...')
    cur.execute('DROP TEMPORARY TABLE IF EXISTS dup_map')
    cur.execute('CREATE TEMPORARY TABLE dup_map (old_id BIGINT PRIMARY KEY, new_id BIGINT NOT NULL)')

    # Insert mapping in batches
    batch_size = 2000
    for i in range(0, len(mapping), batch_size):
        batch = mapping[i:i+batch_size]
        cur.executemany('INSERT INTO dup_map (old_id, new_id) VALUES (%s, %s)', batch)
        conn.commit()
        print(f'  inserted mapping batch {i//batch_size + 1}/{(len(mapping)-1)//batch_size + 1}')

    # Update FK references in small batches to avoid lock timeouts
    print('Updating buses.from_location_id (batched) ...')
    fk_updates = 0
    for i in range(0, len(mapping), 500):
        batch = mapping[i:i+500]
        for old_id, new_id in batch:
            cur.execute(
                'UPDATE buses SET from_location_id = %s WHERE from_location_id = %s',
                (new_id, old_id)
            )
            fk_updates += cur.rowcount
        conn.commit()
        if (i // 500 + 1) % 20 == 0:
            print(f"  processed {(i//500+1)*500}/{len(mapping)} mappings for from_location_id")
    print(f"  total rows updated (from_location_id): {fk_updates}")

    print('Updating buses.to_location_id (batched) ...')
    fk_updates = 0
    for i in range(0, len(mapping), 500):
        batch = mapping[i:i+500]
        for old_id, new_id in batch:
            cur.execute(
                'UPDATE buses SET to_location_id = %s WHERE to_location_id = %s',
                (new_id, old_id)
            )
            fk_updates += cur.rowcount
        conn.commit()
        if (i // 500 + 1) % 20 == 0:
            print(f"  processed {(i//500+1)*500}/{len(mapping)} mappings for to_location_id")
    print(f"  total rows updated (to_location_id): {fk_updates}")

    # Delete duplicates
    print('Deleting duplicate locations...')
    cur.execute('DELETE l FROM locations l JOIN dup_map m ON l.id = m.old_id')
    print(f"  deleted: {cur.rowcount}")
    conn.commit()

    # Verify
    cur.execute('SELECT COUNT(*) FROM locations')
    total = cur.fetchone()[0]
    cur.execute('SELECT COUNT(DISTINCT name) FROM locations')
    uniq = cur.fetchone()[0]
    print(f"Done. Total: {total:,}, Unique names: {uniq:,}, Remaining duplicates: {total - uniq}")

    # Backup log
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    with open(f'preprod_deleted_duplicates_{ts}_fast.txt', 'w') as f:
        f.write(f"Deleted {len(mapping)} duplicates on {datetime.now()}\n")
        f.write(f"Total after delete: {total}, Unique: {uniq}, Remaining dupes: {total - uniq}\n")
    print('Backup log saved')

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
