package com.perundhu.application.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.BusRouteSegmentDTO;
import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.ConnectingRoute;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.port.TranslationRepository;
import com.perundhu.domain.service.ConnectingRouteService;

@Service
public class BusScheduleServiceImpl implements BusScheduleService {

    // Constants to avoid string duplication
    private static final String ENTITY_TYPE_LOCATION = "Location";
    private static final String ENTITY_TYPE_BUS = "Bus";
    private static final String ENTITY_TYPE_STOP = "Stop";
    private static final String FIELD_NAME = "name";

    private final BusRepository busRepository;
    private final LocationRepository locationRepository;
    private final StopRepository stopRepository;
    private final TranslationRepository translationRepository;
    private final ConnectingRouteService connectingRouteService;

    // Constructor injection instead of field injection
    public BusScheduleServiceImpl(
            BusRepository busRepository,
            LocationRepository locationRepository,
            StopRepository stopRepository,
            TranslationRepository translationRepository,
            ConnectingRouteService connectingRouteService) {
        this.busRepository = busRepository;
        this.locationRepository = locationRepository;
        this.stopRepository = stopRepository;
        this.translationRepository = translationRepository;
        this.connectingRouteService = connectingRouteService;
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

        List<Bus> buses = busRepository.findBusesBetweenLocations(fromId, toId);

        return buses.stream()
                .map(BusDTO::fromDomain)
                .toList();
    }

    @Override
    public List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId) {
        // Get the location entities using domain IDs
        Optional<Location> fromLocationOptional = locationRepository.findById(new Location.LocationId(fromLocationId));
        Optional<Location> toLocationOptional = locationRepository.findById(new Location.LocationId(toLocationId));

        if (fromLocationOptional.isEmpty() || toLocationOptional.isEmpty()) {
            return new ArrayList<>();
        }

        Location fromLocation = fromLocationOptional.get();
        Location toLocation = toLocationOptional.get();

        // Get all buses for constructing routes
        List<Bus> allBuses = busRepository.findAll();

        // Use the connecting route service to find routes with domain model
        List<ConnectingRoute> domainRoutes = connectingRouteService.findConnectingRoutesDetailed(allBuses, fromLocation,
                toLocation, null);

        // Convert domain models to DTOs
        return convertToDTOs(domainRoutes, null);
    }

    @Override
    public List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId, Integer maxDepth) {
        // Get the location entities using domain IDs
        Optional<Location> fromLocationOptional = locationRepository.findById(new Location.LocationId(fromLocationId));
        Optional<Location> toLocationOptional = locationRepository.findById(new Location.LocationId(toLocationId));

        if (fromLocationOptional.isEmpty() || toLocationOptional.isEmpty()) {
            return new ArrayList<>();
        }

        Location fromLocation = fromLocationOptional.get();
        Location toLocation = toLocationOptional.get();

        // Get all buses for constructing routes
        List<Bus> allBuses = busRepository.findAll();

        // Use the connecting route service to find routes with domain model
        List<ConnectingRoute> domainRoutes = connectingRouteService.findConnectingRoutesDetailed(allBuses, fromLocation,
                toLocation, null, maxDepth);

        // Convert domain models to DTOs
        return convertToDTOs(domainRoutes, null);
    }

    @Override
    public List<ConnectingRouteDTO> findConnectingRoutes(Location fromLocation, Location toLocation,
            String languageCode) {
        // Get all buses for constructing routes
        List<Bus> allBuses = busRepository.findAll();

        // Use the connecting route service to find routes with domain model
        List<ConnectingRoute> domainRoutes = connectingRouteService.findConnectingRoutesDetailed(allBuses, fromLocation,
                toLocation, languageCode);

        // Convert domain models to DTOs
        return convertToDTOs(domainRoutes, languageCode);
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
            // Create a final copy of the name for use in lambda - using Lombok getter
            final String stopName = stop.getName();
            final String[] translatedNameHolder = { stopName };

            // If language code is provided, try to get translation
            if (languageCode != null && !languageCode.isEmpty()) {
                // Get translation for the stop name if available - using Lombok getter
                translationRepository
                        .findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
                                ENTITY_TYPE_STOP, stop.getId().value(), FIELD_NAME, languageCode)
                        .ifPresent(translation -> {
                            // Using var for local variable type inference (Java 10+)
                            var translatedValue = translation.getTranslatedValue();
                            if (translatedValue != null && !translatedValue.isEmpty()) {
                                translatedNameHolder[0] = translatedValue;
                            }
                        });
            }

            return new StopDTO(
                    translatedNameHolder[0],
                    stop.getName(),
                    stop.getArrivalTime(),
                    stop.getDepartureTime(),
                    stop.getStopOrder());
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
                    bus.busNumber(), // 4. String busNumber
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
                // Compare the Long value from the LocationId with fromLocationId - using Lombok
                // getter
                if (stop.getLocation().id() != null && stop.getLocation().id().value().equals(fromLocationId)) {
                    hasFromLocation = true;
                } else if (stop.getLocation().id() != null && stop.getLocation().id().value().equals(toLocationId)
                        && hasFromLocation) {
                    hasToLocation = true;
                    break;
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
                // Compare the Long value from the LocationId with fromLocationId - using Lombok
                // getter
                if (stop.getLocation().id() != null && stop.getLocation().id().value().equals(fromLocationId)) {
                    hasFromLocation = true;
                } else if (stop.getLocation().id() != null && stop.getLocation().id().value().equals(toLocationId)
                        && hasFromLocation) {
                    hasToLocation = true;
                    break;
                }
            }

            if (hasFromLocation && hasToLocation) {
                return true;
            }
        }

        return false;
    }

    /**
     * Convert domain ConnectingRoute objects to ConnectingRouteDTO objects
     * This is where the transformation from domain to application layer happens
     */
    private List<ConnectingRouteDTO> convertToDTOs(List<ConnectingRoute> domainRoutes, String languageCode) {
        List<ConnectingRouteDTO> dtos = new ArrayList<>();

        for (ConnectingRoute route : domainRoutes) {
            // Create bus route segments for this connecting route
            List<BusRouteSegmentDTO> segments = new ArrayList<>();
            List<Bus> buses = route.getBuses();

            for (int i = 0; i < buses.size(); i++) {
                Bus bus = buses.get(i);

                // Determine from/to location names for this segment
                String fromName = i == 0 ? route.getFrom().name() : null;
                String toName = i == buses.size() - 1 ? route.getTo().name() : null;

                BusRouteSegmentDTO segment = new BusRouteSegmentDTO(
                        bus.id().value(),
                        bus.name(),
                        bus.busNumber(),
                        fromName,
                        toName,
                        bus.departureTime(),
                        bus.arrivalTime());

                segments.add(segment);
            }

            // Build the DTO
            ConnectingRouteDTO dto = ConnectingRouteDTO.builder()
                    .from(route.getFrom().name())
                    .to(route.getTo().name())
                    .departureTime(route.getDepartureTime())
                    .arrivalTime(route.getArrivalTime())
                    .transfers(route.getTransfers())
                    .segments(segments)
                    .build();

            dtos.add(dto);
        }

        return dtos;
    }
}
