package com.perundhu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.perundhu.infrastructure.config.ThreadPoolConfiguration;

@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
@Import(ThreadPoolConfiguration.class)
@ComponentScan(basePackages = {
        "com.perundhu.application",
        "com.perundhu.adapter",
        "com.perundhu.infrastructure",
        "com.perundhu.config",
        "com.perundhu.domain",
        "com.perundhu.api"
})
public class App {

    private static final Logger log = LoggerFactory.getLogger(App.class);

    public static void main(String[] args) {
        // Log Java version on startup
        log.info("Java version: {}", System.getProperty("java.version"));
        log.info("Virtual threads enabled: {}",
                System.getProperty("spring.threads.virtual.enabled"));

        SpringApplication.run(App.class, args);

        log.info("✓ Perundhu Application started with Java 21 optimizations");
    }
}
