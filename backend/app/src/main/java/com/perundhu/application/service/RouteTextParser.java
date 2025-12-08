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
    // Patterns: 27D, 570, MTC-123, Bus 27D, Route 570, பஸ் 27D
    Pattern busPattern = Pattern.compile(
        "(?i)(?:bus|route|பஸ்|வண்டி)\\s*[:#-]?\\s*([A-Z0-9-]+)|" +
            "\\b([A-Z]?\\d{1,4}[A-Z]?)\\b");

    Matcher matcher = busPattern.matcher(text);
    if (matcher.find()) {
      String busNumber = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
      if (busNumber != null && !busNumber.isEmpty()) {
        // Validate bus number format (1-4 digits optionally with letters)
        if (busNumber.matches("[A-Z]?\\d{1,4}[A-Z]?")) {
          data.setBusNumber(busNumber.toUpperCase());
        }
      }
    }
  }

  /**
   * Extract from and to locations
   */
  private void extractLocations(String text, RouteData data) {
    // English patterns: "from X to Y", "X to Y"
    Pattern englishPattern = Pattern.compile(
        "(?i)(?:from\\s+)?([a-zA-Z\\s]{3,30})\\s+(?:to|→|-)\\s+([a-zA-Z\\s]{3,30})");

    // Tamil patterns: "புறப்பாடு X வரவு Y"
    Pattern tamilPattern = Pattern.compile(
        "(?:புறப்பாடு|இருந்து)\\s*[:-]?\\s*([\\u0B80-\\u0BFFa-zA-Z\\s]{3,30})" +
            "\\s+(?:வரவு|வரை)\\s*[:-]?\\s*([\\u0B80-\\u0BFFa-zA-Z\\s]{3,30})");

    Matcher englishMatcher = englishPattern.matcher(text);
    if (englishMatcher.find()) {
      data.setFromLocation(cleanLocationName(englishMatcher.group(1)));
      data.setToLocation(cleanLocationName(englishMatcher.group(2)));
      return;
    }

    Matcher tamilMatcher = tamilPattern.matcher(text);
    if (tamilMatcher.find()) {
      data.setFromLocation(cleanLocationName(tamilMatcher.group(1)));
      data.setToLocation(cleanLocationName(tamilMatcher.group(2)));
    }
  }

  /**
   * Extract timing information
   */
  private List<String> extractTimings(String text) {
    List<String> timings = new ArrayList<>();

    // English time patterns: 6:00 AM, 6 AM, 18:00
    Pattern timePattern = Pattern.compile(
        "\\b(\\d{1,2})(?::(\\d{2}))?\\s*(AM|PM|am|pm)?\\b");

    // Tamil time patterns: காலை 6 மணி, மாலை 5 மணி
    Pattern tamilTimePattern = Pattern.compile(
        "(காலை|மாலை|இரவு|நண்பகல்)\\s*(\\d{1,2})\\s*மணி");

    // Extract English times
    Matcher matcher = timePattern.matcher(text);
    while (matcher.find()) {
      String time = normalizeTime(matcher.group(0));
      if (time != null && !timings.contains(time)) {
        timings.add(time);
      }
    }

    // Extract Tamil times
    Matcher tamilMatcher = tamilTimePattern.matcher(text);
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

    // Pattern: "stops:", "வழி:", followed by list
    Pattern stopsPattern = Pattern.compile(
        "(?i)(?:stops?|via|வழி|நிலையங்கள்)\\s*[:-]?\\s*([^\n.!?]+)",
        Pattern.CASE_INSENSITIVE);

    Matcher matcher = stopsPattern.matcher(text);
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
   * Clean location name
   */
  private String cleanLocationName(String location) {
    if (location == null)
      return "";

    return location.trim()
        .replaceAll("\\s+", " ")
        .replaceAll("^(from|to|புறப்பாடு|வரவு)\\s+", "")
        .trim();
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
    if (time.matches("\\d{1,2}:\\d{2}\\s*[AP]M")) {
      return time;
    }

    // Add minutes if missing
    if (time.matches("\\d{1,2}\\s*[AP]M")) {
      return time.replaceAll("(\\d{1,2})\\s*([AP]M)", "$1:00 $2");
    }

    // Convert 24-hour to 12-hour
    if (time.matches("\\d{1,2}:\\d{2}") && !time.contains("AM") && !time.contains("PM")) {
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
