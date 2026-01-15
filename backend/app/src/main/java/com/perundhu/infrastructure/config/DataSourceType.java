package com.perundhu.infrastructure.config;

/**
 * Enum to identify datasource type for routing.
 * Used by RoutingDataSource to determine which database to use.
 */
public enum DataSourceType {
    /**
     * Primary datasource - handles all write operations and reads when replica unavailable
     */
    PRIMARY,
    
    /**
     * Read replica datasource - handles read-only operations for scaling
     */
    REPLICA
}
