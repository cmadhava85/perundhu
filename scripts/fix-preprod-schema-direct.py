#!/usr/bin/env python3
"""
Direct schema fix for preprod Cloud SQL when Flyway migrations haven't been applied
Usage: python3 scripts/fix-preprod-schema-direct.py
"""

import subprocess
import sys

def run_sql_on_preprod(sql_query):
    """Execute SQL on preprod Cloud SQL via gcloud"""
    try:
        # Use gcloud sql query to execute directly
        process = subprocess.Popen(
            ['gcloud', 'sql', 'connect', 'perundhu-preprod-mysql', 
             '--user=perundhu_user', '--quiet'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(input=sql_query)
        
        if process.returncode != 0:
            print(f"❌ Error executing SQL: {stderr}")
            return False
            
        print(f"✅ SQL executed successfully")
        print(stdout)
        return True
        
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def main():
    print("🔧 Applying schema fixes to preprod Cloud SQL...")
    
    # Read the fix script
    try:
        with open('scripts/fix-preprod-schema.sql', 'r') as f:
            sql_script = f.read()
    except FileNotFoundError:
        print("❌ Script not found: scripts/fix-preprod-schema.sql")
        return 1
    
    print("\n📋 SQL to execute:")
    print("=" * 60)
    print(sql_script)
    print("=" * 60)
    
    # Prompt for confirmation
    response = input("\n⚠️  This will modify the preprod database. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("Aborted.")
        return 1
    
    # Execute the fix
    if run_sql_on_preprod(sql_script):
        print("\n✅ Schema fix applied successfully!")
        return 0
    else:
        print("\n❌ Failed to apply schema fix")
        return 1

if __name__ == '__main__':
    sys.exit(main())
