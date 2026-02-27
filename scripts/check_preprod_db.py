#!/usr/bin/env python3
import mysql.connector
from mysql.connector import Error
import subprocess

def get_db_password():
    """Get database password from Secret Manager"""
    result = subprocess.run(
        ['gcloud', 'secrets', 'versions', 'access', 'latest', 
         '--secret=db-password', '--project=astute-strategy-406601'],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise Exception(f"Failed to get password: {result.stderr}")
    return result.stdout.strip()

print("🔑 Getting database password...")
password = get_db_password()

try:
    connection = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=password,
        database='',  # Connect without specific database first
        auth_plugin='mysql_native_password'
    )
    
    if connection.is_connected():
        cursor = connection.cursor()
        
        print("\n=== SHOWING ALL DATABASES ===")
        cursor.execute("SHOW DATABASES")
        databases = cursor.fetchall()
        for db in databases:
            print(f"  Database: {db[0]}")
        
        print("\n=== CHECKING 'perundhu' DATABASE ===")
        try:
            cursor.execute("USE perundhu")
            print("  ✅ Database 'perundhu' exists")
            
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"\n  Tables in 'perundhu':")
            for table in tables:
                print(f"    - {table[0]}")
                
        except Error as e:
            print(f"  ❌ Cannot use 'perundhu' database: {e}")
        
        print("\n=== CHECKING 'RECOVER_YOUR_DATA' DATABASE ===")
        try:
            cursor.execute("USE RECOVER_YOUR_DATA")
            print("  ✅ Database 'RECOVER_YOUR_DATA' exists")
            
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"\n  Tables in 'RECOVER_YOUR_DATA':")
            for table in tables:
                print(f"    - {table[0]}")
                
        except Error as e:
            print(f"  ❌ Cannot use 'RECOVER_YOUR_DATA' database: {e}")
        
        cursor.close()
        connection.close()
        
except Error as e:
    print(f"Error: {e}")
