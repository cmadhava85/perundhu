#!/usr/bin/env python3
import mysql.connector

def main():
    password='OkG2+j#7vW(:?:4eFeouUFG_iPty*}BX'
    conn=mysql.connector.connect(host='127.0.0.1',port=3307,user='root',password=password,database='perundhu')
    cursor=conn.cursor()
    cursor.execute('SHOW COLUMNS FROM translations')
    cols=cursor.fetchall()
    print('translations columns:')
    for c in cols:
        print('  -',c[0],c[1])
    print()
    candidate_cols=['language','lang','language_code','locale','code']
    lang_col=None
    for col in candidate_cols:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM translations WHERE {col} IN ('ta','TA') AND entity_type='LOCATION'")
            count=cursor.fetchone()[0]
            lang_col=col
            print(f"Tamil translations count ({col}):", count)
            cursor.execute(f"SELECT COUNT(DISTINCT entity_id) FROM translations WHERE entity_type='LOCATION' AND {col} IN ('ta','TA')")
            distinct_count=cursor.fetchone()[0]
            print('Distinct locations with Tamil translation:', distinct_count)
            break
        except Exception:
            continue
    if not lang_col:
        print('Could not auto-detect language column for translations.')
    cursor.execute('SELECT COUNT(*) FROM locations')
    print('Locations total:', cursor.fetchone()[0])
    cursor.close(); conn.close()

if __name__=='__main__':
    main()
