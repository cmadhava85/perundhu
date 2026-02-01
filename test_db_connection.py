# Import necessary libraries
# 
import mysql.connector
import os
import sys

#!/usr/bin/env python3
# Import necessary libraries
# 
import mysql.connector
import os
import sys

def test_connection():
    """Test database connection with preprod credentials"""

    # Configuration
    host = os.getenv('DB_HOST_PREPROD', '127.0.0.1')
    port = int(os.getenv('DB_PORT_PREPROD', 3307))
    user = os.getenv('DB_USER_PREPROD', 'perundhu_user')
    password = os.getenv('DB_PASSWORD_PREPROD', '')
    database = os.getenv('DB_NAME_PREPROD', 'perundhu')

    print("=" * 70)
    print("🔐 Database Connection Test")
    print("=" * 70)
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"User: {user}")
    print(f"Password: {'*' * len(password) if password else 'EMPTY'}")
    print(f"Database: {database}")
    print("=" * 70)

    try:
        print("\n🔄 Attempting connection...")

        connection = mysql.connector.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            autocommit=True,
            connection_timeout=10
        )

        print("✅ Connection successful!")

        # Test query
        cursor = connection.cursor()
        cursor.execute("SELECT VERSION();")
        version = cursor.fetchone()
        print(f"✅ MySQL Version: {version[0]}")

        # Check database
        cursor.execute("SHOW DATABASES LIKE 'perundhu';")
        result = cursor.fetchone()
        if result:
            print(f"✅ Database 'perundhu' exists")
        else:
            print("⚠️  Database 'perundhu' not found")

        # Check locations
        print("\n📍 LOCATIONS TABLE:")
        cursor.execute("SELECT COUNT(*) FROM locations")
        loc_count = cursor.fetchone()[0]
        cursor.execute("""
            SELECT COUNT(*) FROM (
                SELECT name, district FROM locations 
                GROUP BY name, district HAVING COUNT(*) > 1
            ) t
        """)
        loc_dups = cursor.fetchone()[0]
        print(f"   Total records: {loc_count:,}")
        print(f"   Duplicate groups: {loc_dups:,}")

        # Check buses
        print("\n🚌 BUSES TABLE:")
        cursor.execute("SELECT COUNT(*) FROM buses")
        bus_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(DISTINCT bus_number) FROM buses")
        bus_unique = cursor.fetchone()[0]
        print(f"   Total records: {bus_count:,}")
        print(f"   Unique bus numbers: {bus_unique:,}")
        print(f"   Duplicates: {bus_count - bus_unique:,}")

        cursor.close()
        connection.close()

        print("\n" + "=" * 70)
        print("✅ All tests passed!")
        print("=" * 70)
        sys.exit(0)

    except mysql.connector.Error as err:
        print(f"\n❌ Database Error: {err}")
        print(f"   Error Code: {err.errno}")
        print(f"   SQLState: {err.sqlstate}")

        if err.errno == 1045:
            print("\n🔍 Access Denied - Possible causes:")
            print("   1. Incorrect password")
            print("   2. User doesn't have permission to connect")
            print("   3. User account doesn't exist")
            print("   4. Authentication method mismatch")

        sys.exit(1)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    sys.exit(test_connection())
#!/usr/bin/env python3
"""Test database connection with preprod credentials"""

import mysql.connector
import sys
import os

# Configuration
host = os.getenv('DB_HOST_PREPROD', '127.0.0.1')
port = int(os.getenv('DB_PORT_PREPROD', 3307))
user = os.getenv('DB_USER_PREPROD', 'perundhu_user')
password = os.getenv('DB_PASSWORD_PREPROD', '')
database = os.getenv('DB_NAME_PREPROD', 'perundhu')

print("=" * 70)
print("🔐 Database Connection Test")
print("=" * 70)
print(f"Host: {host}")
print(f"Port: {port}")
print(f"User: {user}")
print(f"Password: {'*' * len(password) if password else 'EMPTY'}")
print(f"Database: {database}")
print("=" * 70)

try:
    print("\n🔄 Attempting connection...")
    
    connection = mysql.connector.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        autocommit=True,
        connection_timeout=10
    )
    
    print("✅ Connection successful!")
    
    # Test query
    cursor = connection.cursor()
    cursor.execute("SELECT VERSION();")
    version = cursor.fetchone()
    print(f"✅ MySQL Version: {version[0]}")
    
    # Check database
    cursor.execute("SHOW DATABASES LIKE 'perundhu';")
    result = cursor.fetchone()
    if result:
        print(f"✅ Database 'perundhu' exists")
    else:
        print("⚠️  Database 'perundhu' not found")
    
    cursor.close()
    connection.close()
    
    print("\n" + "=" * 70)
    print("✅ All tests passed!")
    print("=" * 70)
    sys.exit(0)
    
except mysql.connector.Error as err:
    print(f"\n❌ Database Error: {err}")
    print(f"   Error Code: {err.errno}")
    print(f"   SQLState: {err.sqlstate}")
    
    if err.errno == 1045:
        print("\n🔍 Access Denied - Possible causes:")
        print("   1. Incorrect password")
        print("   2. User doesn't have permission to connect")
        print("   3. User account doesn't exist")
        print("   4. Authentication method mismatch")
    
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    sys.exit(1)
