#!/usr/bin/env python3
"""Check database state as root user"""

import mysql.connector
import sys

try:
    print("🔐 Connecting as root...")
    connection = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='root',
        password='root'
    )
    
    print("✅ Connected as root!\n")
    cursor = connection.cursor()
    
    print("📋 MySQL Users:")
    cursor.execute("SELECT user, host FROM mysql.user;")
    for row in cursor.fetchall():
        print(f"   - {row[0]}@{row[1]}")
    
    print("\n📋 Databases:")
    cursor.execute("SHOW DATABASES;")
    for row in cursor.fetchall():
        print(f"   - {row[0]}")
    
    print("\n📋 Checking perundhu_user:")
    cursor.execute("SELECT user, host, authentication_string FROM mysql.user WHERE user='perundhu_user';")
    result = cursor.fetchone()
    if result:
        print(f"   ✅ User exists")
        print(f"   Host: {result[1]}")
        print(f"   Auth: {result[2][:20]}..." if result[2] else "   Auth: None")
    else:
        print(f"   ❌ User 'perundhu_user' does not exist - NEED TO CREATE IT!")
    
    print("\n📋 Checking perundhu database:")
    cursor.execute("SHOW DATABASES LIKE 'perundhu';")
    result = cursor.fetchone()
    if result:
        print(f"   ✅ Database 'perundhu' exists")
    else:
        print(f"   ❌ Database 'perundhu' does not exist - NEED TO CREATE IT!")
    
    cursor.close()
    connection.close()
    
except mysql.connector.Error as err:
    print(f"❌ Error: {err}")
    sys.exit(1)
