#!/usr/bin/env python3
import mysql.connector

PASSWORD='OkG2+j#7vW(:?:4eFeouUFG_iPty*}BX'
DBCFG=dict(host='127.0.0.1',port=3307,user='root',password=PASSWORD,database='perundhu')

LANG_COL_CANDIDATES=['language','lang','language_code','locale','code']
TEXT_COL_CANDIDATES=['translated_value','text','value','translation','name','title']

def detect_column(cursor, table, candidates):
    cursor.execute(f"SHOW COLUMNS FROM {table}")
    cols=[row[0] for row in cursor.fetchall()]
    for c in candidates:
        if c in cols:
            return c
    return None

def main():
    conn=mysql.connector.connect(**DBCFG)
    cursor=conn.cursor()

    # Show translations columns
    cursor.execute('SHOW COLUMNS FROM translations')
    print('[translations] columns:')
    for col in cursor.fetchall():
        print(' -', col[0], col[1])
    print()

    # Detect language and text columns
    lang_col=detect_column(cursor,'translations',LANG_COL_CANDIDATES)
    text_col=detect_column(cursor,'translations',TEXT_COL_CANDIDATES)
    print('Detected columns:')
    print(' - language column:', lang_col or '(not found)')
    print(' - text column:', text_col or '(not found)')
    print()

    # Distinct entity types in translations
    cursor.execute('SELECT entity_type, COUNT(*) FROM translations GROUP BY entity_type ORDER BY COUNT(*) DESC')
    print('Translations by entity_type:')
    for et, cnt in cursor.fetchall():
        print(f' - {et}: {cnt}')
    print()

    # Count Tamil translations for LOCATION and STOP
    if lang_col:
        for et in ['location','stop']:
            cursor.execute(f"SELECT COUNT(DISTINCT entity_id) FROM translations WHERE entity_type=%s AND {lang_col} IN ('ta','TA')", (et,))
            count=cursor.fetchone()[0]
            print(f'Distinct {et} with Tamil translation:', count)
    else:
        print('Language column not detected; cannot count Tamil coverage.')
    print()

    # Verify example: Madurai
    cursor.execute("SELECT id, name FROM locations WHERE LOWER(name)='madurai' LIMIT 1")
    loc=cursor.fetchone()
    if loc:
        loc_id, loc_name = loc
        print(f"Madurai location id: {loc_id}, name: {loc_name}")
        if lang_col and text_col:
            cursor.execute(f"SELECT {lang_col}, {text_col} FROM translations WHERE entity_type='location' AND entity_id=%s ORDER BY {lang_col}", (loc_id,))
            rows=cursor.fetchall()
            print('Madurai translations:')
            for lang, text in rows:
                print(f' - {lang}: {text}')
        else:
            print('Cannot display translations; missing language/text column detection.')
    else:
        print('Madurai not found in locations.')
    print()

    # Verify example: A stop referencing Madurai (first stop in that location)
    cursor.execute("SELECT s.id, s.name FROM stops s WHERE s.location_id=%s LIMIT 1", (loc_id,)) if loc else None
    stop = cursor.fetchone() if loc else None
    if stop:
        stop_id, stop_name = stop
        print(f"Sample stop id: {stop_id}, name: {stop_name}")
        if lang_col and text_col:
            cursor.execute(f"SELECT {lang_col}, {text_col} FROM translations WHERE entity_type='stop' AND entity_id=%s ORDER BY {lang_col}", (stop_id,))
            rows=cursor.fetchall()
            print('Stop translations:')
            for lang, text in rows:
                print(f' - {lang}: {text}')
        else:
            print('Cannot display stop translations; missing language/text column detection.')
    else:
        print('No stop found linked to Madurai (this is fine; we only needed location mapping).')

    cursor.close(); conn.close()

if __name__=='__main__':
    main()
