package com.perundhu.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

/**
 * Custom datasource router that selects between primary and replica databases.
 * Routes based on transaction type:
 * - Read-only transactions → REPLICA datasource (if available)
 * - Read-write transactions → PRIMARY datasource
 * 
 * This enables horizontal scaling by offloading read traffic to read replicas.
 */
@Slf4j
public class RoutingDataSource extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        DataSourceType type = DataSourceContextHolder.getDataSourceType();
        log.trace("Routing to {} datasource", type);
        return type;
    }
}
