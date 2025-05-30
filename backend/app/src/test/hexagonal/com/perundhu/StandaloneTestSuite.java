package com.perundhu;

import org.junit.jupiter.api.Tag;
import org.junit.platform.suite.api.SelectClasses;
import org.junit.platform.suite.api.Suite;

import com.perundhu.domain.service.BusScheduleValidationServiceTest;
import com.perundhu.repository.BasicRepositoryTest;

/**
 * A dedicated test suite for standalone tests that don't rely on Spring's full test context.
 * These tests provide good coverage of the application's core functionality
 * while being more robust and less prone to configuration issues.
 */
@Suite
@Tag("hexagonal")
@SelectClasses({
    // Pure unit tests
    MinimalTest.class,
    StandaloneTest.class,
    
    // Domain service tests (updated for hexagonal architecture)
    BusScheduleValidationServiceTest.class,
    
    // Integration tests
    BasicRepositoryTest.class
})
public class StandaloneTestSuite {
    // This suite focuses on tests that are guaranteed to work with the hexagonal architecture
}