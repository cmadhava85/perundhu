#!/usr/bin/env python3
"""
Quick script to check admin_users table in production database
"""
import mysql.connector
import sys
import os

def check_admin_users():
    """Check admin_users table in production database"""
    
    print("=" * 60)
    print("PRODUCTION ADMIN USERS TABLE CHECK")
    print("=" * 60)
    
    # Production database config
    config = {
        'host': os.getenv('DB_HOST_PROD', '127.0.0.1'),
        'port': int(os.getenv('DB_PORT_PROD', '3307')),
        'user': os.getenv('DB_USER_PROD', 'perundhu_user'),
        'password': os.getenv('DB_PASSWORD_PROD', 'perundhu_password'),
        'database': os.getenv('DB_NAME_PROD', 'perundhu'),
    }
    
    try:
        print(f"\n🔌 Connecting to production database...")
        print(f"   Host: {config['host']}:{config['port']}")
        print(f"   Database: {config['database']}")
        print(f"   User: {config['user']}")
        
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        
        print("✅ Connected successfully!\n")
        
        # Check if admin_users table exists
        cursor.execute("SHOW TABLES LIKE 'admin_users'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("❌ Table 'admin_users' does NOT exist in production database")
            return False
        
        # Get table structure
        cursor.execute("DESCRIBE admin_users")
        columns = cursor.fetchall()
        
        print("📊 TABLE STRUCTURE:")
        print("-" * 60)
        for col in columns:
            print(f"  • {col[0]} ({col[1]})")
        
        # Count total admin users
        cursor.execute("SELECT COUNT(*) FROM admin_users")
        total_count = cursor.fetchone()[0]
        
        print(f"\n📈 Total admin users: {total_count}")
        
        # Get all admin users (excluding password hash for security)
        cursor.execute("""
            SELECT id, username, email, role, created_at, updated_at, is_active 
            FROM admin_users 
            ORDER BY id
        """)
        admins = cursor.fetchall()
        
        if admins:
            print("\n👤 ADMIN USERS:")
            print("-" * 60)
            for admin in admins:
                admin_id, username, email, role, created, updated, is_active = admin
                status = "✅ Active" if is_active else "❌ Inactive"
                print(f"\nID: {admin_id}")
                print(f"  Username: {username}")
                print(f"  Email: {email}")
                print(f"  Role: {role}")
                print(f"  Status: {status}")
                print(f"  Created: {created}")
                print(f"  Updated: {updated}")
        else:
            print("\n⚠️  No admin users found in the table")
        
        print("\n" + "=" * 60)
        print("✅ Admin users check complete")
        return True
            
    except mysql.connector.Error as e:
        print(f"\n❌ Database error: {e}")
        print("\n💡 TIP: Make sure Cloud SQL Proxy is running:")
        print("   ./cloud_sql_proxy perundhu-prod-001:us-central1:perundhu-production-mysql-us --port 3307")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    success = check_admin_users()
    sys.exit(0 if success else 1)
