#!/usr/bin/env python3
"""
Comprehensive schema verification for all V58 migration requirements
"""
import pymysql
from google.cloud import secretmanager

def verify_schema():
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
    
    print("="*70)
    print("COMPREHENSIVE SCHEMA VERIFICATION")
    print("="*70 + "\n")
    
    tables_to_check = {
        'route_contributions': [
            'bus_number', 'submission_date', 'additional_notes', 'submitted_by',
            'source_image_id', 'route_group_id', 'source_bus_id', 'contribution_type', 'stops_json'
        ],
        'system_settings': [
            'id', 'category', 'description', 'created_at'
        ],
        'locations': [
            'osm_node_id', 'osm_way_id', 'last_osm_update', 'osm_tags'
        ]
    }
    
    all_good = True
    
    for table_name, required_columns in tables_to_check.items():
        print(f"📋 Checking {table_name}...")
        
        # Get all columns in the table
        cursor.execute(f"DESC {table_name}")
        existing_columns = {row[0] for row in cursor.fetchall()}
        
        # Check each required column
        missing_columns = []
        for col in required_columns:
            if col in existing_columns:
                print(f"  ✅ {col}")
            else:
                print(f"  ❌ {col} - MISSING!")
                missing_columns.append(col)
                all_good = False
        
        if missing_columns:
            print(f"\n  ⚠️  {table_name} is missing {len(missing_columns)} column(s): {', '.join(missing_columns)}")
        else:
            print(f"  ✅ All required columns present\n")
    
    # Test the actual queries that were failing
    print("\n" + "="*70)
    print("TESTING QUERIES THAT WERE FAILING")
    print("="*70 + "\n")
    
    test_queries = [
        ("route_contributions", """
            SELECT id, additional_notes, arrival_time, bus_name, bus_number, contribution_type,
                   departure_time, from_latitude, from_location_name, from_longitude, processed_date,
                   route_group_id, schedule_info, source_bus_id, source_image_id, status, stops_json,
                   submission_date, submitted_by, to_latitude, to_location_name, to_longitude, user_id,
                   validation_message 
            FROM route_contributions 
            WHERE status='PENDING' 
            LIMIT 1
        """),
        ("system_settings", """
            SELECT id, category, created_at, description, setting_key, setting_value, updated_at 
            FROM system_settings 
            WHERE setting_key LIKE '%' 
            ORDER BY setting_key 
            LIMIT 1
        """),
        ("locations", """
            SELECT id, name, latitude, longitude, osm_node_id, osm_way_id, last_osm_update, osm_tags 
            FROM locations 
            LIMIT 1
        """)
    ]
    
    for table_name, query in test_queries:
        print(f"🧪 Testing {table_name} query...", end="", flush=True)
        try:
            cursor.execute(query)
            result = cursor.fetchone()
            print(f" ✅ SUCCESS")
        except Exception as e:
            print(f" ❌ FAILED")
            print(f"   Error: {str(e)}")
            all_good = False
    
    print("\n" + "="*70)
    if all_good:
        print("✅ ALL SCHEMA CHECKS PASSED - READY FOR PRODUCTION")
    else:
        print("❌ SCHEMA ISSUES FOUND - NEEDS ATTENTION")
    print("="*70)
    
    conn.close()
    return all_good

if __name__ == "__main__":
    import sys
    success = verify_schema()
    sys.exit(0 if success else 1)
