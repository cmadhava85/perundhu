#!/usr/bin/env python3
import mysql.connector

preprod_pwd = 'OkG2+j#7vW(:?:4eFeouUFG_iPty*}BX%'
preprod_user = 'perundhu_user'

try:
    conn = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user=preprod_user,
        password='',
        database='perundhu',
        auth_plugin='mysql_clear_password'
    )
    cursor = conn.cursor()

    bus_stands = [
        ('Arappalayam Bus Stand', 'Madurai - Arappalayam'),
        ('Dharapuram Main Bus Stand', 'Dharapuram - Main'),
        ('Dasarapalle Bus Stop', 'Dasarapalle - Central'),
        ('Parappil Bus Stand', 'Parappil - Central'),
    ]

    print("Updating major bus stands to City - Stand Name format (PREPROD):\n")

    total_updated = 0
    for old_name, new_name in bus_stands:
        cursor.execute("UPDATE locations SET name = %s WHERE name = %s", (new_name, old_name))
        updated = cursor.rowcount
        total_updated += updated
        print(f"  {old_name} → {new_name} ({updated} entries)")

    conn.commit()

    cursor.execute("SELECT DISTINCT name FROM locations WHERE name LIKE 'Madurai%' ORDER BY name")
    print(f"\n=== Madurai Bus Stands (PREPROD) ===")
    for row in cursor.fetchall():
        print(f"  ✓ {row[0]}")

    cursor.execute("SELECT DISTINCT name FROM locations WHERE name LIKE 'Dharapuram%' ORDER BY name")
    print(f"\n=== Dharapuram Bus Stands (PREPROD) ===")
    for row in cursor.fetchall():
        print(f"  ✓ {row[0]}")

    conn.close()
    print(f"\n✅ Preprod database updated successfully ({total_updated} total entries)")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
