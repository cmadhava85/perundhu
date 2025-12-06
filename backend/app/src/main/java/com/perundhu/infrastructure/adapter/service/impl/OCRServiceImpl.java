package com.perundhu.infrastructure.adapter.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import com.perundhu.application.service.LocationResolutionService;
import com.perundhu.domain.model.FileUpload;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.OCREngine;
import com.perundhu.domain.port.OCRService;

/**
 * Implementation of OCR service for extracting text and data from images
 * Uses OCREngine port for actual OCR processing.
 * 
 * Enhanced with LocationResolutionService for handling Tamil Nadu's
 * thousands of cities, towns, and villages through:
 * - Static pattern matching (fast, for common cities)
 * - Database lookup (known locations)
 * - Fuzzy matching with known cities
 * - OpenStreetMap/Nominatim API (for unknown locations)
 */
@Service
public class OCRServiceImpl implements OCRService {

  private static final Logger log = LoggerFactory.getLogger(OCRServiceImpl.class);

  // Location resolution service for handling unknown locations
  @Nullable
  private final LocationResolutionService locationResolutionService;

  // Tamil city name patterns - key syllables/patterns that identify each city
  // Using pattern matching instead of exact mapping for OCR robustness
  private static final Map<String, String[]> TAMIL_CITY_PATTERNS = Map.ofEntries(
      // City name -> Array of identifying Tamil patterns (substrings)
      // Rameshwaram has many spellings: இராமேஸ்வரம், இராமேசுவரம், ராமேஸ்வரம்
      Map.entry("RAMESHWARAM",
          new String[] { "இராமேஸ்வரம்", "இராமேசுவரம்", "ராமேஸ்வரம்", "ராமே", "இராமே", "ரமேஸ்", "ராமேச", "ராமேஸ்வ",
              "ராமேசு" }),
      Map.entry("CHENNAI", new String[] { "சென்னை", "செண்ணை", "சென்ன" }),
      Map.entry("MADURAI", new String[] { "மதுரை", "மதுரா", "மதுர" }),
      Map.entry("COIMBATORE", new String[] { "கோயம்", "கோவை", "கோயமு", "கோயம்பு" }),
      Map.entry("TRICHY", new String[] { "திருச்சி", "திரிச்சி", "திருச்சிரா" }),
      Map.entry("SALEM", new String[] { "சேலம்", "சேலம", "சேல" }),
      Map.entry("TIRUNELVELI", new String[] { "திருநெல்", "நெல்லை", "நெல்வேலி" }),
      Map.entry("KANYAKUMARI", new String[] { "கன்னியா", "கன்யா", "குமரி", "கன்னி" }),
      Map.entry("THANJAVUR", new String[] { "தஞ்சா", "தஞ்சை", "தஞ்ச" }),
      Map.entry("ERODE", new String[] { "ஈரோடு", "ஈரோட்", "ஈரோ" }),
      Map.entry("VELLORE", new String[] { "வேலூர்", "வேலூ", "வேல்லூர்" }),
      Map.entry("TIRUPPUR", new String[] { "திருப்பூர்", "திருப்பூ", "திருப்" }),
      Map.entry("KARUR", new String[] { "கரூர்", "கரூ" }),
      Map.entry("KUMBAKONAM", new String[] { "கும்பகோ", "கும்ப" }),
      Map.entry("THOOTHUKUDI", new String[] { "தூத்துக்", "தூத்து", "துத்துக்" }),
      Map.entry("PATTUKKOTTAI", new String[] { "பட்டுக்கோ", "பட்டுக்" }),
      Map.entry("VIRUDHUNAGAR", new String[] { "விருது", "விருதுந" }),
      Map.entry("SIVAKASI", new String[] { "சிவகாசி", "சிவக", "SIVAKASI" }),
      Map.entry("ARUPPUKKOTTAI", new String[] { "அருப்புக்", "அருப்புக்கோட்டை" }),
      Map.entry("THENI", new String[] { "தேனி", "தேணி" }),
      Map.entry("DINDIGUL", new String[] { "டிண்டி", "திண்டு", "திண்டிக்" }),
      Map.entry("PUDUKKOTTAI", new String[] { "புதுக்கோ", "புதுக்" }),
      Map.entry("NAGERCOIL", new String[] { "நாகர்கோ", "நாகர்", "நாகர்கோவில்" }),
      Map.entry("BENGALURU", new String[] { "பெங்க", "பெங்களூ", "பெங்க" }),
      Map.entry("TIRUVANNAMALAI", new String[] { "திருவண்", "திருவண்ணா" }),
      Map.entry("ARIYALUR", new String[] { "அரியலூ", "அரியா" }),
      Map.entry("PERAMBALUR", new String[] { "பெரம்ப", "பெரம்பலூ" }),
      Map.entry("NAMAKKAL", new String[] { "நாமக்", "நாமக்கல்" }),
      Map.entry("KRISHNAGIRI", new String[] { "கிருஷ்ண", "கிருஷ்" }),
      Map.entry("DHARMAPURI", new String[] { "தர்மபு", "தர்ம", "தர்மபுரி" }),
      Map.entry("HOSUR", new String[] { "ஓசூர்", "ஓசூ", "ஹோசூர்" }),
      Map.entry("THIRUCHENDUR", new String[] { "திருச்செந்", "திருச்சென்", "செந்தூர்" }),
      Map.entry("ARANI", new String[] { "ஆரணி", "ஆரணீ" }),
      Map.entry("KANCHIPURAM", new String[] { "காஞ்சி", "காஞ்சீ", "காஞ்சிபு" }),
      Map.entry("RAMANATHAPURAM", new String[] { "ராமநா", "இராமநா", "ராமனா" }));

  // English city name variations for normalization
  private static final Map<String, String[]> ENGLISH_CITY_PATTERNS = Map.ofEntries(
      Map.entry("RAMESHWARAM", new String[] { "RAMESWAR", "RAMESHWAR", "RAMESWARAM" }),
      Map.entry("CHENNAI", new String[] { "MADRAS", "CHENNAI" }),
      Map.entry("COIMBATORE", new String[] { "KOVAI", "COIMBATORE" }),
      Map.entry("TRICHY", new String[] { "TIRUCHIRAPPALLI", "TIRUCHIRAPALLI", "TRICHY", "TIRUCHI" }),
      Map.entry("THOOTHUKUDI", new String[] { "TUTICORIN", "THOOTHUKUDI" }),
      Map.entry("THANJAVUR", new String[] { "TANJORE", "THANJAVUR" }),
      Map.entry("BENGALURU", new String[] { "BANGALORE", "BENGALURU" }),
      Map.entry("TIRUNELVELI", new String[] { "NELLAI", "TIRUNELVELI" }),
      Map.entry("KANYAKUMARI", new String[] { "CAPE", "KANYAKUMARI", "KUMARI" }));

  /**
   * Match Tamil text to English city name using pattern matching.
   * More robust than exact mapping - handles OCR variations.
   * 
   * Enhanced: If static patterns don't match, uses LocationResolutionService
   * to check database, fuzzy matching, and OpenStreetMap.
   */
  private String matchTamilToEnglish(String text) {
    if (text == null || text.isEmpty())
      return null;

    // First try static patterns (fast path for common cities)
    for (Map.Entry<String, String[]> entry : TAMIL_CITY_PATTERNS.entrySet()) {
      for (String pattern : entry.getValue()) {
        if (text.contains(pattern)) {
          log.debug("Matched Tamil pattern '{}' to city '{}'", pattern, entry.getKey());
          return entry.getKey();
        }
      }
    }

    // If LocationResolutionService available, try to resolve unknown Tamil text
    if (locationResolutionService != null) {
      LocationResolutionService.LocationResolution resolution = locationResolutionService.resolve(text);
      if (resolution.getResolvedName() != null && resolution.getConfidence() >= 0.7) {
        log.info("LocationResolutionService resolved Tamil '{}' -> '{}' (confidence: {}, source: {})",
            text, resolution.getResolvedName(), resolution.getConfidence(), resolution.getSource());
        return resolution.getResolvedName();
      }
    }

    return null;
  }

  /**
   * Normalize English city name to canonical form.
   * 
   * Enhanced: If static patterns don't match, uses LocationResolutionService
   * to check database, fuzzy matching, and OpenStreetMap.
   */
  private String normalizeEnglishCity(String text) {
    if (text == null || text.isEmpty())
      return null;
    String upper = text.toUpperCase();

    // First try static patterns (fast path for common cities)
    for (Map.Entry<String, String[]> entry : ENGLISH_CITY_PATTERNS.entrySet()) {
      for (String pattern : entry.getValue()) {
        if (upper.contains(pattern)) {
          return entry.getKey();
        }
      }
    }

    // If LocationResolutionService available, try to resolve unknown city
    if (locationResolutionService != null) {
      LocationResolutionService.LocationResolution resolution = locationResolutionService.resolve(text);
      if (resolution.getResolvedName() != null && resolution.getConfidence() >= 0.7) {
        log.info("LocationResolutionService normalized '{}' -> '{}' (confidence: {}, source: {})",
            text, resolution.getResolvedName(), resolution.getConfidence(), resolution.getSource());
        return resolution.getResolvedName();
      }
    }

    return upper; // Return as-is if no pattern match
  }

  /**
   * Find all city names (Tamil or English) in a text string.
   * Returns list of normalized English city names found.
   * 
   * Enhanced: Also tries LocationResolutionService for unknown locations.
   */
  private List<String> findAllCitiesInText(String text) {
    List<String> cities = new ArrayList<>();
    if (text == null || text.isEmpty())
      return cities;

    // Check Tamil patterns
    for (Map.Entry<String, String[]> entry : TAMIL_CITY_PATTERNS.entrySet()) {
      for (String pattern : entry.getValue()) {
        if (text.contains(pattern) && !cities.contains(entry.getKey())) {
          cities.add(entry.getKey());
          break; // Found this city, move to next
        }
      }
    }

    // Also check English patterns
    String upper = text.toUpperCase();
    for (Map.Entry<String, String[]> entry : ENGLISH_CITY_PATTERNS.entrySet()) {
      for (String pattern : entry.getValue()) {
        if (upper.contains(pattern) && !cities.contains(entry.getKey())) {
          cities.add(entry.getKey());
          break;
        }
      }
    }

    // If LocationResolutionService available and no cities found yet,
    // try to extract potential location names and resolve them
    if (cities.isEmpty() && locationResolutionService != null) {
      // Try to find capitalized words that might be city names
      String[] words = text.split("\\s+");
      for (String word : words) {
        String cleaned = word.replaceAll("[^A-Za-z]", "").toUpperCase();
        if (cleaned.length() >= 4 && !isNonLocationWord(cleaned)) {
          LocationResolutionService.LocationResolution resolution = locationResolutionService.resolve(cleaned);
          if (resolution.getResolvedName() != null && resolution.getConfidence() >= 0.7
              && !cities.contains(resolution.getResolvedName())) {
            cities.add(resolution.getResolvedName());
            log.debug("LocationResolutionService found city '{}' from text '{}'",
                resolution.getResolvedName(), word);
          }
        }
      }
    }

    return cities;
  }

  private final OCREngine ocrEngine;

  public OCRServiceImpl(OCREngine ocrEngine, @Nullable LocationResolutionService locationResolutionService) {
    this.ocrEngine = ocrEngine;
    this.locationResolutionService = locationResolutionService;
    if (ocrEngine != null && ocrEngine.isAvailable()) {
      log.info("OCRServiceImpl initialized with OCR engine: {}", ocrEngine.getClass().getSimpleName());
    } else {
      log.warn("OCRServiceImpl initialized WITHOUT OCR engine - will use mock data");
    }
    if (locationResolutionService != null) {
      log.info("OCRServiceImpl initialized with LocationResolutionService for scalable city lookup");
    } else {
      log.warn("OCRServiceImpl initialized WITHOUT LocationResolutionService - using static patterns only");
    }
  }

  @Override
  public String extractTextFromImage(FileUpload imageFile) {
    try {
      log.info("Extracting text from image file: {}", imageFile.getOriginalFilename());

      // FileUpload doesn't have URL, so use mock data for now
      // TODO: Save file first and then use OCR engine with file path
      log.info("Using mock data for OCR extraction (FileUpload has no URL)");
      String mockText = generateSampleBusScheduleText();
      return mockText;
    } catch (Exception e) {
      log.error("Error extracting text from image: {}", e.getMessage(), e);
      throw new RuntimeException("Failed to extract text from image", e);
    }
  }

  @Override
  public String extractTextFromImage(String imageUrl) {
    try {
      log.info("Extracting text from image URL: {}", imageUrl);

      // Use OCREngine if available
      if (ocrEngine != null && ocrEngine.isAvailable()) {
        try {
          OCREngine.ExtractionResult result = ocrEngine.extractText(imageUrl);
          log.info("OCR extracted {} characters with confidence: {}",
              result.getRawText().length(), result.getConfidence());
          return result.getRawText();
        } catch (Exception e) {
          log.warn("OCR engine failed for URL {}: {}", imageUrl, e.getMessage());
          log.warn("Falling back to mock data");
        }
      } else {
        log.warn("OCR engine not available, using mock data");
      }

      // Fallback: Return realistic bus schedule text based on URL or generate sample
      // text
      if (imageUrl.contains("error") || imageUrl.contains("fail")) {
        log.warn("Failed to extract text from image URL: {}", imageUrl);
        return "";
      }

      // Generate sample schedule text for demonstration
      return generateSampleBusScheduleText();

    } catch (Exception e) {
      log.error("Error extracting text from image URL: {}", e.getMessage(), e);
      return "";
    }
  }

  @Override
  public boolean isValidBusScheduleImage(FileUpload imageFile) {
    try {
      log.info("Validating bus schedule image: {}", imageFile.getOriginalFilename());

      // Basic validation - check file type and size
      String contentType = imageFile.getContentType();
      if (contentType == null || !contentType.startsWith("image/")) {
        return false;
      }

      // Check file size (max 10MB)
      long maxSize = 10L * 1024 * 1024;
      if (imageFile.getSize() > maxSize) {
        log.warn("Image file too large: {} bytes (max: {} bytes)", imageFile.getSize(), maxSize);
        return false;
      }

      // For now, assume all valid images are bus schedules
      // TODO: Implement actual image content validation
      return true;
    } catch (Exception e) {
      log.error("Error validating bus schedule image: {}", e.getMessage(), e);
      return false;
    }
  }

  @Override
  public double getExtractionConfidence(FileUpload imageFile) {
    try {
      if (imageFile != null) {
        log.info("Calculating extraction confidence for: {}", imageFile.getOriginalFilename());
      }
      // TODO: Implement actual confidence calculation based on image quality
      return 0.85; // Mock confidence score
    } catch (Exception e) {
      log.error("Error calculating extraction confidence: {}", e.getMessage(), e);
      return 0.0;
    }
  }

  @Override
  public RouteContribution parseRouteFromText(String extractedText) {
    try {
      log.info("Parsing route from extracted text");

      Map<String, Object> parsedData = parseScheduleTextToMap(extractedText);

      String routeNumber = (String) parsedData.get("routeNumber");
      String fromLocation = (String) parsedData.get("fromLocation");
      String toLocation = (String) parsedData.get("toLocation");

      RouteContribution route = RouteContribution.builder()
          .id(UUID.randomUUID().toString())
          .busNumber(routeNumber != null ? routeNumber : "Unknown")
          .fromLocationName(fromLocation != null ? fromLocation : "Unknown Origin")
          .toLocationName(toLocation != null ? toLocation : "Unknown Destination")
          .departureTime((String) parsedData.get("departureTime"))
          .arrivalTime((String) parsedData.get("arrivalTime"))
          .submissionDate(LocalDateTime.now())
          .status("PENDING")
          .build();

      return route;
    } catch (Exception e) {
      log.error("Error parsing route from text: {}", e.getMessage(), e);
      throw new RuntimeException("Failed to parse route from text", e);
    }
  }

  @Override
  public List<RouteContribution> parseMultipleRoutes(String extractedText) {
    try {
      log.info("Parsing multiple routes from extracted text");

      List<RouteContribution> routes = new ArrayList<>();

      if (extractedText == null || extractedText.trim().isEmpty()) {
        return routes;
      }

      // Split text by lines and look for multiple route patterns
      String[] lines = extractedText.split("\n");
      StringBuilder currentRoute = new StringBuilder();

      for (String line : lines) {
        line = line.trim();

        // If line looks like a new route header (contains "Route" or "Bus Number")
        if (line.matches("(?i).*(?:route|bus)\\s+(?:number|no|#).*") && currentRoute.length() > 0) {
          // Process the accumulated route text
          processRouteText(currentRoute.toString(), routes);
          currentRoute = new StringBuilder();
        }

        if (!line.isEmpty()) {
          currentRoute.append(line).append("\n");
        }
      }

      // Process the last route
      if (currentRoute.length() > 0) {
        processRouteText(currentRoute.toString(), routes);
      }

      // If no routes were parsed, try to parse the entire text as a single route
      if (routes.isEmpty()) {
        processRouteText(extractedText, routes);
      }

      log.info("Successfully parsed {} routes from extracted text", routes.size());
      return routes;

    } catch (Exception e) {
      log.error("Error parsing multiple routes: {}", e.getMessage(), e);
      return new ArrayList<>();
    }
  }

  @Override
  public Map<String, Object> parseScheduleTextToMap(String extractedText) {
    try {
      log.info("Parsing schedule text to structured map");

      Map<String, Object> scheduleData = new HashMap<>();

      if (extractedText == null || extractedText.trim().isEmpty()) {
        return scheduleData;
      }

      // Initialize default values
      scheduleData.put("extractedText", extractedText);
      scheduleData.put("parseDate", LocalDateTime.now().toString());
      scheduleData.put("confidence", 0.8);

      List<String> timings = new ArrayList<>();
      List<Map<String, Object>> multipleRoutes = new ArrayList<>();

      // DETECT "Bus Timings at [Location] Busstand" format
      // This is a simple departure time listing board that shows only times, not
      // destinations
      // Example: "Bus Timings at Sivakasi N.R.K.Rajarathinam Busstand\n01:10. 01:20.
      // 02:20..."
      String detectedBoardOrigin = detectBusTimingsAtFormat(extractedText);
      if (detectedBoardOrigin != null) {
        log.info("Detected 'Bus Timings at [Location]' format - origin: {}", detectedBoardOrigin);

        // Extract all departure times from the board
        List<String> departureTimes = extractAllDepartureTimes(extractedText);

        scheduleData.put("boardFormat", "DEPARTURE_TIMES_ONLY");
        scheduleData.put("origin", detectedBoardOrigin);
        scheduleData.put("fromLocation", detectedBoardOrigin);
        scheduleData.put("detectedOrigin", detectedBoardOrigin);

        // This format doesn't specify destinations - mark as requiring manual input
        scheduleData.put("destinationRequired", true);
        scheduleData.put("destinationHint",
            "This is a departure times board at " + detectedBoardOrigin + " bus stand. " +
                "It shows departure times but not destinations. Please specify the destination manually or " +
                "this may be a general departure schedule for multiple routes.");

        if (!departureTimes.isEmpty()) {
          scheduleData.put("departureTime", departureTimes.get(0));
          // Create a single route entry with unknown destination
          Map<String, Object> route = new HashMap<>();
          route.put("fromLocation", detectedBoardOrigin);
          route.put("toLocation", null); // Destination unknown
          route.put("timings", departureTimes);
          route.put("scheduleIndex", 1);
          route.put("totalSchedules", 1);
          multipleRoutes.add(route);
        }

        scheduleData.put("timing", departureTimes);
        scheduleData.put("multipleRoutes", multipleRoutes);
        scheduleData.put("groupedRoutes", multipleRoutes);

        log.info("Extracted {} departure times from {} bus stand timing board",
            departureTimes.size(), detectedBoardOrigin);
        return scheduleData;
      }

      // Extract route number/bus number
      String routeNumber = extractPattern(extractedText,
          "(?:route|bus)\\s+(?:number|no|#)\\s*:?\\s*([A-Z0-9\\-]+)", 1);
      if (routeNumber != null) {
        scheduleData.put("routeNumber", routeNumber);
        scheduleData.put("busNumber", routeNumber);
      }

      // Extract locations
      String fromLocation = extractPattern(extractedText,
          "(?:from|origin|source)\\s*:?\\s*([\\w\\s]+?)(?:\\n|to|destination)", 1);
      String toLocation = extractPattern(extractedText,
          "(?:to|destination)\\s*:?\\s*([\\w\\s]+?)(?:\\n|departure|arrival)", 1);

      if (fromLocation != null) {
        scheduleData.put("fromLocation", fromLocation.trim());
        scheduleData.put("origin", fromLocation.trim());
      }
      if (toLocation != null) {
        scheduleData.put("toLocation", toLocation.trim());
        scheduleData.put("destination", toLocation.trim());
      }

      // Extract operator name
      String operatorName = extractPattern(extractedText,
          "(?:operator|transport|corporation)\\s*:?\\s*([\\w\\s]+?)(?:\\n|bus)", 1);
      if (operatorName != null) {
        scheduleData.put("operatorName", operatorName.trim());
      }

      // Extract fare information
      String fare = extractPattern(extractedText,
          "(?:fare|price|cost)\\s*:?\\s*(?:rs\\.?|₹)?\\s*(\\d+(?:\\.\\d{2})?)", 1);
      if (fare != null) {
        scheduleData.put("fare", "₹" + fare);
      }

      // Extract departure and arrival times
      String departureTime = extractPattern(extractedText,
          "(?:departure|dept?)\\s*:?\\s*(\\d{1,2}:\\d{2}(?:\\s*[ap]m)?)", 1);
      String arrivalTime = extractPattern(extractedText,
          "(?:arrival|arr)\\s*:?\\s*(\\d{1,2}:\\d{2}(?:\\s*[ap]m)?)", 1);

      if (departureTime != null) {
        timings.add("Departure: " + departureTime);
        scheduleData.put("departureTime", departureTime);
      }
      if (arrivalTime != null) {
        timings.add("Arrival: " + arrivalTime);
        scheduleData.put("arrivalTime", arrivalTime);
      }

      // Extract stop timings
      Pattern stopPattern = Pattern.compile(
          "(?:stop|station)\\s+(?:\\d+\\s*:?\\s*)?([\\w\\s]+?)\\s+(?:arr?:?\\s*)?(\\d{1,2}:\\d{2}(?:\\s*[ap]m)?)(?:\\s+(?:dep?:?\\s*)?(\\d{1,2}:\\d{2}(?:\\s*[ap]m)?))?",
          Pattern.CASE_INSENSITIVE);

      Matcher stopMatcher = stopPattern.matcher(extractedText);
      List<Map<String, String>> stops = new ArrayList<>();
      while (stopMatcher.find()) {
        String stopName = stopMatcher.group(1).trim();
        String arrTime = stopMatcher.group(2);
        String depTime = stopMatcher.group(3);

        Map<String, String> stop = new HashMap<>();
        stop.put("name", stopName);
        if (arrTime != null) {
          stop.put("arrivalTime", arrTime);
          timings.add(stopName + " Arr: " + arrTime);
        }
        if (depTime != null) {
          stop.put("departureTime", depTime);
          timings.add(stopName + " Dep: " + depTime);
        }
        stops.add(stop);
      }

      scheduleData.put("timing", timings);
      scheduleData.put("stops", stops);
      scheduleData.put("multipleRoutes", multipleRoutes);

      // DETECT SIMPLE SINGLE-ROUTE SCHEDULE FORMAT
      // This format has explicit "From: X" and "To: Y" with "STOPS:" section
      // Example: "From: Chennai" "To: Coimbatore" followed by "STOPS:" with
      // intermediate stops
      // When this format is detected, we should NOT apply multi-route board parsing
      boolean isSimpleSingleRouteFormat = fromLocation != null && toLocation != null &&
          (extractedText.toUpperCase().contains("STOPS:") ||
              extractedText.toUpperCase().contains("STOP 1") ||
              extractedText.toUpperCase().contains("STOP 1:"));

      if (isSimpleSingleRouteFormat) {
        log.info("Detected SIMPLE SINGLE-ROUTE format: {} -> {} with {} stops",
            fromLocation, toLocation, stops.size());

        // Create a single route with the extracted stops as intermediate stops
        Map<String, Object> singleRoute = new HashMap<>();
        singleRoute.put("fromLocation", fromLocation.trim().toUpperCase());
        singleRoute.put("toLocation", toLocation.trim().toUpperCase());

        // Use extracted departure time as the route timing
        List<String> routeTimings = new ArrayList<>();
        if (departureTime != null) {
          // Extract just the time part (e.g., "08:30" from "08:30 AM")
          String timeOnly = departureTime.replaceAll("(?i)\\s*(am|pm)\\s*", "").trim();
          routeTimings.add(timeOnly);
          singleRoute.put("departureTime", timeOnly);
        }
        singleRoute.put("timings", routeTimings);

        // Add stops as intermediate stops with proper structure
        List<Map<String, Object>> routeStops = new ArrayList<>();
        int stopOrder = 1;
        for (Map<String, String> stop : stops) {
          Map<String, Object> routeStop = new HashMap<>();
          routeStop.put("name", stop.get("name").toUpperCase());
          routeStop.put("stopOrder", stopOrder++);
          if (stop.get("arrivalTime") != null) {
            routeStop.put("arrivalTime", stop.get("arrivalTime"));
          }
          if (stop.get("departureTime") != null) {
            routeStop.put("departureTime", stop.get("departureTime"));
          }
          routeStops.add(routeStop);
        }
        singleRoute.put("stops", routeStops);

        // Build VIA string from stop names
        if (!stops.isEmpty()) {
          StringBuilder viaBuilder = new StringBuilder();
          for (Map<String, String> stop : stops) {
            if (viaBuilder.length() > 0)
              viaBuilder.append(", ");
            viaBuilder.append(stop.get("name").toUpperCase());
          }
          singleRoute.put("via", viaBuilder.toString());
        }

        multipleRoutes.add(singleRoute);

        // Set board format for UI
        scheduleData.put("boardFormat", "SINGLE_ROUTE_SCHEDULE");
        scheduleData.put("detectedOrigin", fromLocation.trim().toUpperCase());

        // Skip all multi-route parsing - go directly to final processing
        log.info("Single route extracted: {} -> {} via {} stops",
            fromLocation, toLocation, stops.size());

        // Expand and finalize
        List<Map<String, Object>> expandedRoutes = expandRoutesWithMultipleTimings(multipleRoutes);
        scheduleData.put("multipleRoutes", expandedRoutes);
        scheduleData.put("groupedRoutes", multipleRoutes);

        log.info("Successfully parsed single-route schedule: {} fields extracted", scheduleData.size());
        return scheduleData;
      }

      // Detect board format: Check if header says "DESTINATION VIA TIME"
      // This means origin is at the TOP of the board (common bus station format)
      boolean isDestinationFirstFormat = extractedText.toUpperCase().contains("DESTINATION") &&
          extractedText.toUpperCase().contains("VIA") &&
          extractedText.toUpperCase().contains("TIME");

      String boardOrigin = null;
      if (isDestinationFirstFormat) {
        // Origin is in the header - try to detect it
        boardOrigin = detectBoardOrigin(extractedText);
        if (boardOrigin != null) {
          log.info("Detected board origin: {} (DESTINATION-VIA-TIME format)", boardOrigin);
        }
      }

      // APPROACH 1: Routes with times on same line
      // Pattern: LOCATION1 LOCATION2 [VIA] TIME TIME TIME
      Pattern multiRoutePattern = Pattern.compile(
          "([A-Z][A-Z]+)\\s+([A-Z][A-Z!:]+?)(?:\\s+([A-Z][A-Z]+))?[\\s:!.]+?(\\d{1,2}:\\d{2}(?:[\\s,]+\\d{1,2}:\\d{2})*)",
          Pattern.CASE_INSENSITIVE);

      Matcher multiRouteMatcher = multiRoutePattern.matcher(extractedText);
      int routeCount = 0;

      while (multiRouteMatcher.find() && routeCount < 20) {
        String loc1 = multiRouteMatcher.group(1).trim().toUpperCase();
        String loc2 = multiRouteMatcher.group(2).trim().toUpperCase();
        String loc3 = multiRouteMatcher.group(3) != null ? multiRouteMatcher.group(3).trim().toUpperCase() : null;
        String timingsStr = multiRouteMatcher.group(4).trim();

        // Clean up location names
        loc2 = loc2.replaceAll("[!:]+$", "").trim();

        if (loc1.length() < 4 || loc2.length() < 4) {
          continue;
        }

        // Skip non-destination words
        if (isNonLocationWord(loc1) || isNonLocationWord(loc2)) {
          continue;
        }

        List<String> routeTimings = extractTimes(timingsStr);

        if (!routeTimings.isEmpty()) {
          // If DESTINATION-VIA format:
          // - loc1 is the DESTINATION (where bus goes TO)
          // - loc2 + loc3 is the VIA (intermediate stops)
          // - boardOrigin is where bus comes FROM (may be null if not detected)
          if (isDestinationFirstFormat) {
            // loc1 = destination, loc2 + loc3 = via, boardOrigin = from (may be null)
            String via = loc3 != null && !isNonLocationWord(loc3) ? (loc2 + " " + loc3) : loc2;
            addRoute(multipleRoutes, boardOrigin, loc1, via, routeTimings);
          } else {
            // Standard format: loc1 = from, loc2 = to
            addRoute(multipleRoutes, loc1, loc2, routeTimings);
          }
          routeCount++;
        }
      }

      // APPROACH 2: Routes without times (header-only lines) - collect and try to
      // find times
      // Pattern: LOCATION1 LOCATION2 [VIA] (at start of line, no times)
      Pattern headerOnlyPattern = Pattern.compile(
          "^([A-Z]{4,})\\s+([A-Z]{4,})(?:\\s+([A-Z]{4,}))?\\s*$",
          Pattern.MULTILINE);

      Matcher headerMatcher = headerOnlyPattern.matcher(extractedText);
      List<String[]> routeHeaders = new ArrayList<>();

      // Track VIA cities that have been used - these should not become destinations
      Set<String> usedViaCities = new HashSet<>();
      for (Map<String, Object> route : multipleRoutes) {
        String via = (String) route.get("via");
        if (via != null && !via.isEmpty()) {
          // Split VIA into individual cities and add to set
          for (String city : via.split("[,\\s]+")) {
            if (city.length() >= 4) {
              usedViaCities.add(city.trim().toUpperCase());
            }
          }
        }
      }

      while (headerMatcher.find()) {
        String loc1 = headerMatcher.group(1).trim().toUpperCase();
        String loc2 = headerMatcher.group(2).trim().toUpperCase();
        String loc3 = headerMatcher.group(3) != null ? headerMatcher.group(3).trim().toUpperCase() : null;

        if (!isNonLocationWord(loc1) && !isNonLocationWord(loc2)) {
          // For DESTINATION-VIA-TIME format:
          // - loc1 = destination (toLocation)
          // - loc2 + loc3 = via (intermediate stops - combine if both present)
          // - boardOrigin = from (may be null)
          String from = isDestinationFirstFormat ? boardOrigin : loc1;
          String to = isDestinationFirstFormat ? loc1 : loc2;
          // Combine loc2 and loc3 as VIA stops when in DESTINATION-VIA-TIME format
          String via;
          if (isDestinationFirstFormat) {
            via = loc3 != null ? (loc2 + " " + loc3) : loc2;
          } else {
            via = loc3;
          }

          // Skip if loc1 is already used as a VIA city for another route
          // This prevents "THOOTHUKUDI THIRUCHENDUR" from becoming a destination
          // when it's actually the VIA line for KANYAKUMARI route
          if (isDestinationFirstFormat && usedViaCities.contains(loc1)) {
            log.debug("Skipping header line starting with VIA city: {} {} {}", loc1, loc2, loc3);
            continue;
          }

          // Check if this route was already added with times
          final String finalTo = to;
          boolean alreadyExists = multipleRoutes.stream()
              .anyMatch(r -> finalTo.equals(r.get("toLocation")));

          if (!alreadyExists) {
            routeHeaders.add(new String[] { from, to, via }); // from, to, via
          }
        }
      }

      // APPROACH 3: Collect orphan time groups (times not matched to routes)
      // Look for lines with just times
      Pattern orphanTimesPattern = Pattern.compile(
          "^[^A-Za-z]*?(\\d{1,2}:\\d{2}(?:[\\s,]+\\d{1,2}:\\d{2})+)[^A-Za-z]*$",
          Pattern.MULTILINE);

      Matcher orphanMatcher = orphanTimesPattern.matcher(extractedText);
      List<List<String>> orphanTimeGroups = new ArrayList<>();

      while (orphanMatcher.find()) {
        List<String> times = extractTimes(orphanMatcher.group(1));
        if (!times.isEmpty()) {
          orphanTimeGroups.add(times);
        }
      }

      // Try to match orphan times with header-only routes (in order)
      int timeGroupIndex = 0;
      for (String[] header : routeHeaders) {
        // header[0] = from, header[1] = to, header[2] = via
        if (timeGroupIndex < orphanTimeGroups.size()) {
          addRoute(multipleRoutes, header[0], header[1], header[2], orphanTimeGroups.get(timeGroupIndex));
          timeGroupIndex++;
          routeCount++;
        } else {
          // No times available - add route with empty times (still useful info)
          addRoute(multipleRoutes, header[0], header[1], header[2], new ArrayList<>());
          routeCount++;
        }
      }

      // APPROACH 3: Multi-line format detection for bus boards
      // Pattern: DESTINATION (line) followed by VIA (line with spaces between cities)
      // followed by TIME
      // Example: BENGALURU\nபெங்களூரு\nSALEM HOSUR\nசேலம்\nஒசூர்\n16:30
      if (isDestinationFirstFormat) {
        extractMultiLineRoutes(extractedText, multipleRoutes, boardOrigin);
      }

      // APPROACH 4: Also extract Tamil routes (may have Tamil destinations not caught
      // by English patterns)
      log.info("Also checking for Tamil route patterns...");
      extractTamilRoutes(extractedText, multipleRoutes, isDestinationFirstFormat, boardOrigin);

      // APPROACH 5: Extract route numbers from text
      // Pattern: Route number at start of line like "166UD CHENNAI" or "166UDCHENNAI"
      // This extracts route numbers and associates them with existing routes
      extractAndAssociateRouteNumbers(extractedText, multipleRoutes);

      // Add format hints for the UI
      if (isDestinationFirstFormat) {
        scheduleData.put("boardFormat", "DESTINATION_VIA_TIME");
        if (boardOrigin != null) {
          scheduleData.put("detectedOrigin", boardOrigin);
          scheduleData.put("origin", boardOrigin);
          scheduleData.put("fromLocation", boardOrigin);
        } else {
          // Origin not detected - mark as needing manual input
          scheduleData.put("originRequired", true);
          scheduleData.put("originHint",
              "This appears to be a bus station timing board. The origin station name could not be detected from the image. Please specify the origin manually.");
          log.warn("DESTINATION-VIA-TIME format detected but origin could not be extracted from OCR text");
        }
      }

      // If we found multiple routes, update the main data with the first route
      if (!multipleRoutes.isEmpty() && fromLocation == null && toLocation == null) {
        Map<String, Object> firstRoute = multipleRoutes.get(0);

        // Only set from first route if origin not already set from board detection
        if (scheduleData.get("fromLocation") == null) {
          scheduleData.put("fromLocation", firstRoute.get("fromLocation"));
          scheduleData.put("origin", firstRoute.get("fromLocation"));
        }
        scheduleData.put("toLocation", firstRoute.get("toLocation"));
        scheduleData.put("destination", firstRoute.get("toLocation"));

        @SuppressWarnings("unchecked")
        List<String> firstRouteTimings = (List<String>) firstRoute.get("timings");
        if (!firstRouteTimings.isEmpty()) {
          scheduleData.put("departureTime", firstRouteTimings.get(0));
          if (firstRouteTimings.size() > 1) {
            scheduleData.put("arrivalTime", firstRouteTimings.get(firstRouteTimings.size() - 1));
          }
        }

        log.info("Detected {} routes from multi-route timing board", multipleRoutes.size());
      }

      // Post-processing: Remove routes where the destination is used as a VIA in
      // another route
      // This prevents "THOOTHUKUDI" from being a destination when it's a VIA for
      // KANYAKUMARI
      Set<String> allViaCities = new HashSet<>();
      for (Map<String, Object> route : multipleRoutes) {
        String via = (String) route.get("via");
        if (via != null) {
          for (String city : via.split("[,\\s]+")) {
            allViaCities.add(city.trim().toUpperCase());
          }
        }
      }

      // Remove routes where destination is a VIA city in another route
      int originalCount = multipleRoutes.size();
      multipleRoutes.removeIf(route -> {
        String to = (String) route.get("toLocation");
        if (to != null && allViaCities.contains(to.toUpperCase())) {
          @SuppressWarnings("unchecked")
          List<String> routeTimings = (List<String>) route.get("timings");
          // Only remove if this route has no timings (likely a parsing artifact)
          if (routeTimings == null || routeTimings.isEmpty()) {
            log.debug("Removing route to {} because it's used as VIA in another route and has no timings", to);
            return true;
          }
        }
        return false;
      });
      if (originalCount != multipleRoutes.size()) {
        log.info("Filtered {} routes that are VIA cities with no timings", originalCount - multipleRoutes.size());
      }

      // Expand routes with multiple timings into separate entries
      // This creates one entry per departure time for clearer differentiation
      List<Map<String, Object>> expandedRoutes = expandRoutesWithMultipleTimings(multipleRoutes);

      // Update the multipleRoutes in the schedule data with expanded routes
      scheduleData.put("multipleRoutes", expandedRoutes);

      // Also keep the original grouped routes for reference
      scheduleData.put("groupedRoutes", multipleRoutes);

      log.info("Successfully parsed schedule data: {} fields extracted, {} routes expanded to {} entries",
          scheduleData.size(), multipleRoutes.size(), expandedRoutes.size());
      return scheduleData;

    } catch (Exception e) {
      log.error("Error parsing schedule text to map: {}", e.getMessage(), e);
      Map<String, Object> errorResult = new HashMap<>();
      errorResult.put("error", e.getMessage());
      errorResult.put("extractedText", extractedText);
      return errorResult;
    }
  }

  // Tamil pattern for "Bus Stand" - indicates station header
  private static final String[] BUS_STAND_PATTERNS = { "பேருந்து நிலையம்", "பேருந்து நிலைய", "பேருந்து", "நிலையம்",
      "BUS STAND", "BUS STATION" };

  /**
   * Detect the origin station from the board header
   * Looks for location names in first few lines BEFORE the route table header
   * The origin is typically shown at the top of the board (e.g., "இராமேஸ்வரம்
   * பேருந்து நிலையம்")
   * 
   * IMPORTANT: The origin is found BEFORE the route table header, not in the
   * route data.
   * OCR text may have poor line breaks, so we also check the substring before
   * "ROUTE" keyword.
   */
  private String detectBoardOrigin(String extractedText) {
    if (extractedText == null)
      return null;

    String[] lines = extractedText.split("\\r?\\n");

    // Find where the route table header starts (ROUTE NO, DESTINATION, VIA, TIME)
    int headerLineIndex = -1;
    int headerCharIndex = -1;
    for (int i = 0; i < lines.length; i++) {
      String lineUpper = lines[i].toUpperCase();
      if ((lineUpper.contains("ROUTE") && lineUpper.contains("DESTINATION")) ||
          (lineUpper.contains("DESTINATION") && lineUpper.contains("VIA") && lineUpper.contains("TIME"))) {
        headerLineIndex = i;
        log.info("Found route table header at line {}: {}", i, lines[i]);
        break;
      }
    }

    // Also find where "ROUTE" appears in the raw text (for when OCR has poor line
    // breaks)
    String textUpper = extractedText.toUpperCase();
    headerCharIndex = textUpper.indexOf("ROUTE");
    if (headerCharIndex < 0) {
      headerCharIndex = textUpper.indexOf("DESTINATION");
    }

    // Extract the header portion BEFORE the route table
    // This is where the origin station name should be (e.g., "இராமேஸ்வரம் பேருந்து
    // நிலையம்")
    String headerPortion = "";
    if (headerCharIndex > 0) {
      headerPortion = extractedText.substring(0, headerCharIndex);
      log.info("Header portion before ROUTE keyword ({} chars): {}", headerPortion.length(),
          headerPortion.length() > 200 ? headerPortion.substring(0, 200) + "..." : headerPortion);
    }

    // PRIORITY 1: Check for Tamil city names with "Bus Stand" indicator in header
    // portion
    // This is the strongest signal - "இராமேஸ்வரம் பேருந்து நிலையம்" means
    // "Rameshwaram Bus Stand"
    boolean hasBusStandIndicator = false;
    for (String busPattern : BUS_STAND_PATTERNS) {
      if (headerPortion.contains(busPattern) || headerPortion.toUpperCase().contains(busPattern)) {
        hasBusStandIndicator = true;
        log.info("Found bus stand indicator '{}' in header portion", busPattern);
        break;
      }
    }

    // If bus stand indicator found in header, search for Tamil city patterns there
    if (hasBusStandIndicator && !headerPortion.isEmpty()) {
      for (Map.Entry<String, String[]> entry : TAMIL_CITY_PATTERNS.entrySet()) {
        for (String pattern : entry.getValue()) {
          if (headerPortion.contains(pattern)) {
            log.info("Detected board origin from Tamil pattern in header: {} (pattern: {})",
                entry.getKey(), pattern);
            return entry.getKey();
          }
        }
      }
    }

    // PRIORITY 2: Check header portion for any Tamil city patterns (even without
    // bus stand indicator)
    if (!headerPortion.isEmpty()) {
      for (Map.Entry<String, String[]> entry : TAMIL_CITY_PATTERNS.entrySet()) {
        for (String pattern : entry.getValue()) {
          if (headerPortion.contains(pattern)) {
            log.info("Detected board origin from Tamil pattern in header: {} (pattern: {})",
                entry.getKey(), pattern);
            return entry.getKey();
          }
        }
      }
    }

    // Only check lines BEFORE the header row (that's where the origin station name
    // is)
    int linesToCheck = headerLineIndex > 0 ? headerLineIndex : Math.min(6, lines.length);

    log.info("Checking first {} lines for board origin (header at line {})...", linesToCheck, headerLineIndex);
    for (int i = 0; i < linesToCheck; i++) {
      log.info("Header line {}: {}", i, lines[i]);
    }

    // PRIORITY 3: Check for Tamil location names in header lines using pattern
    // matching
    for (int i = 0; i < linesToCheck; i++) {
      String line = lines[i];

      String matched = matchTamilToEnglish(line);
      if (matched != null) {
        log.info("Detected board origin from Tamil pattern in line: {} (line: {})", matched, line);
        return matched;
      }
    }

    // PRIORITY 4: Check header portion for English location names
    String[] knownOrigins = { "RAMESHWARAM", "RAMESWARAM", "CHENNAI", "MADURAI", "COIMBATORE",
        "TRICHY", "SALEM", "TIRUNELVELI", "THANJAVUR", "BENGALURU" };
    if (!headerPortion.isEmpty()) {
      String headerUpper = headerPortion.toUpperCase();
      for (String origin : knownOrigins) {
        if (headerUpper.contains(origin)) {
          log.info("Detected board origin from English in header portion: {}", origin);
          return origin;
        }
      }
    }

    // PRIORITY 5: Check header lines for English location names
    for (int i = 0; i < linesToCheck; i++) {
      String line = lines[i].toUpperCase();
      for (String origin : knownOrigins) {
        if (line.contains(origin)) {
          log.info("Detected board origin from English in line: {}", origin);
          return origin;
        }
      }
    }

    log.warn("Could not detect board origin from header lines. OCR text may be garbled.");
    return null;
  }

  /**
   * Detect "Bus Timings at [Location] Busstand" format.
   * This is a simple departure times board that lists only departure times,
   * not specific destinations.
   * 
   * Pattern examples:
   * - "Bus Timings at Sivakasi N.R.K.Rajarathinam Busstand"
   * - "Bus Timings at Chennai CMBT"
   * - "பேருந்து நேரங்கள் சிவகாசி"
   * 
   * @param extractedText The OCR extracted text
   * @return The detected origin location, or null if not this format
   */
  private String detectBusTimingsAtFormat(String extractedText) {
    if (extractedText == null || extractedText.isEmpty()) {
      return null;
    }

    String textUpper = extractedText.toUpperCase();

    // Check for "Bus Timings at [Location]" pattern
    // Pattern: "BUS TIMINGS AT" followed by location name (first word only)
    // The location is typically followed by bus stand name suffix like
    // "N.R.K.Rajarathinam Busstand"
    Pattern busTimingsPattern = Pattern.compile(
        "BUS\\s+TIMINGS?\\s+(?:AT|@)\\s+([A-Z]+)(?:\\s|$)",
        Pattern.CASE_INSENSITIVE);

    Matcher matcher = busTimingsPattern.matcher(textUpper);
    if (matcher.find()) {
      String locationPart = matcher.group(1).trim();

      if (locationPart.length() >= 4) {
        // Check if this matches a known city
        String normalized = normalizeLocationName(locationPart);
        if (normalized != null) {
          log.info("Detected 'Bus Timings at' format with origin: {} (from: {})", normalized, locationPart);
          return normalized;
        }

        // If not in our list but looks like a valid location, return as-is
        if (!isNonLocationWord(locationPart)) {
          log.info("Detected 'Bus Timings at' format with unknown origin: {}", locationPart);
          return locationPart;
        }
      }
    }

    // Also check for Tamil format "பேருந்து நேரங்கள்" (Bus Timings)
    if (extractedText.contains("பேருந்து") && extractedText.contains("நேரங்கள்")) {
      // Look for city name patterns in the same line or nearby
      for (Map.Entry<String, String[]> entry : TAMIL_CITY_PATTERNS.entrySet()) {
        for (String pattern : entry.getValue()) {
          if (extractedText.contains(pattern)) {
            log.info("Detected Tamil 'Bus Timings' format with origin: {} (pattern: {})",
                entry.getKey(), pattern);
            return entry.getKey();
          }
        }
      }
    }

    return null;
  }

  /**
   * Normalize a location name to a standard form.
   * Checks against known city patterns.
   * 
   * @param location Raw location name
   * @return Normalized city name or null if not found
   */
  private String normalizeLocationName(String location) {
    if (location == null || location.isEmpty()) {
      return null;
    }

    String upper = location.toUpperCase().trim();

    // Check against known cities (both Tamil and English patterns)
    for (Map.Entry<String, String[]> entry : ENGLISH_CITY_PATTERNS.entrySet()) {
      for (String pattern : entry.getValue()) {
        if (upper.contains(pattern)) {
          return entry.getKey();
        }
      }
    }

    // Check Tamil patterns
    for (Map.Entry<String, String[]> entry : TAMIL_CITY_PATTERNS.entrySet()) {
      for (String pattern : entry.getValue()) {
        if (location.contains(pattern)) {
          return entry.getKey();
        }
      }
    }

    // Known cities not in pattern maps
    String[] additionalCities = {
        "SIVAKASI", "ARUPPUKKOTTAI", "VIRUDHUNAGAR", "SRIVILLIPUTTUR",
        "RAJAPALAYAM", "KOVILPATTI", "TENKASI", "SANKARANKOVIL"
    };
    for (String city : additionalCities) {
      if (upper.contains(city)) {
        return city;
      }
    }

    return null;
  }

  /**
   * Extract all departure times from a timing board text.
   * Handles various formats like "01:10. 01:20." or "01:10, 01:20" or "01:10
   * 01:20"
   * 
   * @param extractedText The OCR extracted text
   * @return List of departure times in HH:MM format
   */
  private List<String> extractAllDepartureTimes(String extractedText) {
    List<String> times = new ArrayList<>();
    if (extractedText == null || extractedText.isEmpty()) {
      return times;
    }

    // Pattern to match various time formats: HH:MM, H:MM, HH.MM
    // Times can be separated by . , space, or newline
    Pattern timePattern = Pattern.compile("(\\d{1,2})[:.](\\d{2})");
    Matcher matcher = timePattern.matcher(extractedText);

    Set<String> uniqueTimes = new HashSet<>();
    while (matcher.find()) {
      int hours = Integer.parseInt(matcher.group(1));
      int minutes = Integer.parseInt(matcher.group(2));

      // Validate time range (0-23 hours, 0-59 minutes)
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        String formattedTime = String.format("%02d:%02d", hours, minutes);
        if (uniqueTimes.add(formattedTime)) {
          times.add(formattedTime);
        }
      }
    }

    // Sort times chronologically
    times.sort((t1, t2) -> {
      String[] parts1 = t1.split(":");
      String[] parts2 = t2.split(":");
      int hour1 = Integer.parseInt(parts1[0]);
      int hour2 = Integer.parseInt(parts2[0]);
      if (hour1 != hour2)
        return hour1 - hour2;
      return Integer.parseInt(parts1[1]) - Integer.parseInt(parts2[1]);
    });

    log.info("Extracted {} unique departure times from timing board", times.size());
    return times;
  }

  /**
   * Check if a word is a non-location keyword (bus type, class, bus stand names,
   * etc.)
   */
  private boolean isNonLocationWord(String word) {
    if (word == null)
      return true;
    String upper = word.toUpperCase();
    return upper.matches("ORDINARY|SEATER|SUPER|DELUXE|EXPRESS|ROUTE|TIME|VIA|DESTINATION|FAST|SLEEPER|VOLVO|LUXURY|" +
        "BUSSTAND|BUS|STAND|STATION|TERMINAL|TIMINGS?|RAJARATHINAM|N\\.?R\\.?K\\.?|" +
        "TRANSPORT|CORPORATION|TNSTC|KSRTC|SETC|MOTTC|SCHEDULE|BOARD");
  }

  /**
   * Validate if a string is a valid route/bus number
   * Valid examples: 166UD, 159UD, 886UD, 637UD, 520UD, 12A, 45B
   * Invalid examples: ORDINARY, 3X2, SEATER, VOLVO, etc.
   */
  private boolean isValidRouteNumber(String routeNumber) {
    if (routeNumber == null || routeNumber.trim().isEmpty()) {
      return false;
    }
    String cleaned = routeNumber.trim().toUpperCase();

    // Invalid patterns - bus types and descriptors
    if (cleaned.matches(".*(?:ORDINARY|SEATER|SUPER|DELUXE|EXPRESS|VOLVO|LUXURY|SLEEPER|FAST|3X2|2X2|2X3|3X3).*")) {
      return false;
    }

    // Invalid if it's a pure city/location name
    if (cleaned
        .matches("CHENNAI|BENGALURU|BANGALORE|MADURAI|COIMBATORE|SALEM|TRICHY|ERODE|TIRUPPUR|KARUR|DINDIGUL|THENI")) {
      return false;
    }

    // Invalid if too long (likely a description, not a route number)
    if (cleaned.length() > 10) {
      return false;
    }

    // Valid pattern: starts with digits, optionally followed by letters (e.g.,
    // 166UD, 12A, 45B)
    // Or starts with letters followed by digits (e.g., UD166, A12)
    return cleaned.matches("\\d+[A-Z]*") || cleaned.matches("[A-Z]+\\d+[A-Z]*");
  }

  /**
   * Extract route number from a line of text
   * Looks for patterns like 166UD, 159UD at the start of lines or before
   * destination names
   */
  private String extractRouteNumberFromLine(String line) {
    if (line == null || line.trim().isEmpty()) {
      return null;
    }

    // Pattern: Route number at start of line (e.g., "166UD CHENNAI" or
    // "166UDCHENNAI")
    Pattern routeNumPattern = Pattern.compile("^\\s*(\\d{1,4}[A-Z]{0,3})(?:[\\s]*[A-Z]|$)", Pattern.CASE_INSENSITIVE);
    Matcher matcher = routeNumPattern.matcher(line.toUpperCase());

    if (matcher.find()) {
      String potentialRouteNum = matcher.group(1).trim();
      if (isValidRouteNumber(potentialRouteNum)) {
        return potentialRouteNum;
      }
    }

    return null;
  }

  /**
   * Extract time values from a string
   */
  private List<String> extractTimes(String text) {
    List<String> times = new ArrayList<>();
    if (text == null)
      return times;

    Pattern timePattern = Pattern.compile("\\d{1,2}:\\d{2}");
    Matcher timeMatcher = timePattern.matcher(text);

    while (timeMatcher.find()) {
      times.add(timeMatcher.group());
    }
    return times;
  }

  /**
   * Add a route to the list with via information, avoiding duplicates.
   * The via parameter may contain multiple stops (e.g., "SALEM HOSUR")
   * which will be parsed into a stops array.
   */
  private void addRoute(List<Map<String, Object>> routes, String from, String to, String via, List<String> timings) {
    // Check for duplicates - only check toLocation since from might be null
    boolean exists = routes.stream()
        .anyMatch(r -> to != null && to.equals(r.get("toLocation")));

    // Skip if this destination is already used as a VIA city in another route
    // This prevents "THOOTHUKUDI" from becoming a destination when it's a VIA for
    // KANYAKUMARI
    boolean isUsedAsVia = routes.stream()
        .anyMatch(r -> {
          String existingVia = (String) r.get("via");
          if (existingVia != null && to != null) {
            for (String city : existingVia.split("[,\\s]+")) {
              if (city.trim().equalsIgnoreCase(to)) {
                return true;
              }
            }
          }
          return false;
        });

    if (isUsedAsVia) {
      log.debug("Skipping route {} -> {} because destination is already used as VIA city", from, to);
    }

    if (!exists && to != null && !isUsedAsVia) {
      Map<String, Object> route = new HashMap<>();
      route.put("fromLocation", from); // May be null - will be set manually later
      route.put("toLocation", to);

      // Parse VIA into intermediate stops
      List<Map<String, String>> intermediateStops = parseViaToStops(via);
      if (!intermediateStops.isEmpty()) {
        route.put("stops", intermediateStops);
        // Keep the via string for display purposes (joined with commas)
        route.put("via", intermediateStops.stream()
            .map(s -> s.get("name"))
            .reduce((a, b) -> a + ", " + b)
            .orElse(via));
      } else if (via != null && !via.isEmpty() && !via.equals(to)) {
        route.put("via", via);
      }

      route.put("timings", timings);
      routes.add(route);
      log.debug("Added route: {} -> {} via {} with {} timing(s) and {} stop(s)",
          from != null ? from : "[ORIGIN REQUIRED]", to, via,
          timings.size(), intermediateStops.size());
    }
  }

  /**
   * Parse a VIA string containing multiple stops into a list of stop objects.
   * For example, "SALEM HOSUR" becomes [{name: "SALEM"}, {name: "HOSUR"}]
   * 
   * @param via String containing one or more location names separated by spaces
   * @return List of stop objects with name property
   */
  private List<Map<String, String>> parseViaToStops(String via) {
    List<Map<String, String>> stops = new ArrayList<>();
    if (via == null || via.isEmpty()) {
      return stops;
    }

    // Known city names to help identify separate stops in the VIA string
    String[] knownCities = {
        "SALEM", "HOSUR", "MADURAI", "TRICHY", "COIMBATORE", "CHENNAI", "BENGALURU", "BANGALORE",
        "ERODE", "TIRUPPUR", "KARUR", "DINDIGUL", "THENI", "DHARAPURAM", "POLLACHI", "PALANI",
        "NAMAKKAL", "KRISHNAGIRI", "DHARMAPURI", "VELLORE", "KANCHIPURAM", "KUMBAKONAM",
        "THANJAVUR", "PATTUKOTTAI", "PUDUKKOTTAI", "VIRUDHUNAGAR", "SIVAKASI", "TENKASI",
        "NAGERCOIL", "MARTHANDAM", "TIRUNELVELI", "THOOTHUKUDI", "THIRUCHENDUR",
        "KANYAKUMARI", "RAMANATHAPURAM", "PARAMAKUDI", "ARUPPUKKOTTAI"
    };

    // First try to match known cities in the via string
    String viaUpper = via.toUpperCase().trim();
    List<String> foundCities = new ArrayList<>();

    for (String city : knownCities) {
      if (viaUpper.contains(city)) {
        foundCities.add(city);
        // Remove the city from viaUpper to avoid double matching
        viaUpper = viaUpper.replace(city, " ").trim();
      }
    }

    // If we found known cities, use them
    if (!foundCities.isEmpty()) {
      int stopOrder = 1;
      for (String city : foundCities) {
        Map<String, String> stop = new HashMap<>();
        stop.put("name", city);
        stop.put("stopOrder", String.valueOf(stopOrder++));
        stops.add(stop);
      }
      log.debug("Parsed VIA '{}' into {} intermediate stops: {}", via, stops.size(), foundCities);
      return stops;
    }

    // Fallback: split by whitespace and filter valid location names
    String[] parts = via.trim().split("\\s+");
    int stopOrder = 1;
    for (String part : parts) {
      String cleaned = part.trim().toUpperCase().replaceAll("[^A-Z]", "");
      // Only add if it looks like a location name (at least 4 chars, not a keyword)
      if (cleaned.length() >= 4 && !isNonLocationWord(cleaned)) {
        Map<String, String> stop = new HashMap<>();
        stop.put("name", cleaned);
        stop.put("stopOrder", String.valueOf(stopOrder++));
        stops.add(stop);
      }
    }

    if (!stops.isEmpty()) {
      log.debug("Parsed VIA '{}' into {} intermediate stops using fallback", via, stops.size());
    }

    return stops;
  }

  /**
   * Add a route to the list, avoiding duplicates
   */
  private void addRoute(List<Map<String, Object>> routes, String from, String to, List<String> timings) {
    // Check for duplicates - only check toLocation since from might be null
    boolean exists = routes.stream()
        .anyMatch(r -> to != null && to.equals(r.get("toLocation")));

    // Skip if this destination is already used as a VIA city in another route
    // This prevents "THOOTHUKUDI" from becoming a destination when it's a VIA for
    // KANYAKUMARI
    boolean isUsedAsVia = routes.stream()
        .anyMatch(r -> {
          String existingVia = (String) r.get("via");
          if (existingVia != null && to != null) {
            for (String city : existingVia.split("[,\\s]+")) {
              if (city.trim().equalsIgnoreCase(to)) {
                return true;
              }
            }
          }
          return false;
        });

    if (isUsedAsVia) {
      log.debug("Skipping route {} -> {} because destination is already used as VIA city", from, to);
    }

    if (!exists && to != null && !isUsedAsVia) {
      Map<String, Object> route = new HashMap<>();
      route.put("fromLocation", from); // May be null
      route.put("toLocation", to);
      route.put("timings", timings);
      routes.add(route);
      log.debug("Added route: {} -> {} with {} timing(s)", from != null ? from : "[ORIGIN REQUIRED]", to,
          timings.size());
    }
  }

  /**
   * Expand routes with multiple timings into separate entries.
   * For example, a route with timings [06:10, 11:00, 13:40] will become
   * three separate routes, each with a single departureTime.
   * This allows for creating separate database records for each schedule entry.
   * 
   * @param groupedRoutes Routes with potentially multiple timings
   * @return Expanded list where each entry has a single departure time
   */
  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> expandRoutesWithMultipleTimings(List<Map<String, Object>> groupedRoutes) {
    List<Map<String, Object>> expandedRoutes = new ArrayList<>();

    for (Map<String, Object> route : groupedRoutes) {
      List<String> timings = (List<String>) route.get("timings");
      String from = (String) route.get("fromLocation");
      String to = (String) route.get("toLocation");
      String via = (String) route.get("via");
      String routeNumber = (String) route.get("routeNumber"); // Get route number if present
      Object stopsObj = route.get("stops"); // Get intermediate stops if present

      if (timings == null || timings.isEmpty()) {
        // No timings - keep the route as is with departureTime = null
        Map<String, Object> expandedRoute = new HashMap<>(route);
        expandedRoute.put("departureTime", null);
        expandedRoute.put("scheduleIndex", 1);
        expandedRoute.put("totalSchedules", 1);
        expandedRoutes.add(expandedRoute);
      } else if (timings.size() == 1) {
        // Single timing - add departureTime field
        Map<String, Object> expandedRoute = new HashMap<>(route);
        expandedRoute.put("departureTime", timings.get(0));
        expandedRoute.put("scheduleIndex", 1);
        expandedRoute.put("totalSchedules", 1);
        expandedRoutes.add(expandedRoute);
      } else {
        // Multiple timings - create a separate entry for each timing
        int totalSchedules = timings.size();
        for (int i = 0; i < timings.size(); i++) {
          String timing = timings.get(i);
          Map<String, Object> expandedRoute = new HashMap<>();
          expandedRoute.put("fromLocation", from);
          expandedRoute.put("toLocation", to);
          if (via != null) {
            expandedRoute.put("via", via);
          }
          // Copy route number if present
          if (routeNumber != null) {
            expandedRoute.put("routeNumber", routeNumber);
          }
          // Copy intermediate stops to each expanded route
          if (stopsObj != null) {
            expandedRoute.put("stops", stopsObj);
          }
          // Each expanded route has a single timing as departureTime
          expandedRoute.put("departureTime", timing);
          // Keep the original timings array for reference
          expandedRoute.put("timings", List.of(timing));
          // Add metadata for UI grouping
          expandedRoute.put("scheduleIndex", i + 1);
          expandedRoute.put("totalSchedules", totalSchedules);
          expandedRoute.put("routeGroupId", from + "-" + to + (via != null ? "-" + via : ""));

          expandedRoutes.add(expandedRoute);
        }
        log.debug("Expanded route {} -> {} into {} separate schedule entries",
            from != null ? from : "[ORIGIN]", to, timings.size());
      }
    }

    log.info("Expanded {} grouped routes into {} individual schedule entries",
        groupedRoutes.size(), expandedRoutes.size());
    return expandedRoutes;
  }

  /**
   * Extract routes from multi-line format typical of bus station boards.
   * Pattern: DESTINATION (English line) followed by Tamil translation, then VIA
   * (with multiple cities),
   * then Tamil translations, then TIME.
   * Example:
   * BENGALURU
   * பெங்களூரு
   * SALEM HOSUR
   * சேலம்
   * ஒசூர்
   * 16:30
   */
  private void extractMultiLineRoutes(String extractedText, List<Map<String, Object>> multipleRoutes,
      String boardOrigin) {
    if (extractedText == null || extractedText.isEmpty()) {
      return;
    }

    log.debug("extractMultiLineRoutes: board origin={}, existing routes={}", boardOrigin, multipleRoutes.size());

    String[] lines = extractedText.split("\\r?\\n");
    Pattern timePattern = Pattern.compile("^\\s*(\\d{1,2}:\\d{2})\\s*$");

    // Known destination cities to look for
    String[] knownDestinations = {
        "BENGALURU", "BANGALORE", "CHENNAI", "COIMBATORE", "MADURAI", "SALEM",
        "TRICHY", "ERODE", "TIRUPPUR", "KANYAKUMARI", "THOOTHUKUDI", "TIRUNELVELI",
        "HOSUR", "VELLORE", "PONDICHERRY", "KARUR", "DINDIGUL", "THENI"
    };

    // Build set of cities already used as VIA stops - these should NOT become
    // destinations
    Set<String> usedViaCities = new HashSet<>();
    for (Map<String, Object> route : multipleRoutes) {
      String via = (String) route.get("via");
      if (via != null && !via.isEmpty()) {
        for (String city : via.split("[,\\s]+")) {
          if (city.length() >= 4) {
            usedViaCities.add(city.trim().toUpperCase());
          }
        }
      }
    }
    log.debug("extractMultiLineRoutes: usedViaCities={}", usedViaCities);

    int addedCount = 0;

    for (int i = 0; i < lines.length - 1; i++) {
      String line = lines[i].trim().toUpperCase();

      // Skip short lines, header lines, and route numbers
      if (line.length() < 4 || line.contains("ROUTE") || line.contains("DESTINATION") ||
          line.contains("VIA") || line.contains("TIME") || line.matches("^\\d+.*")) {
        continue;
      }

      // Check if this line is a known destination (single word, uppercase)
      String destination = null;
      for (String city : knownDestinations) {
        if (line.equals(city)) {
          destination = city;
          break;
        }
      }

      if (destination == null) {
        continue;
      }

      // Skip if this destination is already used as a VIA city for another route
      // This prevents "THOOTHUKUDI" from becoming a destination when it's a VIA for
      // KANYAKUMARI
      if (usedViaCities.contains(destination)) {
        log.debug("extractMultiLineRoutes: Skipping {} as it's already used as a VIA city", destination);
        continue;
      }

      // Check if this destination already has a route with timings
      final String finalDest = destination;
      boolean hasRoutesWithTimings = multipleRoutes.stream()
          .anyMatch(r -> finalDest.equals(r.get("toLocation")) &&
              r.get("timings") != null &&
              !((List<?>) r.get("timings")).isEmpty());

      if (hasRoutesWithTimings) {
        continue; // Already have this route with timings
      }

      // Look for VIA cities in the next few lines (skip Tamil translations)
      String viaString = null;
      List<String> times = new ArrayList<>();

      for (int j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        String nextLine = lines[j].trim();

        // Check if this line contains time(s)
        Matcher timeMatcher = timePattern.matcher(nextLine);
        if (timeMatcher.matches()) {
          times.add(timeMatcher.group(1));
          continue;
        }

        // Check if this is a VIA line (contains multiple known cities separated by
        // space)
        String nextLineUpper = nextLine.toUpperCase();
        if (nextLineUpper.length() >= 4 && !nextLineUpper.equals(destination)) {
          // Check if line contains known cities
          int cityCount = 0;
          for (String city : knownDestinations) {
            if (nextLineUpper.contains(city)) {
              cityCount++;
            }
          }
          if (cityCount >= 1 && viaString == null) {
            // This looks like a VIA line
            viaString = nextLineUpper;
          }
        }
      }

      // If we found a destination with VIA and/or times, add/update the route
      if (viaString != null || !times.isEmpty()) {
        // Remove any existing route for this destination without timings
        multipleRoutes.removeIf(r -> finalDest.equals(r.get("toLocation")) &&
            (r.get("timings") == null || ((List<?>) r.get("timings")).isEmpty()));

        // Parse VIA into stops
        List<Map<String, String>> stops = parseViaToStops(viaString);

        // Add the new route
        if (!times.isEmpty()) {
          addRoute(multipleRoutes, boardOrigin, destination, viaString, times);
          log.debug("Multi-line route found: {} -> {} via {} with times {}",
              boardOrigin, destination, viaString, times);
          addedCount++;
        } else if (!stops.isEmpty()) {
          // Add route with stops but no times
          addRoute(multipleRoutes, boardOrigin, destination, viaString, new ArrayList<>());
          log.debug("Multi-line route found (no times): {} -> {} via {}",
              boardOrigin, destination, viaString);
          addedCount++;
        }
      }
    }

    if (addedCount > 0) {
      log.info("Added {} routes from multi-line format extraction", addedCount);
    }
  }

  /**
   * Extract routes from Tamil text
   * Looks for Tamil location names (destinations) that may not have been caught
   * by English patterns
   */
  private void extractTamilRoutes(String extractedText, List<Map<String, Object>> multipleRoutes,
      boolean isDestinationFirstFormat, String boardOrigin) {
    if (extractedText == null || extractedText.isEmpty()) {
      return;
    }

    String[] lines = extractedText.split("\\r?\\n");
    Pattern timePattern = Pattern.compile("(\\d{1,2}[:.:]\\d{2})");
    int addedCount = 0;

    for (String line : lines) {
      // Skip short lines and header lines
      if (line.trim().length() < 5) {
        continue;
      }
      String lineUpper = line.toUpperCase();
      if (lineUpper.contains("ROUTE") || lineUpper.contains("DESTINATION") || lineUpper.contains("TIME")) {
        continue;
      }

      // Find all Tamil city names in the line
      List<String> foundCities = findAllCitiesInText(line);
      if (foundCities.isEmpty()) {
        continue;
      }

      // Find all times in the line
      Matcher timeMatcher = timePattern.matcher(line);
      List<String> times = new ArrayList<>();
      while (timeMatcher.find()) {
        String time = timeMatcher.group(1).replace(".", ":"); // Normalize separators
        times.add(time);
      }

      // For DESTINATION-VIA-TIME format:
      // - First city found = destination (toLocation)
      // - Second city found = via
      // - boardOrigin = from (may be null)
      String destination = foundCities.get(0);
      String via = foundCities.size() > 1 ? foundCities.get(1) : null;
      String from = isDestinationFirstFormat ? boardOrigin : (foundCities.size() > 1 ? foundCities.get(0) : null);
      String to = isDestinationFirstFormat ? destination : (foundCities.size() > 1 ? foundCities.get(1) : destination);

      // Check if this destination already exists
      final String finalTo = to;
      boolean alreadyExists = multipleRoutes.stream()
          .anyMatch(r -> finalTo.equals(r.get("toLocation")));

      if (!alreadyExists && to != null) {
        Map<String, Object> route = new HashMap<>();
        route.put("fromLocation", from);
        route.put("toLocation", to);
        if (via != null && !via.equals(to)) {
          route.put("via", via);
        }
        route.put("timings", times);
        multipleRoutes.add(route);
        addedCount++;

        log.debug("Detected Tamil route: {} -> {} via {} with {} timing(s)",
            from != null ? from : "[ORIGIN REQUIRED]", to, via, times.size());
      }
    }

    if (addedCount > 0) {
      log.info("Added {} routes from Tamil text extraction", addedCount);
    }
  }

  /**
   * Extract route numbers from OCR text and associate them with parsed routes.
   * Looks for patterns like "166UD", "159UD", "886UD" at the start of lines
   * or before destination city names.
   * 
   * Pattern in bus boards: ROUTE_NO DESTINATION VIA TIME
   * Example: 166UDCHENNAIசென்னைTRICHYதிருச்சிி16:00
   */
  private void extractAndAssociateRouteNumbers(String extractedText, List<Map<String, Object>> routes) {
    if (extractedText == null || routes.isEmpty()) {
      return;
    }

    // Pattern to find route numbers followed by destination names
    // Route number format: 1-4 digits followed by 0-3 letters (e.g., 166UD, 159UD,
    // 886UD, 637UD)
    Pattern routeNumDestPattern = Pattern.compile(
        "(\\d{1,4}[A-Z]{0,3})\\s*([A-Z]{4,})",
        Pattern.CASE_INSENSITIVE);

    // Build a map of destinations to route numbers
    Map<String, String> destinationToRouteNum = new HashMap<>();
    Matcher matcher = routeNumDestPattern.matcher(extractedText.toUpperCase());

    while (matcher.find()) {
      String potentialRouteNum = matcher.group(1).trim();
      String destination = matcher.group(2).trim();

      // Validate the route number
      if (isValidRouteNumber(potentialRouteNum)) {
        // Store the mapping (destination -> route number)
        if (!destinationToRouteNum.containsKey(destination)) {
          destinationToRouteNum.put(destination, potentialRouteNum);
          log.debug("Found route number {} for destination {}", potentialRouteNum, destination);
        }
      }
    }

    // Associate route numbers with parsed routes based on destination
    int associatedCount = 0;
    for (Map<String, Object> route : routes) {
      String toLocation = (String) route.get("toLocation");
      if (toLocation != null && destinationToRouteNum.containsKey(toLocation.toUpperCase())) {
        String routeNum = destinationToRouteNum.get(toLocation.toUpperCase());
        route.put("routeNumber", routeNum);
        associatedCount++;
        log.debug("Associated route number {} with route to {}", routeNum, toLocation);
      }
    }

    if (associatedCount > 0) {
      log.info("Associated {} route numbers with parsed routes", associatedCount);
    }
  }

  @Override
  public Map<String, String> extractBusScheduleInfo(String text) {
    try {
      log.info("Extracting bus schedule info from text");

      Map<String, Object> parsedData = parseScheduleTextToMap(text);
      Map<String, String> info = new HashMap<>();

      // Convert parsed data to string map
      info.put("busNumber", (String) parsedData.get("busNumber"));
      info.put("origin", (String) parsedData.get("fromLocation"));
      info.put("destination", (String) parsedData.get("toLocation"));
      info.put("departureTime", (String) parsedData.get("departureTime"));
      info.put("arrivalTime", (String) parsedData.get("arrivalTime"));
      info.put("fare", (String) parsedData.get("fare"));
      info.put("operatorName", (String) parsedData.get("operatorName"));

      return info;
    } catch (Exception e) {
      log.error("Error extracting bus schedule info: {}", e.getMessage(), e);
      return new HashMap<>();
    }
  }

  @Override
  public boolean validateExtractedData(Map<String, String> data) {
    try {
      log.info("Validating extracted data");

      if (data == null || data.isEmpty()) {
        return false;
      }

      // Check for required fields
      return data.containsKey("busNumber") &&
          data.containsKey("origin") &&
          data.containsKey("destination") &&
          data.get("busNumber") != null &&
          data.get("origin") != null &&
          data.get("destination") != null;
    } catch (Exception e) {
      log.error("Error validating extracted data: {}", e.getMessage(), e);
      return false;
    }
  }

  @Override
  public List<String> getSupportedFormats() {
    return Arrays.asList("jpg", "jpeg", "png", "bmp", "tiff", "gif");
  }

  /**
   * Process a single route text and add it to the routes list
   */
  private void processRouteText(String routeText, List<RouteContribution> routes) {
    try {
      Map<String, Object> parsedData = parseScheduleTextToMap(routeText);

      String routeNumber = (String) parsedData.get("routeNumber");
      String fromLocation = (String) parsedData.get("fromLocation");
      String toLocation = (String) parsedData.get("toLocation");

      if (routeNumber != null && fromLocation != null && toLocation != null) {
        RouteContribution route = RouteContribution.builder()
            .id(UUID.randomUUID().toString())
            .busNumber(routeNumber)
            .fromLocationName(fromLocation)
            .toLocationName(toLocation)
            .departureTime((String) parsedData.get("departureTime"))
            .arrivalTime((String) parsedData.get("arrivalTime"))
            .submissionDate(LocalDateTime.now())
            .status("PENDING")
            .build();

        routes.add(route);
        log.debug("Added route: {} from {} to {}", routeNumber, fromLocation, toLocation);
      }
    } catch (Exception e) {
      log.warn("Failed to process route text: {}", e.getMessage());
    }
  }

  /**
   * Helper method to extract text using regex pattern
   */
  private String extractPattern(String text, String pattern, int groupIndex) {
    try {
      Pattern p = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE);
      Matcher m = p.matcher(text);
      if (m.find() && m.groupCount() >= groupIndex) {
        return m.group(groupIndex);
      }
    } catch (Exception e) {
      log.debug("Pattern extraction failed for: {}", pattern);
    }
    return null;
  }

  /**
   * Generate realistic sample bus schedule text for demonstration
   */
  private String generateSampleBusScheduleText() {
    return """
        TAMIL NADU STATE TRANSPORT CORPORATION
        BUS SCHEDULE

        Route Number: TN-47-1234
        Bus Name: Chennai Express
        Operator: TNSTC

        From: Chennai
        To: Coimbatore

        Departure: 08:30 AM
        Arrival: 03:45 PM
        Fare: Rs. 280

        STOPS:
        Stop 1: Kanchipuram    Arr: 09:30 AM    Dep: 09:35 AM
        Stop 2: Vellore        Arr: 11:00 AM    Dep: 11:10 AM
        Stop 3: Salem          Arr: 01:15 PM    Dep: 01:30 PM
        Stop 4: Erode          Arr: 02:45 PM    Dep: 02:50 PM""";
  }
}