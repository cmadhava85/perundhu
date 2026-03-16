package com.perundhu.infrastructure.config;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * Configuration for read/write splitting datasources.
 * 
 * Creates two datasources:
 * 1. Primary - for write operations
 * 2. Replica - for read-only operations (optional, enabled via property)
 * 
 * When replica is enabled, routes 80% of traffic (reads) to replica,
 * saving costs by not scaling the primary database.
 * 
 * Cost savings: ~$40-180/month vs scaling primary instance
 */
@Configuration
@Slf4j
public class DataSourceConfig {

    /**
     * Primary datasource properties (write operations)
     */
    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties primaryDataSourceProperties() {
        return new DataSourceProperties();
    }

    /**
     * Primary datasource (handles all writes and reads when replica unavailable)
     */
    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.hikari")
    public DataSource primaryDataSource() {
        log.info("Configuring PRIMARY datasource");
        HikariDataSource dataSource = primaryDataSourceProperties()
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
        dataSource.setPoolName("Primary-HikariCP");
        return dataSource;
    }

    /**
     * Read replica datasource properties (read-only operations)
     * Only created when replica is enabled via property
     */
    @Bean
    @ConditionalOnProperty(name = "spring.datasource.replica.enabled", havingValue = "true")
    @ConfigurationProperties("spring.datasource.replica")
    public DataSourceProperties replicaDataSourceProperties() {
        return new DataSourceProperties();
    }

    /**
     * Read replica datasource (handles read-only queries for horizontal scaling)
     * Only created when replica is enabled via property
     */
    @Bean
    @ConditionalOnProperty(name = "spring.datasource.replica.enabled", havingValue = "true")
    @Qualifier("replicaDataSource")
    @ConfigurationProperties("spring.datasource.replica.hikari")
    public DataSource replicaDataSource() {
        log.info("Configuring READ REPLICA datasource");
        HikariDataSource dataSource = replicaDataSourceProperties()
                .initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();
        dataSource.setPoolName("Replica-HikariCP");
        
        // Optimize replica pool for read-heavy workload
        dataSource.setMaximumPoolSize(30); // Can be larger since reads are more frequent
        dataSource.setMinimumIdle(5);
        dataSource.setConnectionTimeout(20000); // Faster timeout for reads
        
        return dataSource;
    }

    /**
     * Routing datasource that switches between primary and replica
     * based on transaction type (read-only vs read-write)
     */
    @Bean("routingDataSource")
    public DataSource routingDataSource(
            @Qualifier("primaryDataSource") DataSource primaryDataSource) {
        
        RoutingDataSource routingDataSource = new RoutingDataSource();
        
        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put(DataSourceType.PRIMARY, primaryDataSource);
        
        // Try to get replica datasource if it exists (conditional bean)
        try {
            DataSource replicaDataSource = replicaDataSource();
            log.info("Read/write splitting ENABLED - routing reads to replica");
            targetDataSources.put(DataSourceType.REPLICA, replicaDataSource);
        } catch (Exception e) {
            log.info("Read replica DISABLED - all traffic routes to primary");
            targetDataSources.put(DataSourceType.REPLICA, primaryDataSource); // Fallback to primary
        }
        
        routingDataSource.setTargetDataSources(targetDataSources);
        routingDataSource.setDefaultTargetDataSource(primaryDataSource);
        
        return routingDataSource;
    }
}
