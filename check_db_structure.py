#!/usr/bin/env python3
"""
Check database structure and content
"""
import mysql.connector
import sys

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'database': 'perundhu',
}

try:
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Show tables
    print("\n📋 Tables in database 'perundhu':")
    print("=" * 50)
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    if not tables:
        print("No tables found in database!")
    else:
        for table in tables:
            table_name = table[0]
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"  • {table_name:30s} ({count:5d} rows)")
    
    print("\n" + "=" * 50)
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as e:
    print(f"MySQL Error: {e}")
    sys.exit(1)
