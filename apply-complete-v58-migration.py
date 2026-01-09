#!/usr/bin/env python3
"""
Apply complete V58 migration including system_settings and locations tables
"""
import pymysql
from google.cloud import secretmanager
import sys

def apply_migration():
    try:
        # Get password from Secret Manager
        client = secretmanager.SecretManagerServiceClient()
        secret_path = "projects/1032721240281/secrets/db-password/versions/latest"
        response = client.access_secret_version(request={"name": secret_path})
        password = response.payload.data.decode("UTF-8")
        
        # Connect to database via Cloud SQL Proxy on localhost:3307
        print("Connecting to database...")
        conn = pymysql.connect(
            host="127.0.0.1",
            port=3307,
            user="perundhu_user",
            password=password,
            database="perundhu"
        )
        cursor = conn.cursor()
        
        print("\n" + "="*60)
        print("APPLYING COMPLETE V58 MIGRATION")
        print("="*60 + "\n")
        
        # =====================
        # SYSTEM_SETTINGS TABLE FIXES
        # =====================
        print("📋 Fixing system_settings table...")
        
        # Check if id column exists
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE table_schema=DATABASE() AND table_name='system_settings' 
            AND column_name='id'
        """)
        has_id = cursor.fetchone()[0] > 0
        
        if not has_id:
            print("  Adding id column as PRIMARY KEY...", end="", flush=True)
            try:
                # Add id column as AUTO_INCREMENT PRIMARY KEY
                cursor.execute("""
                    ALTER TABLE system_settings 
                    ADD COLUMN id BIGINT AUTO_INCREMENT PRIMARY KEY FIRST
                """)
                conn.commit()
                print(" ✅")
            except Exception as e:
                print(f" ❌ Error: {str(e)}")
                conn.rollback()
        else:
            print("  Column id already exists ⏭️")
        
        # Add other system_settings columns
        system_settings_columns = [
            ("category", "VARCHAR(50) AFTER setting_value"),
            ("description", "VARCHAR(255) AFTER category"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER description"),
        ]
        
        for column_name, column_def in system_settings_columns:
            try:
                cursor.execute(f"""
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE table_schema=DATABASE() AND table_name='system_settings' 
                    AND column_name='{column_name}'
                """)
                exists = cursor.fetchone()[0] > 0
                
                if not exists:
                    sql = f"ALTER TABLE system_settings ADD COLUMN {column_name} {column_def}"
                    print(f"  Adding column: {column_name}...", end="", flush=True)
                    cursor.execute(sql)
                    conn.commit()
                    print(" ✅")
                else:
                    print(f"  Column {column_name} already exists ⏭️")
            except Exception as e:
                print(f" ❌ Error: {str(e)}")
                conn.rollback()
        
        # Make setting_key unique
        try:
            cursor.execute("""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                WHERE table_schema=DATABASE() AND table_name='system_settings' 
                AND index_name='setting_key' AND non_unique=0
            """)
            has_unique = cursor.fetchone()[0] > 0
            
            if not has_unique:
                print("  Adding UNIQUE constraint on setting_key...", end="", flush=True)
                cursor.execute("ALTER TABLE system_settings ADD UNIQUE KEY (setting_key)")
                conn.commit()
                print(" ✅")
            else:
                print("  UNIQUE key on setting_key already exists ⏭️")
        except Exception as e:
            print(f"  ⚠️  Could not add unique constraint: {str(e)}")
            conn.rollback()
        
        # =====================
        # LOCATIONS TABLE FIXES
        # =====================
        print("\n📋 Fixing locations table...")
        
        locations_columns = [
            ("osm_node_id", "BIGINT"),
            ("osm_way_id", "BIGINT"),
            ("last_osm_update", "DATETIME"),
            ("osm_tags", "JSON"),
        ]
        
        for column_name, column_def in locations_columns:
            try:
                cursor.execute(f"""
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE table_schema=DATABASE() AND table_name='locations' 
                    AND column_name='{column_name}'
                """)
                exists = cursor.fetchone()[0] > 0
                
                if not exists:
                    sql = f"ALTER TABLE locations ADD COLUMN {column_name} {column_def}"
                    print(f"  Adding column: {column_name}...", end="", flush=True)
                    cursor.execute(sql)
                    conn.commit()
                    print(" ✅")
                else:
                    print(f"  Column {column_name} already exists ⏭️")
            except Exception as e:
                print(f" ❌ Error: {str(e)}")
                conn.rollback()
        
        # =====================
        # VERIFICATION
        # =====================
        print("\n" + "="*60)
        print("VERIFICATION")
        print("="*60 + "\n")
        
        # Verify system_settings
        cursor.execute("DESC system_settings")
        columns = cursor.fetchall()
        print(f"✅ system_settings table ({len(columns)} columns):")
        for col in columns:
            print(f"  - {col[0]:<25} {col[1]}")
        
        # Check specific columns
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE table_schema=DATABASE() AND table_name='system_settings' 
            AND column_name IN ('id', 'category', 'description', 'created_at')
        """)
        ss_count = cursor.fetchone()[0]
        print(f"\n✅ system_settings required columns present: {ss_count}/4")
        
        # Verify locations
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE table_schema=DATABASE() AND table_name='locations' 
            AND column_name IN ('osm_node_id', 'osm_way_id', 'last_osm_update', 'osm_tags')
        """)
        loc_count = cursor.fetchone()[0]
        print(f"✅ locations required columns present: {loc_count}/4")
        
        # Verify route_contributions (from previous run)
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE table_schema=DATABASE() AND table_name='route_contributions' 
            AND column_name IN ('additional_notes', 'submitted_by', 'source_image_id', 'route_group_id', 'stops_json')
        """)
        rc_count = cursor.fetchone()[0]
        print(f"✅ route_contributions required columns present: {rc_count}/5")
        
        print("\n" + "="*60)
        print("✅ COMPLETE V58 MIGRATION APPLIED SUCCESSFULLY")
        print("="*60)
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = apply_migration()
    sys.exit(0 if success else 1)
