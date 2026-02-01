#!/usr/bin/env python3
"""
Fast Tamil Translation Script using deep-translator with parallel workers
Translates all untranslated location names to Tamil using multiple threads
"""

import os
import sys
import time
import json
import mysql.connector
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import queue

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

try:
    from deep_translator import GoogleTranslator
except ImportError:
    print("❌ deep-translator not installed. Installing now...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "deep-translator"])
    from deep_translator import GoogleTranslator


class ParallelTranslator:
    """Parallel translation service with thread-safe operations"""
    
    def __init__(self, num_workers=8, delay_seconds=0.2):
        """
        Args:
            num_workers: Number of parallel translation threads
            delay_seconds: Delay between API calls per worker (rate limiting)
        """
        self.num_workers = num_workers
        self.delay = delay_seconds
        self.translated_count = 0
        self.failed_count = 0
        self.lock = Lock()
        self.failed_translations = []
        
    def translate_batch(self, items, worker_id):
        """Translate a batch of items in one worker thread"""
        translator = GoogleTranslator(source='en', target='ta')
        results = []
        
        for item in items:
            location_id = item['id']
            location_name = item['name']
            
            try:
                # Rate limiting per worker
                time.sleep(self.delay)
                
                tamil_text = translator.translate(location_name)
                
                if tamil_text:
                    results.append({
                        'id': location_id,
                        'name': location_name,
                        'translation': tamil_text
                    })
                    
                    with self.lock:
                        self.translated_count += 1
                        
                        # Progress indicator
                        if self.translated_count % 50 == 0:
                            print(f"   ✅ Translated {self.translated_count} items...")
                else:
                    with self.lock:
                        self.failed_count += 1
                        self.failed_translations.append(location_name)
                        
            except Exception as e:
                with self.lock:
                    self.failed_count += 1
                    self.failed_translations.append(location_name)
                    if self.failed_count <= 10:
                        print(f"   ⚠️  Worker {worker_id}: Failed '{location_name}': {str(e)}")
        
        return results
    
    def translate_all(self, locations):
        """Translate all locations using parallel workers"""
        
        # Split work across workers
        chunk_size = len(locations) // self.num_workers
        if chunk_size == 0:
            chunk_size = len(locations)
        
        chunks = []
        for i in range(0, len(locations), chunk_size):
            chunks.append(locations[i:i + chunk_size])
        
        print(f"   🔧 Starting {len(chunks)} workers with {chunk_size} items each...")
        
        all_results = []
        
        with ThreadPoolExecutor(max_workers=self.num_workers) as executor:
            futures = []
            
            for worker_id, chunk in enumerate(chunks):
                future = executor.submit(self.translate_batch, chunk, worker_id)
                futures.append(future)
            
            # Collect results as they complete
            for future in as_completed(futures):
                try:
                    results = future.result()
                    all_results.extend(results)
                except Exception as e:
                    print(f"   ❌ Worker failed: {str(e)}")
        
        return all_results


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


def batch_insert_translations(conn, translation_results, batch_size=500):
    """Batch insert translations into database"""
    if not translation_results:
        return 0
    
    cursor = conn.cursor()
    
    query = """
        INSERT INTO translations (entity_type, entity_id, language_code, field_name, translated_value)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE translated_value = VALUES(translated_value)
    """
    
    total_inserted = 0
    
    # Process in batches
    for i in range(0, len(translation_results), batch_size):
        batch = translation_results[i:i + batch_size]
        
        values = [
            ('LOCATION', item['id'], 'ta', 'name', item['translation'])
            for item in batch
        ]
        
        cursor.executemany(query, values)
        conn.commit()
        
        total_inserted += len(batch)
        print(f"   💾 Saved batch {i // batch_size + 1}: {total_inserted}/{len(translation_results)} translations")
    
    cursor.close()
    return total_inserted


def save_progress(progress_file, completed_results):
    """Save progress to resume later"""
    with open(progress_file, 'w') as f:
        json.dump({
            'completed': [
                {'id': r['id'], 'name': r['name'], 'translation': r['translation']}
                for r in completed_results
            ]
        }, f, ensure_ascii=False, indent=2)


def load_progress(progress_file):
    """Load previous progress"""
    if os.path.exists(progress_file):
        with open(progress_file, 'r') as f:
            data = json.load(f)
            return data.get('completed', [])
    return []


def main():
    progress_file = 'translation_progress_fast.json'
    num_workers = 8  # Number of parallel workers
    delay_per_worker = 0.2  # Seconds delay between requests per worker
    
    print("🚀 Starting Fast Tamil Translation Process")
    print("=" * 60)
    print(f"⚙️  Configuration:")
    print(f"   Workers: {num_workers}")
    print(f"   Delay per worker: {delay_per_worker}s")
    print(f"   Estimated speed: ~{num_workers / delay_per_worker:.0f} translations/second")
    print("=" * 60)
    
    # Load previous progress
    completed_results = load_progress(progress_file)
    completed_ids = set(r['id'] for r in completed_results)
    
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
    print(f"   Found {total:,} locations to translate")
    
    if total == 0:
        print("✅ All locations already translated!")
        conn.close()
        return
    
    # Estimate time (much faster with parallel workers)
    estimated_seconds = (total * delay_per_worker) / num_workers
    estimated_minutes = estimated_seconds / 60
    estimated_hours = estimated_minutes / 60
    
    if estimated_hours > 1:
        print(f"   ⏱️  Estimated time: {estimated_hours:.1f} hours")
    else:
        print(f"   ⏱️  Estimated time: {estimated_minutes:.1f} minutes")
    
    # Initialize parallel translator
    print(f"\n🌐 Starting parallel translation with {num_workers} workers...")
    translator = ParallelTranslator(num_workers=num_workers, delay_seconds=delay_per_worker)
    
    start_time = time.time()
    
    try:
        # Translate all locations in parallel
        results = translator.translate_all(locations)
        completed_results.extend(results)
        
        # Save to database
        print(f"\n💾 Saving {len(results):,} translations to database...")
        inserted = batch_insert_translations(conn, results)
        
        # Save progress
        save_progress(progress_file, completed_results)
        
    except KeyboardInterrupt:
        print("\n\n⏸️  Process interrupted by user")
        print(f"   Translated so far: {translator.translated_count}")
        
        # Save progress before exiting
        if completed_results:
            save_progress(progress_file, completed_results)
            print(f"   💾 Progress saved. Run again to resume.")
        
        conn.close()
        sys.exit(0)
    
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        
        # Save progress before exiting
        if completed_results:
            save_progress(progress_file, completed_results)
            print(f"   💾 Progress saved.")
        
        conn.close()
        raise
    
    # Final statistics
    elapsed = time.time() - start_time
    elapsed_minutes = elapsed / 60
    elapsed_hours = elapsed / 3600
    
    print("\n" + "=" * 60)
    print("🎉 Translation Complete!")
    print(f"   ✅ Successfully translated: {translator.translated_count:,}")
    print(f"   ⚠️  Failed: {translator.failed_count:,}")
    
    if elapsed_hours > 1:
        print(f"   ⏱️  Time taken: {elapsed_hours:.2f} hours")
    else:
        print(f"   ⏱️  Time taken: {elapsed_minutes:.1f} minutes")
    
    if translator.translated_count > 0:
        rate = translator.translated_count / elapsed
        print(f"   🚀 Average speed: {rate:.1f} translations/second")
    
    if translator.failed_translations:
        print(f"\n⚠️  Failed translations (first 20):")
        for failed in translator.failed_translations[:20]:
            print(f"     - {failed}")
        if len(translator.failed_translations) > 20:
            print(f"     ... and {len(translator.failed_translations) - 20} more")
    
    # Cleanup progress file
    if os.path.exists(progress_file):
        os.remove(progress_file)
        print(f"\n🗑️  Cleaned up progress file")
    
    conn.close()
    print("✅ Done!")


if __name__ == '__main__':
    main()
