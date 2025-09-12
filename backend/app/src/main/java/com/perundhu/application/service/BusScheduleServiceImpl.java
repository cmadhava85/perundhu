package com.perundhu.application.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.time.format.DateTimeFormatter;
import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.BusRouteSegmentDTO;
import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.RouteDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.application.dto.OSMBusStopDTO;
import com.perundhu.application.dto.BusRouteDTO;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.port.TranslationRepository;
import com.perundhu.domain.port.TranslationService;
import com.perundhu.domain.service.ConnectingRouteService;

public class BusScheduleServiceImpl implements BusScheduleService {

        private static final Logger log = LoggerFactory.getLogger(BusScheduleServiceImpl.class);

        private final BusRepository busRepository;
        private final LocationRepository locationRepository;
        private final StopRepository stopRepository;
        private final TranslationService translationService;
        private final TranslationRepository translationRepository;
        private final ConnectingRouteService connectingRouteService;
        private final OpenStreetMapGeocodingService openStreetMapGeocodingService;
        private final OSMOverpassService osmOverpassService;

        public BusScheduleServiceImpl(
                        BusRepository busRepository,
                        LocationRepository locationRepository,
                        StopRepository stopRepository,
                        TranslationService translationService,
                        TranslationRepository translationRepository,
                        ConnectingRouteService connectingRouteService,
                        OpenStreetMapGeocodingService openStreetMapGeocodingService,
                        OSMOverpassService osmOverpassService) {
                this.busRepository = busRepository;
                this.locationRepository = locationRepository;
                this.stopRepository = stopRepository;
                this.translationService = translationService;
                this.translationRepository = translationRepository;
                this.connectingRouteService = connectingRouteService;
                this.openStreetMapGeocodingService = openStreetMapGeocodingService;
                this.osmOverpassService = osmOverpassService;
        }

        /**
         * Implementation for the original method (kept for backward compatibility)
         */
        public List<BusScheduleDTO> findBusSchedules(Location from, Location to, String languageCode) {
                return busRepository.findByFromAndToLocation(from, to)
                                .stream()
                                .map(bus -> mapToDTO(bus, languageCode))
                                .toList();
        }

        @Override
        public List<StopDTO> getStopsForBus(Long busId, String languageCode) {
                return findBusStops(busId, languageCode);
        }

        public List<StopDTO> findBusStops(Long busId, String languageCode) {
                log.info("Finding stops for bus {} with language {}", busId, languageCode);

                // Add detailed debugging to identify issues
                var busOptional = busRepository.findById(new Bus.BusId(busId));
                if (busOptional.isEmpty()) {
                        log.error("Bus with ID {} not found in the database", busId);
                        return List.of();
                }

                Bus bus = busOptional.get();
                log.info("Found bus: id={}, name={}, from={}, to={}",
                                bus.getId().getValue(), bus.getName(),
                                bus.getFromLocation().getName(),
                                bus.getToLocation().getName());

                var stops = stopRepository.findByBusOrderByStopOrder(bus);
                log.info("Found {} stops for bus {}", stops.size(), busId);

                // Log details of each stop for debugging
                stops.forEach(stop -> log.info("Stop: id={}, name={}, location_id={}, order={}",
                                stop.getId().getValue(), stop.getName(),
                                stop.getLocation() != null ? stop.getLocation().getId().getValue() : "null",
                                stop.getStopOrder()));

                return switch (languageCode) {
                        case "ta" -> handleTamilStops(busId);
                        default -> handleDefaultLanguageStops(busId, languageCode);
                };
        }

        private List<StopDTO> handleTamilStops(Long busId) {
                log.info("Tamil language requested for stops, using direct translation lookup");
                return busRepository.findById(new Bus.BusId(busId))
                                .map(bus -> stopRepository.findByBusOrderByStopOrder(bus).stream()
                                                .map(stop -> {
                                                        var stopName = stop.getName();
                                                        var translatedName = stopName;

                                                        var translations = translationRepository
                                                                        .findByEntityAndLanguage("stop",
                                                                                        stop.getId().getValue(), "ta");

                                                        translatedName = translations.stream()
                                                                        .filter(t -> "name".equals(t.getFieldName()))
                                                                        .findFirst()
                                                                        .map(Translation::getTranslatedValue)
                                                                        .or(() -> {
                                                                                var location = stop.getLocation();
                                                                                if (location != null) {
                                                                                        return translationRepository
                                                                                                        .findByEntityAndLanguage(
                                                                                                                        "location",
                                                                                                                        location.getId().getValue(),
                                                                                                                        "ta")
                                                                                                        .stream()
                                                                                                        .filter(t -> "name"
                                                                                                                        .equals(t.getFieldName()))
                                                                                                        .findFirst()
                                                                                                        .map(Translation::getTranslatedValue);
                                                                                }

                                                                                return locationRepository.findAll()
                                                                                                .stream()
                                                                                                .filter(loc -> stopName
                                                                                                                .equalsIgnoreCase(
                                                                                                                                loc.getName()))
                                                                                                .findFirst()
                                                                                                .flatMap(loc -> translationRepository
                                                                                                                .findByEntityAndLanguage(
                                                                                                                                "location",
                                                                                                                                loc.getId().getValue(),
                                                                                                                                "ta")
                                                                                                                .stream()
                                                                                                                .filter(t -> "name"
                                                                                                                                .equals(t.getFieldName()))
                                                                                                                .findFirst()
                                                                                                                .map(Translation::getTranslatedValue));
                                                                        })
                                                                        .orElse(stopName);

                                                        // Extract coordinates from stop location
                                                        Double latitude = null;
                                                        Double longitude = null;
                                                        if (stop.getLocation() != null) {
                                                                latitude = stop.getLocation().getLatitude();
                                                                longitude = stop.getLocation().getLongitude();
                                                        }

                                                        return new StopDTO(
                                                                        stopName,
                                                                        translatedName,
                                                                        stop.getArrivalTime(),
                                                                        stop.getDepartureTime(),
                                                                        stop.getStopOrder(),
                                                                        latitude,
                                                                        longitude);
                                                })
                                                .toList())
                                .orElse(List.of());
        }

        private List<StopDTO> handleDefaultLanguageStops(Long busId, String languageCode) {
                return busRepository.findById(new Bus.BusId(busId))
                                .map(bus -> stopRepository.findByBusOrderByStopOrder(bus).stream()
                                                .map(stop -> {
                                                        // Extract coordinates from stop location
                                                        Double latitude = null;
                                                        Double longitude = null;
                                                        if (stop.getLocation() != null) {
                                                                latitude = stop.getLocation().getLatitude();
                                                                longitude = stop.getLocation().getLongitude();
                                                        }

                                                        return new StopDTO(
                                                                        stop.getName(),
                                                                        translationService.getTranslation(stop, "name",
                                                                                        languageCode),
                                                                        stop.getArrivalTime(),
                                                                        stop.getDepartureTime(),
                                                                        stop.getStopOrder(),
                                                                        latitude,
                                                                        longitude);
                                                })
                                                .toList())
                                .orElse(List.of());
        }

        /**
         * Enhanced connecting routes with OSM integration
         * Combines database routes with OSM-discovered routes
         */
        @Override
        public List<ConnectingRouteDTO> findConnectingRoutes(Location from, Location to, String languageCode) {
                log.info("Finding enhanced connecting routes with OSM integration");

                // First get traditional connecting routes from database
                var allBuses = busRepository.findByFromLocation(from);
                var databaseRoutes = connectingRouteService.findConnectingRoutes(allBuses, from, to);

                List<ConnectingRouteDTO> results = new ArrayList<>();

                // Convert database routes
                List<BusScheduleDTO> busSchedules = databaseRoutes.stream()
                                .flatMap(List::stream)
                                .map(bus -> mapToDTO(bus, languageCode))
                                .toList();

                results.addAll(busSchedules.stream()
                                .map(bus -> {
                                        BusRouteSegmentDTO firstLeg = BusRouteSegmentDTO.builder()
                                                        .busId(bus.getId())
                                                        .busName(bus.getName())
                                                        .busNumber(bus.getBusNumber())
                                                        .departureTime(bus.getDepartureTime().toString())
                                                        .from(bus.getFromLocationName())
                                                        .to("Connection Point")
                                                        .duration(60)
                                                        .distance(15.5)
                                                        .build();

                                        BusRouteSegmentDTO secondLeg = BusRouteSegmentDTO.builder()
                                                        .busId(bus.getId())
                                                        .busName(bus.getName())
                                                        .busNumber(bus.getBusNumber())
                                                        .departureTime(bus.getDepartureTime().toString())
                                                        .from("Connection Point")
                                                        .to(bus.getToLocationName())
                                                        .arrivalTime(bus.getArrivalTime().toString())
                                                        .duration(60)
                                                        .distance(15.5)
                                                        .build();

                                        return ConnectingRouteDTO.builder()
                                                        .id(bus.getId())
                                                        .connectionPoint("Transfer Station")
                                                        .waitTime(15)
                                                        .totalDuration(120)
                                                        .totalDistance(31.0)
                                                        .firstLeg(firstLeg)
                                                        .secondLeg(secondLeg)
                                                        .connectionStops(new ArrayList<>())
                                                        .isOSMDiscovered(false)
                                                        .build();
                                })
                                .collect(Collectors.toList()));

                // If database routes are insufficient, try OSM discovery
                if (results.size() < 3) {
                        try {
                                List<BusRouteDTO> osmRoutes = discoverOSMRoutes(
                                                from.getId().getValue(),
                                                to.getId().getValue());

                                // Convert OSM routes to connecting routes
                                results.addAll(osmRoutes.stream()
                                                .map(osmRoute -> convertOSMRouteToConnecting(osmRoute, from, to))
                                                .filter(route -> route != null)
                                                .collect(Collectors.toList()));

                                log.info("Added {} OSM-discovered routes", osmRoutes.size());
                        } catch (Exception e) {
                                log.error("Error discovering OSM routes", e);
                        }
                }

                return results;
        }

        /**
         * Enhanced route discovery using OSM data
         * Discovers intermediate bus stops between two locations using OpenStreetMap
         */
        public List<OSMBusStopDTO> discoverIntermediateStops(Long fromLocationId, Long toLocationId) {
                log.info("Discovering intermediate stops between locations {} and {}", fromLocationId, toLocationId);

                Optional<LocationPair> locationPair = getLocations(fromLocationId, toLocationId);
                if (locationPair.isEmpty()) {
                        return List.of();
                }

                Location from = locationPair.get().from();
                Location to = locationPair.get().to();

                // Use OSM Overpass API to find bus stops between locations
                return osmOverpassService.discoverBusStopsBetweenLocations(
                                from.getLatitude(), from.getLongitude(),
                                to.getLatitude(), to.getLongitude(),
                                25.0 // 25km search radius
                );
        }

        /**
         * Discover actual bus routes using OSM data
         * This finds real-world bus routes that might connect the locations
         */
        public List<BusRouteDTO> discoverOSMRoutes(Long fromLocationId, Long toLocationId) {
                log.info("Discovering OSM bus routes between locations {} and {}", fromLocationId, toLocationId);

                Optional<LocationPair> locationPair = getLocations(fromLocationId, toLocationId);
                if (locationPair.isEmpty()) {
                        return List.of();
                }

                Location from = locationPair.get().from();
                Location to = locationPair.get().to();

                return osmOverpassService.discoverBusRoutesBetween(
                                from.getLatitude(), from.getLongitude(),
                                to.getLatitude(), to.getLongitude(),
                                50.0 // 50km search radius for route discovery
                );
        }

        /**
         * Convert OSM route to connecting route format
         */
        private ConnectingRouteDTO convertOSMRouteToConnecting(BusRouteDTO osmRoute, Location from, Location to) {
                try {
                        BusRouteSegmentDTO osmLeg = BusRouteSegmentDTO.builder()
                                        .busId(-osmRoute.getOsmId()) // Use negative ID for OSM routes
                                        .busName(osmRoute.getRouteName())
                                        .busNumber(osmRoute.getRouteRef())
                                        .from(osmRoute.getFromLocation() != null ? osmRoute.getFromLocation()
                                                        : from.getName())
                                        .to(osmRoute.getToLocation() != null ? osmRoute.getToLocation()
                                                        : to.getName())
                                        .duration(osmRoute.getEstimatedDuration() != null
                                                        ? osmRoute.getEstimatedDuration().intValue()
                                                        : 90)
                                        .distance(osmRoute.getEstimatedDistance() != null
                                                        ? osmRoute.getEstimatedDistance()
                                                        : 25.0)
                                        .build();

                        return ConnectingRouteDTO.builder()
                                        .id(-osmRoute.getOsmId())
                                        .connectionPoint("OSM Discovered Route")
                                        .waitTime(0) // Direct route
                                        .totalDuration(osmRoute.getEstimatedDuration() != null
                                                        ? osmRoute.getEstimatedDuration().intValue()
                                                        : 90)
                                        .totalDistance(osmRoute.getEstimatedDistance() != null
                                                        ? osmRoute.getEstimatedDistance()
                                                        : 25.0)
                                        .firstLeg(osmLeg)
                                        .secondLeg(null) // Direct route, no second leg
                                        .connectionStops(convertOSMStopsToConnection(osmRoute.getStops()))
                                        .isOSMDiscovered(true)
                                        .osmRouteRef(osmRoute.getRouteRef())
                                        .osmNetwork(osmRoute.getNetwork())
                                        .osmOperator(osmRoute.getOperator())
                                        .build();

                } catch (Exception e) {
                        log.error("Error converting OSM route to connecting route", e);
                        return null;
                }
        }

        /**
         * Convert OSM stops to connection stop format
         */
        private List<StopDTO> convertOSMStopsToConnection(List<OSMBusStopDTO> osmStops) {
                if (osmStops == null)
                        return new ArrayList<>();

                return osmStops.stream()
                                .map(osmStop -> new StopDTO(
                                                osmStop.getName(),
                                                osmStop.getName(),
                                                null, // No timing information from OSM
                                                null,
                                                0,
                                                osmStop.getLatitude(),
                                                osmStop.getLongitude()))
                                .collect(Collectors.toList());
        }

        public List<LocationDTO> getAllLocations() {
                return locationRepository.findAll().stream()
                                .map(location -> new LocationDTO(
                                                location.getId().getValue(),
                                                location.getName(),
                                                location.getLatitude(),
                                                location.getLongitude()))
                                .toList();
        }

        @Override
        public List<LocationDTO> getAllLocations(String languageCode) {
                return getAllLocationsWithLanguage(languageCode);
        }

        public List<LocationDTO> getAllLocationsWithLanguage(String languageCode) {
                log.info("Getting all locations with language: {}", languageCode);

                return switch (languageCode) {
                        case "ta" -> handleTamilLocations();
                        default -> handleDefaultLanguageLocations(languageCode);
                };
        }

        private List<LocationDTO> handleTamilLocations() {
                log.info("Tamil language requested, using direct translation lookup");
                return locationRepository.findAll().stream()
                                .map(location -> {
                                        var locationId = location.getId().getValue();
                                        log.info("Looking up translations for location id={}, name={}", locationId,
                                                        location.getName());

                                        var translations = translationRepository
                                                        .findByEntityAndLanguage("location", locationId, "ta");

                                        log.info("Found {} Tamil translations for location id={}", translations.size(),
                                                        locationId);
                                        translations.forEach(
                                                        t -> log.info("  - Translation for {}: {}", t.getFieldName(),
                                                                        t.getTranslatedValue()));

                                        var translatedName = translations.stream()
                                                        .filter(t -> "name".equals(t.getFieldName()))
                                                        .findFirst()
                                                        .map(Translation::getTranslatedValue)
                                                        .orElse(location.getName());

                                        if (!translatedName.equals(location.getName())) {
                                                log.info("Using translation for location {}: {}", locationId,
                                                                translatedName);
                                        } else {
                                                log.info("No translation found for location {}, using default name: {}",
                                                                locationId, location.getName());
                                        }

                                        var dto = new LocationDTO(
                                                        locationId,
                                                        location.getName(),
                                                        translatedName,
                                                        location.getLatitude(),
                                                        location.getLongitude());

                                        log.info("Created DTO for location={}: name={}, translatedName={}",
                                                        locationId, dto.getName(), dto.getTranslatedName());

                                        return dto;
                                })
                                .toList();
        }

        private List<LocationDTO> handleDefaultLanguageLocations(String languageCode) {
                return locationRepository.findAll().stream()
                                .map(location -> {
                                        var translatedName = translationService.getTranslation(location, "name",
                                                        languageCode);
                                        log.info("Regular flow - Location {}: translated name = {}",
                                                        location.getId().getValue(), translatedName);

                                        return new LocationDTO(
                                                        location.getId().getValue(),
                                                        location.getName(),
                                                        translatedName,
                                                        location.getLatitude(),
                                                        location.getLongitude());
                                })
                                .toList();
        }

        public List<LocationDTO> getDestinations(Long fromId) {
                return locationRepository.findAllExcept(new Location.LocationId(fromId)).stream()
                                .map(location -> new LocationDTO(
                                                location.getId().getValue(),
                                                location.getName(),
                                                translationService.getTranslation(location, "name", "en"),
                                                location.getLatitude(),
                                                location.getLongitude()))
                                .toList();
        }

        public List<LocationDTO> getDestinationsWithLanguage(Long fromId, String languageCode) {
                return locationRepository.findAllExcept(new Location.LocationId(fromId)).stream()
                                .map(location -> new LocationDTO(
                                                location.getId().getValue(),
                                                location.getName(),
                                                translationService.getTranslation(location, "name", languageCode),
                                                location.getLatitude(),
                                                location.getLongitude()))
                                .toList();
        }

        public List<BusScheduleDTO> getBuses(Long fromId, Long toId) {
                return locationRepository.findById(new Location.LocationId(fromId))
                                .flatMap(fromLocation -> locationRepository.findById(new Location.LocationId(toId))
                                                .map(toLocation -> busRepository
                                                                .findByFromAndToLocation(fromLocation, toLocation)
                                                                .stream()
                                                                .map(bus -> mapToDTO(bus, null))
                                                                .toList()))
                                .orElse(List.of());
        }

        public List<BusScheduleDTO> getBusesWithLanguage(Long fromId, Long toId, String languageCode) {
                return locationRepository.findById(new Location.LocationId(fromId))
                                .flatMap(fromLocation -> locationRepository.findById(new Location.LocationId(toId))
                                                .map(toLocation -> busRepository
                                                                .findByFromAndToLocation(fromLocation, toLocation)
                                                                .stream()
                                                                .map(bus -> mapToDTO(bus, languageCode))
                                                                .toList()))
                                .orElse(List.of());
        }

        public List<BusScheduleDTO> findConnectingRoutesByIds(Long fromId, Long toId) {
                return getLocations(fromId, toId)
                                .map(locations -> {
                                        // First get the connecting routes as ConnectingRouteDTO objects
                                        List<ConnectingRouteDTO> routeDTOs = findConnectingRoutes(locations.from(),
                                                        locations.to(), null);

                                        // Then convert them to BusScheduleDTO objects
                                        return routeDTOs.stream()
                                                        .map(route -> new BusScheduleDTO(
                                                                        route.getId(),
                                                                        route.getFirstLeg().getBusName(),
                                                                        route.getFirstLeg().getBusName(),
                                                                        route.getFirstLeg().getBusNumber(),
                                                                        route.getFirstLeg().getFrom(),
                                                                        route.getFirstLeg().getFrom(),
                                                                        route.getSecondLeg().getTo(),
                                                                        route.getSecondLeg().getTo(),
                                                                        null, // Can't easily convert string back to
                                                                              // LocalTime
                                                                        null // Can't easily convert string back to
                                                                             // LocalTime
                                        ))
                                                        .toList();
                                })
                                .orElse(List.of());
        }

        public List<BusScheduleDTO> findConnectingRoutesByIdsWithLanguage(Long fromId, Long toId, String languageCode) {
                return getLocations(fromId, toId)
                                .map(locations -> {
                                        // First get the connecting routes as ConnectingRouteDTO objects
                                        List<ConnectingRouteDTO> routeDTOs = findConnectingRoutes(locations.from(),
                                                        locations.to(),
                                                        languageCode);

                                        // Then convert them to BusScheduleDTO objects
                                        return routeDTOs.stream()
                                                        .map(route -> new BusScheduleDTO(
                                                                        route.getId(),
                                                                        route.getFirstLeg().getBusName(),
                                                                        route.getFirstLeg().getBusName(),
                                                                        route.getFirstLeg().getBusNumber(),
                                                                        route.getFirstLeg().getFrom(),
                                                                        route.getFirstLeg().getFrom(),
                                                                        route.getSecondLeg().getTo(),
                                                                        route.getSecondLeg().getTo(),
                                                                        null, // Can't easily convert string back to
                                                                              // LocalTime
                                                                        null // Can't easily convert string back to
                                                                             // LocalTime
                                        ))
                                                        .toList();
                                })
                                .orElse(List.of());
        }

        @Override
        public List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId) {
                log.info("Finding connecting routes between locations: {} and {}", fromLocationId, toLocationId);

                Optional<LocationPair> locationPair = getLocations(fromLocationId, toLocationId);
                if (locationPair.isPresent()) {
                        return findConnectingRoutes(locationPair.get().from(), locationPair.get().to(), null);
                }

                return List.of();
        }

        @Override
        public List<BusDTO> findBusesBetweenLocations(Long fromLocationId, Long toLocationId) {
                log.info("Finding buses between locations: {} and {}", fromLocationId, toLocationId);
                List<BusScheduleDTO> routes = findRoutesBetweenLocations(fromLocationId, toLocationId);

                List<BusDTO> result = new ArrayList<>();
                for (BusScheduleDTO route : routes) {
                        result.add(new BusDTO(
                                        route.getId(),
                                        route.getName(),
                                        route.getBusNumber(),
                                        route.getFromLocationName(),
                                        route.getToLocationName(),
                                        route.getDepartureTime(),
                                        route.getArrivalTime()));
                }
                return result;
        }

        @Override
        public List<BusDTO> findBusesPassingThroughLocations(Long fromLocationId, Long toLocationId) {
                log.info("Finding buses passing through locations: {} and {}", fromLocationId, toLocationId);

                // Use the new repository method to find buses with intermediate stops
                List<Bus> buses = busRepository.findBusesPassingThroughLocations(fromLocationId, toLocationId);

                List<BusDTO> result = new ArrayList<>();
                for (Bus bus : buses) {
                        result.add(new BusDTO(
                                        bus.getId().getValue(),
                                        bus.getName(),
                                        bus.getBusNumber(),
                                        bus.getFromLocation().getName(),
                                        bus.getToLocation().getName(),
                                        bus.getDepartureTime(),
                                        bus.getArrivalTime()));
                }
                return result;
        }

        @Override
        public List<BusDTO> findBusesContinuingBeyondDestination(Long fromLocationId, Long toLocationId) {
                log.info("Finding buses that continue beyond destination: from {} via {} to further cities",
                                fromLocationId, toLocationId);

                // Input validation
                if (fromLocationId == null) {
                        throw new IllegalArgumentException("From location ID cannot be null");
                }
                if (toLocationId == null) {
                        throw new IllegalArgumentException("To location ID cannot be null");
                }
                if (fromLocationId.equals(toLocationId)) {
                        throw new IllegalArgumentException("From and to location IDs cannot be the same");
                }

                // Find buses that have both fromLocation and toLocation as stops,
                // where toLocation is NOT the final destination
                List<Bus> buses = busRepository.findBusesContinuingBeyondDestination(fromLocationId, toLocationId);

                List<BusDTO> result = new ArrayList<>();
                for (Bus bus : buses) {
                        // Create BusDTO showing the full route (origin to final destination)
                        // but mark it as passing through the search destination
                        result.add(new BusDTO(
                                        bus.getId().getValue(),
                                        bus.getName() + " (via " + getLocationName(toLocationId) + ")",
                                        bus.getBusNumber(),
                                        bus.getFromLocation().getName(),
                                        bus.getToLocation().getName(), // This shows the final destination
                                        bus.getDepartureTime(),
                                        bus.getArrivalTime()));
                }

                log.info("Found {} buses continuing beyond destination", result.size());
                return result;
        }

        /**
         * Helper method to get location name by ID
         */
        private String getLocationName(Long locationId) {
                return locationRepository.findById(new Location.LocationId(locationId))
                                .map(Location::getName)
                                .orElse("Unknown");
        }

        @Override
        public List<BusDTO> getAllBuses() {
                log.info("Getting all buses");

                return busRepository.findAllBuses().stream()
                                .map(bus -> new BusDTO(
                                                bus.getId().getValue(),
                                                bus.getName(),
                                                bus.getBusNumber(),
                                                bus.getFromLocation().getName(),
                                                bus.getToLocation().getName(),
                                                bus.getDepartureTime(),
                                                bus.getArrivalTime()))
                                .collect(Collectors.toList());
        }

        @Override
        public Optional<BusDTO> getBusById(Long busId) {
                log.info("Getting bus by ID: {}", busId);

                return busRepository.findById(busId)
                                .map(bus -> new BusDTO(
                                                bus.getId().getValue(),
                                                bus.getName(),
                                                bus.getBusNumber(),
                                                bus.getFromLocation().getName(),
                                                bus.getToLocation().getName(),
                                                bus.getDepartureTime(),
                                                bus.getArrivalTime()));
        }

        /**
         * Search locations by name pattern for autocomplete
         * Enhanced to support all Indian cities with OpenStreetMap fallback
         * PRIORITIZES TAMIL NADU cities first, then other Indian cities
         * 
         * @param namePattern The partial name to search for (minimum 2 characters)
         * @return List of matching locations, with Tamil Nadu cities first
         */
        public List<Location> searchLocationsByName(String namePattern) {
                log.info("Searching locations by name pattern: '{}'", namePattern);

                if (namePattern == null || namePattern.trim().length() < 2) {
                        log.warn("Name pattern too short for search: '{}'", namePattern);
                        return List.of();
                }

                List<Location> results = new ArrayList<>();

                // PRIORITY 1: Search database for Tamil Nadu locations first
                List<Location> tnDatabaseResults = locationRepository.findByNameContaining(namePattern.trim());
                results.addAll(tnDatabaseResults);

                log.info("Found {} Tamil Nadu database results for '{}'", tnDatabaseResults.size(), namePattern);

                // PRIORITY 2: If we need more results, search OpenStreetMap with TN priority
                if (results.size() < 10) {
                        try {
                                List<LocationDTO> osmResults = openStreetMapGeocodingService.searchIndianCities(
                                                namePattern.trim(), 10 - results.size());

                                // Convert OSM results to Location objects, maintaining TN priority
                                for (LocationDTO osmLocation : osmResults) {
                                        // Check if we already have this city in our results
                                        boolean isDuplicate = results.stream()
                                                        .anyMatch(existing -> isSimilarLocation(existing.getName(),
                                                                        osmLocation.getName()));

                                        if (!isDuplicate) {
                                                Location osmLocationEntity = new Location(
                                                                new Location.LocationId(osmLocation.getId()),
                                                                osmLocation.getName(),
                                                                osmLocation.getLatitude(),
                                                                osmLocation.getLongitude());
                                                results.add(osmLocationEntity);
                                        }
                                }

                                log.info("Added {} OpenStreetMap results for '{}'", osmResults.size(), namePattern);

                        } catch (Exception e) {
                                log.error("Error searching OpenStreetMap for pattern: '{}'", namePattern, e);
                        }
                }

                // 3. Sort results to ensure Tamil Nadu cities appear first
                List<Location> sortedResults = results.stream()
                                .sorted((loc1, loc2) -> {
                                        boolean isTn1 = isInTamilNadu(loc1);
                                        boolean isTn2 = isInTamilNadu(loc2);

                                        // Tamil Nadu locations first
                                        if (isTn1 && !isTn2)
                                                return -1;
                                        if (!isTn1 && isTn2)
                                                return 1;

                                        // Within same category, sort alphabetically
                                        return loc1.getName().compareToIgnoreCase(loc2.getName());
                                })
                                .limit(10)
                                .map(this::cleanLocationName)
                                .collect(Collectors.toList());

                log.info("Returning {} prioritized results for '{}' ({} TN, {} others)",
                                sortedResults.size(), namePattern,
                                sortedResults.stream().mapToInt(loc -> isInTamilNadu(loc) ? 1 : 0).sum(),
                                sortedResults.stream().mapToInt(loc -> isInTamilNadu(loc) ? 0 : 1).sum());

                return sortedResults;
        }

        /**
         * Check if a location is in Tamil Nadu based on coordinates
         */
        private boolean isInTamilNadu(Location location) {
                if (location.getLatitude() == null || location.getLongitude() == null) {
                        // For locations without coordinates, assume they're in TN if from our database
                        return true; // Most database locations are TN-based
                }

                double lat = location.getLatitude();
                double lon = location.getLongitude();

                // Tamil Nadu approximate bounds
                return lat >= 8.0 && lat <= 13.5 && lon >= 76.0 && lon <= 81.0;
        }

        /**
         * Check if two location names are similar (to avoid duplicates)
         */
        private boolean isSimilarLocation(String name1, String name2) {
                if (name1 == null || name2 == null)
                        return false;

                String clean1 = name1.toLowerCase().trim();
                String clean2 = name2.toLowerCase().trim();

                return clean1.equals(clean2) ||
                                clean1.contains(clean2) ||
                                clean2.contains(clean1) ||
                                calculateSimilarity(clean1, clean2) > 0.8;
        }

        /**
         * Calculate string similarity using simple character comparison
         */
        private double calculateSimilarity(String s1, String s2) {
                if (s1.equals(s2))
                        return 1.0;

                int maxLength = Math.max(s1.length(), s2.length());
                if (maxLength == 0)
                        return 1.0;

                int editDistance = calculateEditDistance(s1, s2);
                return 1.0 - (double) editDistance / maxLength;
        }

        /**
         * Calculate edit distance between two strings
         */
        private int calculateEditDistance(String s1, String s2) {
                int[][] dp = new int[s1.length() + 1][s2.length() + 1];

                for (int i = 0; i <= s1.length(); i++) {
                        for (int j = 0; j <= s2.length(); j++) {
                                if (i == 0) {
                                        dp[i][j] = j;
                                } else if (j == 0) {
                                        dp[i][j] = i;
                                } else {
                                        dp[i][j] = Math.min(
                                                        dp[i - 1][j] + 1,
                                                        Math.min(
                                                                        dp[i][j - 1] + 1,
                                                                        dp[i - 1][j - 1] + (s1.charAt(i - 1) == s2
                                                                                        .charAt(j - 1) ? 0 : 1)));
                                }
                        }
                }

                return dp[s1.length()][s2.length()];
        }

        /**
         * Clean location name to show only city name (remove street/road details)
         */
        private Location cleanLocationName(Location location) {
                String originalName = location.getName();
                String cleanName = cleanCityName(originalName);

                if (!cleanName.equals(originalName)) {
                        return new Location(
                                        location.getId(),
                                        cleanName,
                                        location.getLatitude(),
                                        location.getLongitude());
                }

                return location;
        }

        /**
         * Clean city name by removing street names, road details, etc.
         */
        private String cleanCityName(String name) {
                if (name == null || name.trim().isEmpty()) {
                        return name;
                }

                // Split by comma and take the first meaningful part
                String[] parts = name.split(",");

                for (String part : parts) {
                        String cleanPart = part.trim();

                        // Skip parts that look like street names or administrative details
                        if (cleanPart.matches(
                                        ".*\\b(road|street|avenue|lane|circle|sector|phase|area|extension|junction|bus stand|railway station|station)\\b.*")) {
                                continue;
                        }

                        // Skip state names and country
                        if (cleanPart.matches(
                                        ".*\\b(Tamil Nadu|Karnataka|Kerala|Maharashtra|Gujarat|Delhi|India)\\b.*")) {
                                continue;
                        }

                        // Skip postal codes
                        if (cleanPart.matches("\\d{5,6}")) {
                                continue;
                        }

                        // If we found a good city name part, clean it up and return
                        if (cleanPart.length() >= 3) {
                                return cleanPart.replaceAll("\\b(New|Old|North|South|East|West)\\s+", "")
                                                .replaceAll("\\s+(District|City|Town)$", "")
                                                .trim();
                        }
                }

                // Fallback: return original name cleaned up
                return name.replaceAll("\\b(New|Old|North|South|East|West)\\s+", "")
                                .replaceAll("\\s+(District|City|Town)$", "")
                                .trim();
        }

        /**
         * Helper method to get locations by IDs
         */
        private Optional<LocationPair> getLocations(Long fromLocationId, Long toLocationId) {
                Optional<Location> fromLocation = locationRepository.findById(new Location.LocationId(fromLocationId));
                Optional<Location> toLocation = locationRepository.findById(new Location.LocationId(toLocationId));

                if (fromLocation.isPresent() && toLocation.isPresent()) {
                        return Optional.of(new LocationPair(fromLocation.get(), toLocation.get()));
                }

                return Optional.empty();
        }

        /**
         * Helper record for location pairs
         */
        private record LocationPair(Location from, Location to) {
        }

        @Override
        public List<RouteDTO> getAllRoutes() {
                log.info("Getting all bus routes");

                return busRepository.findAllBuses().stream()
                                .map(bus -> RouteDTO.builder()
                                                .id(bus.getId().getValue())
                                                .name(bus.getName())
                                                .description("Route from " + bus.getFromLocation().getName() + " to "
                                                                + bus.getToLocation().getName())
                                                .fromLocation(bus.getFromLocation().getName())
                                                .toLocation(bus.getToLocation().getName())
                                                .departureTime(bus.getDepartureTime())
                                                .arrivalTime(bus.getArrivalTime())
                                                .category(bus.getCategory())
                                                .active(bus.isActive())
                                                .stops(getStopsForRoute(bus.getId().getValue()))
                                                .build())
                                .collect(Collectors.toList());
        }

        @Override
        public List<BusDTO> searchRoutes(String fromLocation, String toLocation, int page, int size) {
                log.info("Searching routes from {} to {} (page: {}, size: {})", fromLocation, toLocation, page, size);

                // Find locations by name
                Optional<Location> fromLoc = locationRepository.findByExactName(fromLocation);
                Optional<Location> toLoc = locationRepository.findByExactName(toLocation);

                if (fromLoc.isPresent() && toLoc.isPresent()) {
                        List<Bus> buses = busRepository.findByFromAndToLocation(fromLoc.get(), toLoc.get());

                        // Apply pagination
                        int startIndex = page * size;
                        int endIndex = Math.min(startIndex + size, buses.size());

                        if (startIndex >= buses.size()) {
                                return List.of(); // Return empty list if page is beyond available data
                        }

                        return buses.subList(startIndex, endIndex).stream()
                                        .map(bus -> new BusDTO(
                                                        bus.getId().getValue(),
                                                        bus.getName(),
                                                        bus.getBusNumber(),
                                                        bus.getFromLocation().getName(),
                                                        bus.getToLocation().getName(),
                                                        bus.getDepartureTime(),
                                                        bus.getArrivalTime()))
                                        .toList();
                }

                return List.of();
        }

        @Override
        public List<BusScheduleDTO> searchBuses(String from, String to, LocalDate date) {
                log.info("Searching buses from {} to {} on {}", from, to, date);

                // For now, ignoring date and searching by location names
                Optional<Location> fromLocation = locationRepository.findByExactName(from);
                Optional<Location> toLocation = locationRepository.findByExactName(to);

                if (fromLocation.isPresent() && toLocation.isPresent()) {
                        return busRepository.findByFromAndToLocation(fromLocation.get(), toLocation.get())
                                        .stream()
                                        .map(bus -> mapToDTO(bus, null))
                                        .toList();
                }

                return List.of();
        }

        @Override
        public BusScheduleDTO getBusSchedule(Long busId, LocalDate date) {
                log.info("Getting bus schedule for bus {} on {}", busId, date);

                return busRepository.findById(busId)
                                .map(bus -> mapToDTO(bus, null))
                                .orElse(null);
        }

        @Override
        public List<StopDTO> getStopsForRoute(Long routeId) {
                log.info("Getting stops for route ID: {}", routeId);

                return busRepository.findById(new Bus.BusId(routeId))
                                .map(bus -> stopRepository.findByBusOrderByStopOrder(bus).stream()
                                                .map(stop -> {
                                                        // Extract coordinates from stop location
                                                        Double latitude = null;
                                                        Double longitude = null;
                                                        if (stop.getLocation() != null) {
                                                                latitude = stop.getLocation().getLatitude();
                                                                longitude = stop.getLocation().getLongitude();
                                                        }

                                                        return new StopDTO(
                                                                        stop.getName(),
                                                                        stop.getName(),
                                                                        stop.getArrivalTime(),
                                                                        stop.getDepartureTime(),
                                                                        stop.getStopOrder(),
                                                                        latitude,
                                                                        longitude);
                                                })
                                                .toList())
                                .orElse(List.of());
        }

        public Optional<BusScheduleDTO> getRouteById(Long routeId) {
                log.info("Getting bus route by ID: {}", routeId);

                return busRepository.findById(new Bus.BusId(routeId))
                                .map(bus -> mapToDTO(bus, null));
        }

        public List<BusScheduleDTO> findRoutesBetweenLocations(Long fromLocationId, Long toLocationId) {
                log.info("Finding routes between locations: {} and {}", fromLocationId, toLocationId);

                return getLocations(fromLocationId, toLocationId)
                                .map(locations -> busRepository
                                                .findByFromAndToLocation(locations.from(), locations.to())
                                                .stream()
                                                .map(bus -> mapToDTO(bus, null))
                                                .toList())
                                .orElse(List.of());
        }

        private BusScheduleDTO mapToDTO(Bus bus, String languageCode) {
                var fromLocationTranslated = bus.getFromLocation().getName();
                var toLocationTranslated = bus.getToLocation().getName();
                var busNameTranslated = bus.getName();

                if (languageCode != null) {
                        switch (languageCode) {
                                case "ta" -> {
                                        log.info("Tamil translation requested for bus {}", bus.getId().getValue());

                                        busNameTranslated = translationRepository
                                                        .findByEntityAndLanguage("bus", bus.getId().getValue(), "ta")
                                                        .stream()
                                                        .filter(t -> "name".equals(t.getFieldName()))
                                                        .findFirst()
                                                        .map(Translation::getTranslatedValue)
                                                        .orElse(busNameTranslated);

                                        if (bus.getFromLocation() != null) {
                                                fromLocationTranslated = translationRepository
                                                                .findByEntityAndLanguage("location",
                                                                                bus.getFromLocation().getId()
                                                                                                .getValue(),
                                                                                "ta")
                                                                .stream()
                                                                .filter(t -> "name".equals(t.getFieldName()))
                                                                .findFirst()
                                                                .map(Translation::getTranslatedValue)
                                                                .orElse(fromLocationTranslated);
                                        }

                                        if (bus.getToLocation() != null) {
                                                toLocationTranslated = translationRepository
                                                                .findByEntityAndLanguage("location",
                                                                                bus.getToLocation().getId().getValue(),
                                                                                "ta")
                                                                .stream()
                                                                .filter(t -> "name".equals(t.getFieldName()))
                                                                .findFirst()
                                                                .map(Translation::getTranslatedValue)
                                                                .orElse(toLocationTranslated);
                                        }
                                }
                                default -> {
                                        fromLocationTranslated = translationService.getTranslation(
                                                        bus.getFromLocation(), "name",
                                                        languageCode);
                                        toLocationTranslated = translationService.getTranslation(bus.getToLocation(),
                                                        "name", languageCode);
                                        busNameTranslated = translationService.getTranslation(bus, "name",
                                                        languageCode);
                                }
                        }
                }

                return new BusScheduleDTO(
                                bus.getId().getValue(),
                                bus.getName(),
                                busNameTranslated,
                                bus.getBusNumber(),
                                bus.getFromLocation().getName(),
                                fromLocationTranslated,
                                bus.getToLocation().getName(),
                                toLocationTranslated,
                                bus.getDepartureTime(),
                                bus.getArrivalTime());
        }
}