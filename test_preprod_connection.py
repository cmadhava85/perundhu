#!/usr/bin/env python3
import pymysql
import subprocess

print("=" * 60)
print("DATABASE CONNECTION TEST - PREPROD")
print("=" * 60)
print("")

# Get password
print("1️⃣  Retrieving password from Secret Manager...")
pw_result = subprocess.run(
    ['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password', '--project=astute-strategy-406601'],
    capture_output=True,
    text=True,
    timeout=10
)
password = pw_result.stdout.strip()
print(f"   ✅ Password retrieved: {password[:10]}...{password[-5:]}")
print("")

# Connect
print("2️⃣  Connecting to preprod database...")
try:
    conn = pymysql.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=password,
        database='perundhu'
    )
    print("   ✅ Connection established")
    print("")
    
    cursor = conn.cursor()
    
    # Test basic query
    print("3️⃣  Running test query...")
    cursor.execute('SELECT DATABASE() as db, VERSION() as version')
    result = cursor.fetchone()
    print(f"   ✅ Database: {result[0]}")
    print(f"   ✅ MySQL Version: {result[1]}")
    print("")
    
    # Get table count
    print("4️⃣  Checking tables...")
    cursor.execute('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = "perundhu"')
    table_count = cursor.fetchone()[0]
    print(f"   ✅ Tables in database: {table_count}")
    print("")
    
    # List some tables
    print("5️⃣  Sample tables:")
    cursor.execute('SELECT table_name FROM information_schema.tables WHERE table_schema = "perundhu" LIMIT 10')
    tables = cursor.fetchall()
    for table in tables:
        print(f"      - {table[0]}")
    print("")
    
    # Get row counts for key tables
    print("6️⃣  Key table row counts:")
    key_tables = ['buses', 'locations', 'stops', 'reviews']
    for table in key_tables:
        try:
            cursor.execute(f'SELECT COUNT(*) FROM {table}')
            count = cursor.fetchone()[0]
            print(f"      - {table}: {count} rows")
        except:
            print(f"      - {table}: [table not found]")
    print("")
    
    cursor.close()
    conn.close()
    
    print("=" * 60)
    print("✅ CONNECTION TEST PASSED")
    print("=" * 60)
    print("")
    print("Summary:")
    print("  • Cloud SQL Proxy: ✅ Connected")
    print("  • Database User: ✅ perundhu_user@%")
    print("  • Database: ✅ perundhu")
    print("  • Query Execution: ✅ Working")
    print("  • Status: READY FOR PIPELINE")
    print("")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("")
    print("=" * 60)
    print("❌ CONNECTION TEST FAILED")
    print("=" * 60)
