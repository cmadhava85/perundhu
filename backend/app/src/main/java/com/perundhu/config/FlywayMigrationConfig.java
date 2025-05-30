package com.perundhu.config;

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
                // If migration fails, clean and start fresh
                System.out.println("Migration failed, attempting clean and migrate: " + e.getMessage());
                flyway.clean();
                flyway.migrate();
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