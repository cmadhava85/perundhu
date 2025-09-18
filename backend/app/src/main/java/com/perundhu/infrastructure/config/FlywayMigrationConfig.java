package com.perundhu.infrastructure.config;

import javax.sql.DataSource;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
public class FlywayMigrationConfig {

    @Bean
    @Profile("!test")
    public FlywayMigrationStrategy productionMigrationStrategy(DataSource dataSource) {
        return flyway -> {
            try {
                // First try to repair the schema history table
                flyway.repair();

                // Then try to migrate
                flyway.migrate();
            } catch (Exception e) {
                // Log the error but don't try to clean in production/dev
                System.err.println("Migration failed: " + e.getMessage());
                System.err.println("Please check the migration scripts and database state manually.");
                throw new RuntimeException("Database migration failed. Manual intervention required.", e);
            }
        };
    }

    @Bean
    @Profile("test")
    public FlywayMigrationStrategy testMigrationStrategy() {
        return flyway -> {
            // In test environment, always clean and migrate
            flyway.clean();
            flyway.migrate();
        };
    }
}