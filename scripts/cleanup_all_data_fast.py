#!/usr/bin/env python3
"""Delete all data from production database - Fast version"""
import mysql.connector
import subprocess
import argparse

def get_db_password():
    result = subprocess.run(['gcloud', 'secrets', 'versions', 'access', 'latest', '--secret=db-password'], capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Failed to get password: {result.stderr}")
    return result.stdout.strip()

def cleanup_all_data(skip_confirmation=False):
    if not skip_confirmation:
        print("⚠️  WARNING: This will DELETE ALL DATA from production database!")
        response = input("Type 'DELETE ALL' to confirm: ")
        if response != "DELETE ALL":
            print("❌ Cancelled")
            return False
    
    password = get_db_password()
    conn = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=password,
        database='RECOVER_YOUR_DATA',
        auth_plugin='mysql_native_password'
    )
    cursor = conn.cursor()
    
    try:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        
        tables = ['bus_routes', 'buses', 'stops', 'translations', 'locations']
        
        for table in tables:
            print(f"🗑️  Deleting {table}...")
            try:
                cursor.execute(f"DELETE FROM {table}")
                print(f"   ✅ Deleted {cursor.rowcount} rows")
            except Exception as e:
                print(f"   ⚠️  Skipped (table may not exist): {e}")
        
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        conn.commit()
        
        print("\n✅ All data deleted successfully!")
        return True
    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--confirm", action="store_true")
    args = parser.parse_args()
    
    success = cleanup_all_data(skip_confirmation=args.confirm)
    exit(0 if success else 1)
