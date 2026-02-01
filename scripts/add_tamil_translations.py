#!/usr/bin/env python3
"""Add Tamil translations for existing locations and buses"""

import os
import sys
import mysql.connector
from pathlib import Path

# Add parent directory to path to import tamil_translator
sys.path.insert(0, str(Path(__file__).parent))

try:
    from tamil_translator import TamilTranslator
    TRANSLATION_AVAILABLE = True
except ImportError:
    print("⚠️  Tamil translator not available")
    TRANSLATION_AVAILABLE = False
    sys.exit(1)


def add_translations():
    """Add Tamil translations for locations and buses"""
    
    db_config = {
        'host': os.getenv('DB_HOST_PREPROD', '127.0.0.1'),
        'port': int(os.getenv('DB_PORT_PREPROD', '3307')),
        'user': os.getenv('DB_USER_PREPROD', 'perundhu_user'),
        'password': os.getenv('DB_PASSWORD_PREPROD'),
        'database': os.getenv('DB_NAME_PREPROD', 'perundhu')
    }
    
    print("🔗 Connecting to database...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    print(f"✅ Connected to: {db_config['database']}")
    
    translator = TamilTranslator()
    
    # Batch insert translation query
    translation_query = """
        INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            translated_value = VALUES(translated_value),
            updated_at = NOW()
    """
    
    # ========================
    # Location translations
    # ========================
    print("\n📍 Processing location translations...")
    cursor.execute("SELECT id, name FROM locations")
    locations = cursor.fetchall()
    print(f"   Found {len(locations)} locations")
    
    location_translations = []
    for loc_id, name in locations:
        tamil_text = translator.translate(name)
        if tamil_text and tamil_text != name:
            location_translations.append(('location', loc_id, 'ta', 'name', tamil_text))
    
    if location_translations:
        print(f"   Inserting {len(location_translations)} location translations...")
        cursor.executemany(translation_query, location_translations)
        conn.commit()
        print(f"   ✅ Added {len(location_translations)} location translations")
    else:
        print("   No translations to add")
    
    # ========================
    # Bus translations
    # ========================
    print("\n🚌 Processing bus translations...")
    cursor.execute("SELECT id, name FROM buses")
    buses = cursor.fetchall()
    print(f"   Found {len(buses)} buses")
    
    bus_translations = []
    for bus_id, name in buses:
        tamil_text = translator.translate(name)
        if tamil_text and tamil_text != name:
            bus_translations.append(('bus', bus_id, 'ta', 'name', tamil_text))
    
    if bus_translations:
        print(f"   Inserting {len(bus_translations)} bus translations...")
        cursor.executemany(translation_query, bus_translations)
        conn.commit()
        print(f"   ✅ Added {len(bus_translations)} bus translations")
    else:
        print("   No translations to add")
    
    cursor.close()
    conn.close()
    
    print("\n🎉 Translation complete!")
    print(f"   Location translations: {len(location_translations)}")
    print(f"   Bus translations: {len(bus_translations)}")
    print(f"   Total: {len(location_translations) + len(bus_translations)}")


if __name__ == '__main__':
    add_translations()
