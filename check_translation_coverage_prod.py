#!/usr/bin/env python3
"""
Check Tamil translation coverage in PRODUCTION database
Shows statistics on which locations have translations and which don't
"""
import mysql.connector
import subprocess
import sys

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
        
        print("✅ Credentials retrieved\n")
        return username, password
    except subprocess.CalledProcessError as e:
        print(f"❌ Error retrieving credentials: {e}")
        sys.exit(1)


def check_translation_coverage():
    """Check translation coverage in production database"""
    
    print("=" * 80)
    print("TAMIL TRANSLATION COVERAGE - PRODUCTION DATABASE")
    print("=" * 80)
    print()
    
    # Get credentials
    db_user, db_password = get_db_credentials()
    
    # Connect to database via Cloud SQL Proxy
    print("🔗 Connecting to production database via Cloud SQL Proxy...")
    print("   Host: 127.0.0.1:3307")
    print("   Database: perundhu")
    print()
    
    try:
        conn = mysql.connector.connect(
            host='127.0.0.1',
            port=3307,
            user=db_user,
            password=db_password,
            database='perundhu',
            charset='utf8mb4'
        )
        
        cursor = conn.cursor()
        print("✅ Connected to production database\n")
        
        # Total locations count
        print("=" * 80)
        print("OVERALL STATISTICS")
        print("=" * 80)
        
        cursor.execute("""
            SELECT COUNT(*) as total_locations
            FROM locations
            WHERE state = 'Tamil Nadu'
        """)
        total_locations = cursor.fetchone()[0]
        print(f"Total Tamil Nadu locations: {total_locations:,}")
        
        # Locations with translations (using translations table)
        cursor.execute("""
            SELECT COUNT(DISTINCT l.id) as with_translation
            FROM locations l
            INNER JOIN translations t ON t.entity_id = l.id 
            WHERE l.state = 'Tamil Nadu' 
            AND t.entity_type = 'location'
            AND t.language_code = 'ta'
            AND t.field_name = 'name'
            AND t.translated_value IS NOT NULL
            AND t.translated_value != ''
        """)
        with_translation = cursor.fetchone()[0]
        
        # Locations without translations
        without_translation = total_locations - with_translation
        translation_percentage = (with_translation / total_locations * 100) if total_locations > 0 else 0
        
        print(f"Locations WITH translations:    {with_translation:,} ({translation_percentage:.2f}%)")
        print(f"Locations WITHOUT translations: {without_translation:,} ({100-translation_percentage:.2f}%)")
        print()
        
        # District-wise breakdown
        print("=" * 80)
        print("TRANSLATION COVERAGE BY DISTRICT (Top 15)")
        print("=" * 80)
        
        cursor.execute("""
            SELECT 
                l.district,
                COUNT(DISTINCT l.id) as total,
                COUNT(DISTINCT CASE WHEN t.translated_value IS NOT NULL AND t.translated_value != '' THEN l.id END) as translated,
                ROUND(COUNT(DISTINCT CASE WHEN t.translated_value IS NOT NULL AND t.translated_value != '' THEN l.id END) * 100.0 / COUNT(DISTINCT l.id), 2) as percentage
            FROM locations l
            LEFT JOIN translations t ON t.entity_id = l.id AND t.entity_type = 'location' AND t.language_code = 'ta' AND t.field_name = 'name'
            WHERE l.state = 'Tamil Nadu' AND l.district != 'Unknown' AND l.district IS NOT NULL
            GROUP BY l.district
            ORDER BY total DESC
            LIMIT 15
        """)
        
        print(f"{'District':<20} {'Total':>8} {'Translated':>12} {'Coverage':>10}")
        print("-" * 80)
        
        for district, total, translated, percentage in cursor:
            print(f"{district:<20} {total:>8,} {translated:>12,} {percentage:>9.2f}%")
        
        # Sample locations without translations
        print("\n" + "=" * 80)
        print("SAMPLE LOCATIONS WITHOUT TRANSLATIONS (First 20)")
        print("=" * 80)
        
        cursor.execute("""
            SELECT l.id, l.name, l.district
            FROM locations l
            LEFT JOIN translations t ON t.entity_id = l.id AND t.entity_type = 'location' AND t.language_code = 'ta' AND t.field_name = 'name'
            WHERE l.state = 'Tamil Nadu'
            AND (t.translated_value IS NULL OR t.translated_value = '')
            ORDER BY l.id
            LIMIT 20
        """)
        
        missing_samples = cursor.fetchall()
        
        if missing_samples:
            print(f"{'ID':<8} {'Name':<40} {'District':<20}")
            print("-" * 80)
            for loc_id, name, district in missing_samples:
                print(f"{loc_id:<8} {name:<40} {district or 'Unknown':<20}")
        else:
            print("✅ All locations have translations!")
        
        # Sample locations WITH translations
        print("\n" + "=" * 80)
        print("SAMPLE LOCATIONS WITH TRANSLATIONS (Random 10)")
        print("=" * 80)
        
        cursor.execute("""
            SELECT l.name, t.translated_value, l.district
            FROM locations l
            INNER JOIN translations t ON t.entity_id = l.id AND t.entity_type = 'location' AND t.language_code = 'ta' AND t.field_name = 'name'
            WHERE l.state = 'Tamil Nadu'
            AND t.translated_value IS NOT NULL
            AND t.translated_value != ''
            ORDER BY RAND()
            LIMIT 10
        """)
        
        translated_samples = cursor.fetchall()
        
        if translated_samples:
            print(f"{'English Name':<30} {'Tamil Name':<30} {'District':<20}")
            print("-" * 80)
            for name, translated, district in translated_samples:
                print(f"{name:<30} {translated:<30} {district or 'Unknown':<20}")
        
        # Summary
        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        
        if translation_percentage >= 99:
            print(f"✅ EXCELLENT: {translation_percentage:.2f}% coverage")
        elif translation_percentage >= 90:
            print(f"✓ GOOD: {translation_percentage:.2f}% coverage")
        elif translation_percentage >= 50:
            print(f"⚠️  PARTIAL: {translation_percentage:.2f}% coverage")
        else:
            print(f"❌ LOW: {translation_percentage:.2f}% coverage")
        
        print(f"\nMissing translations: {without_translation:,} locations")
        
        if without_translation > 0:
            print("\n💡 Recommendation:")
            print("   Run bulk translation script to complete remaining translations:")
            print("   python3 scripts/bulk_translate_prod.py")
        
        print("=" * 80)
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"\n❌ Database Error: {e}")
        print("\nTroubleshooting:")
        print("  1. Ensure Cloud SQL Proxy is running:")
        print("     ./cloud_sql_proxy -instances=perundhu-prod-001:us-central1:perundhu-production-mysql-us=tcp:3307 &")
        print("  2. Check gcloud authentication:")
        print("     gcloud auth application-default login --project perundhu-prod-001")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Check Tamil translation coverage in production',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Prerequisites:
  1. Cloud SQL Proxy must be running on port 3307:
     ./cloud_sql_proxy -instances=perundhu-prod-001:us-central1:perundhu-production-mysql-us=tcp:3307 &
  
  2. Authenticated with gcloud:
     gcloud auth application-default login --project perundhu-prod-001

Example:
  python3 check_translation_coverage_prod.py
        """
    )
    
    args = parser.parse_args()
    check_translation_coverage()


if __name__ == '__main__':
    main()
