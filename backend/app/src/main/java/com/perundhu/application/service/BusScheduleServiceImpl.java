package com.perundhu.application.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.perundhu.application.dto.BusScheduleDTO;
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

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BusScheduleServiceImpl implements BusScheduleService {
    
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
    
    @Override
    public List<BusScheduleDTO> findBusSchedules(Location from, Location to, String languageCode) {
        return busRepository.findByFromAndToLocation(from, to)
            .stream()
            .map(bus -> mapToDTO(bus, languageCode))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<StopDTO> findBusStops(Long busId, String languageCode) {
        log.info("Finding stops for bus {} with language {}", busId, languageCode);
        
        // Special handling for Tamil language
        if ("ta".equals(languageCode)) {
            log.info("Tamil language requested for stops, using direct translation lookup");
            return busRepository.findById(new Bus.BusId(busId))
                .map(bus -> stopRepository.findByBusOrderByStopOrder(bus).stream()
                    .map(stop -> {
                        String stopName = stop.getName();
                        String translatedName = stopName; // Default to original name
                        
                        // First try to get a direct translation for the stop
                        List<Translation> translations = translationRepository
                            .findByEntityAndLanguage("stop", stop.getId().getValue(), "ta");
                            
                        Optional<Translation> nameTranslation = translations.stream()
                            .filter(t -> "name".equals(t.getFieldName()))
                            .findFirst();
                            
                        if (nameTranslation.isPresent()) {
                            // If we have a direct stop translation, use it
                            translatedName = nameTranslation.get().getTranslatedValue();
                            log.info("Found direct Tamil translation for stop {}: {}", stop.getId().getValue(), translatedName);
                        } else {
                            // If we don't have a direct translation, try to find a matching location translation
                            // 1. First check if the stop has an associated location
                            Location location = stop.getLocation();
                            if (location != null) {
                                // 2. Use the location's translation
                                List<Translation> locTranslations = translationRepository
                                    .findByEntityAndLanguage("location", location.getId().getValue(), "ta");
                                    
                                Optional<Translation> locNameTranslation = locTranslations.stream()
                                    .filter(t -> "name".equals(t.getFieldName()))
                                    .findFirst();
                                    
                                if (locNameTranslation.isPresent()) {
                                    translatedName = locNameTranslation.get().getTranslatedValue();
                                    log.info("Using location translation for stop {}: {}", 
                                        stop.getId().getValue(), translatedName);
                                }
                            } else {
                                // 3. If there's no associated location, try to find a location with a matching name
                                // Find all locations
                                List<Location> locations = locationRepository.findAll();
                                
                                // Find if any location name matches the stop name
                                Optional<Location> matchingLocation = locations.stream()
                                    .filter(loc -> stopName.equalsIgnoreCase(loc.getName()))
                                    .findFirst();
                                
                                if (matchingLocation.isPresent()) {
                                    // If a matching location is found, use its translation
                                    Location loc = matchingLocation.get();
                                    List<Translation> matchedLocTranslations = translationRepository
                                        .findByEntityAndLanguage("location", loc.getId().getValue(), "ta");
                                        
                                    Optional<Translation> matchedLocNameTranslation = matchedLocTranslations.stream()
                                        .filter(t -> "name".equals(t.getFieldName()))
                                        .findFirst();
                                        
                                    if (matchedLocNameTranslation.isPresent()) {
                                        translatedName = matchedLocNameTranslation.get().getTranslatedValue();
                                        log.info("Using matching location name translation for stop {}: {}", 
                                            stop.getId().getValue(), translatedName);
                                    }
                                } else {
                                    log.info("No translation found for stop {} and no matching location, using default name: {}", 
                                        stop.getId().getValue(), stopName);
                                }
                            }
                        }
                        
                        return new StopDTO(
                            stopName,
                            translatedName,
                            stop.getArrivalTime(),
                            stop.getDepartureTime(),
                            stop.getStopOrder()
                        );
                    })
                    .collect(Collectors.toList())
                )
                .orElse(List.of());
        }
        
        // Default behavior for other languages
        return busRepository.findById(new Bus.BusId(busId))
            .map(bus -> stopRepository.findByBusOrderByStopOrder(bus).stream()
                .map(stop -> new StopDTO(
                    stop.getName(),
                    translationService.getTranslation(stop, "name", languageCode),
                    stop.getArrivalTime(),
                    stop.getDepartureTime(),
                    stop.getStopOrder()
                ))
                .collect(Collectors.toList())
            )
            .orElse(List.of());
    }
    
    @Override
    public List<BusScheduleDTO> findConnectingRoutes(Location from, Location to, String languageCode) {
        List<Bus> allBuses = busRepository.findByFromLocation(from);
        List<List<Bus>> routes = connectingRouteService.findConnectingRoutes(allBuses, from, to);
        
        return routes.stream()
            .flatMap(List::stream)
            .map(bus -> mapToDTO(bus, languageCode))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<LocationDTO> getAllLocations() {
        return locationRepository.findAll().stream()
            .map(location -> new LocationDTO(
                location.getId().getValue(),
                location.getName(),
                location.getLatitude(),
                location.getLongitude()
            ))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<LocationDTO> getAllLocationsWithLanguage(String languageCode) {
        log.info("Getting all locations with language: {}", languageCode);
        
        // Special handling for Tamil language
        if ("ta".equals(languageCode)) {
            log.info("Tamil language requested, using direct translation lookup");
            return locationRepository.findAll().stream()
                .map(location -> {
                    // Directly query the translation from the repository
                    Long locationId = location.getId().getValue();
                    log.info("Looking up translations for location id={}, name={}", locationId, location.getName());
                    
                    List<Translation> translations = translationRepository
                        .findByEntityAndLanguage("location", locationId, "ta");
                    
                    log.info("Found {} Tamil translations for location id={}", translations.size(), locationId);
                    translations.forEach(t -> 
                        log.info("  - Translation for {}: {}", t.getFieldName(), t.getTranslatedValue()));
                    
                    String translatedName = location.getName(); // Default to English name
                    // Look for name translation
                    Optional<Translation> nameTranslation = translations.stream()
                        .filter(t -> "name".equals(t.getFieldName()))
                        .findFirst();
                        
                    if (nameTranslation.isPresent()) {
                        translatedName = nameTranslation.get().getTranslatedValue();
                        log.info("Using translation for location {}: {}", locationId, translatedName);
                    } else {
                        log.info("No translation found for location {}, using default name: {}", 
                              locationId, location.getName());
                    }
                    
                    LocationDTO dto = new LocationDTO(
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
                .collect(Collectors.toList());
        }
        
        // For all other languages, use the existing translation service approach
        return locationRepository.findAll().stream()
            .map(location -> {
                String translatedName = translationService.getTranslation(location, "name", languageCode);
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
            .collect(Collectors.toList());
    }
    
    @Override
    public List<LocationDTO> getDestinations(Long fromId) {
        return locationRepository.findAllExcept(new Location.LocationId(fromId)).stream()
            .map(location -> new LocationDTO(
                location.getId().getValue(),
                location.getName(),
                translationService.getTranslation(location, "name", "en"), // Use English as default
                location.getLatitude(),
                location.getLongitude()
            ))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<LocationDTO> getDestinationsWithLanguage(Long fromId, String languageCode) {
        return locationRepository.findAllExcept(new Location.LocationId(fromId)).stream()
            .map(location -> new LocationDTO(
                location.getId().getValue(),
                location.getName(),
                translationService.getTranslation(location, "name", languageCode),
                location.getLatitude(),
                location.getLongitude()
            ))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<BusScheduleDTO> getBuses(Long fromId, Long toId) {
        Optional<Location> fromLocation = locationRepository.findById(new Location.LocationId(fromId));
        Optional<Location> toLocation = locationRepository.findById(new Location.LocationId(toId));
        
        if (fromLocation.isEmpty() || toLocation.isEmpty()) {
            return List.of();
        }
        
        return busRepository.findByFromAndToLocation(fromLocation.get(), toLocation.get())
            .stream()
            .map(bus -> mapToDTO(bus, null))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<BusScheduleDTO> getBusesWithLanguage(Long fromId, Long toId, String languageCode) {
        Optional<Location> fromLocation = locationRepository.findById(new Location.LocationId(fromId));
        Optional<Location> toLocation = locationRepository.findById(new Location.LocationId(toId));
        
        if (fromLocation.isEmpty() || toLocation.isEmpty()) {
            return List.of();
        }
        
        return busRepository.findByFromAndToLocation(fromLocation.get(), toLocation.get())
            .stream()
            .map(bus -> mapToDTO(bus, languageCode))
            .collect(Collectors.toList());
    }
    
    @Override
    public List<BusScheduleDTO> findConnectingRoutesByIds(Long fromId, Long toId) {
        Optional<Location> fromLocation = locationRepository.findById(new Location.LocationId(fromId));
        Optional<Location> toLocation = locationRepository.findById(new Location.LocationId(toId));
        
        if (fromLocation.isEmpty() || toLocation.isEmpty()) {
            return List.of();
        }
        
        return findConnectingRoutes(fromLocation.get(), toLocation.get(), null);
    }
    
    @Override
    public List<BusScheduleDTO> findConnectingRoutesByIdsWithLanguage(Long fromId, Long toId, String languageCode) {
        Optional<Location> fromLocation = locationRepository.findById(new Location.LocationId(fromId));
        Optional<Location> toLocation = locationRepository.findById(new Location.LocationId(toId));
        
        if (fromLocation.isEmpty() || toLocation.isEmpty()) {
            return List.of();
        }
        
        return findConnectingRoutes(fromLocation.get(), toLocation.get(), languageCode);
    }
    
    // Helper methods
    
    private BusScheduleDTO mapToDTO(Bus bus, String languageCode) {
        String fromLocationTranslated = bus.getFromLocation().getName();
        String toLocationTranslated = bus.getToLocation().getName();
        String busNameTranslated = bus.getName();
        
        // Special handling for Tamil language
        if ("ta".equals(languageCode)) {
            log.info("Tamil translation requested for bus {}", bus.getId().getValue());
            
            // Get translations for the bus name
            List<Translation> busTranslations = translationRepository
                .findByEntityAndLanguage("bus", bus.getId().getValue(), "ta");
                
            Optional<Translation> busNameTranslation = busTranslations.stream()
                .filter(t -> "name".equals(t.getFieldName()))
                .findFirst();
                
            if (busNameTranslation.isPresent()) {
                busNameTranslated = busNameTranslation.get().getTranslatedValue();
                log.info("Found Tamil translation for bus name: {}", busNameTranslated);
            } else {
                log.info("No Tamil translation found for bus name, using default: {}", busNameTranslated);
            }
            
            // Get translations for from location
            Location fromLocation = bus.getFromLocation();
            if (fromLocation != null) {
                List<Translation> fromLocTranslations = translationRepository
                    .findByEntityAndLanguage("location", fromLocation.getId().getValue(), "ta");
                    
                Optional<Translation> fromLocNameTranslation = fromLocTranslations.stream()
                    .filter(t -> "name".equals(t.getFieldName()))
                    .findFirst();
                    
                if (fromLocNameTranslation.isPresent()) {
                    fromLocationTranslated = fromLocNameTranslation.get().getTranslatedValue();
                    log.info("Found Tamil translation for from location: {}", fromLocationTranslated);
                } else {
                    log.info("No Tamil translation found for from location, using default: {}", fromLocationTranslated);
                }
            }
            
            // Get translations for to location
            Location toLocation = bus.getToLocation();
            if (toLocation != null) {
                List<Translation> toLocTranslations = translationRepository
                    .findByEntityAndLanguage("location", toLocation.getId().getValue(), "ta");
                    
                Optional<Translation> toLocNameTranslation = toLocTranslations.stream()
                    .filter(t -> "name".equals(t.getFieldName()))
                    .findFirst();
                    
                if (toLocNameTranslation.isPresent()) {
                    toLocationTranslated = toLocNameTranslation.get().getTranslatedValue();
                    log.info("Found Tamil translation for to location: {}", toLocationTranslated);
                } else {
                    log.info("No Tamil translation found for to location, using default: {}", toLocationTranslated);
                }
            }
        } else if (languageCode != null) {
            // For all other languages, use the translation service
            fromLocationTranslated = translationService.getTranslation(bus.getFromLocation(), "name", languageCode);
            toLocationTranslated = translationService.getTranslation(bus.getToLocation(), "name", languageCode);
            busNameTranslated = translationService.getTranslation(bus, "name", languageCode);
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