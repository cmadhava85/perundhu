package com.perundhu.application.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.BusRouteDTO;
import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.OSMBusStopDTO;
import com.perundhu.application.dto.RouteDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.port.TranslationRepository;

@Service
@Transactional(readOnly = true) // Default to read-only for all methods (optimize read queries)
public class BusScheduleServiceImpl implements BusScheduleService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BusScheduleServiceImpl.class);

    // Constants to avoid string duplication
    private static final String ENTITY_TYPE_LOCATION = "location";
    private static final String ENTITY_TYPE_BUS = "Bus";
    private static final String ENTITY_TYPE_STOP = "Stop";
    private static final String FIELD_NAME = "name";

    private final BusRepository busRepository;
    private final LocationRepository locationRepository;
    private final StopRepository stopRepository;
    private final TranslationRepository translationRepository;

    // Constructor injection instead of field injection
    public BusScheduleServiceImpl(
            BusRepository busRepository,
            LocationRepository locationRepository,
            StopRepository stopRepository,
            TranslationRepository translationRepository) {
        this.busRepository = busRepository;
        this.locationRepository = locationRepository;
        this.stopRepository = stopRepository;
        this.translationRepository = translationRepository;
    }

    @Override
    @Cacheable(value = "allBusesCache")
    public List<BusDTO> getAllBuses() {
        long startTime = System.currentTimeMillis();
        // Get all buses from the repository
        List<Bus> buses = busRepository.findAll();
        log.debug("Fetched {} buses in {}ms", buses.size(), System.currentTimeMillis() - startTime);

        // Convert the Bus entities to DTOs using the static factory method
        return buses.stream()
                .map(BusDTO::fromDomain)
                .toList(); // Using Java 17's toList() instead of collect(Collectors.toList())
    }

    @Override
    public Optional<BusDTO> getBusById(Long busId) {
        return busRepository.findById(new BusId(busId))
                .map(BusDTO::fromDomain);
    }

    @Override
    @Cacheable(value = "locationsCache", key = "#languageCode")
    public List<LocationDTO> getAllLocations(String languageCode) {
        long startTime = System.currentTimeMillis();
        List<Location> locations = locationRepository.findAll();
        log.debug("Fetched {} locations in {}ms", locations.size(), System.currentTimeMillis() - startTime);

        // Batch load all translations for locations in one query to avoid N+1
        Map<Long, String> translationMap = new java.util.HashMap<>();
        if (languageCode != null && !languageCode.isEmpty()) {
            long transStart = System.currentTimeMillis();
            List<Translation> translations = translationRepository.findByEntityTypeAndLanguage(ENTITY_TYPE_LOCATION,
                    languageCode);
            for (Translation t : translations) {
                if (FIELD_NAME.equals(t.getFieldName())) {
                    translationMap.put(t.getEntityId(), t.getTranslatedValue());
                }
            }
            log.debug("Batch loaded {} translations in {}ms", translations.size(),
                    System.currentTimeMillis() - transStart);
        }

        return locations.stream().map(location -> {
            String translatedName = location.name();
            if (location.id() != null && translationMap.containsKey(location.id().value())) {
                translatedName = translationMap.get(location.id().value());
            }
            return new LocationDTO(
                    location.id() != null ? location.id().value() : null,
                    location.name(),
                    translatedName,
                    location.latitude(),
                    location.longitude());
        }).toList();
    }

    @Override
    @Cacheable(value = "busSearchCache", key = "#fromLocationId + '-' + #toLocationId")
    public List<BusDTO> findBusesBetweenLocations(Long fromLocationId, Long toLocationId) {
        LocationId fromId = new LocationId(fromLocationId);
        LocationId toId = new LocationId(toLocationId);

        List<Bus> buses = busRepository.findBusesBetweenLocations(fromId.value(), toId.value());

        // Sort buses by departure time with smart ordering:
        // 1. Current/upcoming buses first (based on current time)
        // 2. Past buses at the end (for today's reference)
        return sortBusesByCurrentTime(buses).stream()
                .map(BusDTO::fromDomain)
                .toList();
    }
    
    @Override
    @Cacheable(value = "busSearchCache", key = "#fromLocationId + '-' + #toLocationId + '-' + #languageCode")
    public List<BusDTO> findBusesBetweenLocations(Long fromLocationId, Long toLocationId, String languageCode) {
        LocationId fromId = new LocationId(fromLocationId);
        LocationId toId = new LocationId(toLocationId);

        List<Bus> buses = busRepository.findBusesBetweenLocations(fromId.value(), toId.value());

        // If English or no language specified, use standard method
        if (languageCode == null || "en".equals(languageCode)) {
            return findBusesBetweenLocations(fromLocationId, toLocationId);
        }

        // Get translations for from and to locations
        String fromTranslation = getLocationTranslation(fromLocationId, languageCode);
        String toTranslation = getLocationTranslation(toLocationId, languageCode);

        // Sort and convert to DTO with translations
        return sortBusesByCurrentTime(buses).stream()
                .map(bus -> BusDTO.fromDomainWithTranslations(bus, fromTranslation, toTranslation))
                .toList();
    }

    /**
     * Sort buses so that current/upcoming buses appear first, followed by past
     * buses.
     * This provides users with the most relevant departures at the top.
     * 
     * Sorting logic:
     * - Buses departing now or in the future are shown first (sorted by departure
     * time ascending)
     * - Buses that have already departed today are shown after (sorted by departure
     * time ascending)
     * - Buses without departure time are shown at the end
     */
    private List<Bus> sortBusesByCurrentTime(List<Bus> buses) {
        if (buses == null || buses.isEmpty()) {
            return buses;
        }

        LocalTime currentTime = LocalTime.now();

        // Custom comparator that prioritizes upcoming buses
        Comparator<Bus> smartTimeComparator = (bus1, bus2) -> {
            LocalTime time1 = bus1.getDepartureTime();
            LocalTime time2 = bus2.getDepartureTime();

            // Handle null departure times - put them at the end
            if (time1 == null && time2 == null)
                return 0;
            if (time1 == null)
                return 1;
            if (time2 == null)
                return -1;

            boolean isUpcoming1 = time1.isAfter(currentTime) || time1.equals(currentTime);
            boolean isUpcoming2 = time2.isAfter(currentTime) || time2.equals(currentTime);

            // If both are upcoming or both are past, sort by time ascending
            if (isUpcoming1 == isUpcoming2) {
                return time1.compareTo(time2);
            }

            // Upcoming buses come before past buses
            return isUpcoming1 ? -1 : 1;
        };

        return buses.stream()
                .sorted(smartTimeComparator)
                .toList();
    }

    @Override
    public List<StopDTO> getStopsForBus(Long busId, String languageCode) {
        long startTime = System.currentTimeMillis();
        Optional<Bus> busOptional = busRepository.findById(new BusId(busId));

        if (busOptional.isEmpty()) {
            return new ArrayList<>();
        }

        Bus bus = busOptional.get();
        List<Stop> stops = stopRepository.findByBusOrderByStopOrder(bus);
        log.debug("Loaded {} stops for bus {} in {}ms", stops.size(), busId, System.currentTimeMillis() - startTime);

        // Batch load translations for all location IDs to avoid N+1 queries
        Map<Long, String> translationMap = new java.util.HashMap<>();
        if (languageCode != null && !languageCode.isEmpty()) {
            long transStart = System.currentTimeMillis();
            List<Translation> translations = translationRepository.findByEntityTypeAndLanguage(ENTITY_TYPE_LOCATION,
                    languageCode);
            for (Translation t : translations) {
                if (FIELD_NAME.equals(t.getFieldName())) {
                    translationMap.put(t.getEntityId(), t.getTranslatedValue());
                }
            }
            log.debug("Batch loaded {} translations in {}ms", translations.size(),
                    System.currentTimeMillis() - transStart);
        }

        return stops.stream().map(stop -> {
            String translatedName = stop.name();

            // Look up translation from batch-loaded map
            if (stop.location() != null && stop.location().id() != null) {
                String translated = translationMap.get(stop.location().id().value());
                if (translated != null && !translated.isEmpty()) {
                    translatedName = translated;
                }
            }

            return new StopDTO(
                    stop.id().value(), // Long id
                    translatedName, // String name (translated)
                    stop.location() != null ? stop.location().id().value() : null, // Long locationId
                    stop.arrivalTime(), // LocalTime arrivalTime
                    stop.departureTime(), // LocalTime departureTime
                    stop.sequence(), // int sequence
                    Map.of(), // Map<String, String> features - empty for now
                    stop.location() != null ? stop.location().latitude() : null, // Double latitude
                    stop.location() != null ? stop.location().longitude() : null // Double longitude
            );
        }).toList();
    }

    @Override
    public List<StopDTO> findBusStops(Long busId, String languageCode) {
        // This is essentially the same as getStopsForBus
        return getStopsForBus(busId, languageCode);
    }

    @Override
    public List<BusScheduleDTO> findBusSchedules(Location fromLocation, Location toLocation, String languageCode) {
        List<Bus> buses = busRepository.findByFromAndToLocation(fromLocation, toLocation);

        return buses.stream().map(bus -> {
            // Initialize with original values
            String translatedName = bus.name();
            String fromLocationTranslatedName = fromLocation.name();
            String toLocationTranslatedName = toLocation.name();

            // If language code is provided, try to get translations
            if (languageCode != null && !languageCode.isEmpty()) {
                // For bus name
                final String[] finalTranslatedName = { translatedName };
                translationRepository
                        .findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
                                ENTITY_TYPE_BUS, bus.id().value(), FIELD_NAME, languageCode)
                        .ifPresent(translation -> finalTranslatedName[0] = translation.getTranslatedValue());
                translatedName = finalTranslatedName[0];

                // For from location name
                final String[] finalFromLocationName = { fromLocationTranslatedName };
                if (fromLocation.id() != null) {
                    translationRepository
                            .findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
                                    ENTITY_TYPE_LOCATION, fromLocation.id().value(), FIELD_NAME, languageCode)
                            .ifPresent(translation -> finalFromLocationName[0] = translation.getTranslatedValue());
                }
                fromLocationTranslatedName = finalFromLocationName[0];

                // For to location name
                final String[] finalToLocationName = { toLocationTranslatedName };
                if (toLocation.id() != null) {
                    translationRepository
                            .findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
                                    ENTITY_TYPE_LOCATION, toLocation.id().value(), FIELD_NAME, languageCode)
                            .ifPresent(translation -> finalToLocationName[0] = translation.getTranslatedValue());
                }
                toLocationTranslatedName = finalToLocationName[0];
            }

            return new BusScheduleDTO(
                    bus.id().value(), // 1. Long id
                    bus.name(), // 2. String name
                    translatedName, // 3. String translatedName
                    bus.number(), // 4. String busNumber
                    fromLocation.name(), // 5. String fromLocation
                    fromLocationTranslatedName, // 6. String fromLocationTranslated
                    toLocation.name(), // 7. String toLocation
                    toLocationTranslatedName, // 8. String toLocationTranslated
                    bus.departureTime(), // 9. LocalTime departureTime
                    bus.arrivalTime() // 10. LocalTime arrivalTime
            );
        }).toList(); // Using Java 17's toList() instead of collect(Collectors.toList())
    }

    @Override
    public List<BusDTO> findBusesPassingThroughLocations(Long fromLocationId, Long toLocationId) {
        // Enhanced: Automatically handle duplicate location names
        // If a village has the same name near different cities, search across all of
        // them
        long startTime = System.currentTimeMillis();

        // Get all location IDs that share the same name as the selected locations
        List<Long> fromLocationIds = findDuplicateLocationIds(fromLocationId);
        List<Long> toLocationIds = findDuplicateLocationIds(toLocationId);

        List<Bus> buses;
        if (fromLocationIds.size() > 1 || toLocationIds.size() > 1) {
            // Multiple locations with same name - use multi-ID search
            log.info("Searching across duplicate locations: from {} IDs, to {} IDs",
                    fromLocationIds.size(), toLocationIds.size());
            buses = busRepository.findBusesPassingThroughAnyLocations(fromLocationIds, toLocationIds);
        } else {
            // Single location - use optimized single-ID query
            buses = busRepository.findBusesPassingThroughLocations(fromLocationId, toLocationId);
        }

        log.debug("Found {} buses passing through locations in {}ms", buses.size(),
                System.currentTimeMillis() - startTime);

        return buses.stream()
                .map(BusDTO::fromDomain)
                .toList();
    }
    
    @Override
    public List<BusDTO> findBusesPassingThroughLocations(Long fromLocationId, Long toLocationId, String languageCode) {
        // If English or no language specified, use standard method
        if (languageCode == null || "en".equals(languageCode)) {
            return findBusesPassingThroughLocations(fromLocationId, toLocationId);
        }

        long startTime = System.currentTimeMillis();

        // Get all location IDs that share the same name as the selected locations
        List<Long> fromLocationIds = findDuplicateLocationIds(fromLocationId);
        List<Long> toLocationIds = findDuplicateLocationIds(toLocationId);

        List<Bus> buses;
        if (fromLocationIds.size() > 1 || toLocationIds.size() > 1) {
            // Multiple locations with same name - use multi-ID search
            log.info("Searching across duplicate locations: from {} IDs, to {} IDs",
                    fromLocationIds.size(), toLocationIds.size());
            buses = busRepository.findBusesPassingThroughAnyLocations(fromLocationIds, toLocationIds);
        } else {
            // Single location - use optimized single-ID query
            buses = busRepository.findBusesPassingThroughLocations(fromLocationId, toLocationId);
        }

        log.debug("Found {} buses passing through locations in {}ms", buses.size(),
                System.currentTimeMillis() - startTime);

        // Get translations for from and to locations
        String fromTranslation = getLocationTranslation(fromLocationId, languageCode);
        String toTranslation = getLocationTranslation(toLocationId, languageCode);

        return buses.stream()
                .map(bus -> BusDTO.fromDomainWithTranslations(bus, fromTranslation, toTranslation))
                .toList();
    }

    /**
     * Find all location IDs that have the same name as the given location.
     * This helps handle duplicate village names near different cities.
     * 
     * @param locationId The location ID to find duplicates for
     * @return List of location IDs with the same name (including the original)
     */
    private List<Long> findDuplicateLocationIds(Long locationId) {
        if (locationId == null) {
            return List.of();
        }

        // First, get the location name
        Optional<Location> locationOpt = locationRepository.findById(locationId);
        if (locationOpt.isEmpty()) {
            return List.of(locationId);
        }

        String locationName = locationOpt.get().name();

        // Find all locations with the same name
        List<Location> sameNameLocations = locationRepository.findByName(locationName);
        if (sameNameLocations.isEmpty() || sameNameLocations.size() == 1) {
            return List.of(locationId);
        }

        // Return all IDs including the original
        return sameNameLocations.stream()
                .map(loc -> loc.id().value())
                .toList();
    }

    /**
     * Helper method to check if there's a direct route between two locations
     * This method is not part of the BusScheduleService interface but can be useful
     * internally
     */
    public boolean hasDirectRoute(Long fromLocationId, Long toLocationId) {
        // Use the optimized query instead of loading all buses and stops
        List<Bus> buses = busRepository.findBusesPassingThroughLocations(fromLocationId, toLocationId);
        return !buses.isEmpty();
    }

    // Missing method implementations
    @Override
    public List<BusDTO> findBusesContinuingBeyondDestination(Long fromLocationId, Long toLocationId) {
        // Validate input parameters
        if (fromLocationId == null) {
            throw new IllegalArgumentException("From location ID cannot be null");
        }
        if (toLocationId == null) {
            throw new IllegalArgumentException("To location ID cannot be null");
        }
        if (fromLocationId.equals(toLocationId)) {
            throw new IllegalArgumentException("From and to location IDs cannot be the same");
        }

        // Call repository to find buses continuing beyond destination
        List<Bus> buses = busRepository.findBusesContinuingBeyondDestination(fromLocationId, toLocationId);

        // Convert to DTOs and return
        return buses.stream()
                .map(BusDTO::fromDomain)
                .toList();
    }

    @Override
    public List<BusRouteDTO> discoverOSMRoutes(Long fromLocationId, Long toLocationId) {
        // TODO: Implement actual logic to discover OSM routes
        return new ArrayList<>();
    }

    @Override
    public List<OSMBusStopDTO> discoverIntermediateStops(Long fromLocationId, Long toLocationId) {
        // TODO: Implement actual logic to discover intermediate stops
        return new ArrayList<>();
    }

    @Override
    public List<Location> searchLocationsByName(String query) {
        if (query == null || query.trim().length() < 2) {
            return new ArrayList<>();
        }

        String trimmedQuery = query.trim();
        List<Location> results = new ArrayList<>();
        
        // Detect if query is Tamil text
        boolean isTamilQuery = trimmedQuery.matches(".*[\\u0B80-\\u0BFF].*");
        
        if (isTamilQuery) {
            log.debug("Tamil search query detected: {}", trimmedQuery);
            
            // Search in translations table for Tamil names
            List<Translation> tamilTranslations = translationRepository.findByEntityTypeAndLanguage(
                ENTITY_TYPE_LOCATION, "ta");
            
            for (Translation translation : tamilTranslations) {
                String tamilName = translation.getTranslatedValue();
                if (tamilName != null && tamilName.toLowerCase().contains(trimmedQuery.toLowerCase())) {
                    // Found a matching Tamil translation - get the location
                    Optional<Location> location = locationRepository.findById(translation.getEntityId());
                    if (location.isPresent() && !results.contains(location.get())) {
                        results.add(location.get());
                        log.debug("Found location by Tamil search: {} -> {}", 
                            tamilName, location.get().getName());
                    }
                }
            }
            
            // Also try to translate Tamil to English and search in English names
            // This handles cases where the Tamil name might match an English location
            // that has a translation stored
        }
        
        // Also search by English name (standard search)
        List<Location> englishResults = locationRepository.findByNameContaining(trimmedQuery);
        for (Location loc : englishResults) {
            if (!results.contains(loc)) {
                results.add(loc);
            }
        }
        
        log.debug("Location search for '{}' returned {} results", trimmedQuery, results.size());
        return results;
    }

    @Override
    public List<BusDTO> searchRoutes(String fromLocation, String toLocation, int page, int size) {
        // TODO: Implement actual logic to search routes
        return new ArrayList<>();
    }

    @Override
    public List<BusScheduleDTO> searchBuses(String fromLocation, String toLocation, LocalDate date) {
        // TODO: Implement actual logic to search buses by date
        return new ArrayList<>();
    }

    @Override
    public List<RouteDTO> getAllRoutes() {
        // TODO: Implement actual logic to get all routes
        return new ArrayList<>();
    }

    @Override
    public BusScheduleDTO getBusSchedule(Long busId, LocalDate date) {
        // TODO: Implement actual logic to get bus schedule
        return null;
    }

    @Override
    public List<StopDTO> getStopsForRoute(Long routeId) {
        // TODO: Implement actual logic to get stops for route
        return new ArrayList<>();
    }

    @Override
    public List<BusDTO> findBusesPassingThroughAnyLocations(List<Long> fromLocationIds, List<Long> toLocationIds) {
        if (fromLocationIds == null || fromLocationIds.isEmpty() ||
                toLocationIds == null || toLocationIds.isEmpty()) {
            return new ArrayList<>();
        }

        long startTime = System.currentTimeMillis();
        List<Bus> buses = busRepository.findBusesPassingThroughAnyLocations(fromLocationIds, toLocationIds);
        log.debug("Found {} buses passing through any of {} from locations to any of {} to locations in {}ms",
                buses.size(), fromLocationIds.size(), toLocationIds.size(),
                System.currentTimeMillis() - startTime);

        return buses.stream()
                .map(BusDTO::fromDomain)
                .toList();
    }

    @Override
    public List<Long> findLocationIdsByName(String locationName) {
        if (locationName == null || locationName.trim().isEmpty()) {
            return new ArrayList<>();
        }

        List<Location> locations = locationRepository.findByName(locationName.trim());
        return locations.stream()
                .map(loc -> loc.id().getValue())
                .toList();
    }

    @Override
    public String getLocationTranslation(Long locationId, String languageCode) {
        if (locationId == null || languageCode == null) {
            return null;
        }
        
        // If requesting English, just return the location name directly
        if ("en".equals(languageCode)) {
            return locationRepository.findById(locationId)
                    .map(Location::getName)
                    .orElse(null);
        }
        
        // Look up translation in translations table
        Optional<Translation> translation = translationRepository.findTranslation(
                ENTITY_TYPE_LOCATION, locationId, languageCode, FIELD_NAME);
        
        return translation.map(Translation::getTranslatedValue).orElse(null);
    }
}
