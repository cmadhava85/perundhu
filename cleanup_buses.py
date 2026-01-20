#!/usr/bin/env python3
import mysql.connector
from mysql.connector import Error

try:
    config = {
        'host': 'localhost',
        'user': 'root',
        'password': 'root123',
        'database': 'bus_tracker_db'
    }
    
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    # Delete all buses and stops to clean slate
    cursor.execute("DELETE FROM bus_schedules")
    cursor.execute("DELETE FROM stops")
    cursor.execute("DELETE FROM buses")
    cursor.execute("DELETE FROM locations WHERE location_type = 'bus_terminal'")
    
    print(f"Deleted all buses, schedules, stops, and terminals")
    print(f"Rows affected: {cursor.rowcount}")
    
    # Check current counts
    cursor.execute("SELECT COUNT(*) FROM buses")
    bus_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM locations WHERE location_type = 'bus_terminal'")
    terminal_count = cursor.fetchone()[0]
    
    print(f"\nCurrent state:")
    print(f"  Buses: {bus_count}")
    print(f"  Bus terminals: {terminal_count}")
    
    conn.commit()
    cursor.close()
    conn.close()
    
except Error as e:
    print(f"Error: {e}")
