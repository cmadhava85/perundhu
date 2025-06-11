package com.perundhu.application.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.BusRouteSegmentDTO;
import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.port.TranslationRepository;
import com.perundhu.domain.port.TranslationService;
import com.perundhu.domain.service.ConnectingRouteService;

@Service
public class BusScheduleServiceImpl implements BusScheduleService {
    
    private static final Logger log = LoggerFactory.getLogger(BusScheduleServiceImpl.class);
    
    private final BusRepository busRepository;
    private final LocationRepository locationRepository;
    private final StopRepository stopRepository;
    private final TranslationService translationService;
    private final TranslationRepository translationRepository;
    private final ConnectingRouteService connectingRouteService;
    
    public BusScheduleServiceImpl(
            BusRepository busRepository,
            LocationRepository locationRepository,
            StopRepository stopRepository,
            TranslationService translationService,
            TranslationRepository translationRepository,
            ConnectingRouteService connectingRouteService) {
        this.busRepository = busRepository;
        this.locationRepository = locationRepository;
        this.stopRepository = stopRepository;
        this.translationService = translationService;
        this.translationRepository = translationRepository;
        this.connectingRouteService = connectingRouteService;
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
        stops.forEach(stop -> 
            log.info("Stop: id={}, name={}, location_id={}, order={}", 
                    stop.getId().getValue(), stop.getName(), 
                    stop.getLocation() != null ? stop.getLocation().getId().getValue() : "null", 
                    stop.getStopOrder())
        );
        
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
                        .findByEntityAndLanguage("stop", stop.getId().getValue(), "ta");
                        
                    translatedName = translations.stream()
                        .filter(t -> "name".equals(t.getFieldName()))
                        .findFirst()
                        .map(Translation::getTranslatedValue)
                        .or(() -> {
                            var location = stop.getLocation();
                            if (location != null) {
                                return translationRepository.findByEntityAndLanguage("location", location.getId().getValue(), "ta")
                                    .stream()
                                    .filter(t -> "name".equals(t.getFieldName()))
                                    .findFirst()
                                    .map(Translation::getTranslatedValue);
                            }
                            
                            return locationRepository.findAll().stream()
                                .filter(loc -> stopName.equalsIgnoreCase(loc.getName()))
                                .findFirst()
                                .flatMap(loc -> translationRepository.findByEntityAndLanguage("location", loc.getId().getValue(), "ta")
                                    .stream()
                                    .filter(t -> "name".equals(t.getFieldName()))
                                    .findFirst()
                                    .map(Translation::getTranslatedValue)
                                );
                        })
                        .orElse(stopName);
                    
                    return new StopDTO(
                        stopName,
                        translatedName,
                        stop.getArrivalTime(),
                        stop.getDepartureTime(),
                        stop.getStopOrder()
                    );
                })
                .toList()
            )
            .orElse(List.of());
    }
    
    private List<StopDTO> handleDefaultLanguageStops(Long busId, String languageCode) {
        return busRepository.findById(new Bus.BusId(busId))
            .map(bus -> stopRepository.findByBusOrderByStopOrder(bus).stream()
                .map(stop -> new StopDTO(
                    stop.getName(),
                    translationService.getTranslation(stop, "name", languageCode),
                    stop.getArrivalTime(),
                    stop.getDepartureTime(),
                    stop.getStopOrder()
                ))
                .toList()
            )
            .orElse(List.of());
    }
    
    /**
     * Implementation for the interface method
     * This converts the BusScheduleDTO objects to ConnectingRouteDTO objects
     */
    @Override
    public List<ConnectingRouteDTO> findConnectingRoutes(Location from, Location to, String languageCode) {
        log.info("Finding connecting routes between locations with language: {}", languageCode);
        
        var allBuses = busRepository.findByFromLocation(from);
        var routes = connectingRouteService.findConnectingRoutes(allBuses, from, to);
        
        List<BusScheduleDTO> busSchedules = routes.stream()
            .flatMap(List::stream)
            .map(bus -> mapToDTO(bus, languageCode))
            .toList();
            
        // Convert BusScheduleDTO objects to ConnectingRouteDTO objects
        return busSchedules.stream()
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
                    .build();
            })
            .collect(Collectors.toList());
    }
    
    public List<LocationDTO> getAllLocations() {
        return locationRepository.findAll().stream()
            .map(location -> new LocationDTO(
                location.getId().getValue(),
                location.getName(),
                location.getLatitude(),
                location.getLongitude()
            ))
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
                log.info("Looking up translations for location id={}, name={}", locationId, location.getName());
                
                var translations = translationRepository
                    .findByEntityAndLanguage("location", locationId, "ta");
                
                log.info("Found {} Tamil translations for location id={}", translations.size(), locationId);
                translations.forEach(t -> 
                    log.info("  - Translation for {}: {}", t.getFieldName(), t.getTranslatedValue()));
                
                var translatedName = translations.stream()
                    .filter(t -> "name".equals(t.getFieldName()))
                    .findFirst()
                    .map(Translation::getTranslatedValue)
                    .orElse(location.getName());
                
                if (!translatedName.equals(location.getName())) {
                    log.info("Using translation for location {}: {}", locationId, translatedName);
                } else {
                    log.info("No translation found for location {}, using default name: {}", 
                          locationId, location.getName());
                }
                
                var dto = new LocationDTO(
                    locationId,
                    location.getName(),
                    translatedName,
                    location.getLatitude(),
                    location.getLongitude()
                );
                
                log.info("Created DTO for location={}: name={}, translatedName={}", 
                      locationId, dto.getName(), dto.getTranslatedName());
                
                return dto;
            })
            .toList();
    }
    
    private List<LocationDTO> handleDefaultLanguageLocations(String languageCode) {
        return locationRepository.findAll().stream()
            .map(location -> {
                var translatedName = translationService.getTranslation(location, "name", languageCode);
                log.info("Regular flow - Location {}: translated name = {}", 
                      location.getId().getValue(), translatedName);
                
                return new LocationDTO(
                    location.getId().getValue(),
                    location.getName(),
                    translatedName,
                    location.getLatitude(),
                    location.getLongitude()
                );
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
                location.getLongitude()
            ))
            .toList();
    }
    
    public List<LocationDTO> getDestinationsWithLanguage(Long fromId, String languageCode) {
        return locationRepository.findAllExcept(new Location.LocationId(fromId)).stream()
            .map(location -> new LocationDTO(
                location.getId().getValue(),
                location.getName(),
                translationService.getTranslation(location, "name", languageCode),
                location.getLatitude(),
                location.getLongitude()
            ))
            .toList();
    }
    
    public List<BusScheduleDTO> getBuses(Long fromId, Long toId) {
        return locationRepository.findById(new Location.LocationId(fromId))
            .flatMap(fromLocation -> locationRepository.findById(new Location.LocationId(toId))
                .map(toLocation -> busRepository.findByFromAndToLocation(fromLocation, toLocation)
                    .stream()
                    .map(bus -> mapToDTO(bus, null))
                    .toList()
                )
            )
            .orElse(List.of());
    }
    
    public List<BusScheduleDTO> getBusesWithLanguage(Long fromId, Long toId, String languageCode) {
        return locationRepository.findById(new Location.LocationId(fromId))
            .flatMap(fromLocation -> locationRepository.findById(new Location.LocationId(toId))
                .map(toLocation -> busRepository.findByFromAndToLocation(fromLocation, toLocation)
                    .stream()
                    .map(bus -> mapToDTO(bus, languageCode))
                    .toList()
                )
            )
            .orElse(List.of());
    }
    
    public List<BusScheduleDTO> findConnectingRoutesByIds(Long fromId, Long toId) {
        return getLocations(fromId, toId)
            .map(locations -> {
                // First get the connecting routes as ConnectingRouteDTO objects
                List<ConnectingRouteDTO> routeDTOs = findConnectingRoutes(locations.from(), locations.to(), null);
                
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
                        null, // Can't easily convert string back to LocalTime
                        null  // Can't easily convert string back to LocalTime
                    ))
                    .toList();
            })
            .orElse(List.of());
    }
    
    public List<BusScheduleDTO> findConnectingRoutesByIdsWithLanguage(Long fromId, Long toId, String languageCode) {
        return getLocations(fromId, toId)
            .map(locations -> {
                // First get the connecting routes as ConnectingRouteDTO objects
                List<ConnectingRouteDTO> routeDTOs = findConnectingRoutes(locations.from(), locations.to(), languageCode);
                
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
                        null, // Can't easily convert string back to LocalTime
                        null  // Can't easily convert string back to LocalTime
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
                route.getArrivalTime()
            ));
        }
        return result;
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
                bus.getArrivalTime()
            ))
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
                bus.getArrivalTime()
            ));
    }
    
    private record LocationPair(Location from, Location to) {}
    
    private Optional<LocationPair> getLocations(Long fromId, Long toId) {
        return locationRepository.findById(new Location.LocationId(fromId))
            .flatMap(fromLocation -> locationRepository.findById(new Location.LocationId(toId))
                .map(toLocation -> new LocationPair(fromLocation, toLocation))
            );
    }
    
    public List<BusScheduleDTO> getAllRoutes() {
        log.info("Getting all bus routes");
        
        return busRepository.findAllBuses().stream()
            .map(bus -> mapToDTO(bus, null))
            .toList();
    }
    
    public Optional<BusScheduleDTO> getRouteById(Long routeId) {
        log.info("Getting bus route by ID: {}", routeId);
        
        return busRepository.findById(new Bus.BusId(routeId))
            .map(bus -> mapToDTO(bus, null));
    }
    
    public List<StopDTO> getStopsForRoute(Long routeId) {
        log.info("Getting stops for route ID: {}", routeId);
        
        return busRepository.findById(new Bus.BusId(routeId))
            .map(bus -> stopRepository.findByBusOrderByStopOrder(bus).stream()
                .map(stop -> new StopDTO(
                    stop.getName(),
                    stop.getName(),
                    stop.getArrivalTime(),
                    stop.getDepartureTime(),
                    stop.getStopOrder()
                ))
                .toList()
            )
            .orElse(List.of());
    }
    
    public List<BusScheduleDTO> findRoutesBetweenLocations(Long fromLocationId, Long toLocationId) {
        log.info("Finding routes between locations: {} and {}", fromLocationId, toLocationId);
        
        return getLocations(fromLocationId, toLocationId)
            .map(locations -> busRepository.findByFromAndToLocation(locations.from(), locations.to())
                .stream()
                .map(bus -> mapToDTO(bus, null))
                .toList()
            )
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
                            .findByEntityAndLanguage("location", bus.getFromLocation().getId().getValue(), "ta")
                            .stream()
                            .filter(t -> "name".equals(t.getFieldName()))
                            .findFirst()
                            .map(Translation::getTranslatedValue)
                            .orElse(fromLocationTranslated);
                    }
                    
                    if (bus.getToLocation() != null) {
                        toLocationTranslated = translationRepository
                            .findByEntityAndLanguage("location", bus.getToLocation().getId().getValue(), "ta")
                            .stream()
                            .filter(t -> "name".equals(t.getFieldName()))
                            .findFirst()
                            .map(Translation::getTranslatedValue)
                            .orElse(toLocationTranslated);
                    }
                }
                default -> {
                    fromLocationTranslated = translationService.getTranslation(bus.getFromLocation(), "name", languageCode);
                    toLocationTranslated = translationService.getTranslation(bus.getToLocation(), "name", languageCode);
                    busNameTranslated = translationService.getTranslation(bus, "name", languageCode);
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
            bus.getArrivalTime()
        );
    }
}