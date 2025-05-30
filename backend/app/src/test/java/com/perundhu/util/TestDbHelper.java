package com.perundhu.util;

import javax.sql.DataSource;

import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

/**
 * Helper class to set up a test database for repository tests.
 */
public class TestDbHelper {

    /**
     * Creates and initializes an H2 in-memory database for tests.
     * 
     * @return The initialized DataSource
     */
    public static DataSource createTestDataSource() {
        // Create an H2 in-memory database
        DataSource dataSource = new EmbeddedDatabaseBuilder()
                .setType(EmbeddedDatabaseType.H2)
                .setName("testdb")
                .build();
                
        // Initialize the database with schema and test data
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.addScript(new ClassPathResource("schema-h2.sql"));
        populator.addScript(new ClassPathResource("data-h2.sql"));
        populator.execute(dataSource);
        
        return dataSource;
    }
}