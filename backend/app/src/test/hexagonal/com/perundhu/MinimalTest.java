package com.perundhu;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/**
 * A minimal test class that verifies basic functionality without Spring context.
 * This is useful as a sanity check that the testing framework is working.
 */
@Tag("hexagonal")
public class MinimalTest {
    
    @Test
    void testSimpleAssertion() {
        // This test just verifies that JUnit is working
        assertEquals(4, 2 + 2, "Simple arithmetic should work");
    }
    
    @Test
    void testObjectCreation() {
        // This test verifies that we can create objects
        Object obj = new Object();
        assertNotNull(obj, "Should be able to create objects");
    }
}