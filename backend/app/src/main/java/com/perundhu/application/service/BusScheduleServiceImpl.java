package com.perundhu.application.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

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
public class BusScheduleServiceImpl implements BusScheduleService {

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
    public List<BusDTO> getAllBuses() {
        // Get all buses from the repository
        List<Bus> buses = busRepository.findAll();

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
    public List<LocationDTO> getAllLocations(String languageCode) {
        List<Location> locations = locationRepository.findAll();

        return locations.stream().map(location -> {
            var translatedName = location.name();

            // If language code is provided, try to get translation
            if (languageCode != null && !languageCode.isEmpty() && location.id() != null) {
                // Using Java 17's map/orElse pattern for cleaner Optional handling
                translatedName = translationRepository
                        .findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
                                ENTITY_TYPE_LOCATION, location.id().value(), FIELD_NAME, languageCode)
                        .map(Translation::getTranslatedValue)
                        .orElse(location.name());
            }

            return new LocationDTO(
                    location.id() != null ? location.id().value() : null,
                    location.name(),
                    translatedName,
                    location.latitude(),
                    location.longitude());
        }).toList(); // Using Java 17's toList() instead of collect(Collectors.toList())
    }

    @Override
    public List<BusDTO> findBusesBetweenLocations(Long fromLocationId, Long toLocationId) {
        LocationId fromId = new LocationId(fromLocationId);
        LocationId toId = new LocationId(toLocationId);

        List<Bus> buses = busRepository.findBusesBetweenLocations(fromId.value(), toId.value());

        return buses.stream()
                .map(BusDTO::fromDomain)
                .toList();
    }

    @Override
    public List<StopDTO> getStopsForBus(Long busId, String languageCode) {
        Optional<Bus> busOptional = busRepository.findById(new BusId(busId));

        if (busOptional.isEmpty()) {
            return new ArrayList<>();
        }

        Bus bus = busOptional.get();
        List<Stop> stops = stopRepository.findByBusOrderByStopOrder(bus);

        return stops.stream().map(stop -> {
            // Create a final copy of the name for use in lambda - using record accessor
            final String stopName = stop.name();
            final String[] translatedNameHolder = { stopName };

            // If language code is provided, try to get translation
            // Note: Stops use location names, so we translate using the location's
            // translation
            if (languageCode != null && !languageCode.isEmpty() && stop.location() != null) {
                // Get translation for the stop's location name
                translationRepository
                        .findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
                                ENTITY_TYPE_LOCATION, stop.location().id().value(), FIELD_NAME, languageCode)
                        .ifPresent(translation -> {
                            // Using var for local variable type inference (Java 10+)
                            var translatedValue = translation.getTranslatedValue();
                            if (translatedValue != null && !translatedValue.isEmpty()) {
                                translatedNameHolder[0] = translatedValue;
                            }
                        });
            }

            return new StopDTO(
                    stop.id().value(), // Long id
                    translatedNameHolder[0], // String name (translated)
                    stop.location() != null ? stop.location().id().value() : null, // Long locationId
                    stop.arrivalTime(), // LocalTime arrivalTime
                    stop.departureTime(), // LocalTime departureTime
                    stop.sequence(), // int sequence
                    Map.of(), // Map<String, String> features - empty for now
                    stop.location() != null ? stop.location().latitude() : null, // Double latitude
                    stop.location() != null ? stop.location().longitude() : null // Double longitude
            );
        }).toList(); // Using Java 17's toList() instead of collect(Collectors.toList())
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
        List<Bus> buses = busRepository.findAll();
        List<Bus> resultBuses = new ArrayList<>();

        for (Bus bus : buses) {
            List<Stop> stops = stopRepository.findByBusOrderByStopOrder(bus);

            boolean hasFromLocation = false;
            boolean hasToLocation = false;

            for (Stop stop : stops) {
                // First check if the location itself is not null before accessing its id
                if (stop.location() != null && stop.location().id() != null) {
                    Long stopLocationId = stop.location().id().value();

                    // Check if this is the from location
                    if (stopLocationId.equals(fromLocationId)) {
                        hasFromLocation = true;
                    }

                    // Check if this is the to location AND we've already passed the from location
                    if (stopLocationId.equals(toLocationId) && hasFromLocation) {
                        hasToLocation = true;
                        break;
                    }
                }
            }

            if (hasFromLocation && hasToLocation) {
                resultBuses.add(bus);
            }
        }

        return resultBuses.stream()
                .map(BusDTO::fromDomain)
                .toList();
    }

    /**
     * Helper method to check if there's a direct route between two locations
     * This method is not part of the BusScheduleService interface but can be useful
     * internally
     */
    public boolean hasDirectRoute(Long fromLocationId, Long toLocationId) {
        List<Bus> buses = busRepository.findAll();

        for (Bus bus : buses) {
            List<Stop> stops = stopRepository.findByBusOrderByStopOrder(bus);

            boolean hasFromLocation = false;
            boolean hasToLocation = false;

            for (Stop stop : stops) {
                // First check if the location itself is not null before accessing its id
                if (stop.location() != null && stop.location().id() != null) {
                    Long stopLocationId = stop.location().id().value();

                    // Check if this is the from location
                    if (stopLocationId.equals(fromLocationId)) {
                        hasFromLocation = true;
                    }

                    // Check if this is the to location AND we've already passed the from location
                    if (stopLocationId.equals(toLocationId) && hasFromLocation) {
                        hasToLocation = true;
                        break;
                    }
                }
            }

            if (hasFromLocation && hasToLocation) {
                return true;
            }
        }

        return false;
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
        if (query == null || query.trim().length() < 3) {
            return new ArrayList<>();
        }

        // Use the repository method to search for locations by name pattern
        return locationRepository.findByNameContaining(query.trim());
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
}
