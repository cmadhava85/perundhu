#!/usr/bin/env python3
"""
Format bus station names in English and Tamil.
- English: ensure suffix "Bus Stand" and optionally prefix nearby_city when absent.
- Tamil: if a Tamil translation exists, ensure it ends with " பேருந்து நிலையம்".
- Dry-run prompt before applying updates.
"""
import mysql.connector
from getpass import getpass

PASSWORD='OkG2+j#7vW(:?:4eFeouUFG_iPty*}BX'
DBCFG=dict(host='127.0.0.1',port=3307,user='root',password=PASSWORD,database='perundhu')

T_SUFFIX=" பேருந்து நிலையம்"


def fetch_bus_stations(cursor):
    cursor.execute("""
        SELECT id, name, district, nearby_city, neighborhood
        FROM locations
        WHERE type='bus_station'
    """)
    return cursor.fetchall()


def fetch_tamil_map(cursor):
    cursor.execute("""
        SELECT entity_id, translated_value
        FROM translations
        WHERE entity_type='location' AND language_code='ta' AND field_name='name'
    """)
    return {row[0]: row[1] for row in cursor.fetchall()}


def format_english(name, nearby_city):
    lower = name.lower()
    if "bus stand" in lower:
        return name  # already formatted
    base = name
    if nearby_city and nearby_city.lower() not in lower:
        return f"{nearby_city} - {base} Bus Stand"
    return f"{base} Bus Stand"


def format_tamil(t_val):
    if not t_val:
        return None
    if t_val.endswith(T_SUFFIX):
        return t_val
    return t_val + T_SUFFIX


def main():
    print("="*60)
    print("Apply bus stand formatting (English + Tamil suffix)")
    print("="*60)
    print()
    conn = mysql.connector.connect(**DBCFG)
    cursor = conn.cursor()

    rows = fetch_bus_stations(cursor)
    t_map = fetch_tamil_map(cursor)

    eng_updates = []
    tam_updates = []

    for rid, name, district, nearby_city, neighborhood in rows:
        target_en = format_english(name, nearby_city)
        if target_en != name:
            eng_updates.append((target_en, rid, name))
        if rid in t_map:
            new_t = format_tamil(t_map[rid])
            if new_t and new_t != t_map[rid]:
                tam_updates.append((new_t, rid, t_map[rid]))

    print(f"Bus stations found: {len(rows)}")
    print(f"English updates needed: {len(eng_updates)}")
    print(f"Tamil suffix updates: {len(tam_updates)}")
    if eng_updates:
        print("Sample English change:")
        for target, rid, old in eng_updates[:3]:
            print(f" - id {rid}: '{old}' -> '{target}'")
    if tam_updates:
        print("Sample Tamil change:")
        for new_t, rid, old_t in tam_updates[:3]:
            print(f" - id {rid}: '{old_t}' -> '{new_t}'")

    resp = input("Apply updates? (yes/no): ").strip().lower()
    if resp != 'yes':
        print("Cancelled.")
        cursor.close(); conn.close();
        return

    # Apply English updates
    for target, rid, _ in eng_updates:
        cursor.execute("UPDATE locations SET name=%s, updated_at=NOW() WHERE id=%s", (target, rid))
    # Apply Tamil updates
    for new_t, rid, _ in tam_updates:
        cursor.execute(
            "UPDATE translations SET translated_value=%s, updated_at=NOW() WHERE entity_type='location' AND language_code='ta' AND field_name='name' AND entity_id=%s",
            (new_t, rid)
        )
    conn.commit()
    print("✅ Updates applied.")
    cursor.close(); conn.close()


if __name__ == '__main__':
    main()
