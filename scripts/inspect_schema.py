#!/usr/bin/env python3
import mysql.connector
from getpass import getpass

def print_columns(cursor, table):
    cursor.execute(f'SHOW COLUMNS FROM {table}')
    cols = cursor.fetchall()
    print(f'[{table}] columns:')
    for c in cols:
        print(f'  - {c[0]} ({c[1]})')
    print()

def main():
    password='OkG2+j#7vW(:?:4eFeouUFG_iPty*}BX'
    conn = mysql.connector.connect(host='127.0.0.1', port=3307, user='root', password=password, database='perundhu')
    cursor = conn.cursor()
    for t in ['locations','translations','buses','stops','connecting_routes']:
        print_columns(cursor, t)
    cursor.close(); conn.close()

if __name__=='__main__':
    main()
