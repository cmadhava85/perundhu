#!/usr/bin/env python3
import subprocess
import mysql.connector

pwd = subprocess.check_output(
    ['gcloud', 'secrets', 'versions', 'access', 'latest', 
     '--secret=db-password', '--project=perundhu-prod-001'],
    text=True
).strip()

conn = mysql.connector.connect(
    host='127.0.0.1',
    port=3307,
    user='perundhu_user',
    password=pwd,
    database='RECOVER_YOUR_DATA'
)

c = conn.cursor()

print("=" * 70)
print("WHY DOES 'KCBT' FALL BACK TO OVERPASS API?")
print("=" * 70)

# 1. Check exact searches
print("\n1️⃣  CHECKING IF 'KCBT' EXISTS IN DATABASE:")
print("-" * 70)

searches = [
    ("%KCBT%", "name LIKE '%KCBT%'"),
    ("%Koyambedu%", "name LIKE '%Koyambedu%'"),
    ("%CMBT%", "name LIKE '%CMBT%'"),
    ("Chennai - CMBT%", "name LIKE 'Chennai - CMBT%'"),
]

for pattern, condition in searches:
    c.execute(f"SELECT COUNT(*) FROM locations WHERE {condition}")
    count = c.fetchone()[0]
    status = "✅ FOUND" if count > 0 else "❌ NOT FOUND"
    print(f"  {condition:<40} : {status} ({count} records)")

# 2. Show Chennai bus terminals that DO exist
print("\n2️⃣  CHENNAI BUS TERMINALS THAT EXIST IN DATABASE:")
print("-" * 70)

c.execute("""
    SELECT id, name, alias 
    FROM locations 
    WHERE name LIKE '%Chennai%' 
      AND (name LIKE '%Bus%' OR name LIKE '%Terminal%' OR name LIKE '%CMBT%' OR name LIKE '%Koyambedu%')
    LIMIT 10
""")

results = c.fetchall()
if results:
    for id, name, alias in results:
        alias_str = f" (alias: {alias})" if alias else ""
        print(f"  ID {id}: {name}{alias_str}")
else:
    print("  ❌ No Chennai bus terminals found!")

# 3. Check aliases
print("\n3️⃣  CHECKING ALIASES FOR 'KCBT':")
print("-" * 70)

c.execute("SELECT COUNT(*) FROM locations WHERE alias LIKE '%KCBT%'")
alias_count = c.fetchone()[0]
print(f"  Locations with 'KCBT' in alias: {alias_count}")

if alias_count > 0:
    c.execute("SELECT id, name, alias FROM locations WHERE alias LIKE '%KCBT%' LIMIT 5")
    for id, name, alias in c.fetchall():
        print(f"    ID {id}: {name} (alias: {alias})")

# 4. Simulate the actual search
print("\n4️⃣  SIMULATING API searchLocationsByName('KCBT'):")
print("-" * 70)

query = "KCBT"
c.execute("SELECT id, name FROM locations WHERE name LIKE CONCAT('%', %s, '%') LIMIT 10", (query,))
name_results = c.fetchall()

c.execute("SELECT id, name, alias FROM locations WHERE alias LIKE CONCAT('%', %s, '%') LIMIT 10", (query,))
alias_results = c.fetchall()

total_results = len(name_results) + len(alias_results)

print(f"  Name search results: {len(name_results)}")
print(f"  Alias search results: {len(alias_results)}")
print(f"  TOTAL RESULTS: {total_results}")

if total_results == 0:
    print("\n  ⚠️  THIS IS WHY IT FALLS BACK TO OVERPASS API!")
    print("  The database search returns EMPTY, so the autocomplete")
    print("  endpoint calls the slow external Overpass API.")

# 5. Suggest fix
print("\n5️⃣  RECOMMENDED FIX:")
print("-" * 70)

c.execute("""
    SELECT id, name 
    FROM locations 
    WHERE name LIKE '%Koyambedu%' OR name LIKE '%CMBT%'
    ORDER BY name
    LIMIT 3
""")

similar = c.fetchall()
if similar:
    print("  Add 'KCBT' as an ALIAS to existing locations:")
    for id, name in similar:
        print(f"    UPDATE locations SET alias='KCBT' WHERE id={id}; -- {name}")
else:
    print("  No similar locations found to add alias to.")

conn.close()

print("\n" + "=" * 70)
