package com.perundhu.application.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.BusRouteDTO;
import com.perundhu.application.dto.OSMBusStopDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

/**
 * Enhanced OSM service using Overpass API for detailed bus transit data
 * Discovers bus stops, routes, and connections between locations
 */
@Service
public class OSMOverpassService {

  private static final Logger log = LoggerFactory.getLogger(OSMOverpassService.class);
  private static final String OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

  private final RestTemplate restTemplate;
  private final ObjectMapper objectMapper;

  public OSMOverpassService(RestTemplate restTemplate) {
    this.restTemplate = restTemplate;
    this.objectMapper = new ObjectMapper();
  }

  /**
   * Discover all bus stops between two locations using OSM data
   * This finds actual bus stops that could be intermediate stops on routes
   */
  public List<OSMBusStopDTO> discoverBusStopsBetweenLocations(
      double fromLat, double fromLon,
      double toLat, double toLon,
      double radiusKm) {

    log.info("Discovering bus stops between ({},{}) and ({},{}) within {}km",
        fromLat, fromLon, toLat, toLon, radiusKm);

    // Calculate bounding box that encompasses both locations plus radius
    double[] bbox = calculateBoundingBox(fromLat, fromLon, toLat, toLon, radiusKm);

    String overpassQuery = buildBusStopsQuery(bbox[0], bbox[1], bbox[2], bbox[3]);

    try {
      String response = executeOverpassQuery(overpassQuery);
      return parseBusStopsResponse(response);
    } catch (Exception e) {
      log.error("Error discovering bus stops between locations", e);
      return new ArrayList<>();
    }
  }

  /**
   * Find actual bus routes that connect two areas using OSM route relations
   */
  public List<BusRouteDTO> discoverBusRoutesBetween(
      double fromLat, double fromLon,
      double toLat, double toLon,
      double searchRadiusKm) {

    log.info("Discovering bus routes between ({},{}) and ({},{})",
        fromLat, fromLon, toLat, toLon);

    double[] bbox = calculateBoundingBox(fromLat, fromLon, toLat, toLon, searchRadiusKm);
    String overpassQuery = buildBusRoutesQuery(bbox[0], bbox[1], bbox[2], bbox[3]);

    try {
      String response = executeOverpassQuery(overpassQuery);
      return parseBusRoutesResponse(response, fromLat, fromLon, toLat, toLon);
    } catch (Exception e) {
      log.error("Error discovering bus routes", e);
      return new ArrayList<>();
    }
  }

  /**
   * Get detailed information about a specific bus route from OSM
   */
  public BusRouteDTO getRouteDetails(String routeRef, double centerLat, double centerLon) {
    log.info("Getting details for route: {} near ({},{})", routeRef, centerLat, centerLon);

    String overpassQuery = buildRouteDetailsQuery(routeRef, centerLat, centerLon);

    try {
      String response = executeOverpassQuery(overpassQuery);
      List<BusRouteDTO> routes = parseBusRoutesResponse(response, centerLat, centerLon, centerLat, centerLon);
      return routes.isEmpty() ? null : routes.get(0);
    } catch (Exception e) {
      log.error("Error getting route details for: {}", routeRef, e);
      return null;
    }
  }

  /**
   * Find all bus stops along a discovered route corridor
   */
  public List<OSMBusStopDTO> getStopsAlongRoute(List<LocationDTO> routePoints, double corridorWidthKm) {
    log.info("Finding bus stops along route corridor with {}km width", corridorWidthKm);

    if (routePoints.size() < 2) {
      return new ArrayList<>();
    }

    Set<OSMBusStopDTO> allStops = new HashSet<>();

    // For each segment of the route, find nearby bus stops
    for (int i = 0; i < routePoints.size() - 1; i++) {
      LocationDTO start = routePoints.get(i);
      LocationDTO end = routePoints.get(i + 1);

      List<OSMBusStopDTO> segmentStops = discoverBusStopsBetweenLocations(
          start.getLatitude(), start.getLongitude(),
          end.getLatitude(), end.getLongitude(),
          corridorWidthKm);

      allStops.addAll(segmentStops);
    }

    return new ArrayList<>(allStops);
  }

  /**
   * Build Overpass query for bus stops in a bounding box
   */
  private String buildBusStopsQuery(double south, double west, double north, double east) {
    return String.format("""
        [out:json][timeout:25];
        (
          node["highway"="bus_stop"](%f,%f,%f,%f);
          node["public_transport"="stop_position"](%f,%f,%f,%f);
          node["public_transport"="platform"](%f,%f,%f,%f);
          way["public_transport"="platform"](%f,%f,%f,%f);
          node["amenity"="bus_station"](%f,%f,%f,%f);
        );
        out geom meta;
        """, south, west, north, east,
        south, west, north, east,
        south, west, north, east,
        south, west, north, east,
        south, west, north, east);
  }

  /**
   * Build Overpass query for bus route relations
   */
  private String buildBusRoutesQuery(double south, double west, double north, double east) {
    return String.format("""
        [out:json][timeout:30];
        (
          relation["route"="bus"](%f,%f,%f,%f);
          relation["route"="trolleybus"](%f,%f,%f,%f);
          relation["public_transport"="route"](%f,%f,%f,%f);
        );
        (._;>;);
        out geom meta;
        """, south, west, north, east,
        south, west, north, east,
        south, west, north, east);
  }

  /**
   * Build query for specific route details
   */
  private String buildRouteDetailsQuery(String routeRef, double centerLat, double centerLon) {
    // Search in 50km radius around the center point
    double radius = 50.0; // km
    double[] bbox = calculateBoundingBox(centerLat, centerLon, centerLat, centerLon, radius);

    return String.format("""
        [out:json][timeout:30];
        (
          relation["route"="bus"]["ref"="%s"](%f,%f,%f,%f);
          relation["route"="bus"]["name"~"%s"](%f,%f,%f,%f);
        );
        (._;>;);
        out geom meta;
        """, routeRef, bbox[0], bbox[1], bbox[2], bbox[3],
        routeRef, bbox[0], bbox[1], bbox[2], bbox[3]);
  }

  /**
   * Execute Overpass API query with rate limiting
   */
  private String executeOverpassQuery(String query) throws Exception {
    log.debug("Executing Overpass query: {}", query.substring(0, Math.min(100, query.length())));

    // Rate limiting - respect Overpass API limits
    Thread.sleep(1000);

    String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
    String response = restTemplate.postForObject(OVERPASS_API_URL, "data=" + encodedQuery, String.class);

    if (response == null || response.trim().isEmpty()) {
      throw new RuntimeException("Empty response from Overpass API");
    }

    return response;
  }

  /**
   * Parse bus stops from Overpass API response
   */
  private List<OSMBusStopDTO> parseBusStopsResponse(String response) throws Exception {
    List<OSMBusStopDTO> stops = new ArrayList<>();
    JsonNode root = objectMapper.readTree(response);
    JsonNode elements = root.get("elements");

    if (elements != null && elements.isArray()) {
      for (JsonNode element : elements) {
        OSMBusStopDTO stop = parseBusStopElement(element);
        if (stop != null) {
          stops.add(stop);
        }
      }
    }

    log.info("Parsed {} bus stops from OSM response", stops.size());
    return stops;
  }

  /**
   * Parse bus routes from Overpass API response
   */
  private List<BusRouteDTO> parseBusRoutesResponse(String response, double fromLat, double fromLon, double toLat,
      double toLon) throws Exception {
    List<BusRouteDTO> routes = new ArrayList<>();
    JsonNode root = objectMapper.readTree(response);
    JsonNode elements = root.get("elements");

    if (elements != null && elements.isArray()) {
      for (JsonNode element : elements) {
        if ("relation".equals(element.get("type").asText()) &&
            "bus".equals(getTagValue(element, "route"))) {

          BusRouteDTO route = parseBusRouteElement(element, fromLat, fromLon, toLat, toLon);
          if (route != null) {
            routes.add(route);
          }
        }
      }
    }

    log.info("Parsed {} bus routes from OSM response", routes.size());
    return routes;
  }

  /**
   * Parse individual bus stop element
   */
  private OSMBusStopDTO parseBusStopElement(JsonNode element) {
    try {
      String type = element.get("type").asText();
      if (!"node".equals(type) && !"way".equals(type)) {
        return null;
      }

      long osmId = element.get("id").asLong();
      String name = getTagValue(element, "name");

      if (name == null || name.trim().isEmpty()) {
        name = "Bus Stop " + osmId;
      }

      double lat, lon;
      if ("node".equals(type)) {
        lat = element.get("lat").asDouble();
        lon = element.get("lon").asDouble();
      } else {
        // For ways, use the center point
        JsonNode center = element.get("center");
        if (center == null)
          return null;
        lat = center.get("lat").asDouble();
        lon = center.get("lon").asDouble();
      }

      String shelter = getTagValue(element, "shelter");
      String bench = getTagValue(element, "bench");
      String network = getTagValue(element, "network");
      String operator = getTagValue(element, "operator");

      return OSMBusStopDTO.builder()
          .osmId(osmId)
          .name(cleanStopName(name))
          .latitude(lat)
          .longitude(lon)
          .hasShelter("yes".equals(shelter))
          .hasBench("yes".equals(bench))
          .network(network)
          .operator(operator)
          .stopType(getTagValue(element, "highway") != null ? "bus_stop" : "platform")
          .build();

    } catch (Exception e) {
      log.debug("Error parsing bus stop element: {}", e.getMessage());
      return null;
    }
  }

  /**
   * Parse individual bus route element
   */
  private BusRouteDTO parseBusRouteElement(JsonNode element, double fromLat, double fromLon, double toLat,
      double toLon) {
    try {
      long osmId = element.get("id").asLong();
      String routeRef = getTagValue(element, "ref");
      String routeName = getTagValue(element, "name");
      String network = getTagValue(element, "network");
      String operator = getTagValue(element, "operator");
      String fromTag = getTagValue(element, "from");
      String toTag = getTagValue(element, "to");

      // Calculate relevance score based on proximity to search area
      double relevanceScore = calculateRouteRelevance(element, fromLat, fromLon, toLat, toLon);

      if (relevanceScore < 0.1) {
        return null; // Route not relevant to search area
      }

      return BusRouteDTO.builder()
          .osmId(osmId)
          .routeRef(routeRef != null ? routeRef : "Unknown")
          .routeName(routeName != null ? routeName : "Bus Route " + osmId)
          .network(network)
          .operator(operator)
          .fromLocation(fromTag)
          .toLocation(toTag)
          .relevanceScore(relevanceScore)
          .build();

    } catch (Exception e) {
      log.debug("Error parsing bus route element: {}", e.getMessage());
      return null;
    }
  }

  /**
   * Calculate route relevance based on proximity to search points
   */
  private double calculateRouteRelevance(JsonNode routeElement, double fromLat, double fromLon, double toLat,
      double toLon) {
    // This is a simplified relevance calculation
    // In a full implementation, you'd analyze the route's member stops and ways
    return 0.8; // Default relevance
  }

  /**
   * Get tag value from OSM element
   */
  private String getTagValue(JsonNode element, String tagKey) {
    JsonNode tags = element.get("tags");
    if (tags != null && tags.has(tagKey)) {
      return tags.get(tagKey).asText();
    }
    return null;
  }

  /**
   * Clean stop name to remove unnecessary details
   */
  private String cleanStopName(String name) {
    if (name == null)
      return null;

    return name.replaceAll("\\s+(Bus Stop|Stop|Station)$", "")
        .replaceAll("^(Bus Stop|Stop)\\s+", "")
        .trim();
  }

  /**
   * Calculate bounding box for geographic area
   */
  private double[] calculateBoundingBox(double lat1, double lon1, double lat2, double lon2, double radiusKm) {
    double minLat = Math.min(lat1, lat2);
    double maxLat = Math.max(lat1, lat2);
    double minLon = Math.min(lon1, lon2);
    double maxLon = Math.max(lon1, lon2);

    // Expand by radius (rough calculation)
    double latDelta = radiusKm / 111.0; // Approximately 111 km per degree latitude
    double lonDelta = radiusKm / (111.0 * Math.cos(Math.toRadians((minLat + maxLat) / 2)));

    return new double[] {
        minLat - latDelta, // south
        minLon - lonDelta, // west
        maxLat + latDelta, // north
        maxLon + lonDelta // east
    };
  }
}