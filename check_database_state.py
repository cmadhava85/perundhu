#!/usr/bin/env python3
import mysql.connector
from mysql.connector import Error

config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root123',
    'database': 'bus_tracker_db'
}

try:
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    # Get current state
    cursor.execute("SELECT COUNT(*) FROM buses")
    total_buses = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM buses WHERE departure_time IS NOT NULL")
    buses_with_times = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM buses WHERE departure_time IS NULL")
    buses_null_times = cursor.fetchone()[0]
    
    print(f"Current Database State:")
    print(f"  Total buses: {total_buses}")
    print(f"  Buses with departure_time: {buses_with_times}")
    print(f"  Buses with NULL departure_time: {buses_null_times}")
    
    # Check route 5E
    cursor.execute("SELECT COUNT(*) FROM buses WHERE bus_number = '5E'")
    route_5e = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT departure_time) FROM buses WHERE bus_number = '5E' AND departure_time IS NOT NULL")
    route_5e_timings = cursor.fetchone()[0]
    
    print(f"\nRoute 5E:")
    print(f"  Total records: {route_5e}")
    print(f"  Unique departure times: {route_5e_timings}")
    
    if buses_null_times > 0:
        print(f"\n⚠️  WARNING: {buses_null_times} buses have NULL times (old checkpoint data)")
        print("\nCleaning up NULL times...")
        cursor.execute("DELETE FROM buses WHERE departure_time IS NULL")
        deleted = cursor.rowcount
        conn.commit()
        print(f"✅ Deleted {deleted} records with NULL times")
        
        # Verify cleanup
        cursor.execute("SELECT COUNT(*) FROM buses WHERE departure_time IS NULL")
        remaining_null = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM buses")
        remaining_total = cursor.fetchone()[0]
        
        print(f"\nAfter cleanup:")
        print(f"  Total buses: {remaining_total}")
        print(f"  Buses with NULL times: {remaining_null}")
        print(f"✅ All buses now have timing information")
    else:
        print("\n✅ All buses already have timing information")
    
    cursor.close()
    conn.close()
    
except Error as e:
    print(f"Error: {e}")
