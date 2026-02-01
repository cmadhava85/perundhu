#!/usr/bin/env python3
"""Cleanup duplicate records and add unique indexes for deduping."""

import os
import mysql.connector


def index_exists(cursor, db_name, table_name, index_name):
    cursor.execute(
        """
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = %s AND table_name = %s AND index_name = %s
        LIMIT 1
        """,
        (db_name, table_name, index_name),
    )
    return cursor.fetchone() is not None


def main():
    db_name = os.getenv("DB_NAME_PREPROD", "perundhu")
    config = {
        "host": os.getenv("DB_HOST_PREPROD", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT_PREPROD", "3307")),
        "user": os.getenv("DB_USER_PREPROD", "perundhu_user"),
        "password": os.getenv("DB_PASSWORD_PREPROD", ""),
        "database": db_name,
    }

    print("=" * 70)
    print("🧹 Starting duplicate cleanup")
    print("=" * 70)

    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()

    try:
        conn.start_transaction()

        # Normalize NULLs for consistent dedupe keys
        cursor.execute("UPDATE locations SET district = '' WHERE district IS NULL")
        cursor.execute("UPDATE locations SET state = '' WHERE state IS NULL")
        cursor.execute("UPDATE buses SET bus_number = '' WHERE bus_number IS NULL")

        # -------------------------
        # Deduplicate locations
        # -------------------------
        cursor.execute(
            """
            CREATE TEMPORARY TABLE tmp_location_map AS
            SELECT
                id AS old_id,
                MIN(id) OVER (PARTITION BY name, district, state) AS keep_id
            FROM locations
            """
        )

        cursor.execute(
            """
            UPDATE buses b
            JOIN tmp_location_map m ON b.from_location_id = m.old_id
            SET b.from_location_id = m.keep_id
            WHERE b.from_location_id <> m.keep_id
            """
        )
        cursor.execute(
            """
            UPDATE buses b
            JOIN tmp_location_map m ON b.to_location_id = m.old_id
            SET b.to_location_id = m.keep_id
            WHERE b.to_location_id <> m.keep_id
            """
        )
        cursor.execute(
            """
            UPDATE stops s
            JOIN tmp_location_map m ON s.location_id = m.old_id
            SET s.location_id = m.keep_id
            WHERE s.location_id <> m.keep_id
            """
        )
        cursor.execute(
            """
            UPDATE translations t
            JOIN tmp_location_map m ON t.entity_type = 'location' AND t.entity_id = m.old_id
            SET t.entity_id = m.keep_id
            WHERE t.entity_id <> m.keep_id
            """
        )
        cursor.execute(
            """
            DELETE l FROM locations l
            JOIN tmp_location_map m ON l.id = m.old_id
            WHERE m.old_id <> m.keep_id
            """
        )

        # -------------------------
        # Deduplicate buses
        # -------------------------
        cursor.execute(
            """
            CREATE TEMPORARY TABLE tmp_bus_map AS
            SELECT
                id AS old_id,
                MIN(id) OVER (PARTITION BY bus_number, from_location_id, to_location_id, departure_time, arrival_time) AS keep_id
            FROM buses
            """
        )
        cursor.execute(
            """
            UPDATE stops s
            JOIN tmp_bus_map m ON s.bus_id = m.old_id
            SET s.bus_id = m.keep_id
            WHERE s.bus_id <> m.keep_id
            """
        )
        cursor.execute(
            """
            UPDATE translations t
            JOIN tmp_bus_map m ON t.entity_type = 'bus' AND t.entity_id = m.old_id
            SET t.entity_id = m.keep_id
            WHERE t.entity_id <> m.keep_id
            """
        )
        cursor.execute(
            """
            DELETE b FROM buses b
            JOIN tmp_bus_map m ON b.id = m.old_id
            WHERE m.old_id <> m.keep_id
            """
        )

        # -------------------------
        # Deduplicate stops
        # -------------------------
        cursor.execute(
            """
            CREATE TEMPORARY TABLE tmp_stop_map AS
            SELECT
                id AS old_id,
                MIN(id) OVER (PARTITION BY bus_id, stop_order) AS keep_id
            FROM stops
            """
        )
        cursor.execute(
            """
            DELETE s FROM stops s
            JOIN tmp_stop_map m ON s.id = m.old_id
            WHERE m.old_id <> m.keep_id
            """
        )

        # -------------------------
        # Deduplicate translations
        # -------------------------
        cursor.execute(
            """
            CREATE TEMPORARY TABLE tmp_translation_keep AS
            SELECT MIN(id) AS keep_id
            FROM translations
            GROUP BY entity_type, entity_id, language_code, field_name
            """
        )
        cursor.execute(
            """
            DELETE t FROM translations t
            LEFT JOIN tmp_translation_keep k ON t.id = k.keep_id
            WHERE k.keep_id IS NULL
            """
        )

        # -------------------------
        # Add unique indexes (if missing)
        # -------------------------
        if not index_exists(cursor, db_name, "locations", "uq_locations_name_district_state"):
            cursor.execute(
                """
                CREATE UNIQUE INDEX uq_locations_name_district_state
                ON locations (name, district, state)
                """
            )

        if not index_exists(cursor, db_name, "buses", "uq_buses_bus_number_route_time"):
            cursor.execute(
                """
                CREATE UNIQUE INDEX uq_buses_bus_number_route_time
                ON buses (bus_number, from_location_id, to_location_id, departure_time, arrival_time)
                """
            )

        if not index_exists(cursor, db_name, "stops", "uq_stops_bus_order"):
            cursor.execute(
                """
                CREATE UNIQUE INDEX uq_stops_bus_order
                ON stops (bus_id, stop_order)
                """
            )

        conn.commit()
        print("✅ Cleanup complete. Unique indexes ensured.")

    except Exception as exc:
        conn.rollback()
        print(f"❌ Cleanup failed: {exc}")
        raise

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
