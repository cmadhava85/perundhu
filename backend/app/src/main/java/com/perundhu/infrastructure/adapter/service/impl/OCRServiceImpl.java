package com.perundhu.infrastructure.adapter.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.perundhu.domain.model.FileUpload;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.OCREngine;
import com.perundhu.domain.port.OCRService;

/**
 * Implementation of OCR service for extracting text and data from images
 * Uses OCREngine port for actual OCR processing
 */
public class OCRServiceImpl implements OCRService {

  private static final Logger log = LoggerFactory.getLogger(OCRServiceImpl.class);

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
   * Match Tamil text to English city name using pattern matching
   * More robust than exact mapping - handles OCR variations
   */
  private String matchTamilToEnglish(String text) {
    if (text == null || text.isEmpty())
      return null;

    for (Map.Entry<String, String[]> entry : TAMIL_CITY_PATTERNS.entrySet()) {
      for (String pattern : entry.getValue()) {
        if (text.contains(pattern)) {
          log.debug("Matched Tamil pattern '{}' to city '{}'", pattern, entry.getKey());
          return entry.getKey();
        }
      }
    }
    return null;
  }

  /**
   * Normalize English city name to canonical form
   */
  private String normalizeEnglishCity(String text) {
    if (text == null || text.isEmpty())
      return null;
    String upper = text.toUpperCase();

    for (Map.Entry<String, String[]> entry : ENGLISH_CITY_PATTERNS.entrySet()) {
      for (String pattern : entry.getValue()) {
        if (upper.contains(pattern)) {
          return entry.getKey();
        }
      }
    }
    return upper; // Return as-is if no pattern match
  }

  /**
   * Find all city names (Tamil or English) in a text string
   * Returns list of normalized English city names found
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

    return cities;
  }

  private final OCREngine ocrEngine;

  public OCRServiceImpl(OCREngine ocrEngine) {
    this.ocrEngine = ocrEngine;
    if (ocrEngine != null && ocrEngine.isAvailable()) {
      log.info("OCRServiceImpl initialized with OCR engine: {}", ocrEngine.getClass().getSimpleName());
    } else {
      log.warn("OCRServiceImpl initialized WITHOUT OCR engine - will use mock data");
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
          "([A-Z][A-Z]+)\\s+([A-Z][A-Z!:]+?)(?:\\s+[A-Z][A-Z]+)?[\\s:!.]+?(\\d{1,2}:\\d{2}(?:[\\s,]+\\d{1,2}:\\d{2})*)",
          Pattern.CASE_INSENSITIVE);

      Matcher multiRouteMatcher = multiRoutePattern.matcher(extractedText);
      int routeCount = 0;

      while (multiRouteMatcher.find() && routeCount < 20) {
        String loc1 = multiRouteMatcher.group(1).trim().toUpperCase();
        String loc2 = multiRouteMatcher.group(2).trim().toUpperCase();
        String timingsStr = multiRouteMatcher.group(3).trim();

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
          // - loc2 is the VIA (intermediate stop)
          // - boardOrigin is where bus comes FROM (may be null if not detected)
          if (isDestinationFirstFormat) {
            // loc1 = destination, loc2 = via, boardOrigin = from (may be null)
            addRoute(multipleRoutes, boardOrigin, loc1, loc2, routeTimings);
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

      while (headerMatcher.find()) {
        String loc1 = headerMatcher.group(1).trim().toUpperCase();
        String loc2 = headerMatcher.group(2).trim().toUpperCase();
        String loc3 = headerMatcher.group(3) != null ? headerMatcher.group(3).trim().toUpperCase() : null;

        if (!isNonLocationWord(loc1) && !isNonLocationWord(loc2)) {
          // For DESTINATION-VIA-TIME format:
          // - loc1 = destination (toLocation)
          // - loc2 = via
          // - boardOrigin = from (may be null)
          String from = isDestinationFirstFormat ? boardOrigin : loc1;
          String to = isDestinationFirstFormat ? loc1 : loc2;
          String via = isDestinationFirstFormat ? loc2 : loc3;

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

      // APPROACH 4: Also extract Tamil routes (may have Tamil destinations not caught
      // by English patterns)
      log.info("Also checking for Tamil route patterns...");
      extractTamilRoutes(extractedText, multipleRoutes, isDestinationFirstFormat, boardOrigin);

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

      // Update the multipleRoutes in the schedule data
      scheduleData.put("multipleRoutes", multipleRoutes);

      log.info("Successfully parsed schedule data: {} fields extracted", scheduleData.size());
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
   */
  private String detectBoardOrigin(String extractedText) {
    if (extractedText == null)
      return null;

    String[] lines = extractedText.split("\\r?\\n");

    // Find where the route table header starts (ROUTE NO, DESTINATION, VIA, TIME)
    int headerLineIndex = -1;
    for (int i = 0; i < lines.length; i++) {
      String lineUpper = lines[i].toUpperCase();
      if ((lineUpper.contains("ROUTE") && lineUpper.contains("DESTINATION")) ||
          (lineUpper.contains("DESTINATION") && lineUpper.contains("VIA") && lineUpper.contains("TIME"))) {
        headerLineIndex = i;
        log.info("Found route table header at line {}: {}", i, lines[i]);
        break;
      }
    }

    // Only check lines BEFORE the header row (that's where the origin station name
    // is)
    int linesToCheck = headerLineIndex > 0 ? headerLineIndex : Math.min(6, lines.length);

    log.info("Checking first {} lines for board origin (header at line {})...", linesToCheck, headerLineIndex);
    for (int i = 0; i < linesToCheck; i++) {
      log.info("Header line {}: {}", i, lines[i]);
    }

    // First check for Tamil location names using pattern matching
    for (int i = 0; i < linesToCheck; i++) {
      String line = lines[i];

      // Check if this line contains "Bus Stand" pattern - stronger indicator of
      // origin line
      boolean hasBusStandIndicator = false;
      for (String busPattern : BUS_STAND_PATTERNS) {
        if (line.contains(busPattern) || line.toUpperCase().contains(busPattern)) {
          hasBusStandIndicator = true;
          log.info("Found bus stand indicator '{}' in line: {}", busPattern, line);
          break;
        }
      }

      String matched = matchTamilToEnglish(line);
      if (matched != null) {
        log.info("Detected board origin from Tamil pattern: {} (line: {})", matched, line);
        return matched;
      }

      // If bus stand pattern found but no city match, log for debugging
      if (hasBusStandIndicator) {
        log.warn("Bus stand indicator found but no city matched in line: {}", line);
      }
    }

    // Then check for English location names in header area
    String[] knownOrigins = { "RAMESHWARAM", "RAMESWARAM", "CHENNAI", "MADURAI", "COIMBATORE",
        "TRICHY", "SALEM", "TIRUNELVELI", "THANJAVUR", "BENGALURU" };
    for (int i = 0; i < linesToCheck; i++) {
      String line = lines[i].toUpperCase();
      for (String origin : knownOrigins) {
        if (line.contains(origin)) {
          log.info("Detected board origin from English: {}", origin);
          return origin;
        }
      }
    }

    log.warn("Could not detect board origin from header lines. OCR text may be garbled.");
    return null;
  }

  /**
   * Check if a word is a non-location keyword (bus type, class, etc.)
   */
  private boolean isNonLocationWord(String word) {
    if (word == null)
      return true;
    String upper = word.toUpperCase();
    return upper.matches("ORDINARY|SEATER|SUPER|DELUXE|EXPRESS|ROUTE|TIME|VIA|DESTINATION|FAST|SLEEPER|VOLVO|LUXURY");
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
   * Add a route to the list with via information, avoiding duplicates
   */
  private void addRoute(List<Map<String, Object>> routes, String from, String to, String via, List<String> timings) {
    // Check for duplicates - only check toLocation since from might be null
    boolean exists = routes.stream()
        .anyMatch(r -> to != null && to.equals(r.get("toLocation")));

    if (!exists && to != null) {
      Map<String, Object> route = new HashMap<>();
      route.put("fromLocation", from); // May be null - will be set manually later
      route.put("toLocation", to);
      if (via != null && !via.isEmpty() && !via.equals(to)) {
        route.put("via", via);
      }
      route.put("timings", timings);
      routes.add(route);
      log.debug("Added route: {} -> {} via {} with {} timing(s)", from != null ? from : "[ORIGIN REQUIRED]", to, via,
          timings.size());
    }
  }

  /**
   * Add a route to the list, avoiding duplicates
   */
  private void addRoute(List<Map<String, Object>> routes, String from, String to, List<String> timings) {
    // Check for duplicates - only check toLocation since from might be null
    boolean exists = routes.stream()
        .anyMatch(r -> to != null && to.equals(r.get("toLocation")));

    if (!exists && to != null) {
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