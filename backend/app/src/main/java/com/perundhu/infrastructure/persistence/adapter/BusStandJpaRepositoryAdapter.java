package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.perundhu.domain.model.BusStand;
import com.perundhu.domain.model.BusStandId;
import com.perundhu.domain.model.BusStandType;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.port.BusStandRepository;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.LocationJpaRepository;

/**
 * Adapter implementing BusStandRepository port using Location table.
 * Uses the existing locations table with naming pattern "City - BusStandName"
 * to provide multi-bus-stand search functionality.
 * 
 * This approach leverages existing data from V23 migration which added
 * bus stands as locations with the pattern "City - BusStandName".
 */
@Component
public class BusStandJpaRepositoryAdapter implements BusStandRepository {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BusStandJpaRepositoryAdapter.class);
    
    private final LocationJpaRepository locationRepository;

    public BusStandJpaRepositoryAdapter(LocationJpaRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    /**
     * Convert a location with pattern "City - BusStandName" to a BusStand domain object
     */
    private BusStand locationToBusStand(LocationJpaEntity location) {
        if (location == null) {
            return null;
        }
        
        String name = location.getName();
        String cityName = extractCityName(name);
        String busStandName = extractBusStandName(name);
        
        return new BusStand(
                new BusStandId(location.getId()),
                busStandName.isEmpty() ? name : name, // Full name as bus stand name
                new LocationId(location.getId()),
                cityName,
                location.getLatitude() != null ? location.getLatitude() : 0.0,
                location.getLongitude() != null ? location.getLongitude() : 0.0,
                null, // address
                null, // contactPhone
                determineBusStandType(name),
                null, // openingTime
                null, // closingTime
                true, // hasWaitingArea
                true, // hasRestroom
                false, // hasFoodCourt
                false, // hasAtm
                false, // hasParking
                null, // aliases
                true  // isActive
        );
    }

    /**
     * Extract city name from "City - BusStandName" pattern
     */
    private String extractCityName(String fullName) {
        if (fullName == null) return "";
        int dashIndex = fullName.indexOf(" - ");
        return dashIndex > 0 ? fullName.substring(0, dashIndex).trim() : fullName;
    }

    /**
     * Extract bus stand name from "City - BusStandName" pattern
     */
    private String extractBusStandName(String fullName) {
        if (fullName == null) return "";
        int dashIndex = fullName.indexOf(" - ");
        return dashIndex > 0 ? fullName.substring(dashIndex + 3).trim() : "";
    }

    /**
     * Determine bus stand type from name
     */
    private BusStandType determineBusStandType(String name) {
        if (name == null) return BusStandType.TNSTC;
        String lowerName = name.toLowerCase();
        if (lowerName.contains("private") || lowerName.contains("arapalayam")) {
            return BusStandType.PRIVATE;
        }
        if (lowerName.contains("setc")) {
            return BusStandType.SETC;
        }
        if (lowerName.contains("cmbt") || lowerName.contains("central") || lowerName.contains("main")) {
            return BusStandType.MAIN;
        }
        return BusStandType.TNSTC;
    }

    @Override
    public Optional<BusStand> findById(BusStandId id) {
        if (id == null || id.value() == null) {
            return Optional.empty();
        }
        return locationRepository.findById(id.value())
                .map(this::locationToBusStand);
    }

    @Override
    public Optional<BusStand> findById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return locationRepository.findById(id)
                .map(this::locationToBusStand);
    }

    @Override
    public List<BusStand> findAll() {
        // Find all locations that have the "City - BusStandName" pattern
        return locationRepository.findAll().stream()
                .filter(loc -> loc.getName() != null && loc.getName().contains(" - "))
                .map(this::locationToBusStand)
                .toList();
    }

    @Override
    public List<BusStand> findByCityId(LocationId cityId) {
        // Not directly applicable in location-based approach
        return List.of();
    }

    @Override
    public List<BusStand> findByCityName(String cityName) {
        if (cityName == null || cityName.isBlank()) {
            return List.of();
        }
        
        String searchPattern = cityName.trim() + " - ";
        log.debug("Searching for bus stands with pattern: '{}'", searchPattern);
        
        // Find locations that start with "CityName - "
        return locationRepository.findAll().stream()
                .filter(loc -> loc.getName() != null && 
                        loc.getName().toLowerCase().startsWith(cityName.trim().toLowerCase() + " - "))
                .map(this::locationToBusStand)
                .toList();
    }

    @Override
    public List<BusStand> findByNameContaining(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().length() < 2) {
            return List.of();
        }
        
        String term = searchTerm.trim().toLowerCase();
        return locationRepository.findAll().stream()
                .filter(loc -> loc.getName() != null && 
                        loc.getName().contains(" - ") &&
                        loc.getName().toLowerCase().contains(term))
                .map(this::locationToBusStand)
                .toList();
    }

    @Override
    public Optional<BusStand> findByExactName(String busStandName) {
        if (busStandName == null || busStandName.isBlank()) {
            return Optional.empty();
        }
        
        return locationRepository.findFirstByNameEqualsIgnoreCase(busStandName.trim())
                .map(this::locationToBusStand);
    }

    @Override
    public List<BusStand> findNearby(Double latitude, Double longitude, double radiusKm) {
        // Not implemented for location-based approach
        return List.of();
    }

    @Override
    public boolean isCityWithMultipleStands(String searchTerm) {
        if (searchTerm == null || searchTerm.isBlank()) {
            return false;
        }
        
        String term = searchTerm.trim().toLowerCase();
        
        // Check if there are multiple locations with pattern "CityName - *"
        long count = locationRepository.findAll().stream()
                .filter(loc -> loc.getName() != null && 
                        loc.getName().toLowerCase().startsWith(term + " - "))
                .count();
        
        log.debug("City '{}' has {} bus stands", searchTerm, count);
        return count > 1;
    }

    @Override
    public int countByCityName(String cityName) {
        if (cityName == null || cityName.isBlank()) {
            return 0;
        }
        
        String term = cityName.trim().toLowerCase();
        return (int) locationRepository.findAll().stream()
                .filter(loc -> loc.getName() != null && 
                        loc.getName().toLowerCase().startsWith(term + " - "))
                .count();
    }

    @Override
    public BusStand save(BusStand busStand) {
        // Not supported in location-based approach
        throw new UnsupportedOperationException("Save operation not supported for location-based bus stand adapter");
    }

    @Override
    public void delete(BusStandId id) {
        // Not supported in location-based approach
        throw new UnsupportedOperationException("Delete operation not supported for location-based bus stand adapter");
    }

    /**
     * Get list of cities that have multiple bus stands
     */
    public List<String> getCitiesWithMultipleStands() {
        // Group locations by city name and filter those with count > 1
        return locationRepository.findAll().stream()
                .filter(loc -> loc.getName() != null && loc.getName().contains(" - "))
                .map(loc -> extractCityName(loc.getName()))
                .collect(Collectors.groupingBy(city -> city, Collectors.counting()))
                .entrySet().stream()
                .filter(e -> e.getValue() > 1)
                .map(e -> e.getKey())
                .toList();
    }
}
