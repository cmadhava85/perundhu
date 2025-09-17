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
import org.springframework.stereotype.Service;

import com.perundhu.domain.model.FileUpload;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.OCRService;

/**
 * Implementation of OCR service for extracting text and data from images
 */
@Service
public class OCRServiceImpl implements OCRService {

  private static final Logger log = LoggerFactory.getLogger(OCRServiceImpl.class);

  @Override
  public String extractTextFromImage(FileUpload imageFile) {
    try {
      log.info("Extracting text from image file: {}", imageFile.getOriginalFilename());
      // TODO: Implement actual OCR logic using Tesseract or cloud OCR service
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

      // In a real implementation, this would download the image from URL and process
      // it
      // For demonstration purposes, we'll simulate OCR extraction based on URL

      // Simulate OCR processing delay
      Thread.sleep(500);

      // Return realistic bus schedule text based on URL or generate sample text
      if (imageUrl.contains("error") || imageUrl.contains("fail")) {
        log.warn("Failed to extract text from image URL: {}", imageUrl);
        return "";
      }

      // Generate sample schedule text for demonstration
      return generateSampleBusScheduleText();

    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      log.error("Thread interrupted while extracting text from image URL: {}", e.getMessage());
      return "";
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