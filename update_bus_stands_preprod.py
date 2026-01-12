#!/usr/bin/env python3
import mysql.connector
import sys

# Preprod database credentials via Cloud SQL Proxy
# Using root user which is always available on Cloud SQL
db_host = '127.0.0.1'
db_port = 3307
db_user = 'root'
db_password = 'root'
db_name = 'perundhu'

try:
    print(f"Connecting to preprod database at {db_host}:{db_port}...")
    
    conn = mysql.connector.connect(
        host=db_host,
        port=db_port,
        user=db_user,
        database=db_name,
        autocommit=False
    )
    cursor = conn.cursor()

    # Bus stands that need City - Stand formatting
    bus_stands = [
        ('Arappalayam Bus Stand', 'Madurai - Arappalayam'),
        ('Dharapuram Main Bus Stand', 'Dharapuram - Main'),
        ('Dasarapalle Bus Stop', 'Dasarapalle - Central'),
        ('Parappil Bus Stand', 'Parappil - Central'),
    ]

    print("\nUpdating major bus stands in PREPROD to City - Stand Name format:\n")

    total_updated = 0
    for old_name, new_name in bus_stands:
        cursor.execute("UPDATE locations SET name = %s WHERE name = %s", (new_name, old_name))
        updated = cursor.rowcount
        total_updated += updated
        print(f"  {old_name} → {new_name} ({updated} entries)")

    conn.commit()

    # Show verification
    cursor.execute("""
        SELECT DISTINCT name FROM locations 
        WHERE name IN ('Madurai - Arappalayam', 'Madurai - Mattuthavani', 'Madurai - Periyar', 
                       'Dharapuram - Main', 'Dasarapalle - Central', 'Parappil - Central')
        ORDER BY name
    """)

    print(f"\n✓ Total entries updated in PREPROD: {total_updated}")
    print("\n=== Verification (Preprod) ===")
    for row in cursor.fetchall():
        print(f"  ✓ {row[0]}")

    conn.close()
    print("\n✅ Preprod database updated successfully!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
