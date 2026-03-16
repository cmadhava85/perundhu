package com.perundhu.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.SmartLifecycle;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Runs Flyway migrations as a SmartLifecycle component at phase 0.
 *
 * Why SmartLifecycle instead of Spring Boot's FlywayAutoConfiguration:
 * - FlywayAutoConfiguration creates a 'flyway' bean in Spring's bean graph.
 * - FlywayEntityManagerFactoryDependsOnPostProcessor then adds
 *   entityManagerFactory → depends-on → flyway.
 * - Our multi-datasource setup (LazyProxy → RoutingDataSource → primaryDataSource)
 *   creates a transitive path back, causing a circular depends-on error.
 *
 * By running at phase 0 (before the embedded web server at MAX_VALUE - 1),
 * migrations complete BEFORE HTTP is live, so the startup probe cannot pass
 * until the schema is fully ready.
 */
@Component
@Profile("preprod")
@Slf4j
public class FlywayRunner implements SmartLifecycle {

    @Value("${spring.flyway.url}")
    private String url;

    @Value("${spring.flyway.user}")
    private String user;

    @Value("${spring.flyway.password:}")
    private String password;

    @Value("${spring.flyway.locations:classpath:db/migration}")
    private String locations;

    @Value("${spring.flyway.schemas:perundhu}")
    private String schemas;

    @Value("${spring.flyway.out-of-order:true}")
    private boolean outOfOrder;

    @Value("${spring.flyway.connect-retries:5}")
    private int connectRetries;

    @Value("${spring.flyway.enabled:true}")
    private boolean enabled;

    private volatile boolean running = false;

    @Override
    public void start() {
        if (!enabled) {
            log.info("Flyway migration disabled via FLYWAY_ENABLED=false, skipping.");
            running = true;
            return;
        }

        log.info("Running Flyway database migration (phase 0, before web server)...");
        try {
            Flyway flyway = Flyway.configure()
                    .dataSource(url, user, password)
                    .locations(locations)
                    .schemas(schemas)
                    .outOfOrder(outOfOrder)
                    .validateOnMigrate(false)
                    .cleanDisabled(true)
                    .baselineOnMigrate(false)
                    .encoding("UTF-8")
                    .connectRetries(connectRetries)
                    .load();

            flyway.migrate();

            log.info("Flyway migration completed successfully.");
        } catch (Exception e) {
            log.error("Flyway migration failed: {}", e.getMessage(), e);
            throw new RuntimeException("Database migration failed. Application cannot start.", e);
        }

        running = true;
    }

    @Override
    public void stop() {
        running = false;
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    @Override
    public int getPhase() {
        // Phase 0 ensures this runs before the embedded web server
        // (WebServerStartStopLifecycle runs at Integer.MAX_VALUE - 1).
        // Migrations are fully applied before HTTP accepts any traffic.
        return 0;
    }
}
