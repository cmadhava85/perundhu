#!/usr/bin/env python3
"""
Repair preprod Flyway schema history
Removes the failed V119 migration so it can be re-run with the fixed version
"""
import mysql.connector
import sys

config = {
    'host': '127.0.0.1',
    'port': 3308,  # Preprod proxy on port 3308
    'user': 'perundhu_user',
    'password': '-2*{tJEaes>w<qk<)6Uzdx:)<=&Z?C$:',
    'database': 'perundhu',
}

try:
    print("🔌 Connecting to preprod database...")
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    # Check if failed V119 migration exists
    print("🔍 Checking for failed V119 migration...")
    cursor.execute("""
        SELECT version, description, success, installed_on 
        FROM flyway_schema_history 
        WHERE version = '119'
    """)
    v119_records = cursor.fetchall()
    
    if not v119_records:
        print("✅ No V119 migration found in schema history")
        sys.exit(0)
    
    print(f"\n📊 Found {len(v119_records)} V119 record(s):")
    for record in v119_records:
        version, description, success, installed_on = record
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"  {status} - Version: {version}, Description: {description}, Installed: {installed_on}")
    
    # Delete failed migrations
    print("\n🗑️  Deleting failed V119 migration(s)...")
    cursor.execute("""
        DELETE FROM flyway_schema_history 
        WHERE version = '119' 
        AND success = 0
    """)
    deleted_count = cursor.rowcount
    conn.commit()
    
    print(f"✅ Deleted {deleted_count} failed migration record(s)")
    
    # Verify cleanup
    print("\n🔍 Verifying cleanup...")
    cursor.execute("""
        SELECT version, description, success 
        FROM flyway_schema_history 
        WHERE version >= '118' 
        ORDER BY installed_rank DESC 
        LIMIT 5
    """)
    recent_migrations = cursor.fetchall()
    
    print("\n📋 Recent migrations:")
    for migration in recent_migrations:
        version, description, success = migration
        status = "✅" if success else "❌"
        print(f"  {status} V{version}: {description}")
    
    print("\n✅ Preprod Flyway schema history repaired successfully!")
    print("🚀 You can now redeploy preprod - V119 will run with the fixed version")
    
except mysql.connector.Error as e:
    print(f"❌ Database error: {e}")
    print("\n💡 Make sure Cloud SQL Proxy is running:")
    print("   ./cloud_sql_proxy astute-strategy-406601:us-central1:perundhu-preprod-mysql-us --port 3308")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
        print("\n🔌 Database connection closed")
