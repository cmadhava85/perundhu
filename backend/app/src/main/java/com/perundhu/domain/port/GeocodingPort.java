package com.perundhu.domain.port;

import java.util.Optional;

/**
 * Port interface for geocoding service (location lookup by name).
 * Used for resolving unknown location names to coordinates.
 */
public interface GeocodingPort {

    /**
     * Search for a location in Tamil Nadu
     * 
     * @param query The location name to search for
     * @return Optional result with location details
     */
    Optional<GeocodingResult> searchTamilNadu(String query);

    /**
     * Get the current cache size
     * 
     * @return Number of cached entries
     */
    int getCacheSize();

    /**
     * Result from a geocoding lookup
     */
    interface GeocodingResult {
        /**
         * Get the canonical/standardized name
         */
        String getCanonicalName();

        /**
         * Get the latitude
         */
        double getLatitude();

        /**
         * Get the longitude
         */
        double getLongitude();

        /**
         * Get the display name (full address)
         */
        String getDisplayName();
    }
}
