#!/usr/bin/env python3
"""
Fix system_settings table by dropping existing PK and adding id column
"""
import pymysql
from google.cloud import secretmanager
import sys

def fix_system_settings():
    try:
        client = secretmanager.SecretManagerServiceClient()
        secret_path = "projects/1032721240281/secrets/db-password/versions/latest"
        response = client.access_secret_version(request={"name": secret_path})
        password = response.payload.data.decode("UTF-8")
        
        conn = pymysql.connect(
            host="127.0.0.1",
            port=3307,
            user="perundhu_user",
            password=password,
            database="perundhu"
        )
        cursor = conn.cursor()
        
        print("Checking system_settings table structure...")
        
        # Check current primary key
        cursor.execute("""
            SHOW KEYS FROM system_settings WHERE Key_name = 'PRIMARY'
        """)
        pk_info = cursor.fetchall()
        
        if pk_info:
            print(f"\nCurrent PRIMARY KEY:")
            for row in pk_info:
                print(f"  - Column: {row[4]}")
        
        # Check if id column exists
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE table_schema=DATABASE() AND table_name='system_settings' AND column_name='id'
        """)
        has_id = cursor.fetchone()[0] > 0
        
        if not has_id:
            print("\n🔧 Fixing system_settings table...")
            
            # Drop existing primary key if it exists
            if pk_info:
                print("  Step 1: Dropping existing PRIMARY KEY...", end="", flush=True)
                cursor.execute("ALTER TABLE system_settings DROP PRIMARY KEY")
                conn.commit()
                print(" ✅")
            
            # Add id column as new primary key
            print("  Step 2: Adding id column as PRIMARY KEY...", end="", flush=True)
            cursor.execute("""
                ALTER TABLE system_settings 
                ADD COLUMN id BIGINT AUTO_INCREMENT PRIMARY KEY FIRST
            """)
            conn.commit()
            print(" ✅")
            
            # Make setting_key unique (not primary)
            print("  Step 3: Adding UNIQUE constraint on setting_key...", end="", flush=True)
            try:
                cursor.execute("ALTER TABLE system_settings ADD UNIQUE KEY uk_setting_key (setting_key)")
                conn.commit()
                print(" ✅")
            except Exception as e:
                if "Duplicate key name" in str(e):
                    print(" ⏭️  (already exists)")
                else:
                    print(f" ⚠️  {str(e)}")
        else:
            print("\n✅ Column id already exists")
        
        # Verify
        cursor.execute("DESC system_settings")
        columns = cursor.fetchall()
        print(f"\n✅ system_settings table structure ({len(columns)} columns):")
        for col in columns:
            key_marker = ""
            if col[3] == "PRI":
                key_marker = " [PRIMARY KEY]"
            elif col[3] == "UNI":
                key_marker = " [UNIQUE]"
            print(f"  - {col[0]:<25} {col[1]}{key_marker}")
        
        # Test query that was failing
        print("\n🧪 Testing query that was failing...")
        try:
            cursor.execute("""
                SELECT id, category, created_at, description, setting_key, setting_value, updated_at 
                FROM system_settings 
                WHERE setting_key LIKE '%' 
                ORDER BY setting_key 
                LIMIT 1
            """)
            result = cursor.fetchone()
            if result:
                print(f"✅ Query successful! Sample row: id={result[0]}, setting_key={result[4]}")
            else:
                print("✅ Query successful (no data)")
        except Exception as e:
            print(f"❌ Query failed: {str(e)}")
            return False
        
        print("\n" + "="*60)
        print("✅ SYSTEM_SETTINGS TABLE FIXED SUCCESSFULLY")
        print("="*60)
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"\n❌ Fix failed: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = fix_system_settings()
    sys.exit(0 if success else 1)
