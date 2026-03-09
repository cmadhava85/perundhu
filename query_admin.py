#!/usr/bin/env python3
"""
Query admin_users table in production using Cloud SQL Proxy
"""
import mysql.connector
import sys
import os

def check_admin_users():
    """Query admin users from production database"""
    
    print("=" * 70)
    print("PRODUCTION ADMIN USERS CHECK")
    print("=" * 70)
    
    # Get credentials from environment variables or defaults
    config = {
        'host': os.getenv('DB_HOST_PROD', '127.0.0.1'),
        'port': int(os.getenv('DB_PORT_PROD', '3307')),
        'user': os.getenv('DB_USER_PROD', 'perundhu_user'),
        'password': os.getenv('DB_PASSWORD_PROD', ''),  # Must be provided
        'database': os.getenv('DB_NAME_PROD', 'perundhu'),
    }
    
    # Check if password is provided
    if not config['password']:
        print("\n❌ ERROR: DB_PASSWORD_PROD environment variable not set!")
        print("\n📝 To run this script:")
        print("\n   Option 1 - From Cloud Shell (has authorized access):")
        print("   ============================================")
        print("   # Copy to Cloud Shell")
        print("   gcloud cloud-shell scp query_admin.py cloudshell:~/")
        print("   ")
        print("   # Run in Cloud Shell")
        print("   gcloud cloud-shell ssh")
        print("   python3 query_admin.py")
        print("\n   Option 2 - Set password locally:")
        print("   ============================================")
        print("   export DB_PASSWORD_PROD='<password-from-secret>'")
        print("   python3 query_admin.py")
        return False
    
    try:
        print(f"\n🔌 Connecting to production database...")
        print(f"   Host: {config['host']}:{config['port']}")
        print(f"   Database: {config['database']}")
        print(f"   User: {config['user']}")
        
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        
        print("✅ Connected successfully!\n")
        
        # Query admin users
        query = """
            SELECT 
                id, 
                username, 
                email, 
                full_name,
                enabled, 
                roles,
                created_at,
                updated_at,
                last_login_at
            FROM admin_users
            WHERE username = 'perundhu_admin'
        """
        
        cursor.execute(query)
        result = cursor.fetchone()
        
        if result:
            print("📊 ADMIN USER FOUND")
            print("=" * 70)
            admin_id, username, email, full_name, enabled, roles, created_at, updated_at, last_login_at = result
            print(f"ID:              {admin_id}")
            print(f"Username:        {username}")
            print(f"Email:           {email}")
            print(f"Full Name:       {full_name}")
            print(f"Enabled:         {'✅ YES' if enabled else '❌ NO'}")
            print(f"Roles:           {roles}")
            print(f"Created:         {created_at}")
            print(f"Updated:         {updated_at}")
            print(f"Last Login:      {last_login_at}")
            print("=" * 70)
            
            if not enabled:
                print("\n⚠️  WARNING: Admin user is DISABLED!")
                print("Enable with: UPDATE admin_users SET enabled=TRUE WHERE username='perundhu_admin';")
            
            return True
        else:
            print("❌ ADMIN USER NOT FOUND (perundhu_admin)")
            print("\n💡 The default admin was not created or was deleted.")
            print("You need to:")
            print("  1. Ask DevOps for the current admin credentials")
            print("  2. Or create a new admin user")
            
            # Show total admin count
            cursor.execute("SELECT COUNT(*) FROM admin_users")
            total = cursor.fetchone()[0]
            print(f"\nTotal admin users in database: {total}")
            
            if total > 0:
                cursor.execute("SELECT id, username, email, enabled FROM admin_users ORDER BY id")
                admins = cursor.fetchall()
                print("\nExisting admin users:")
                for admin in admins:
                    status = "✅ Enabled" if admin[3] else "❌ Disabled"
                    print(f"  • {admin[1]} ({admin[2]}) - {status}")
            
            return False
            
    except mysql.connector.Error as e:
        print(f"\n❌ Database error: {e}")
        print("\n💡 Make sure:")
        print("   1. Cloud SQL Proxy is running on port 3307")
        print("   2. DB_PASSWORD_PROD environment variable is set correctly")
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
            print("\n✅ Connection closed")

if __name__ == "__main__":
    success = check_admin_users()
    sys.exit(0 if success else 1)
