#!/usr/bin/env python3
"""Test IAM-based database connection"""

import mysql.connector
import subprocess
import sys

# Get IAM access token
print("🔐 Getting IAM access token...")
try:
    result = subprocess.run(
        ["gcloud", "auth", "print-access-token"],
        capture_output=True,
        text=True,
        timeout=10
    )
    
    if result.returncode != 0:
        print(f"❌ Failed to get access token: {result.stderr}")
        sys.exit(1)
    
    access_token = result.stdout.strip()
    print("✅ Access token obtained")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

# Connect using IAM token
print("\n🔐 Testing IAM-based connection...")
try:
    connection = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='cmadhava@gmail.com',
        password=access_token,
        database='perundhu',
        autocommit=True,
        connection_timeout=10
    )
    
    print("✅ IAM Connection successful!")
    
    cursor = connection.cursor()
    cursor.execute("SELECT VERSION();")
    version = cursor.fetchone()
    print(f"✅ MySQL Version: {version[0]}")
    
    cursor.execute("SELECT DATABASE();")
    db = cursor.fetchone()
    print(f"✅ Connected to database: {db[0]}")
    
    cursor.close()
    connection.close()
    
    print("\n" + "=" * 70)
    print("✅ IAM authentication is working!")
    print("=" * 70)
    sys.exit(0)
    
except mysql.connector.Error as err:
    print(f"❌ Database Error: {err}")
    print(f"   Error Code: {err.errno}")
    print(f"   SQLState: {err.sqlstate}")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
