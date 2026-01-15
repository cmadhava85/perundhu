package com.perundhu.infrastructure.config;

import lombok.extern.slf4j.Slf4j;

/**
 * Thread-local holder for current datasource type.
 * This allows transparent switching between primary and replica databases.
 */
@Slf4j
public class DataSourceContextHolder {

    private static final ThreadLocal<DataSourceType> contextHolder = new ThreadLocal<>();

    // Private constructor to prevent instantiation
    private DataSourceContextHolder() {
        throw new UnsupportedOperationException("Utility class");
    }

    /**
     * Set datasource type for current thread
     */
    public static void setDataSourceType(DataSourceType dataSourceType) {
        if (dataSourceType == null) {
            log.warn("Setting null datasource type, using PRIMARY as fallback");
            contextHolder.set(DataSourceType.PRIMARY);
        } else {
            log.debug("Switching to {} datasource", dataSourceType);
            contextHolder.set(dataSourceType);
        }
    }

    /**
     * Get datasource type for current thread
     * @return DataSourceType, defaults to PRIMARY if not set
     */
    public static DataSourceType getDataSourceType() {
        DataSourceType type = contextHolder.get();
        return type != null ? type : DataSourceType.PRIMARY;
    }

    /**
     * Clear datasource type for current thread
     */
    public static void clearDataSourceType() {
        contextHolder.remove();
    }
}
