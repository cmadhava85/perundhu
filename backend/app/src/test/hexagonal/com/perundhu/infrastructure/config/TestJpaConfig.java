package com.perundhu.infrastructure.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;

import javax.sql.DataSource;

/**
 * Test configuration for JPA repositories.
 * This provides an in-memory H2 database for testing.
 */
@TestConfiguration
@EnableJpaRepositories(basePackages = "com.perundhu.infrastructure.persistence.jpa")
@ComponentScan(basePackages = {
    "com.perundhu.infrastructure.persistence.adapter",
    "com.perundhu.infrastructure.persistence.mapper"
})
public class TestJpaConfig {

    @Bean
    public DataSource dataSource() {
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .setName("testdb")
            .addScript("schema-h2.sql")
            .addScript("data-h2.sql")
            .build();
    }
}