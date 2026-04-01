#!/usr/bin/env python3
"""
Update Tamil translations for ALL locations in local MySQL database using Google Translate API
"""
import mysql.connector
import sys
import os
import getpass
import time
from datetime import datetime
from pathlib import Path

# Add scripts directory to path to import tamil_translator
sys.path.insert(0, str(Path(__file__).parent / 'scripts'))

try:
    from tamil_translator import TamilTranslator
except ImportError:
    print("❌ Error: Could not import tamil_translator module")
    print("Make sure scripts/tamil_translator.py exists")
    sys.exit(1)

# Local MySQL connection config
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'database': 'perundhu',
    'charset': 'utf8mb4'
}


def update_all_translations(batch_size=100, delay_seconds=0.1):
    """
    Connect to local MySQL and update ALL location translations using Google Translate API
    
    Args:
        batch_size: Number of locations to process before saving cache
        delay_seconds: Delay between API calls to avoid rate limiting
    """
    
    print("=" * 80)
    print("UPDATING ALL TAMIL TRANSLATIONS IN LOCAL MYSQL DATABASE")
    print("=" * 80)
    print()
    
    # Initialize translator with API support
    print("🔧 Initializing Tamil Translator with Google Translate API...")
    translator = TamilTranslator(use_api=True)
    
    if not translator.use_api or not translator.translator:
        print("⚠️  WARNING: API not available, will only use offline dictionary")
        print("   To enable API translation, install: pip install deep-translator")
        response = input("   Continue with offline dictionary only? (y/n): ")
        if response.lower() != 'y':
            print("Aborted.")
            sys.exit(0)
    else:
        print("✅ Google Translate API initialized successfully")
    
    print()
    
    try:
        # Connect to database
        print(f"📊 Connecting to MySQL database at {DB_CONFIG['host']}:{DB_CONFIG['port']}...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        print("✅ Connected successfully!")
        print()
        
        # Get locations that need translation
        print("🔍 Fetching locations without Tamil translation...")
        cursor.execute("""
            SELECT l.id, l.name
            FROM locations l
            LEFT JOIN translations t ON t.entity_id = l.id 
                AND t.entity_type = 'location' 
                AND t.language_code = 'ta'
                AND t.field_name = 'name'
            WHERE t.id IS NULL
            ORDER BY l.id
        """)
        locations_to_translate = cursor.fetchall()
        
        print(f"✅ Found {len(locations_to_translate)} locations needing translation")
        print()
        
        if len(locations_to_translate) == 0:
            print("ℹ️  All locations already have translations!")
            cursor.close()
            conn.close()
            return
        
        # Ask for confirmation
        print(f"⚠️  This will translate {len(locations_to_translate):,} locations using Google Translate API")
        if translator.use_api:
            estimated_time = len(locations_to_translate) * delay_seconds / 60
            print(f"   Estimated time: ~{estimated_time:.1f} minutes (with {delay_seconds}s delay between calls)")
        print()
        response = input("Continue? (y/n): ")
        if response.lower() != 'y':
            print("Aborted.")
            cursor.close()
            conn.close()
            return
        
        print()
        print("🔄 Starting translation process...")
        print("-" * 80)
        
        # Statistics
        stats = {
            'total': len(locations_to_translate),
            'inserted': 0,
            'failed': 0,
            'skipped': 0
        }
        
        start_time = time.time()
        
        for idx, location in enumerate(locations_to_translate, 1):
            location_id = location['id']
            location_name = location['name']
            
            # Get Tamil translation
            tamil_translation = translator.translate_location(location_name)
            
            if not tamil_translation:
                print(f"⚠️  [{idx:5d}/{stats['total']:5d}] ID {location_id:6d} | {location_name:45s} | Translation failed")
                stats['failed'] += 1
                continue
            
            # Insert translation into database
            try:
                cursor.execute("""
                    INSERT INTO translations 
                    (entity_type, entity_id, language_code, field_name, translated_value, created_at, updated_at)
                    VALUES ('location', %s, 'ta', 'name', %s, %s, %s)
                """, (location_id, tamil_translation, datetime.now(), datetime.now()))
                
                conn.commit()
                
                print(f"✅ [{idx:5d}/{stats['total']:5d}] ID {location_id:6d} | {location_name:45s} | {tamil_translation}")
                stats['inserted'] += 1
                
            except mysql.connector.Error as e:
                print(f"❌ [{idx:5d}/{stats['total']:5d}] ID {location_id:6d} | {location_name:45s} | DB Error: {e}")
                stats['failed'] += 1
                continue
            
            # Save cache periodically
            if idx % batch_size == 0:
                translator.save_cache()
                elapsed = time.time() - start_time
                rate = idx / elapsed if elapsed > 0 else 0
                remaining = stats['total'] - idx
                eta_seconds = remaining / rate if rate > 0 else 0
                print(f"💾 Cache saved. Progress: {idx}/{stats['total']} ({idx*100//stats['total']}%) | "
                      f"Rate: {rate:.1f}/s | ETA: {eta_seconds/60:.1f} min")
            
            # Delay to avoid rate limiting (only if using API)
            if translator.use_api and delay_seconds > 0:
                time.sleep(delay_seconds)
        
        # Final cache save
        print()
        print("💾 Saving final cache...")
        translator.save_cache()
        
        # Print summary
        elapsed_time = time.time() - start_time
        print()
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Total locations:        {stats['total']:6d}")
        print(f"✅ Translated:          {stats['inserted']:6d}")
        print(f"❌ Failed:              {stats['failed']:6d}")
        print(f"⏱️  Time taken:          {elapsed_time/60:.1f} minutes")
        print(f"📊 Rate:                {stats['inserted']/elapsed_time:.1f} translations/sec")
        print("=" * 80)
        print()
        
        if stats['inserted'] > 0:
            print("✅ Database updated successfully!")
            print(f"💾 Cache saved to: {translator.cache_file}")
        
        # Close connection
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"\n❌ MySQL Error: {e}")
        print("\nMake sure:")
        print("  1. MySQL is running")
        print("  2. Database 'perundhu' exists")
        print("  3. Connection details are correct")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Translation interrupted by user")
        print("💾 Saving cache...")
        translator.save_cache()
        cursor.close()
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Update Tamil translations for ALL locations using Google Translate API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Translate all locations with default settings
  python3 update_all_translations.py

  # Use custom MySQL credentials
  python3 update_all_translations.py --user myuser --password mypass

  # Adjust rate limiting (faster, but may hit API limits)
  python3 update_all_translations.py --delay 0.05

  # Process in larger batches before saving cache
  python3 update_all_translations.py --batch-size 500
        """
    )
    
    parser.add_argument('--user', '-u', help='MySQL username (default: root)', 
                        default='root')
    parser.add_argument('--password', '-p', help='MySQL password (default: root)', 
                        default='root')
    parser.add_argument('--host', help='MySQL host (default: localhost)', 
                        default='localhost')
    parser.add_argument('--port', type=int, help='MySQL port (default: 3306)', 
                        default=3306)
    parser.add_argument('--database', '-d', help='Database name (default: perundhu)', 
                        default='perundhu')
    parser.add_argument('--batch-size', '-b', type=int, 
                        help='Number of translations to process before saving cache (default: 100)',
                        default=100)
    parser.add_argument('--delay', type=float,
                        help='Delay in seconds between API calls to avoid rate limiting (default: 0.1)',
                        default=0.1)
    
    args = parser.parse_args()
    
    # Update DB_CONFIG with command line arguments
    DB_CONFIG['user'] = args.user
    DB_CONFIG['password'] = args.password
    DB_CONFIG['host'] = args.host
    DB_CONFIG['port'] = args.port
    DB_CONFIG['database'] = args.database
    
    update_all_translations(batch_size=args.batch_size, delay_seconds=args.delay)
