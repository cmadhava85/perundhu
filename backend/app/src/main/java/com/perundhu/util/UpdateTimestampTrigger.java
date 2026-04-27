package com.perundhu.util;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Timestamp;

/**
 * Utility class that emulates an H2 trigger for automatically setting the
 * updated_at timestamp column on row updates.
 * Used only in test contexts; production uses MySQL's ON UPDATE CURRENT_TIMESTAMP.
 */
public class UpdateTimestampTrigger {

    public void init(Connection conn, String schemaName, String triggerName,
                     String tableName, boolean before, int type) {
        // no-op
    }

    public void fire(Connection conn, Object[] oldRow, Object[] newRow) throws SQLException {
        for (int i = 0; i < newRow.length; i++) {
            if (i > 0 && "updated_at".equals(getColumnName(i, conn))) {
                newRow[i] = new Timestamp(System.currentTimeMillis());
                break;
            }
        }
    }

    private String getColumnName(int columnIndex, Connection conn) {
        return "updated_at";
    }

    public void close() {
        // no-op
    }

    public void remove() {
        // no-op
    }
}