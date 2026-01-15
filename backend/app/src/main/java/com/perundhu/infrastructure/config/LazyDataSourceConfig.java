package com.perundhu.infrastructure.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.LazyConnectionDataSourceProxy;

import javax.sql.DataSource;

/**
 * Wraps routing datasource with LazyConnectionDataSourceProxy.
 * This ensures datasource routing happens AFTER transaction determination,
 * preventing premature datasource selection.
 * 
 * Without this, Spring might select datasource before @Transactional
 * annotation is processed, causing incorrect routing.
 */
@Configuration
public class LazyDataSourceConfig {

    @Bean
    public DataSource dataSource(@Qualifier("routingDataSource") DataSource routingDataSource) {
        return new LazyConnectionDataSourceProxy(routingDataSource);
    }
}
