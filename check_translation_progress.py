#!/usr/bin/env python3
"""Monitor translation progress in real-time"""
import mysql.connector
import time
import sys

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'database': 'perundhu'
}

def check_progress():
    """Check and display translation progress"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Get statistics
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT l.id) as total_locations,
                COUNT(DISTINCT t.entity_id) as translated_locations
            FROM locations l
            LEFT JOIN translations t ON t.entity_id = l.id 
                AND t.entity_type = 'location' 
                AND t.language_code = 'ta'
        """)
        stats = cursor.fetchone()
        
        total = stats['total_locations']
        translated = stats['translated_locations']
        remaining = total - translated
        percentage = (translated * 100.0 / total) if total > 0 else 0
        
        print("\n" + "=" * 70)
        print("TAMIL TRANSLATION PROGRESS")
        print("=" * 70)
        print(f"Total locations:          {total:,}")
        print(f"✅ Translated:            {translated:,} ({percentage:.1f}%)")
        print(f"⏳ Remaining:             {remaining:,}")
        print("=" * 70)
        
        # Progress bar
        bar_width = 50
        filled = int(bar_width * percentage / 100)
        bar = "█" * filled + "░" * (bar_width - filled)
        print(f"\n[{bar}] {percentage:.1f}%\n")
        
        # Get latest 5 translations
        cursor.execute("""
            SELECT l.name, t.translated_value, t.created_at
            FROM translations t
            JOIN locations l ON l.id = t.entity_id
            WHERE t.entity_type = 'location' AND t.language_code = 'ta'
            ORDER BY t.created_at DESC
            LIMIT 5
        """)
        
        latest = cursor.fetchall()
        if latest:
            print("Latest translations:")
            print("-" * 70)
            for row in latest:
                print(f"  {row['name']:40s} → {row['translated_value']}")
        
        cursor.close()
        conn.close()
        
        return percentage >= 100
        
    except mysql.connector.Error as e:
        print(f"Error: {e}")
        return False

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Monitor translation progress')
    parser.add_argument('--watch', '-w', action='store_true',
                        help='Watch mode: update every 10 seconds')
    parser.add_argument('--interval', '-i', type=int, default=10,
                        help='Update interval in seconds (default: 10)')
    
    args = parser.parse_args()
    
    if args.watch:
        print("Watching translation progress (Ctrl+C to stop)...")
        try:
            while True:
                # Clear screen
                print("\033[2J\033[H", end="")
                
                complete = check_progress()
                
                if complete:
                    print("\n🎉 Translation complete! All locations translated.")
                    break
                
                print(f"\nUpdating in {args.interval} seconds... (Press Ctrl+C to stop)")
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\n\nMonitoring stopped.")
            sys.exit(0)
    else:
        check_progress()
