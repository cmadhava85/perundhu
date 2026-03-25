#!/usr/bin/env python3
"""
Check Tamil translations in production database for Chennai and Madurai
"""
import mysql.connector
import sys
import os
import subprocess
import time
import signal

def get_db_credentials():
    """Retrieve database credentials from Secret Manager"""
    print("🔐 Retrieving credentials from Secret Manager...")
    try:
        username = subprocess.check_output([
            'gcloud', 'secrets', 'versions', 'access', 'latest',
            '--secret=db-username',
            '--project=perundhu-prod-001'
        ], text=True).strip()
        
        password = subprocess.check_output([
            'gcloud', 'secrets', 'versions', 'access', 'latest',
            '--secret=db-password',
            '--project=perundhu-prod-001'
        ], text=True).strip()
        
        print("✅ Credentials retrieved")
        return username, password
    except subprocess.CalledProcessError as e:
        print(f"❌ Error retrieving credentials: {e}")
        sys.exit(1)

def check_tamil_translations():
    """Check Tamil translations in production database"""
    
    print("=" * 70)
    print("TAMIL TRANSLATIONS CHECK - PRODUCTION DATABASE")
    print("=" * 70)
    print()
    
    # Get credentials
    username, password = get_db_credentials()
    
    # Kill existing proxies
    print("\n🧹 Cleaning up existing proxies...")
    subprocess.run(['pkill', '-f', 'cloud-sql-proxy.*3307'], 
                   stderr=subprocess.DEVNULL)
    time.sleep(2)
    
    # Start cloud-sql-proxy
    print("🔌 Starting Cloud SQL Proxy...")
    instance = "perundhu-prod-001:us-central1:perundhu-production-mysql-us"
    proxy_process = subprocess.Popen(
        ['cloud-sql-proxy', instance, '--port', '3307'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    print(f"   Proxy PID: {proxy_process.pid}")
    
    # Wait for proxy
    print("⏳ Waiting for proxy to be ready...")
    time.sleep(5)
    
    # Database config
    config = {
        'host': '127.0.0.1',
        'port': 3307,
        'user': username,
        'password': password,
        'database': 'perundhu',
    }
    
    try:
        print(f"\n📊 Connecting to database...")
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        print("✅ Connected successfully!")
        print()
        
        # Query 1: Check Chennai and Madurai specifically
        print("=" * 70)
        print("CHENNAI & MADURAI TAMIL TRANSLATIONS:")
        print("=" * 70)
        cursor.execute("""
            SELECT 
                l.id, 
                l.name as english_name, 
                t.translated_value as tamil_name,
                CASE 
                    WHEN t.translated_value IS NULL THEN '❌ MISSING'
                    ELSE '✅ EXISTS'
                END as status
            FROM locations l
            LEFT JOIN translations t ON t.entity_id = l.id 
                AND t.entity_type = 'location' 
                AND t.language_code = 'ta'
            WHERE l.name IN ('Chennai', 'Madurai')
            ORDER BY l.id
        """)
        
        results = cursor.fetchall()
        if results:
            print(f"\n{'ID':<6} {'English Name':<20} {'Tamil Name':<30} {'Status':<15}")
            print("-" * 70)
            for row in results:
                tamil = row[2] if row[2] else '---'
                print(f"{row[0]:<6} {row[1]:<20} {tamil:<30} {row[3]:<15}")
        else:
            print("❌ Chennai and Madurai not found in database!")
        
        # Query 2: Overall stats
        print("\n" + "=" * 70)
        print("OVERALL TAMIL TRANSLATION STATISTICS:")
        print("=" * 70)
        cursor.execute("""
            SELECT 
                COUNT(*) as total_locations,
                COUNT(DISTINCT t.entity_id) as locations_with_tamil,
                ROUND(COUNT(DISTINCT t.entity_id) * 100.0 / COUNT(*), 2) as percentage_with_tamil
            FROM locations l
            LEFT JOIN translations t ON t.entity_id = l.id 
                AND t.entity_type = 'location' 
                AND t.language_code = 'ta'
        """)
        
        stats = cursor.fetchone()
        print(f"\nTotal Locations:          {stats[0]}")
        print(f"With Tamil Translation:   {stats[1]}")
        print(f"Percentage:               {stats[2]}%")
        
        # Query 3: Sample locations with Tamil
        print("\n" + "=" * 70)
        print("SAMPLE LOCATIONS WITH TAMIL TRANSLATIONS (10 examples):")
        print("=" * 70)
        cursor.execute("""
            SELECT 
                l.id,
                l.name,
                t.translated_value as tamil_name
            FROM locations l
            INNER JOIN translations t ON t.entity_id = l.id 
                AND t.entity_type = 'location'
                AND t.language_code = 'ta'
            LIMIT 10
        """)
        
        samples = cursor.fetchall()
        if samples:
            print(f"\n{'ID':<6} {'English Name':<25} {'Tamil Name':<40}")
            print("-" * 70)
            for row in samples:
                print(f"{row[0]:<6} {row[1]:<25} {row[2]:<40}")
        else:
            print("❌ No locations with Tamil translations found!")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"\n❌ Database Error: {err}")
        sys.exit(1)
    finally:
        # Cleanup proxy
        print("\n🧹 Cleaning up proxy...")
        proxy_process.terminate()
        try:
            proxy_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proxy_process.kill()
    
    print("\n" + "=" * 70)
    print("✅ Check complete")
    print("=" * 70)

if __name__ == "__main__":
    check_tamil_translations()
