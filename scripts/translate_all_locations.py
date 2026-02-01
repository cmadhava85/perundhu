#!/usr/bin/env python3
"""
Free Tamil Translation Script using deep-translator
Translates all untranslated location names to Tamil
"""

import os
import sys
import time
import json
import mysql.connector
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("❌ deep-translator not installed. Installing now...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "deep-translator"])
    from deep_translator import GoogleTranslator


class FreeTranslationService:
    """Free Google Translate service using deep-translator"""
    
    def __init__(self, delay_seconds=1.5):
        self.translator = GoogleTranslator(source='en', target='ta')
        self.delay = delay_seconds
        self.translated_count = 0
        self.failed_translations = []
    
    def translate(self, text):
        """Translate text with rate limiting"""
        try:
            # Rate limiting to avoid blocks
            time.sleep(self.delay)
            
            result = self.translator.translate(text)
            self.translated_count += 1
            
            # Progress indicator
            if self.translated_count % 10 == 0:
                print(f"   📝 Translated {self.translated_count} items...")
            
            return result
        except Exception as e:
            print(f"   ⚠️  Failed to translate '{text}': {str(e)}")
            self.failed_translations.append(text)
            return None


def get_db_connection():
    """Connect to preprod database"""
    return mysql.connector.connect(
        host=os.environ.get('DB_HOST_PREPROD', '127.0.0.1'),
        port=int(os.environ.get('DB_PORT_PREPROD', '3307')),
        user=os.environ.get('DB_USER_PREPROD', 'perundhu_user'),
        password=os.environ.get('DB_PASSWORD_PREPROD', 'PerundhuTest123456'),
        database=os.environ.get('DB_NAME_PREPROD', 'perundhu')
    )


def get_untranslated_locations(conn):
    """Get all location names that don't have Tamil translations"""
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT DISTINCT l.id, l.name
        FROM locations l
        LEFT JOIN translations t ON t.entity_type = 'LOCATION' 
            AND t.entity_id = l.id 
            AND t.language_code = 'ta'
            AND t.field_name = 'name'
        WHERE t.id IS NULL
        AND l.name IS NOT NULL
        AND l.name != ''
        ORDER BY l.name
    """
    
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    
    return results


def batch_insert_translations(conn, translations):
    """Batch insert translations into database"""
    if not translations:
        return 0
    
    cursor = conn.cursor()
    
    query = """
        INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE translated_value = VALUES(translated_value)
    """
    
    cursor.executemany(query, translations)
    conn.commit()
    
    count = cursor.rowcount
    cursor.close()
    
    return count


def save_progress(progress_file, completed_ids):
    """Save progress to resume later"""
    with open(progress_file, 'w') as f:
        json.dump({'completed_ids': list(completed_ids)}, f)


def load_progress(progress_file):
    """Load previous progress"""
    if os.path.exists(progress_file):
        with open(progress_file, 'r') as f:
            data = json.load(f)
            return set(data.get('completed_ids', []))
    return set()


def main():
    progress_file = 'translation_progress.json'
    batch_size = 100  # Insert every 100 translations
    
    print("🚀 Starting Free Tamil Translation Process")
    print("=" * 60)
    
    # Load previous progress
    completed_ids = load_progress(progress_file)
    if completed_ids:
        print(f"📂 Resuming... {len(completed_ids)} locations already translated")
    
    # Connect to database
    print("🔗 Connecting to database...")
    conn = get_db_connection()
    print(f"✅ Connected to: {conn.database}")
    
    # Get untranslated locations
    print("\n📍 Fetching untranslated locations...")
    locations = get_untranslated_locations(conn)
    
    # Filter out already completed
    locations = [loc for loc in locations if loc['id'] not in completed_ids]
    
    total = len(locations)
    print(f"   Found {total} locations to translate")
    
    if total == 0:
        print("✅ All locations already translated!")
        conn.close()
        return
    
    # Estimate time
    estimated_minutes = (total * 1.5) / 60
    print(f"   ⏱️  Estimated time: {estimated_minutes:.1f} minutes")
    print(f"   (Processing with 1.5 second delay to avoid rate limits)")
    
    # Initialize translator
    print("\n🌐 Starting translation...")
    translator = FreeTranslationService(delay_seconds=1.5)
    
    translation_batch = []
    start_time = time.time()
    
    try:
        for i, location in enumerate(locations, 1):
            location_id = location['id']
            location_name = location['name']
            
            # Translate
            tamil_text = translator.translate(location_name)
            
            if tamil_text:
                translation_batch.append((
                    'LOCATION',
                    location_id,
                    'ta',
                    'name',
                    tamil_text
                ))
                completed_ids.add(location_id)
            
            # Batch insert and save progress
            if len(translation_batch) >= batch_size:
                inserted = batch_insert_translations(conn, translation_batch)
                print(f"   ✅ Inserted batch of {inserted} translations ({i}/{total})")
                translation_batch = []
                save_progress(progress_file, completed_ids)
        
        # Insert remaining
        if translation_batch:
            inserted = batch_insert_translations(conn, translation_batch)
            print(f"   ✅ Inserted final batch of {inserted} translations")
            save_progress(progress_file, completed_ids)
    
    except KeyboardInterrupt:
        print("\n\n⏸️  Process interrupted by user")
        print(f"   Progress saved. Run again to resume from location {translator.translated_count + 1}")
        
        # Save any pending translations
        if translation_batch:
            inserted = batch_insert_translations(conn, translation_batch)
            print(f"   💾 Saved {inserted} pending translations")
            save_progress(progress_file, completed_ids)
        
        conn.close()
        sys.exit(0)
    
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        
        # Save progress before exiting
        if translation_batch:
            inserted = batch_insert_translations(conn, translation_batch)
            print(f"   💾 Saved {inserted} pending translations")
            save_progress(progress_file, completed_ids)
        
        conn.close()
        raise
    
    # Final statistics
    elapsed = time.time() - start_time
    elapsed_minutes = elapsed / 60
    
    print("\n" + "=" * 60)
    print("🎉 Translation Complete!")
    print(f"   ✅ Total translated: {translator.translated_count}")
    print(f"   ⚠️  Failed: {len(translator.failed_translations)}")
    print(f"   ⏱️  Time taken: {elapsed_minutes:.1f} minutes")
    
    if translator.failed_translations:
        print(f"\n⚠️  Failed translations:")
        for failed in translator.failed_translations[:10]:
            print(f"     - {failed}")
        if len(translator.failed_translations) > 10:
            print(f"     ... and {len(translator.failed_translations) - 10} more")
    
    # Cleanup progress file
    if os.path.exists(progress_file):
        os.remove(progress_file)
        print(f"\n🗑️  Cleaned up progress file")
    
    conn.close()
    print("✅ Done!")


if __name__ == '__main__':
    main()
