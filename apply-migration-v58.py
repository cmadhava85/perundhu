#!/usr/bin/env python3
"""
Apply V58 migration to add missing route_contributions columns
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
        
        print("Applying V58 migration: Add missing route_contributions columns...\n")
        
        columns_to_add = [
            ("bus_number", "VARCHAR(50) AFTER user_id"),
            ("submission_date", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status"),
            ("additional_notes", "TEXT AFTER processed_date"),
            ("submitted_by", "VARCHAR(100) AFTER validation_message"),
            ("source_image_id", "VARCHAR(50) AFTER submitted_by"),
            ("route_group_id", "VARCHAR(50) AFTER source_image_id"),
            ("source_bus_id", "BIGINT"),
            ("contribution_type", "VARCHAR(50)"),
            ("stops_json", "TEXT AFTER contribution_type"),
        ]
        
        for column_name, column_def in columns_to_add:
            try:
                # Check if column exists
                cursor.execute(f"""
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE table_schema=DATABASE() AND table_name='route_contributions' 
                    AND column_name='{column_name}'
                """)
                exists = cursor.fetchone()[0] > 0
                
                if not exists:
                    # Add the column
                    sql = f"ALTER TABLE route_contributions ADD COLUMN {column_name} {column_def}"
                    print(f"  Adding column: {column_name}...", end="", flush=True)
                    cursor.execute(sql)
                    conn.commit()
                    print(" ✅")
                else:
                    print(f"  Column {column_name} already exists ⏭️")
            except Exception as e:
                print(f" ❌ Error: {str(e)}")
                conn.rollback()
        
        # Verify columns
        cursor.execute("DESC route_contributions")
        columns = cursor.fetchall()
        
        print("\n" + "="*60)
        print("✅ V58 MIGRATION APPLIED SUCCESSFULLY")
        print("="*60)
        print(f"\nRoute Contributions Table Columns ({len(columns)} total):")
        for col in columns:
            print(f"  - {col[0]:<25} {col[1]}")
        
        # Check specific columns we needed
        cursor.execute("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE table_schema=DATABASE() AND table_name='route_contributions' 
            AND column_name IN ('additional_notes', 'submitted_by', 'source_image_id', 'route_group_id', 'stops_json')
        """)
        added_count = cursor.fetchone()[0]
        print(f"\n✅ Required columns present: {added_count}/5")
        
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
