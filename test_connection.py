#!/usr/bin/env python3
import subprocess
import sys

# Get password from gcloud
try:
    password_result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password', '--project=astute-strategy-406601'],
        capture_output=True,
        text=True,
        timeout=10
    )
    password = password_result.stdout.strip()
    print(f"✅ Password retrieved: {password[:10]}...{password[-5:]}")
except Exception as e:
    print(f"❌ Failed to get password: {e}")
    sys.exit(1)

# Try importing mysql connector
try:
    import mysql.connector
    print("✅ mysql-connector-python is installed")
except ImportError:
    print("❌ mysql-connector-python not installed, trying pymysql...")
    try:
        import pymysql
        print("✅ pymysql is installed")
    except ImportError:
        print("❌ Neither mysql-connector-python nor pymysql is installed")
        sys.exit(1)

# Test connection with mysql.connector
try:
    import mysql.connector
    print("\nAttempting to connect to preprod database...")
    conn = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=password,
        database='perundhu'
    )
    cursor = conn.cursor()
    cursor.execute("SELECT DATABASE() as current_db, VERSION() as mysql_version;")
    result = cursor.fetchone()
    print(f"\n✅ CONNECTION SUCCESSFUL!")
    print(f"   Database: {result[0]}")
    print(f"   MySQL Version: {result[1]}")
    
    # Get table count
    cursor.execute("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'perundhu';")
    table_count = cursor.fetchone()[0]
    print(f"   Tables in database: {table_count}")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"\n❌ Connection failed: {e}")
    sys.exit(1)
