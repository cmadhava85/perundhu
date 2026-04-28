package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service for parsing route information from natural language text.
 * Supports Tamil and English mixed text.
 */
@Service
@Slf4j
public class RouteTextParser {

  // --- Static compiled patterns (compile once, reuse on every call) ---

  // Bus number patterns
  private static final Pattern BUS_EXPLICIT = Pattern.compile(
      "(?i)(?:bus|route|service|no\\.?|number|பஸ்|வண்டி|எண்)\\s*[:#.-]?\\s*([A-Z0-9]{1,4}[A-Z]?|[A-Z]{1,3}[0-9]{1,4}[A-Z]?)",
      Pattern.CASE_INSENSITIVE);
  private static final Pattern BUS_PREFIX = Pattern.compile(
      "(?i)(TNSTC|MTC|SETC|KSRTC|TSRTC|APSRTC|BMTC)\\s*[-:]?\\s*([A-Z0-9]{1,5})");
  private static final Pattern BUS_START = Pattern.compile(
      "^\\s*([A-Z]?\\d{1,4}[A-Z]?)\\b");
  private static final Pattern BUS_STANDALONE = Pattern.compile(
      "\\b([A-Z]{0,2}\\d{1,4}[A-Z]?)\\b");
  private static final Pattern VALID_BUS_FORMAT1 = Pattern.compile("[A-Z]{0,3}[-]?\\d{1,4}[A-Z]?");
  private static final Pattern VALID_BUS_FORMAT2 = Pattern.compile("[A-Z]\\d{1,4}");
  private static final Pattern NOT_BUS_YEAR = Pattern.compile("20[2-3]\\d");
  private static final Pattern NOT_BUS_THREE_DIGIT = Pattern.compile("\\d{3}");
  private static final Pattern NOT_BUS_VALID_THREE = Pattern.compile("[1-9]\\d{2}");
  private static final Pattern NOT_BUS_LEADING_ZERO = Pattern.compile("0\\d{3}");

  // Location patterns
  private static final Pattern LOC_ARROW = Pattern.compile(
      "([a-zA-Z][a-zA-Z\\s]{2,35})\\s*(?:→|->|➡️|➡|→|–|—|=>|>)\\s*([a-zA-Z][a-zA-Z\\s]{2,35})",
      Pattern.CASE_INSENSITIVE);
  private static final Pattern LOC_DASH = Pattern.compile(
      "([A-Z][a-zA-Z]{2,20})\\s+-\\s+([A-Z][a-zA-Z]{2,20})");
  private static final Pattern LOC_ENGLISH = Pattern.compile(
      "(?i)(?:from\\s+)?([a-zA-Z][a-zA-Z\\s]{2,35})\\s+(?:to|towards|via)\\s+([a-zA-Z][a-zA-Z\\s]{2,35})");
  private static final Pattern LOC_DEPART_ARRIVE = Pattern.compile(
      "(?i)(?:departure|depart|start|origin)\\s*[:-]?\\s*([a-zA-Z][a-zA-Z\\s]{2,30})" +
          ".*?(?:arrival|arrive|end|destination)\\s*[:-]?\\s*([a-zA-Z][a-zA-Z\\s]{2,30})",
      Pattern.DOTALL);
  private static final Pattern LOC_ROUTE_HEADER = Pattern.compile(
      "([A-Z][a-zA-Z]{2,20})\\s*[-–]?\\s*([A-Z][a-zA-Z]{2,20})\\s*(?:Route|Express|Bus|Service)",
      Pattern.CASE_INSENSITIVE);
  private static final Pattern LOC_TAMIL = Pattern.compile(
      "(?:புறப்பாடு|இருந்து)\\s*[:-]?\\s*([\\u0B80-\\u0BFFa-zA-Z\\s]{3,30})" +
          "\\s+(?:வரவு|வரை)\\s*[:-]?\\s*([\\u0B80-\\u0BFFa-zA-Z\\s]{3,30})");
  private static final Pattern LOC_TAMIL_SUFFIX = Pattern.compile(
      "([\\u0B80-\\u0BFFa-zA-Z\\s]{3,30})\\s*லிருந்து\\s*([\\u0B80-\\u0BFFa-zA-Z\\s]{3,30})\\s*க்கு");
  private static final Pattern LOC_COLON = Pattern.compile(
      "(?i)from\\s*[:-]\\s*([a-zA-Z][a-zA-Z\\s]{2,30}).*?to\\s*[:-]\\s*([a-zA-Z][a-zA-Z\\s]{2,30})",
      Pattern.DOTALL);

  // Timing patterns
  private static final Pattern TIME_ENGLISH = Pattern.compile(
      "\\b(\\d{1,2})(?::(\\d{2}))?\\s*(AM|PM|am|pm)?\\b");
  private static final Pattern TIME_TAMIL = Pattern.compile(
      "(காலை|மாலை|இரவு|நண்பகல்)\\s*(\\d{1,2})\\s*மணி");
  private static final Pattern TIME_FULL_FORMAT = Pattern.compile("\\d{1,2}:\\d{2}\\s*[AP]M");
  private static final Pattern TIME_SHORT_FORMAT = Pattern.compile("\\d{1,2}\\s*[AP]M");
  private static final Pattern TIME_24H_FORMAT = Pattern.compile("\\d{1,2}:\\d{2}");

  // Stop patterns
  private static final Pattern STOPS_LIST = Pattern.compile(
      "(?i)(?:stops?|via|வழி|நிலையங்கள்)\\s*[:-]?\\s*([^\n.!?]+)");

  /**
   * Extract route information from transcribed text
   * 
   * @param text Transcribed text from voice or paste
   * @return RouteData containing extracted information
   */
  public RouteData extractRouteFromText(String text) {
    log.info("Extracting route data from text: {}", text);

    RouteData data = new RouteData();

    if (text == null || text.trim().isEmpty()) {
      data.setConfidence(0.0);
      return data;
    }

    // Extract bus number
    extractBusNumber(text, data);

    // Extract locations (from/to pattern)
    extractLocations(text, data);

    // Extract timings
    data.setTimings(extractTimings(text));

    // Extract stops
    data.setStops(extractStops(text));

    // Calculate confidence score
    data.setConfidence(calculateConfidence(data));

    log.info("Extracted route data - Bus: {}, From: {}, To: {}, Confidence: {}",
        data.getBusNumber(), data.getFromLocation(), data.getToLocation(), data.getConfidence());

    return data;
  }

  /**
   * Extract bus number from text
   */
  private void extractBusNumber(String text, RouteData data) {
    // Priority 1: Explicit "Bus/Route X" format
    Matcher explicitMatcher = BUS_EXPLICIT.matcher(text);
    if (explicitMatcher.find()) {
      String busNumber = explicitMatcher.group(1).toUpperCase();
      if (isValidBusNumber(busNumber)) {
        data.setBusNumber(busNumber);
        log.debug("Matched explicit bus pattern: {}", busNumber);
        return;
      }
    }

    // Priority 2: TNSTC/MTC format: TNSTC-123, MTC 45G, etc.
    Matcher prefixMatcher = BUS_PREFIX.matcher(text);
    if (prefixMatcher.find()) {
      String prefix = prefixMatcher.group(1).toUpperCase();
      String number = prefixMatcher.group(2).toUpperCase();
      String busNumber = prefix + "-" + number;
      data.setBusNumber(busNumber);
      log.debug("Matched prefix bus pattern: {}", busNumber);
      return;
    }

    // Priority 3: Alphanumeric at start of text: "27D Chennai to Madurai"
    Matcher startMatcher = BUS_START.matcher(text);
    if (startMatcher.find()) {
      String busNumber = startMatcher.group(1).toUpperCase();
      if (isValidBusNumber(busNumber)) {
        data.setBusNumber(busNumber);
        log.debug("Matched start bus pattern: {}", busNumber);
        return;
      }
    }

    // Priority 4: Standalone bus numbers: 27D, 570, 123A
    Matcher standaloneMatcher = BUS_STANDALONE.matcher(text);
    while (standaloneMatcher.find()) {
      String busNumber = standaloneMatcher.group(1).toUpperCase();
      if (isValidBusNumber(busNumber) && !isLikelyNotBusNumber(busNumber)) {
        data.setBusNumber(busNumber);
        log.debug("Matched standalone bus pattern: {}", busNumber);
        return;
      }
    }
  }

  /**
   * Validate bus number format
   */
  private boolean isValidBusNumber(String busNumber) {
    if (busNumber == null || busNumber.isEmpty())
      return false;
    return VALID_BUS_FORMAT1.matcher(busNumber).matches() ||
        VALID_BUS_FORMAT2.matcher(busNumber).matches();
  }

  /**
   * Check if number is likely not a bus number (years, times, etc.)
   */
  private boolean isLikelyNotBusNumber(String number) {
    if (number == null)
      return true;
    if (NOT_BUS_YEAR.matcher(number).matches())
      return true;
    if (NOT_BUS_THREE_DIGIT.matcher(number).matches() && !NOT_BUS_VALID_THREE.matcher(number).matches())
      return true;
    return NOT_BUS_LEADING_ZERO.matcher(number).matches();
  }

  /**
   * Extract from and to locations
   */
  private void extractLocations(String text, RouteData data) {
    // Pattern 1: Arrow format — most common in pastes
    Matcher arrowMatcher = LOC_ARROW.matcher(text);
    if (arrowMatcher.find()) {
      data.setFromLocation(cleanLocationName(arrowMatcher.group(1)));
      data.setToLocation(cleanLocationName(arrowMatcher.group(2)));
      log.debug("Matched arrow pattern: {} -> {}", data.getFromLocation(), data.getToLocation());
      return;
    }

    // Pattern 2: Dash/hyphen format with space
    Matcher dashMatcher = LOC_DASH.matcher(text);
    if (dashMatcher.find()) {
      data.setFromLocation(cleanLocationName(dashMatcher.group(1)));
      data.setToLocation(cleanLocationName(dashMatcher.group(2)));
      log.debug("Matched dash pattern: {} -> {}", data.getFromLocation(), data.getToLocation());
      return;
    }

    // Pattern 3: Departure/Arrival keyword pattern
    Matcher departMatcher = LOC_DEPART_ARRIVE.matcher(text);
    if (departMatcher.find()) {
      data.setFromLocation(cleanLocationName(departMatcher.group(1)));
      data.setToLocation(cleanLocationName(departMatcher.group(2)));
      log.debug("Matched depart/arrive pattern: {} -> {}", data.getFromLocation(), data.getToLocation());
      return;
    }

    // Pattern 4: Colon-separated: "From: Chennai To: Madurai"
    Matcher colonMatcher = LOC_COLON.matcher(text);
    if (colonMatcher.find()) {
      data.setFromLocation(cleanLocationName(colonMatcher.group(1)));
      data.setToLocation(cleanLocationName(colonMatcher.group(2)));
      log.debug("Matched colon pattern: {} -> {}", data.getFromLocation(), data.getToLocation());
      return;
    }

    // Pattern 5: Route header format: "Chennai Madurai Route"
    Matcher routeHeaderMatcher = LOC_ROUTE_HEADER.matcher(text);
    if (routeHeaderMatcher.find()) {
      data.setFromLocation(cleanLocationName(routeHeaderMatcher.group(1)));
      data.setToLocation(cleanLocationName(routeHeaderMatcher.group(2)));
      log.debug("Matched route header pattern: {} -> {}", data.getFromLocation(), data.getToLocation());
      return;
    }

    // Pattern 6: English "from X to Y"
    Matcher englishMatcher = LOC_ENGLISH.matcher(text);
    if (englishMatcher.find()) {
      data.setFromLocation(cleanLocationName(englishMatcher.group(1)));
      data.setToLocation(cleanLocationName(englishMatcher.group(2)));
      log.debug("Matched English pattern: {} -> {}", data.getFromLocation(), data.getToLocation());
      return;
    }

    // Pattern 7: Tamil keywords
    Matcher tamilMatcher = LOC_TAMIL.matcher(text);
    if (tamilMatcher.find()) {
      data.setFromLocation(cleanLocationName(tamilMatcher.group(1)));
      data.setToLocation(cleanLocationName(tamilMatcher.group(2)));
      log.debug("Matched Tamil pattern: {} -> {}", data.getFromLocation(), data.getToLocation());
      return;
    }

    // Pattern 8: Tamil suffix "X லிருந்து Y க்கு"
    Matcher tamilSuffixMatcher = LOC_TAMIL_SUFFIX.matcher(text);
    if (tamilSuffixMatcher.find()) {
      data.setFromLocation(cleanLocationName(tamilSuffixMatcher.group(1)));
      data.setToLocation(cleanLocationName(tamilSuffixMatcher.group(2)));
      log.debug("Matched Tamil suffix pattern: {} -> {}", data.getFromLocation(), data.getToLocation());
    }
  }

  /**
   * Extract timing information
   */
  private List<String> extractTimings(String text) {
    List<String> timings = new ArrayList<>();

    // Extract English times
    Matcher matcher = TIME_ENGLISH.matcher(text);
    while (matcher.find()) {
      String time = normalizeTime(matcher.group(0));
      if (time != null && !timings.contains(time)) {
        timings.add(time);
      }
    }

    // Extract Tamil times: காலை 6 மணி, மாலை 5 மணி
    Matcher tamilMatcher = TIME_TAMIL.matcher(text);
    while (tamilMatcher.find()) {
      String time = normalizeTamilTime(tamilMatcher.group(1), tamilMatcher.group(2));
      if (time != null && !timings.contains(time)) {
        timings.add(time);
      }
    }

    return timings;
  }

  /**
   * Extract stop information
   */
  private List<String> extractStops(String text) {
    List<String> stops = new ArrayList<>();

    Matcher matcher = STOPS_LIST.matcher(text);
    if (matcher.find()) {
      String stopsText = matcher.group(1);
      // Split by comma, semicolon, "and", "மற்றும்"
      String[] stopArray = stopsText.split("[,;]|\\s+(?:and|மற்றும்)\\s+");

      for (String stop : stopArray) {
        String cleaned = cleanStopName(stop);
        if (!cleaned.isEmpty() && cleaned.length() >= 3) {
          stops.add(cleaned);
        }
      }
    }

    return stops;
  }

  /**
   * Clean location name - removes common prefixes/suffixes and normalizes spacing
   */
  private String cleanLocationName(String location) {
    if (location == null)
      return "";

    String cleaned = location.trim()
        .replaceAll("\\s+", " ")
        // CRITICAL: Remove bus number patterns first (before other cleaning)
        // Patterns: "27D from", "123A ", "42 ", "5A " - remove leading bus numbers
        .replaceAll("^[A-Z]?\\d{1,4}[A-Z]?\\s+", "") // Remove bus number at start: "27D Chennai" -> "Chennai"
        .replaceAll("\\b[A-Z]?\\d{1,4}[A-Z]?\\s+(?=[A-Z])", "") // Remove bus number before capitalized word
        // Remove common prefixes
        .replaceAll("(?i)^(from|to|at|in|near|புறப்பாடு|வரவு|via)\\s+", "")
        // Remove common suffixes
        .replaceAll("(?i)\\s+(route|express|bus|service|station|junction|jn|stand|terminal)$", "")
        // Remove time-related keywords
        .replaceAll("(?i)\\s*(departure|arrival|morning|evening|afternoon|night|daily|am|pm)$", "")
        // Remove any trailing punctuation
        .replaceAll("[.,;:!?]+$", "")
        // Remove any leading punctuation
        .replaceAll("^[.,;:!?-]+", "")
        .trim();

    // Capitalize first letter of each word for consistency
    if (!cleaned.isEmpty() && Character.isLowerCase(cleaned.charAt(0))) {
      cleaned = Character.toUpperCase(cleaned.charAt(0)) + cleaned.substring(1);
    }

    return cleaned;
  }

  /**
   * Clean stop name
   */
  private String cleanStopName(String stop) {
    if (stop == null)
      return "";

    return stop.trim()
        .replaceAll("^\\d+\\.?\\s*", "") // Remove numbering
        .replaceAll("^[-•*]\\s*", "") // Remove bullets
        .replaceAll("\\s+", " ")
        .trim();
  }

  /**
   * Normalize English time to 12-hour format
   */
  private String normalizeTime(String time) {
    if (time == null || time.trim().isEmpty())
      return null;

    time = time.trim().toUpperCase();

    // Already in good format
    if (TIME_FULL_FORMAT.matcher(time).matches()) {
      return time;
    }

    // Add minutes if missing
    if (TIME_SHORT_FORMAT.matcher(time).matches()) {
      return time.replaceAll("(\\d{1,2})\\s*([AP]M)", "$1:00 $2");
    }

    // Convert 24-hour to 12-hour
    if (TIME_24H_FORMAT.matcher(time).matches() && !time.contains("AM") && !time.contains("PM")) {
      String[] parts = time.split(":");
      int hour = Integer.parseInt(parts[0]);
      String minutes = parts[1];

      if (hour >= 0 && hour < 12) {
        return String.format("%d:%s AM", hour == 0 ? 12 : hour, minutes);
      } else if (hour >= 12 && hour < 24) {
        return String.format("%d:%s PM", hour == 12 ? 12 : hour - 12, minutes);
      }
    }

    return time;
  }

  /**
   * Normalize Tamil time to 12-hour format
   */
  private String normalizeTamilTime(String period, String hour) {
    int hourInt = Integer.parseInt(hour);

    // Convert Tamil time period to AM/PM using Java 17 switch expression
    return switch (period) {
      case "காலை" -> // Morning
        (hourInt >= 1 && hourInt <= 11) ? String.format("%d:00 AM", hourInt) : null;
      case "மாலை" -> // Evening
        (hourInt >= 1 && hourInt <= 11) ? String.format("%d:00 PM", hourInt) : null;
      case "இரவு" -> { // Night
        if (hourInt >= 6 && hourInt <= 11) {
          yield String.format("%d:00 PM", hourInt);
        } else if (hourInt >= 1 && hourInt <= 5) {
          yield String.format("%d:00 AM", hourInt);
        }
        yield null;
      }
      case "நண்பகல்" -> "12:00 PM"; // Noon
      default -> null;
    };
  }

  /**
   * Calculate confidence score based on extracted data
   */
  private double calculateConfidence(RouteData data) {
    double confidence = 0.0;

    // Bus number: 20% (optional but helpful)
    if (data.getBusNumber() != null && !data.getBusNumber().isEmpty()) {
      confidence += 0.20;
    }

    // From location: 30% (required)
    if (data.getFromLocation() != null && !data.getFromLocation().isEmpty()) {
      confidence += 0.30;
    }

    // To location: 30% (required)
    if (data.getToLocation() != null && !data.getToLocation().isEmpty()) {
      confidence += 0.30;
    }

    // At least one timing: 10%
    if (data.getTimings() != null && !data.getTimings().isEmpty()) {
      confidence += 0.10;
    }

    // Stops information: 10%
    if (data.getStops() != null && !data.getStops().isEmpty()) {
      confidence += 0.10;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Data class for parsed route information
   */
  public static class RouteData {
    private String busNumber;
    private String fromLocation;
    private String toLocation;
    private List<String> timings;
    private List<String> stops;
    private double confidence;

    public RouteData() {
      this.timings = new ArrayList<>();
      this.stops = new ArrayList<>();
      this.confidence = 0.0;
    }

    // Getters and setters
    public String getBusNumber() {
      return busNumber;
    }

    public void setBusNumber(String busNumber) {
      this.busNumber = busNumber;
    }

    public String getFromLocation() {
      return fromLocation;
    }

    public void setFromLocation(String fromLocation) {
      this.fromLocation = fromLocation;
    }

    public String getToLocation() {
      return toLocation;
    }

    public void setToLocation(String toLocation) {
      this.toLocation = toLocation;
    }

    public List<String> getTimings() {
      return timings;
    }

    public void setTimings(List<String> timings) {
      this.timings = timings;
    }

    public List<String> getStops() {
      return stops;
    }

    public void setStops(List<String> stops) {
      this.stops = stops;
    }

    public double getConfidence() {
      return confidence;
    }

    public void setConfidence(double confidence) {
      this.confidence = confidence;
    }

    public boolean isValid() {
      // Bus number is optional - user might not have noticed it
      // Only require from/to locations as minimum valid data
      return fromLocation != null && !fromLocation.isEmpty() &&
          toLocation != null && !toLocation.isEmpty();
    }
  }
}
