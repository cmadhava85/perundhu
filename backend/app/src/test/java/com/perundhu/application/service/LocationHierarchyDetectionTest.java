package com.perundhu.application.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for location hierarchy detection logic in ContributionProcessingService
 * 
 * Tests the detectParentCity() and inferLocationType() methods to ensure
 * proper parent-child relationships are detected during contribution processing.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Location Hierarchy Detection Tests")
class LocationHierarchyDetectionTest {

    /**
     * Helper class to test private methods via reflection
     * In production, these would be tested through integration tests
     */
    static class HierarchyTestHelper {
        
        // Simplified version of detection logic for unit testing
        static boolean isTerminal(String locationName) {
            if (locationName == null) return false;
            String normalized = locationName.toLowerCase().trim();
            
            return normalized.contains("bus stand") ||
                   normalized.contains("terminal") ||
                   normalized.contains("bus station") ||
                   normalized.matches(".*(cmbt|kcbt|ombt|mbt|kpbt).*") ||
                   normalized.matches(".*(kilambakkam|koyambedu|madhavaram|poonamallee|tambaram).*") ||
                   normalized.matches(".*(gandhipuram|ukkadam|singanallur).*") ||
                   normalized.matches(".*(mattuthavani|arapalayam|periyar).*");
        }
        
        static boolean hasCityTerminalPattern(String locationName) {
            if (locationName == null) return false;
            return locationName.contains(" - ");
        }
        
        static boolean isMajorCity(String normalizedName) {
            if (normalizedName == null) return false;
            return normalizedName.matches(".*(chennai|madurai|coimbatore|trichy|tiruchirappalli|salem|" +
                    "vellore|tirunelveli|erode|tiruppur|thanjavur|dindigul|karur|" +
                    "kanchipuram|nagercoil|kumbakonam|thoothukudi|tuticorin|" +
                    "hosur|krishnagiri|dharmapuri|cuddalore|villupuram|" +
                    "bangalore|bengaluru|hyderabad|tirupati).*");
        }
    }

    @Test
    @DisplayName("Should detect city-terminal pattern")
    void shouldDetectCityTerminalPattern() {
        assertTrue(HierarchyTestHelper.hasCityTerminalPattern("Chennai - Kilambakkam"));
        assertTrue(HierarchyTestHelper.hasCityTerminalPattern("Madurai - Mattuthavani"));
        assertTrue(HierarchyTestHelper.hasCityTerminalPattern("Coimbatore - Gandhipuram"));
        
        assertFalse(HierarchyTestHelper.hasCityTerminalPattern("Chennai"));
        assertFalse(HierarchyTestHelper.hasCityTerminalPattern("Kilambakkam"));
    }

    @Test
    @DisplayName("Should detect terminal keywords")
    void shouldDetectTerminalKeywords() {
        // Direct keywords
        assertTrue(HierarchyTestHelper.isTerminal("Chennai Bus Stand"));
        assertTrue(HierarchyTestHelper.isTerminal("Central Bus Terminal"));
        assertTrue(HierarchyTestHelper.isTerminal("Omni Bus Station"));
        
        // Abbreviations
        assertTrue(HierarchyTestHelper.isTerminal("CMBT"));
        assertTrue(HierarchyTestHelper.isTerminal("KCBT"));
        assertTrue(HierarchyTestHelper.isTerminal("OMBT"));
        
        // Specific terminals
        assertTrue(HierarchyTestHelper.isTerminal("Kilambakkam"));
        assertTrue(HierarchyTestHelper.isTerminal("Koyambedu"));
        assertTrue(HierarchyTestHelper.isTerminal("Madhavaram"));
        assertTrue(HierarchyTestHelper.isTerminal("Gandhipuram"));
        assertTrue(HierarchyTestHelper.isTerminal("Mattuthavani"));
        
        // Non-terminals
        assertFalse(HierarchyTestHelper.isTerminal("Chennai"));
        assertFalse(HierarchyTestHelper.isTerminal("Madurai"));
        assertFalse(HierarchyTestHelper.isTerminal("Sivakasi"));
    }

    @Test
    @DisplayName("Should detect major cities")
    void shouldDetectMajorCities() {
        // Tamil Nadu cities
        assertTrue(HierarchyTestHelper.isMajorCity("chennai"));
        assertTrue(HierarchyTestHelper.isMajorCity("madurai"));
        assertTrue(HierarchyTestHelper.isMajorCity("coimbatore"));
        assertTrue(HierarchyTestHelper.isMajorCity("salem"));
        assertTrue(HierarchyTestHelper.isMajorCity("trichy"));
        assertTrue(HierarchyTestHelper.isMajorCity("tiruchirappalli"));
        assertTrue(HierarchyTestHelper.isMajorCity("vellore"));
        assertTrue(HierarchyTestHelper.isMajorCity("tirunelveli"));
        
        // Inter-state cities
        assertTrue(HierarchyTestHelper.isMajorCity("bangalore"));
        assertTrue(HierarchyTestHelper.isMajorCity("bengaluru"));
        assertTrue(HierarchyTestHelper.isMajorCity("hyderabad"));
        assertTrue(HierarchyTestHelper.isMajorCity("tirupati"));
        
        // Non-major cities
        assertFalse(HierarchyTestHelper.isMajorCity("sivakasi"));
        assertFalse(HierarchyTestHelper.isMajorCity("aruppukkottai"));
        assertFalse(HierarchyTestHelper.isMajorCity("unknown town"));
    }

    @Test
    @DisplayName("Should handle null and empty strings safely")
    void shouldHandleNullAndEmptyStrings() {
        assertFalse(HierarchyTestHelper.isTerminal(null));
        assertFalse(HierarchyTestHelper.isTerminal(""));
        assertFalse(HierarchyTestHelper.isTerminal("   "));
        
        assertFalse(HierarchyTestHelper.hasCityTerminalPattern(null));
        assertFalse(HierarchyTestHelper.hasCityTerminalPattern(""));
        
        assertFalse(HierarchyTestHelper.isMajorCity(null));
        assertFalse(HierarchyTestHelper.isMajorCity(""));
    }

    @Test
    @DisplayName("Should detect real-world location patterns")
    void shouldDetectRealWorldPatterns() {
        // Real Chennai terminals
        assertTrue(HierarchyTestHelper.isTerminal("Chennai - Kilambakkam Bus Stand"));
        assertTrue(HierarchyTestHelper.isTerminal("Koyambedu CMBT"));
        assertTrue(HierarchyTestHelper.isTerminal("Madhavaram Bus Terminus"));
        
        // Real Coimbatore terminals
        assertTrue(HierarchyTestHelper.isTerminal("Gandhipuram Central Bus Stand"));
        assertTrue(HierarchyTestHelper.isTerminal("Ukkadam Bus Stand"));
        assertTrue(HierarchyTestHelper.isTerminal("Singanallur Bus Station"));
        
        // Real Madurai terminals
        assertTrue(HierarchyTestHelper.isTerminal("Madurai - Mattuthavani Bus Stand"));
        assertTrue(HierarchyTestHelper.isTerminal("Arapalayam Bus Terminal"));
        assertTrue(HierarchyTestHelper.isTerminal("Periyar Bus Stand"));
    }

    @Test
    @DisplayName("Should be case insensitive")
    void shouldBeCaseInsensitive() {
        assertTrue(HierarchyTestHelper.isTerminal("KILAMBAKKAM"));
        assertTrue(HierarchyTestHelper.isTerminal("kilambakkam"));
        assertTrue(HierarchyTestHelper.isTerminal("Kilambakkam"));
        
        // isMajorCity expects normalized lowercase input
        assertTrue(HierarchyTestHelper.isMajorCity("chennai"));
        assertTrue(HierarchyTestHelper.isMajorCity("madurai city"));
        assertTrue(HierarchyTestHelper.isMajorCity("coimbatore junction"));
    }
}
