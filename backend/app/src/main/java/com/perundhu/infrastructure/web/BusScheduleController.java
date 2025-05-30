package com.perundhu.infrastructure.web;

import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.domain.model.Location;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/bus-schedules")
@CrossOrigin(origins = "*")
@Slf4j
public class BusScheduleController {
    
    private final BusScheduleService busScheduleService;
    
    public BusScheduleController(BusScheduleService busScheduleService) {
        this.busScheduleService = busScheduleService;
    }
    
    @GetMapping("/locations")
    public ResponseEntity<List<LocationDTO>> getAllLocations(
            @RequestParam(name = "lang", required = false, defaultValue = "en") String languageCode) {
        log.info("GET /locations with language parameter: {} (original param value)", languageCode);
        
        // Debug the language code parameter
        if (languageCode != null) {
            log.info("Language code details: value=[{}], length={}, bytes={}",
                    languageCode,
                    languageCode.length(),
                    languageCode.getBytes().length);
        }
        
        List<LocationDTO> locations = busScheduleService.getAllLocationsWithLanguage(languageCode);
        
        // Debug: Print each location's name and translated name
        if ("ta".equals(languageCode)) {
            log.info("Tamil translations requested. First 3 locations:");
            locations.stream().limit(3).forEach(loc -> 
                log.info("Location {}: name='{}', translatedName='{}'", 
                    loc.getId(), loc.getName(), loc.getTranslatedName()));
        }
        
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noCache().mustRevalidate())
            .header("Cache-Control", "no-store")
            .body(locations);
    }
    
    @GetMapping("/locations/{fromId}/destinations")
    public ResponseEntity<List<LocationDTO>> getDestinations(
            @PathVariable Long fromId,
            @RequestParam(name = "lang", required = false, defaultValue = "en") String languageCode) {
        log.info("GET /locations/{}/destinations with lang={}", fromId, languageCode);
        
        List<LocationDTO> destinations = busScheduleService.getDestinationsWithLanguage(fromId, languageCode);
        
        // Debug log for Tamil translations
        if ("ta".equals(languageCode) && !destinations.isEmpty()) {
            log.info("Tamil translations for destinations (showing first 3):");
            destinations.stream().limit(3).forEach(dest -> 
                log.info("Destination {}: name='{}', translatedName='{}'", 
                    dest.getId(), dest.getName(), dest.getTranslatedName()));
        }
        
        return ResponseEntity.ok(destinations);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<BusScheduleDTO>> searchBuses(
            @RequestParam Long fromLocationId,
            @RequestParam Long toLocationId,
            @RequestParam(name = "lang", required = false, defaultValue = "en") String languageCode) {
        log.info("GET /search with fromId={}, toId={}, lang={}", fromLocationId, toLocationId, languageCode);
        Location from = Location.reference(fromLocationId);
        Location to = Location.reference(toLocationId);
        
        List<BusScheduleDTO> buses = busScheduleService.findBusSchedules(from, to, languageCode);
        
        // Debug log for Tamil translations
        if ("ta".equals(languageCode) && !buses.isEmpty()) {
            log.info("Tamil translations for bus search results (showing first bus):");
            BusScheduleDTO firstBus = buses.get(0);
            log.info("Bus {}: name='{}', translatedName='{}', from='{}', translatedFrom='{}', to='{}', translatedTo='{}'", 
                firstBus.getId(), 
                firstBus.getName(), 
                firstBus.getTranslatedName(),
                firstBus.getFromLocationName(),
                firstBus.getFromLocationTranslatedName(),
                firstBus.getToLocationName(),
                firstBus.getToLocationTranslatedName());
        }
        
        return ResponseEntity.ok(buses);
    }
    
    @GetMapping("/{busId}/stops")
    public ResponseEntity<List<StopDTO>> getBusStops(
            @PathVariable Long busId,
            @RequestParam(name = "lang", required = false, defaultValue = "en") String languageCode) {
        log.info("GET /{}/stops with lang={}", busId, languageCode);
        
        List<StopDTO> stops = busScheduleService.findBusStops(busId, languageCode);
        
        // Debug log for Tamil translations
        if ("ta".equals(languageCode) && !stops.isEmpty()) {
            log.info("Tamil translations for bus stops (showing first stop):");
            StopDTO firstStop = stops.get(0);
            log.info("Stop: name='{}', translatedName='{}'", 
                    firstStop.getName(), 
                    firstStop.getTranslatedName());
        }
        
        return ResponseEntity.ok(stops);
    }
    
    @GetMapping("/connecting-routes")
    public ResponseEntity<List<BusScheduleDTO>> findConnectingRoutes(
            @RequestParam Long fromLocationId,
            @RequestParam Long toLocationId,
            @RequestParam(name = "lang", required = false, defaultValue = "en") String languageCode) {
        log.info("GET /connecting-routes with fromId={}, toId={}, lang={}", fromLocationId, toLocationId, languageCode);
        Location from = Location.reference(fromLocationId);
        Location to = Location.reference(toLocationId);
        
        List<BusScheduleDTO> routes = busScheduleService.findConnectingRoutes(from, to, languageCode);
        
        // Debug log for Tamil translations
        if ("ta".equals(languageCode) && !routes.isEmpty()) {
            log.info("Tamil translations for connecting routes (showing first route):");
            BusScheduleDTO firstRoute = routes.get(0);
            log.info("Route {}: name='{}', translatedName='{}', from='{}', translatedFrom='{}', to='{}', translatedTo='{}'", 
                firstRoute.getId(), 
                firstRoute.getName(), 
                firstRoute.getTranslatedName(),
                firstRoute.getFromLocationName(),
                firstRoute.getFromLocationTranslatedName(),
                firstRoute.getToLocationName(),
                firstRoute.getToLocationTranslatedName());
        }
        
        return ResponseEntity.ok(routes);
    }
}