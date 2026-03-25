#!/usr/bin/env python3
"""
Validate Tamil translations for quality and accuracy
Uses multiple validation strategies:
1. Reverse translation (Tamil → English) to check accuracy
2. Pattern detection for common translation errors
3. Sample review for major cities
4. Unicode validation for Tamil characters
"""

import os
import sys
import mysql.connector
import json
import time
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple
import random


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


def is_valid_tamil_unicode(text: str) -> bool:
    """Check if text contains valid Tamil Unicode characters"""
    tamil_range = range(0x0B80, 0x0BFF + 1)  # Tamil Unicode block
    
    has_tamil = False
    for char in text:
        code = ord(char)
        if code in tamil_range:
            has_tamil = True
        elif not (char.isspace() or char in '.,()-/&'):
            # Non-Tamil, non-whitespace, non-punctuation character
            return False
    
    return has_tamil


def reverse_translate(tamil_text: str) -> str:
    """Reverse translate Tamil → English to verify accuracy"""
    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source='ta', target='en')
        return translator.translate(tamil_text)
    except Exception as e:
        return f"ERROR: {e}"


def detect_common_errors(english_name: str, tamil_name: str) -> List[str]:
    """Detect common translation errors"""
    errors = []
    
    # Check if translation is identical to English
    if english_name == tamil_name:
        errors.append("⚠️  Identical to English (not translated)")
    
    # Check if Tamil text is too short (likely untranslated acronym)
    if len(tamil_name) < 3:
        errors.append("⚠️  Very short (possible acronym not translated)")
    
    # Check if contains Latin characters (should be pure Tamil)
    if any(ord(c) < 128 and c.isalpha() for c in tamil_name):
        errors.append("⚠️  Contains Latin characters")
    
    # Check for common untranslated patterns
    untranslated_patterns = ['BYPASS', 'TOLL', 'METRO', 'BS', 'RS', 'DEPOT']
    upper_tamil = tamil_name.upper()
    for pattern in untranslated_patterns:
        if pattern in upper_tamil and pattern in english_name.upper():
            errors.append(f"⚠️  Contains untranslated term: {pattern}")
    
    return errors


def validate_translations():
    """Validate Tamil translations in production database"""
    
    print("=" * 80)
    print("TAMIL TRANSLATION VALIDATION - PRODUCTION DATABASE")
    print("=" * 80)
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
        
        # Get all locations with Tamil translations
        print("\n📊 Fetching all translations...")
        cursor.execute("""
            SELECT 
                l.id,
                l.name as english_name,
                t.translated_value as tamil_name
            FROM locations l
            INNER JOIN translations t ON t.entity_id = l.id 
                AND t.entity_type = 'location'
                AND t.language_code = 'ta'
            ORDER BY l.name
        """)
        
        all_translations = cursor.fetchall()
        print(f"   Found {len(all_translations)} translations to validate")
        
        # Priority locations to check (major cities)
        priority_cities = [
            'Chennai', 'Madurai', 'Coimbatore', 'Trichy', 'Tiruchirappalli',
            'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi',
            'Dindigul', 'Thanjavur', 'Kanchipuram', 'Nagercoil', 'Puducherry'
        ]
        
        print("\n" + "=" * 80)
        print("VALIDATION 1: PRIORITY CITIES (Major Transit Hubs)")
        print("=" * 80)
        
        priority_results = []
        for loc_id, english_name, tamil_name in all_translations:
            if english_name in priority_cities:
                priority_results.append((loc_id, english_name, tamil_name))
        
        print(f"\n{'ID':<8} {'English':<25} {'Tamil':<30} {'Reverse':<25}")
        print("-" * 80)
        
        for loc_id, english_name, tamil_name in priority_results:
            reverse = reverse_translate(tamil_name)
            print(f"{loc_id:<8} {english_name:<25} {tamil_name:<30} {reverse:<25}")
            time.sleep(0.3)  # Rate limit
        
        # Pattern-based validation
        print("\n" + "=" * 80)
        print("VALIDATION 2: DETECT COMMON TRANSLATION ERRORS")
        print("=" * 80)
        
        error_count = 0
        error_details = []
        
        for loc_id, english_name, tamil_name in all_translations:
            errors = detect_common_errors(english_name, tamil_name)
            if errors:
                error_count += 1
                error_details.append((loc_id, english_name, tamil_name, errors))
        
        if error_details:
            print(f"\n⚠️  Found {error_count} locations with potential issues:")
            print()
            for loc_id, english_name, tamil_name, errors in error_details[:20]:  # Show first 20
                print(f"ID {loc_id}: {english_name} → {tamil_name}")
                for error in errors:
                    print(f"      {error}")
                print()
        else:
            print("\n✅ No common errors detected!")
        
        # Unicode validation
        print("\n" + "=" * 80)
        print("VALIDATION 3: UNICODE CHARACTER VALIDATION")
        print("=" * 80)
        
        invalid_unicode = []
        for loc_id, english_name, tamil_name in all_translations:
            if not is_valid_tamil_unicode(tamil_name):
                invalid_unicode.append((loc_id, english_name, tamil_name))
        
        if invalid_unicode:
            print(f"\n⚠️  Found {len(invalid_unicode)} locations with invalid Tamil Unicode:")
            for loc_id, english_name, tamil_name in invalid_unicode[:10]:
                print(f"   ID {loc_id}: {english_name} → {tamil_name}")
        else:
            print("\n✅ All translations use valid Tamil Unicode!")
        
        # Random sample validation with reverse translation
        print("\n" + "=" * 80)
        print("VALIDATION 4: RANDOM SAMPLE REVERSE TRANSLATION (20 samples)")
        print("=" * 80)
        
        sample_size = min(20, len(all_translations))
        sample = random.sample(all_translations, sample_size)
        
        print(f"\n{'English':<30} {'Tamil':<30} {'Reverse → English':<30}")
        print("-" * 90)
        
        accuracy_score = 0
        for loc_id, english_name, tamil_name in sample:
            reverse = reverse_translate(tamil_name)
            
            # Simple accuracy check: if reverse contains original name or is close
            is_accurate = (
                english_name.lower() in reverse.lower() or 
                reverse.lower() in english_name.lower() or
                # Handle common variations
                english_name.replace(' ', '').lower()[:5] == reverse.replace(' ', '').lower()[:5]
            )
            
            if is_accurate:
                accuracy_score += 1
                status = "✅"
            else:
                status = "⚠️ "
            
            print(f"{status} {english_name:<28} {tamil_name:<28} {reverse:<28}")
            time.sleep(0.3)  # Rate limit
        
        accuracy_percent = (accuracy_score / sample_size) * 100
        print(f"\nSample Accuracy: {accuracy_score}/{sample_size} ({accuracy_percent:.1f}%)")
        
        # Summary
        print("\n" + "=" * 80)
        print("VALIDATION SUMMARY")
        print("=" * 80)
        print(f"\nTotal Translations:          {len(all_translations)}")
        print(f"Priority Cities Checked:     {len(priority_results)}")
        print(f"Potential Errors Detected:   {error_count}")
        print(f"Invalid Unicode:             {len(invalid_unicode)}")
        print(f"Sample Accuracy:             {accuracy_percent:.1f}%")
        
        if error_count > 50:
            print(f"\n⚠️  WARNING: {error_count} potential issues found")
            print("   Review error details and consider manual verification")
        elif error_count > 0:
            print(f"\n⚠️  {error_count} minor issues found - review recommended")
        else:
            print("\n✅ All validations passed! Translations look good.")
        
        # Save detailed report
        report_file = Path('data/translation_validation_report.json')
        report_file.parent.mkdir(parents=True, exist_ok=True)
        
        report = {
            'total_translations': len(all_translations),
            'priority_cities': len(priority_results),
            'errors_detected': error_count,
            'invalid_unicode': len(invalid_unicode),
            'sample_accuracy': accuracy_percent,
            'error_details': [
                {
                    'id': loc_id,
                    'english': english_name,
                    'tamil': tamil_name,
                    'issues': errors
                }
                for loc_id, english_name, tamil_name, errors in error_details
            ],
            'invalid_unicode_details': [
                {
                    'id': loc_id,
                    'english': english_name,
                    'tamil': tamil_name
                }
                for loc_id, english_name, tamil_name in invalid_unicode
            ]
        }
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Detailed report saved to: {report_file}")
        
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
    
    print("\n" + "=" * 80)
    print("✅ Validation complete!")
    print("=" * 80)
    print("\n💡 Next Steps:")
    print("   1. Review error_details in validation report")
    print("   2. Manually verify priority cities with Tamil speakers")
    print("   3. Consider implementing user feedback for corrections")
    print("   4. Set up periodic re-validation with updated translation models")


if __name__ == '__main__':
    try:
        from deep_translator import GoogleTranslator
    except ImportError:
        print("❌ ERROR: deep-translator not installed")
        print("   Run: pip install --break-system-packages deep-translator")
        sys.exit(1)
    
    validate_translations()
