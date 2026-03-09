#!/usr/bin/env python3
"""Update admin password hash with a freshly generated BCrypt hash."""
import subprocess
import sys
import os
import re

def get_bcrypt_hash(password):
    """Generate BCrypt hash using htpasswd (available on macOS/Linux)."""
    result = subprocess.run(
        ['htpasswd', '-bnBC', '10', '', password],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"htpasswd failed: {result.stderr}")
    # Output format is ":$2y$10$..." — strip the leading colon and newline
    raw = result.stdout.strip().lstrip(':')
    # Spring Security accepts $2y$ and $2a$ but prefers $2a$
    return raw.replace('$2y$', '$2a$')

def update_password():
    import mysql.connector

    password = os.environ.get('ADMIN_PASSWORD', 'Admin123!@#Change')
    db_pass = os.environ.get('DB_PASS')
    if not db_pass:
        print("ERROR: DB_PASS environment variable required")
        sys.exit(1)

    print(f"Generating BCrypt hash for admin password...")
    new_hash = get_bcrypt_hash(password)
    print(f"Generated hash: {new_hash}")

    conn = mysql.connector.connect(
        host='127.0.0.1',
        port=3307,
        user='perundhu_user',
        password=db_pass,
        database='perundhu'
    )
    cursor = conn.cursor()

    # Check current hash
    cursor.execute("SELECT username, password_hash FROM admin_users WHERE username = 'perundhu_admin'")
    row = cursor.fetchone()
    if row:
        print(f"Current hash in DB: {row[1]}")
    else:
        print("WARNING: perundhu_admin user not found!")

    # Update with new verified hash
    cursor.execute(
        "UPDATE admin_users SET password_hash = %s WHERE username = 'perundhu_admin'",
        (new_hash,)
    )
    conn.commit()
    print(f"Updated password_hash for perundhu_admin")
    print(f"New hash: {new_hash}")

    cursor.close()
    conn.close()

if __name__ == '__main__':
    update_password()
