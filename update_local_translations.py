#!/usr/bin/env python3
"""
Update Tamil translations for all locations in local MySQL database
"""
import mysql.connector
import sys
import os
import getpass
from datetime import datetime

# Tamil translation dictionary (from tamil_translator.py)
TAMIL_DICTIONARY = {
    'BROADWAY': 'பிராட்வே',
    'ANNA NAGAR': 'அண்ணா நகர்',
    'KOYAMBEDU': 'கோயம்பேடு',
    'POONAMALLEE': 'பூணமல்லி',
    'SALEM': 'சேலம்',
    'MADURAI': 'மதுரை',
    'COIMBATORE': 'கோயம்பூர்',
    'TIRUPPUR': 'திருப்பூர்',
    'ERODE': 'ஈரோடு',
    'TRICHY': 'திருச்சிராப்பள்ளி',
    'VILLUPURAM': 'விள்ளுப்புரம்',
    'KANCHIPURAM': 'காஞ்சிபுரம்',
    'TINDIVANAM': 'திண்டிவனம்',
    'CHENGALPATTU': 'சேஞ்சல்பட்டு',
    'VELLORE': 'வேலூர்',
    'RANIPET': 'ராணிப்பேட்டை',
    'HOSUR': 'ஹோசூர்',
    'UDHAGAMANDALAM': 'உதகமண்டலம்',
    'COONOOR': 'கூனூர்',
    'METTUPALAYAM': 'மேட்டுப்பாளையம்',
    'KODAIKANAL': 'கோடைக்கானல்',
    'DINDIGUL': 'திண்டுக்கல்',
    'PALANI': 'பழனி',
    'POLLACHI': 'பொள்ளாச்சி',
    'NAGERCOIL': 'நாகர்கோவில்',
    'KANYAKUMARI': 'கன்னியாகுமரி',
    'THOOTHUKUDI': 'தூத்துக்குடி',
    'VIRUDUNAGAR': 'விருதுநகர்',
    'SIVAKASI': 'சிவகாசி',
    'THENI': 'தேனி',
    'NAMAKKAL': 'நாமக்கல்',
    'KRISHNAGIRI': 'கிருஷ்ணகிரி',
    'PERAMBALUR': 'பெரம்பலூர்',
    'CUDDALORE': 'கடலூர்',
    'PUDUCHERRY': 'புதுச்சேரி',
    'PONDICHERRY': 'பாண்டிச்சேரி',
    'KARAIKAL': 'காரைக்கால்',
    'TIRUVANNAMALAI': 'திருவண்ணாமலை',
    'SRIPERUMBUDUR': 'சிறிபெரும்புதூர்',
    'TAMBARAM': 'தாம்பரம்',
    'AVADI': 'அவடி',
    'THIRUVALLUR': 'திருவள்ளூர்',
    'ALANDUR': 'ஆலந்துர்',
    'ASHOK NAGAR': 'அசோக் நகர்',
    'BESANT NAGAR': 'பேசன்ட் நகர்',
    'CHINTADRIPET': 'சிந்தாத்திரிப்பேட்',
    'DENNINGTON ROAD': 'டென்னிங்டன் சாலை',
    'GEORGE TOWN': 'ஜார்ஜ் டவுன்',
    'ADYAR': 'அடியார்',
    'MADRAS': 'மெட்ராஸ்',
    'MAHABALIPURAM': 'மகாபலிபுரம்',
    'VEDANTHANGAL': 'வேதாந்தாங்கள்',
    'TIRUNELVELI': 'திருநெல்வேலி',
    'NELLORE': 'நெல்லூர்',
    'TADA': 'தாடா',
    'SULURPET': 'சுலூர்பேட்',
    'GUDUR': 'குடூர்',
    'CHITTOOR': 'சித்தூர்',
    'BARGUR': 'பர்கூர்',
    'WALAJAH': 'வளாஜா',
    'PALAMNER': 'பாலமனेர்',
    'RENIGUNTA': 'রেনিগুনটা',
    'TIRUPATI': 'திருப்பதி',
    'ALAMPUR': 'ஆலம்பூர்',
    'ATMAKUR': 'ஆத்மமூர்',
    'M.G.R KOYAMBEDU': 'மெ.தி.ம கோயம்பேடு',
    'ANNA NAGAR EAST': 'அண்ணா நகர் கிழக்கு',
    'POONAMALLEE B.S': 'பூணமல்லி பி.எஸ்',
    'CHENNAI': 'சென்னை',
}

# Local MySQL connection config (defaults - can be overridden via command line args)
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': os.getenv('MYSQL_USER', 'perundhu_user'),
    'password': os.getenv('MYSQL_PASSWORD', 'perundhu_password'),
    'database': 'perundhu',
    'charset': 'utf8mb4'
}


def get_translation(location_name: str) -> str:
    """Get Tamil translation for a location name"""
    # Try exact match first
    name_upper = location_name.upper().strip()
    if name_upper in TAMIL_DICTIONARY:
        return TAMIL_DICTIONARY[name_upper]
    
    # Try case-insensitive partial match
    for key, value in TAMIL_DICTIONARY.items():
        if key in name_upper or name_upper in key:
            return value
    
    return None


def update_translations():
    """Connect to local MySQL and update all location translations"""
    
    print("=" * 80)
    print("UPDATING TAMIL TRANSLATIONS IN LOCAL MYSQL DATABASE")
    print("=" * 80)
    print()
    
    try:
        # Connect to database
        print(f"📊 Connecting to MySQL database at {DB_CONFIG['host']}:{DB_CONFIG['port']}...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        print("✅ Connected successfully!")
        print()
        
        # Get all locations
        print("🔍 Fetching all locations...")
        cursor.execute("SELECT id, name FROM locations ORDER BY id")
        locations = cursor.fetchall()
        print(f"✅ Found {len(locations)} locations")
        print()
        
        # Statistics
        stats = {
            'total': len(locations),
            'inserted': 0,
            'updated': 0,
            'skipped': 0,
            'no_translation': 0
        }
        
        print("🔄 Processing translations...")
        print("-" * 80)
        
        for location in locations:
            location_id = location['id']
            location_name = location['name']
            
            # Get Tamil translation
            tamil_translation = get_translation(location_name)
            
            if not tamil_translation:
                print(f"⚠️  ID {location_id:4d} | {location_name:40s} | No translation")
                stats['no_translation'] += 1
                continue
            
            # Check if translation already exists
            cursor.execute("""
                SELECT id, translated_value 
                FROM translations 
                WHERE entity_type = 'location' 
                  AND entity_id = %s 
                  AND language_code = 'ta' 
                  AND field_name = 'name'
            """, (location_id,))
            
            existing = cursor.fetchone()
            
            if existing:
                # Update if different
                if existing['translated_value'] != tamil_translation:
                    cursor.execute("""
                        UPDATE translations 
                        SET translated_value = %s, 
                            updated_at = %s
                        WHERE id = %s
                    """, (tamil_translation, datetime.now(), existing['id']))
                    print(f"🔄 ID {location_id:4d} | {location_name:40s} | Updated: {tamil_translation}")
                    stats['updated'] += 1
                else:
                    print(f"✓  ID {location_id:4d} | {location_name:40s} | Already exists")
                    stats['skipped'] += 1
            else:
                # Insert new translation
                cursor.execute("""
                    INSERT INTO translations 
                    (entity_type, entity_id, language_code, field_name, translated_value, created_at, updated_at)
                    VALUES ('location', %s, 'ta', 'name', %s, %s, %s)
                """, (location_id, tamil_translation, datetime.now(), datetime.now()))
                print(f"✅ ID {location_id:4d} | {location_name:40s} | Inserted: {tamil_translation}")
                stats['inserted'] += 1
        
        # Commit changes
        conn.commit()
        
        # Print summary
        print()
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Total locations:        {stats['total']:4d}")
        print(f"✅ Inserted:            {stats['inserted']:4d}")
        print(f"🔄 Updated:             {stats['updated']:4d}")
        print(f"✓  Already exists:      {stats['skipped']:4d}")
        print(f"⚠️  No translation:     {stats['no_translation']:4d}")
        print("=" * 80)
        print()
        
        if stats['inserted'] + stats['updated'] > 0:
            print("✅ Database updated successfully!")
        else:
            print("ℹ️  No changes needed - all translations up to date")
        
        # Close connection
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"\n❌ MySQL Error: {e}")
        print("\nMake sure:")
        print("  1. MySQL is running (docker-compose -f docker-compose.mysql-local.yml up -d)")
        print("  2. Database 'perundhu' exists")
        print("  3. Connection details are correct")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Update Tamil translations in local MySQL database')
    parser.add_argument('--user', '-u', help='MySQL username (default: perundhu_user)', 
                        default=os.getenv('MYSQL_USER', 'perundhu_user'))
    parser.add_argument('--password', '-p', help='MySQL password (will prompt if not provided)')
    parser.add_argument('--host', help='MySQL host (default: localhost)', 
                        default='localhost')
    parser.add_argument('--port', type=int, help='MySQL port (default: 3306)', 
                        default=3306)
    parser.add_argument('--database', '-d', help='Database name (default: perundhu)', 
                        default='perundhu')
    
    args = parser.parse_args()
    
    # Update DB_CONFIG with command line arguments
    DB_CONFIG['user'] = args.user
    DB_CONFIG['host'] = args.host
    DB_CONFIG['port'] = args.port
    DB_CONFIG['database'] = args.database
    
    # Prompt for password if not provided
    if args.password:
        DB_CONFIG['password'] = args.password
    elif args.user != 'perundhu_user':
        # Only prompt if user changed from default
        DB_CONFIG['password'] = getpass.getpass(f"Enter password for {args.user}: ")
    
    update_translations()
