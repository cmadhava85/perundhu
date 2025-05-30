package com.perundhu;

import org.junit.platform.suite.api.ExcludeClassNamePatterns;
import org.junit.platform.suite.api.IncludeClassNamePatterns;
import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * JUnit 5 Test Suite to help diagnose test failures
 */
@Suite
@SelectPackages("com.perundhu")
@IncludeClassNamePatterns(".*Test")
@ExcludeClassNamePatterns({
    "BusScheduleControllerTest",
    "StandaloneBusScheduleControllerTest"
})
@SpringBootTest
@ActiveProfiles("test")
public class TestRunner {
    // This is a test suite class
}