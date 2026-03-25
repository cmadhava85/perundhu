#!/usr/bin/env python3
"""
Bulk Tamil translation for PRODUCTION database
Translates all location names using Google Translate with caching
"""

import os
import sys
import mysql.connector
import json
import time
import subprocess
from pathlib import Path
from typing import List, Dict


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


def load_cache() -> Dict[str, str]:
    """Load translation cache"""
    cache_file = Path('data/translation_cache.json')
    if cache_file.exists():
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}


def save_cache(cache: Dict[str, str]):
    """Save translation cache"""
    cache_file = Path('data/translation_cache.json')
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_file, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    print(f"💾 Cache saved: {len(cache)} entries")


def translate_batch(texts: List[str], cache: Dict[str, str]) -> Dict[str, str]:
    """Translate a batch of texts using free Google Translate"""
    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source='en', target='ta')
    except ImportError:
        print("❌ ERROR: deep-translator not installed")
        print("   Run: pip install deep-translator")
        sys.exit(1)
    
    results = {}
    to_translate = []
    
    # Check cache first
    for text in texts:
        key = text.lower().strip()
        if key in cache:
            results[text] = cache[key]
            print(f"   📚 Cache hit: {text} → {cache[key]}")
        else:
            to_translate.append(text)
    
    print(f"\n   📊 Cache hits: {len(results)}, API calls needed: {len(to_translate)}")
    
    # Translate uncached items in batches
    for i, text in enumerate(to_translate):
        try:
            print(f"   🌐 Translating ({i+1}/{len(to_translate)}): {text}...", end=' ')
            tamil = translator.translate(text)
            results[text] = tamil
            cache[text.lower().strip()] = tamil
            print(f"→ {tamil}")
            
            # Rate limiting and progress saves
            if (i + 1) % 50 == 0:
                print(f"\n   ⏸️  Pausing for rate limit...")
                time.sleep(2)  # Longer pause every 50 requests
                save_cache(cache)  # Save progress
            elif i > 0 and i % 10 == 0:
                time.sleep(0.5)  # Small pause every 10 requests
            
        except Exception as e:
            print(f"⚠️  FAILED: {e}")
            results[text] = None
            time.sleep(2)  # Back off on error
    
    return results


def bulk_translate_production():
    """Bulk translate all locations in production database"""
    
    print("=" * 70)
    print("BULK TAMIL TRANSLATION - PRODUCTION DATABASE")
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
    db_config = {
        'host': '127.0.0.1',
        'port': 3307,
        'user': username,
        'password': password,
        'database': 'perundhu',
    }
    
    try:
        print(f"\n🔗 Connecting to production database...")
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print("✅ Connected successfully!")
        
        # Load cache
        cache = load_cache()
        print(f"📚 Loaded cache with {len(cache)} entries")
        
        # Get unique location names
        print("\n📍 Fetching all location names from production...")
        cursor.execute("SELECT DISTINCT name FROM locations ORDER BY name")
        all_names = [row[0] for row in cursor.fetchall()]
        print(f"   Found {len(all_names)} unique location names")
        
        # Filter out already cached
        uncached = [name for name in all_names if name.lower().strip() not in cache]
        print(f"   Already cached: {len(all_names) - len(uncached)}")
        print(f"   Need translation: {len(uncached)}")
        
        if uncached:
            print(f"\n🌐 Starting Google Translate API calls for {len(uncached)} locations...")
            print("   (This will take several minutes...)")
            print()
            translations = translate_batch(uncached, cache)
            save_cache(cache)
            print(f"\n✅ Translation complete!")
        else:
            print("\n✅ All locations already in cache!")
        
        # Insert/update translations in database
        print("\n📤 Inserting Tamil translations into production database...")
        
        # Get all locations with their IDs
        cursor.execute("SELECT id, name FROM locations ORDER BY id")
        locations = cursor.fetchall()
        
        translation_query = """
            INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                translated_value = VALUES(translated_value),
                updated_at = NOW()
        """
        
        batch = []
        inserted = 0
        skipped = 0
        
        for loc_id, name in locations:
            key = name.lower().strip()
            if key in cache and cache[key]:
                tamil_name = cache[key]
                # Only insert if it's actually different from English
                if tamil_name != name:
                    batch.append(('location', loc_id, 'ta', 'name', tamil_name))
                else:
                    skipped += 1
                
                if len(batch) >= 500:
                    cursor.executemany(translation_query, batch)
                    conn.commit()
                    inserted += len(batch)
                    print(f"   ✅ Inserted {inserted} translations...")
                    batch = []
        
        # Insert remaining
        if batch:
            cursor.executemany(translation_query, batch)
            conn.commit()
            inserted += len(batch)
        
        print(f"\n🎉 Translation Complete!")
        print(f"   Inserted/Updated: {inserted} Tamil translations")
        print(f"   Skipped (same as English): {skipped}")
        print(f"   Total locations: {len(locations)}")
        
        # Verify results
        print("\n🔍 Verifying results...")
        cursor.execute("""
            SELECT COUNT(DISTINCT t.entity_id) 
            FROM translations t
            WHERE t.entity_type = 'location' AND t.language_code = 'ta'
        """)
        count = cursor.fetchone()[0]
        print(f"   ✅ Database now has {count} locations with Tamil translations")
        
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
    print("✅ Bulk translation complete!")
    print("=" * 70)
    print("\n💡 Next: Test Tamil search on https://perundhu.com")
    print("   Try searching: சென்னை → மதுரை")


if __name__ == '__main__':
    bulk_translate_production()
