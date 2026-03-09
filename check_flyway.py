#!/usr/bin/env python3
import mysql.connector

config = {
    'host': '127.0.0.1',
    'port': 3307,
    'user': 'perundhu_user',
    'password': '%1zh}-U97!pEIuQvx@SuEC7[SzaTk)X#',
    'database': 'perundhu',
}

try:
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    cursor.execute("SHOW TABLES LIKE 'flyway_schema_history'")
    if cursor.fetchone():
        cursor.execute("SELECT version, description, success FROM flyway_schema_history WHERE version = '100'")
        v100 = cursor.fetchone()
        
        if v100:
            print("V100 WAS ATTEMPTED:")
            print(f"  Version: {v100[0]}")
            print(f"  Description: {v100[1]}")
            print(f"  Success: {'YES' if v100[2] else 'NO'}")
        else:
            print("V100 WAS NEVER ATTEMPTED - Migration hasn't run")
            cursor.execute("SELECT COUNT(*) FROM flyway_schema_history")
            total = cursor.fetchone()[0]
            print(f"Total migrations run: {total}")
    else:
        print("flyway_schema_history table doesn't exist - Flyway never ran")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        cursor.close()
        conn.close()
