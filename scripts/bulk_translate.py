#!/usr/bin/env python3
"""
Fast bulk Tamil translation using free Google Translate
Optimized for large datasets with batching, caching, and rate limiting
"""

import os
import sys
import mysql.connector
import json
import time
from pathlib import Path
from typing import List, Tuple, Dict, Optional


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


def translate_batch(texts: List[str], cache: Dict[str, str]) -> Dict[str, str]:
    """Translate a batch of texts using free Google Translate"""
    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source='en', target='ta')
    except ImportError:
        print("❌ pip install deep-translator")
        sys.exit(1)
    
    results = {}
    to_translate = []
    
    # Check cache first
    for text in texts:
        key = text.lower().strip()
        if key in cache:
            results[text] = cache[key]
        else:
            to_translate.append(text)
    
    print(f"   📚 Cache hits: {len(results)}, API calls needed: {len(to_translate)}")
    
    # Translate uncached items
    for i, text in enumerate(to_translate):
        try:
            tamil = translator.translate(text)
            results[text] = tamil
            cache[text.lower().strip()] = tamil
            
            if (i + 1) % 100 == 0:
                print(f"   ✅ Translated {i + 1}/{len(to_translate)}")
                time.sleep(0.5)  # Rate limit
            
            if (i + 1) % 500 == 0:
                save_cache(cache)
                print(f"   💾 Cache saved ({len(cache)} entries)")
        except Exception as e:
            print(f"   ⚠️  Failed: '{text}': {e}")
            results[text] = None
            time.sleep(1)  # Back off on error
    
    return results


def bulk_translate():
    """Bulk translate all locations and buses"""
    
    db_config = {
        'host': os.getenv('DB_HOST_PREPROD', '127.0.0.1'),
        'port': int(os.getenv('DB_PORT_PREPROD', '3307')),
        'user': os.getenv('DB_USER_PREPROD', 'perundhu_user'),
        'password': os.getenv('DB_PASSWORD_PREPROD'),
        'database': os.getenv('DB_NAME_PREPROD', 'perundhu')
    }
    
    if not db_config['password']:
        print("❌ DB_PASSWORD_PREPROD not set")
        sys.exit(1)
    
    print("🔗 Connecting to database...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    print(f"✅ Connected to: {db_config['database']}")
    
    cache = load_cache()
    print(f"📚 Loaded cache with {len(cache)} entries")
    
    # Get unique location names (deduplicate to minimize API calls)
    print("\n📍 Fetching unique location names...")
    cursor.execute("SELECT DISTINCT name FROM locations")
    all_names = [row[0] for row in cursor.fetchall()]
    print(f"   Found {len(all_names)} unique location names")
    
    # Filter out already cached
    uncached = [name for name in all_names if name.lower().strip() not in cache]
    print(f"   Uncached: {len(uncached)}")
    
    if uncached:
        print(f"\n🌐 Translating {len(uncached)} names via Google Translate...")
        translations = translate_batch(uncached, cache)
        save_cache(cache)
        print(f"💾 Final cache: {len(cache)} entries")
    
    # Now insert translations
    print("\n📤 Inserting translations into database...")
    
    # Get all locations with their IDs
    cursor.execute("SELECT id, name FROM locations")
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
    
    for loc_id, name in locations:
        key = name.lower().strip()
        if key in cache and cache[key] and cache[key] != name:
            batch.append(('location', loc_id, 'ta', 'name', cache[key]))
            
            if len(batch) >= 1000:
                cursor.executemany(translation_query, batch)
                conn.commit()
                inserted += len(batch)
                print(f"   ✅ Inserted {inserted} translations...")
                batch = []
    
    if batch:
        cursor.executemany(translation_query, batch)
        conn.commit()
        inserted += len(batch)
    
    print(f"\n🎉 Complete! Inserted {inserted} location translations")
    
    cursor.close()
    conn.close()


if __name__ == '__main__':
    bulk_translate()
