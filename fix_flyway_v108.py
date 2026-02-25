#!/usr/bin/env python3
import mysql.connector
import sys

try:
    # Connect to the database
    conn = mysql.connector.connect(
        host="34.47.132.22",
        port=3306,
        user="perundhu_user",
        password="%1zh}-U97!pEIuQvx@SuEC7[SzaTk)X#",
        database="perundhu"
    )
    cursor = conn.cursor()
    
    # Update V108 to mark as successful
    update_query = """
    UPDATE flyway_schema_history 
    SET success = TRUE 
    WHERE version = '108' AND success = FALSE
    """
    cursor.execute(update_query)
    conn.commit()
    
    print(f"✓ Updated V108 migration status to SUCCESS")
    print(f"  Rows affected: {cursor.rowcount}")
    
    cursor.close()
    conn.close()
    
    print("\n✓ Database fix completed successfully")
    sys.exit(0)
    
except mysql.connector.Error as err:
    print(f"✗ Database error: {err}")
    sys.exit(1)
except Exception as e:
    print(f"✗ Unexpected error: {e}")
    sys.exit(1)
