package com.perundhu.domain.model;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Bus domain model using Java 17 record for immutability and reduced
 * boilerplate
 */
public record Bus(
        BusId id,
        String name,
        String busNumber,
        Location fromLocation,
        Location toLocation,
        LocalTime departureTime,
        LocalTime arrivalTime,
        int capacity,
        String category,
        List<Location> stops,
        List<Translation> translations,
        Boolean active) implements Translatable<Bus> {

    // Value object for Bus ID
    public static record BusId(Long value) {
    }

    // Compact constructor for validation and default values
    public Bus {
        if (stops == null)
            stops = new ArrayList<>();
        if (translations == null)
            translations = new ArrayList<>();
        if (capacity <= 0)
            capacity = 50; // Default capacity
        if (active == null)
            active = true; // Default active status
    }

    /**
     * Constructor for backward compatibility with tests
     */
    public Bus(BusId id, String name, String busNumber, Location fromLocation, Location toLocation,
            LocalTime departureTime, LocalTime arrivalTime) {
        this(id, name, busNumber, fromLocation, toLocation, departureTime, arrivalTime,
                50, null, new ArrayList<>(), new ArrayList<>(), true);
    }

    /**
     * Constructor with capacity but no category for backward compatibility
     */
    public Bus(BusId id, String name, String busNumber, Location fromLocation, Location toLocation,
            LocalTime departureTime, LocalTime arrivalTime, int capacity, List<Location> stops) {
        this(id, name, busNumber, fromLocation, toLocation, departureTime, arrivalTime,
                capacity, null, stops != null ? stops : new ArrayList<>(), new ArrayList<>(), true);
    }

    /**
     * Constructor with all fields except active for backward compatibility
     */
    public Bus(BusId id, String name, String busNumber, Location fromLocation, Location toLocation,
            LocalTime departureTime, LocalTime arrivalTime, int capacity, String category,
            List<Location> stops, List<Translation> translations) {
        this(id, name, busNumber, fromLocation, toLocation, departureTime, arrivalTime,
                capacity, category, stops, translations, true);
    }

    /**
     * Returns all stops for this bus route, including the from and to locations
     */
    public List<Location> getStops() {
        if (stops == null || stops.isEmpty()) {
            // If no stops are explicitly defined, return just from and to locations
            return List.of(fromLocation, toLocation);
        }
        return Collections.unmodifiableList(stops);
    }

    /**
     * Check if this bus serves a route between the specified location IDs
     */
    public boolean hasRoute(Long fromLocationId, Long toLocationId) {
        boolean hasFromLocation = fromLocation != null && fromLocation.id() != null &&
                fromLocation.id().value().equals(fromLocationId);
        boolean hasToLocation = toLocation != null && toLocation.id() != null &&
                toLocation.id().value().equals(toLocationId);
        return hasFromLocation && hasToLocation;
    }

    /**
     * Calculate the journey duration in minutes
     */
    public int getDurationMinutes() {
        if (departureTime == null || arrivalTime == null) {
            return -1;
        }

        int departureMinutes = departureTime.getHour() * 60 + departureTime.getMinute();
        int arrivalMinutes = arrivalTime.getHour() * 60 + arrivalTime.getMinute();

        // Handle overnight journeys
        if (arrivalMinutes < departureMinutes) {
            arrivalMinutes += 24 * 60; // Add 24 hours
        }

        return arrivalMinutes - departureMinutes;
    }

    /**
     * Check if this bus is currently in service
     */
    public boolean isInService(LocalTime currentTime) {
        if (departureTime == null || arrivalTime == null || currentTime == null) {
            return false;
        }

        // Handle overnight journeys
        if (arrivalTime.isBefore(departureTime)) {
            // For overnight journeys, bus is in service if the current time is after
            // departure
            // or before arrival
            return !currentTime.isBefore(departureTime) || !currentTime.isAfter(arrivalTime);
        } else {
            // For same-day journeys, bus is in service if the current time is between
            // departure and arrival
            return !currentTime.isBefore(departureTime) && !currentTime.isAfter(arrivalTime);
        }
    }

    @Override
    public String getEntityType() {
        return "bus";
    }

    @Override
    public Long getEntityId() {
        return id != null ? id.value() : null;
    }

    @Override
    public String getDefaultValue(String fieldName) {
        return switch (fieldName) {
            case "name" -> name;
            case "busNumber" -> busNumber;
            default -> null;
        };
    }

    @Override
    public Translation addTranslation(String fieldName, String languageCode, String value) {
        Translation newTranslation = new Translation();
        newTranslation.setFieldName(fieldName);
        newTranslation.setLanguageCode(languageCode);
        newTranslation.setTranslatedValue(value); // Fixed: using setTranslatedValue instead of setValue
        newTranslation.setEntityType(getEntityType());
        newTranslation.setEntityId(getEntityId());

        List<Translation> updatedTranslations = new ArrayList<>(translations);
        updatedTranslations.add(newTranslation);

        // Return the new translation
        return newTranslation;
    }

    @Override
    public Map<String, Map<String, String>> getTranslations() {
        Map<String, Map<String, String>> result = new java.util.HashMap<>();

        // Group translations by field name and language
        for (Translation translation : translations) {
            String fieldName = translation.getFieldName();
            String languageCode = translation.getLanguageCode();
            String value = translation.getTranslatedValue();

            result.computeIfAbsent(fieldName, k -> new java.util.HashMap<>())
                    .put(languageCode, value);
        }

        return result;
    }

    /**
     * Get raw list of translations (for backward compatibility)
     */
    public List<Translation> getRawTranslations() {
        return translations != null ? List.copyOf(translations) : List.of();
    }

    @Override
    public Location getRelatedLocation() {
        return null; // Bus doesn't have a direct related location
    }

    // Helper methods for compatibility with existing code
    public BusId getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getBusNumber() {
        return busNumber;
    }

    public Location getFromLocation() {
        return fromLocation;
    }

    public Location getToLocation() {
        return toLocation;
    }

    public LocalTime getDepartureTime() {
        return departureTime;
    }

    public LocalTime getArrivalTime() {
        return arrivalTime;
    }

    public int getCapacity() {
        return capacity;
    }

    public String getCategory() {
        return category;
    }

    public Boolean getActive() {
        return active;
    }
}
