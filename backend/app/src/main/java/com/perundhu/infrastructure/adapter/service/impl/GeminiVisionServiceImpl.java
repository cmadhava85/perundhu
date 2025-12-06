package com.perundhu.infrastructure.adapter.service.impl;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.perundhu.domain.port.GeminiVisionService;

/**
 * Implementation of GeminiVisionService using Google's Gemini API.
 * 
 * This service uses Gemini Vision to intelligently extract bus schedule
 * information from images. Unlike traditional OCR which just extracts text,
 * Gemini Vision understands the semantic structure of bus schedule boards.
 * 
 * Features:
 * - Identifies origin/destination stations from board headers
 * - Extracts route numbers, bus types, and intermediate stops
 * - Parses departure times even from complex layouts
 * - Handles Tamil + English mixed text
 * - Returns structured JSON directly
 * 
 * Uses Google AI Studio API (generativelanguage.googleapis.com) which has
 * a free tier of 15 requests/minute and 1500 requests/day.
 */
@Service
public class GeminiVisionServiceImpl implements GeminiVisionService {

  private static final Logger log = LoggerFactory.getLogger(GeminiVisionServiceImpl.class);

  private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

  // The prompt template for extracting bus schedule information
  // Using compact pipe-delimited format to minimize token usage
  private static final String BUS_SCHEDULE_PROMPT = """
      Extract bus schedule from this Tamil Nadu bus timing board image.

      Return ONLY in this compact format (no markdown, no explanation):

      ORIGIN:station_name
      TYPE:departure_board|route_schedule|destination_table
      TIMES:HH:MM,HH:MM,HH:MM,...
      ROUTES:
      bus_num|destination|via1,via2|time1,time2|bus_type
      bus_num|destination|via1,via2|time1,time2|bus_type
      END

      Example for departure times board:
      ORIGIN:SIVAKASI
      TYPE:departure_board
      TIMES:01:10,01:20,02:00,03:30,04:15
      ROUTES:
      END

      Example for route schedule:
      ORIGIN:MADURAI
      TYPE:route_schedule
      TIMES:
      ROUTES:
      166UD|CHENNAI|Dindigul,Trichy|06:00,14:30|EXPRESS
      520UD|BANGALORE|Salem,Krishnagiri|08:00,20:00|DELUXE
      END

      RULES:
      - Use 24-hour HH:MM format
      - Use English names (e.g., Chennai not சென்னை)
      - Leave field empty if not visible (use - as placeholder)
      - List ALL times you can read from the image
      """;

  @Value("${gemini.api.key:}")
  private String apiKey;

  @Value("${gemini.api.model:gemini-1.5-flash}")
  private String modelName;

  @Value("${gemini.api.enabled:false}")
  private boolean enabled;

  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;

  public GeminiVisionServiceImpl() {
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(30))
        .build();
    this.objectMapper = new ObjectMapper();
  }

  @Override
  public boolean isAvailable() {
    if (!enabled) {
      log.debug("Gemini Vision service is disabled");
      return false;
    }
    if (apiKey == null || apiKey.isBlank()) {
      log.warn("Gemini API key is not configured");
      return false;
    }
    return true;
  }

  @Override
  public String getProviderName() {
    return "gemini-" + modelName;
  }

  @Override
  public Map<String, Object> extractBusScheduleFromImage(String imageUrl) {
    if (!isAvailable()) {
      log.warn("Gemini Vision service is not available");
      return createErrorResponse("Gemini Vision service is not available");
    }

    try {
      // Download the image and convert to base64
      String base64Data = downloadImageAsBase64(imageUrl);
      String mimeType = guessMimeType(imageUrl);

      return extractBusScheduleFromBase64(base64Data, mimeType);
    } catch (Exception e) {
      log.error("Error extracting bus schedule from image URL: {}", e.getMessage(), e);
      return createErrorResponse("Failed to process image: " + e.getMessage());
    }
  }

  @Override
  public Map<String, Object> extractBusScheduleFromBase64(String base64ImageData, String mimeType) {
    if (!isAvailable()) {
      log.warn("Gemini Vision service is not available");
      return createErrorResponse("Gemini Vision service is not available");
    }

    try {
      // Build the Gemini API request
      String requestBody = buildGeminiRequest(base64ImageData, mimeType);

      // Call the Gemini API
      String response = callGeminiApi(requestBody);

      // Parse the response
      return parseGeminiResponse(response);
    } catch (Exception e) {
      log.error("Error calling Gemini Vision API: {}", e.getMessage(), e);
      return createErrorResponse("Gemini API error: " + e.getMessage());
    }
  }

  /**
   * Build the JSON request body for Gemini API.
   */
  private String buildGeminiRequest(String base64ImageData, String mimeType) throws JsonProcessingException {
    ObjectNode root = objectMapper.createObjectNode();

    // Create contents array
    ArrayNode contents = objectMapper.createArrayNode();
    ObjectNode content = objectMapper.createObjectNode();

    // Create parts array with text prompt and image
    ArrayNode parts = objectMapper.createArrayNode();

    // Add text prompt
    ObjectNode textPart = objectMapper.createObjectNode();
    textPart.put("text", BUS_SCHEDULE_PROMPT);
    parts.add(textPart);

    // Add image data
    ObjectNode imagePart = objectMapper.createObjectNode();
    ObjectNode inlineData = objectMapper.createObjectNode();
    inlineData.put("mimeType", mimeType);
    inlineData.put("data", base64ImageData);
    imagePart.set("inlineData", inlineData);
    parts.add(imagePart);

    content.set("parts", parts);
    contents.add(content);
    root.set("contents", contents);

    // Add generation config for JSON output
    ObjectNode generationConfig = objectMapper.createObjectNode();
    generationConfig.put("temperature", 0.1); // Low temperature for consistent output
    generationConfig.put("maxOutputTokens", 4096); // Increased for longer bus schedule responses
    root.set("generationConfig", generationConfig);

    return objectMapper.writeValueAsString(root);
  }

  /**
   * Call the Gemini API and return the raw response.
   */
  private String callGeminiApi(String requestBody) throws IOException, InterruptedException {
    String url = String.format(GEMINI_API_URL, modelName) + "?key=" + apiKey;

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("Content-Type", "application/json")
        .timeout(Duration.ofSeconds(60))
        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
        .build();

    log.info("Calling Gemini Vision API with model: {}", modelName);

    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

    if (response.statusCode() != 200) {
      log.error("Gemini API error: {} - {}", response.statusCode(), response.body());
      throw new IOException("Gemini API returned status " + response.statusCode() + ": " + response.body());
    }

    return response.body();
  }

  /**
   * Parse the Gemini API response and extract the structured data.
   * Uses pipe-delimited format for compact responses.
   */
  private Map<String, Object> parseGeminiResponse(String response) {
    try {
      JsonNode root = objectMapper.readTree(response);

      // Navigate to the text content
      JsonNode candidates = root.get("candidates");
      if (candidates == null || !candidates.isArray() || candidates.isEmpty()) {
        log.error("No candidates in Gemini response");
        return createErrorResponse("No response from Gemini");
      }

      JsonNode firstCandidate = candidates.get(0);

      // Check finish reason
      JsonNode finishReasonNode = firstCandidate.get("finishReason");
      String finishReason = finishReasonNode != null ? finishReasonNode.asText() : "UNKNOWN";
      log.info("Gemini finish reason: {}", finishReason);

      JsonNode content = firstCandidate.get("content");
      if (content == null) {
        return createErrorResponse("No content in Gemini response");
      }

      JsonNode parts = content.get("parts");
      if (parts == null || !parts.isArray() || parts.isEmpty()) {
        return createErrorResponse("No parts in Gemini response");
      }

      String textContent = parts.get(0).get("text").asText();
      log.info("Gemini response text length: {} chars", textContent.length());
      log.info("Gemini response text:\n{}", textContent);

      // Parse the pipe-delimited format
      return parsePipeDelimitedResponse(textContent);

    } catch (Exception e) {
      log.error("Error parsing Gemini response: {}", e.getMessage(), e);
      return createErrorResponse("Failed to parse Gemini response: " + e.getMessage());
    }
  }

  /**
   * Parse pipe-delimited response format.
   * Format:
   * ORIGIN:station_name
   * TYPE:departure_board|route_schedule|destination_table
   * TIMES:HH:MM,HH:MM,HH:MM,...
   * ROUTES:
   * bus_num|destination|via1,via2|time1,time2|bus_type
   * END
   */
  private Map<String, Object> parsePipeDelimitedResponse(String text) {
    Map<String, Object> result = new HashMap<>();
    result.put("extractedBy", "gemini-vision");
    result.put("model", modelName);

    // Clean up markdown if present
    text = text.trim();
    if (text.startsWith("```")) {
      int endOfFirstLine = text.indexOf('\n');
      if (endOfFirstLine > 0) {
        text = text.substring(endOfFirstLine + 1);
      }
    }
    if (text.endsWith("```")) {
      text = text.substring(0, text.length() - 3);
    }
    text = text.trim();

    String[] lines = text.split("\n");
    List<Map<String, Object>> routes = new ArrayList<>();
    List<String> allTimes = new ArrayList<>();
    boolean inRoutes = false;

    for (String line : lines) {
      line = line.trim();
      if (line.isEmpty() || line.equals("END")) {
        inRoutes = false;
        continue;
      }

      if (line.startsWith("ORIGIN:")) {
        String origin = line.substring(7).trim();
        if (!origin.equals("-") && !origin.isEmpty()) {
          result.put("origin", normalizeLocationName(origin));
          result.put("fromLocation", normalizeLocationName(origin));
        }
      } else if (line.startsWith("TYPE:")) {
        result.put("boardType", line.substring(5).trim());
      } else if (line.startsWith("TIMES:")) {
        String timesStr = line.substring(6).trim();
        if (!timesStr.isEmpty() && !timesStr.equals("-")) {
          String[] times = timesStr.split(",");
          for (String time : times) {
            time = time.trim();
            if (!time.isEmpty() && time.matches("\\d{1,2}:\\d{2}")) {
              allTimes.add(normalizeTime(time));
            }
          }
        }
      } else if (line.equals("ROUTES:")) {
        inRoutes = true;
      } else if (inRoutes && line.contains("|")) {
        // Parse route: bus_num|destination|via1,via2|time1,time2|bus_type
        String[] parts = line.split("\\|", -1);
        if (parts.length >= 2) {
          Map<String, Object> route = new HashMap<>();

          if (parts.length > 0 && !parts[0].trim().equals("-")) {
            route.put("routeNumber", parts[0].trim());
          }
          if (parts.length > 1 && !parts[1].trim().equals("-")) {
            route.put("destination", normalizeLocationName(parts[1].trim()));
            route.put("toLocation", normalizeLocationName(parts[1].trim()));
          }
          if (parts.length > 2 && !parts[2].trim().equals("-") && !parts[2].trim().isEmpty()) {
            List<String> via = new ArrayList<>();
            for (String v : parts[2].split(",")) {
              v = v.trim();
              if (!v.isEmpty())
                via.add(normalizeLocationName(v));
            }
            if (!via.isEmpty())
              route.put("via", via);
          }

          // Parse times from field 3 (expected position)
          List<String> times = new ArrayList<>();
          if (parts.length > 3 && !parts[3].trim().equals("-") && !parts[3].trim().isEmpty()) {
            for (String t : parts[3].split(",")) {
              t = t.trim();
              if (t.matches("\\d{1,2}:\\d{2}")) {
                times.add(normalizeTime(t));
              }
            }
          }

          // If no times found in field 3, check field 4 (sometimes Gemini puts times
          // here)
          if (times.isEmpty() && parts.length > 4 && !parts[4].trim().equals("-") && !parts[4].trim().isEmpty()) {
            String field4 = parts[4].trim();
            // Check if field4 looks like comma-separated times (e.g., "18:15,20:15")
            if (field4.matches(".*\\d{1,2}:\\d{2}.*")) {
              for (String t : field4.split(",")) {
                t = t.trim();
                if (t.matches("\\d{1,2}:\\d{2}")) {
                  times.add(normalizeTime(t));
                }
              }
              // If we extracted times from field 4, don't set busType from field 4
              if (!times.isEmpty()) {
                log.debug("Extracted {} times from field 4 (busType position) for route to {}",
                    times.size(), parts[1].trim());
              }
            }
          }

          if (!times.isEmpty()) {
            route.put("departureTimes", times);
            route.put("timings", times);
            route.put("departureTime", times.get(0));
          }

          // Only set busType if field 4 is NOT a time list
          if (parts.length > 4 && !parts[4].trim().equals("-") && !parts[4].trim().isEmpty()) {
            String field4 = parts[4].trim();
            // Only use as busType if it doesn't look like times
            if (!field4.matches(".*\\d{1,2}:\\d{2}.*")) {
              route.put("busType", field4.toUpperCase());
            }
          }

          // Set from location from origin
          if (result.containsKey("fromLocation")) {
            route.put("fromLocation", result.get("fromLocation"));
          }

          routes.add(route);
        }
      }
    }

    if (!allTimes.isEmpty()) {
      result.put("allDepartureTimes", allTimes);
      result.put("timing", allTimes);
      if (!result.containsKey("departureTime")) {
        result.put("departureTime", allTimes.get(0));
      }
    }

    if (!routes.isEmpty()) {
      result.put("routes", routes);
    }

    log.info("Parsed {} times and {} routes from Gemini response", allTimes.size(), routes.size());
    return result;
  }

  /**
   * Normalize time to HH:MM format.
   */
  private String normalizeTime(String time) {
    if (time == null)
      return null;
    time = time.trim();
    if (time.matches("\\d:\\d{2}")) {
      return "0" + time;
    }
    return time;
  }

  /**
   * Normalize the extracted data to match our standard format.
   */
  @SuppressWarnings("unchecked")
  private void normalizeExtractedData(Map<String, Object> data) {
    // Set origin/fromLocation
    String origin = (String) data.get("origin");
    String boardLocation = (String) data.get("boardLocation");

    if (origin != null && !origin.isEmpty()) {
      data.put("fromLocation", normalizeLocationName(origin));
      data.put("detectedOrigin", normalizeLocationName(origin));
    } else if (boardLocation != null && !boardLocation.isEmpty()) {
      // Extract city name from board location (e.g., "Sivakasi N.R.K.Rajarathinam
      // Busstand" -> "SIVAKASI")
      String extractedCity = extractCityFromBoardLocation(boardLocation);
      if (extractedCity != null) {
        data.put("fromLocation", extractedCity);
        data.put("detectedOrigin", extractedCity);
        data.put("origin", extractedCity);
      }
    }

    // Process routes
    List<Map<String, Object>> routes = (List<Map<String, Object>>) data.get("routes");
    if (routes != null && !routes.isEmpty()) {
      List<Map<String, Object>> multipleRoutes = new ArrayList<>();
      List<Map<String, Object>> groupedRoutes = new ArrayList<>();

      for (Map<String, Object> route : routes) {
        Map<String, Object> normalizedRoute = new HashMap<>();

        // Set from location
        String from = (String) data.get("fromLocation");
        normalizedRoute.put("fromLocation", from);

        // Set destination
        String destination = (String) route.get("destination");
        if (destination != null) {
          normalizedRoute.put("toLocation", normalizeLocationName(destination));
        }

        // Set route number
        String routeNumber = (String) route.get("routeNumber");
        if (routeNumber != null) {
          normalizedRoute.put("routeNumber", routeNumber);
        }

        // Set via stops
        List<String> via = (List<String>) route.get("via");
        if (via != null && !via.isEmpty()) {
          List<Map<String, Object>> stops = new ArrayList<>();
          int stopOrder = 1;
          for (String stopName : via) {
            Map<String, Object> stop = new HashMap<>();
            stop.put("name", normalizeLocationName(stopName));
            stop.put("stopOrder", stopOrder++);
            stops.add(stop);
          }
          normalizedRoute.put("stops", stops);
          normalizedRoute.put("via", String.join(", ", via.stream()
              .map(this::normalizeLocationName)
              .toList()));
        }

        // Set timings
        List<String> departureTimes = (List<String>) route.get("departureTimes");
        if (departureTimes != null && !departureTimes.isEmpty()) {
          normalizedRoute.put("timings", departureTimes);
          normalizedRoute.put("departureTime", departureTimes.get(0));

          // Expand into individual schedules
          int totalSchedules = departureTimes.size();
          for (int i = 0; i < departureTimes.size(); i++) {
            Map<String, Object> expanded = new HashMap<>(normalizedRoute);
            expanded.put("departureTime", departureTimes.get(i));
            expanded.put("timings", List.of(departureTimes.get(i)));
            expanded.put("scheduleIndex", i + 1);
            expanded.put("totalSchedules", totalSchedules);
            multipleRoutes.add(expanded);
          }
        } else {
          normalizedRoute.put("timings", new ArrayList<>());
          multipleRoutes.add(normalizedRoute);
        }

        groupedRoutes.add(normalizedRoute);
      }

      data.put("multipleRoutes", multipleRoutes);
      data.put("groupedRoutes", groupedRoutes);

      // Set first route as primary
      if (!groupedRoutes.isEmpty()) {
        Map<String, Object> firstRoute = groupedRoutes.get(0);
        data.put("toLocation", firstRoute.get("toLocation"));
        data.put("destination", firstRoute.get("toLocation"));
      }
    }

    // Handle departure times board format
    List<String> allDepartureTimes = (List<String>) data.get("allDepartureTimes");
    if (allDepartureTimes != null && !allDepartureTimes.isEmpty()) {
      data.put("timing", allDepartureTimes);
      data.put("boardFormat", "DEPARTURE_TIMES_ONLY");
      data.put("destinationRequired", true);
      if (!allDepartureTimes.isEmpty()) {
        data.put("departureTime", allDepartureTimes.get(0));
      }
    }
  }

  /**
   * Extract city name from board location string.
   * E.g., "Sivakasi N.R.K.Rajarathinam Busstand" -> "SIVAKASI"
   */
  private String extractCityFromBoardLocation(String boardLocation) {
    if (boardLocation == null || boardLocation.isEmpty()) {
      return null;
    }

    // Common city names in Tamil Nadu
    String[] knownCities = {
        "SIVAKASI", "CHENNAI", "MADURAI", "COIMBATORE", "TRICHY", "SALEM",
        "TIRUNELVELI", "RAMESHWARAM", "KANYAKUMARI", "THANJAVUR", "ERODE",
        "TIRUPPUR", "KARUR", "VELLORE", "DINDIGUL", "THENI", "HOSUR",
        "BENGALURU", "ARUPPUKKOTTAI", "VIRUDHUNAGAR", "THOOTHUKUDI"
    };

    String upper = boardLocation.toUpperCase();
    for (String city : knownCities) {
      if (upper.contains(city)) {
        return city;
      }
    }

    // Try to extract first word as potential city name
    String[] words = boardLocation.split("\\s+");
    if (words.length > 0) {
      String firstWord = words[0].replaceAll("[^A-Za-z]", "").toUpperCase();
      if (firstWord.length() >= 4) {
        return firstWord;
      }
    }

    return null;
  }

  /**
   * Normalize location name to standard format.
   */
  private String normalizeLocationName(String name) {
    if (name == null || name.isEmpty()) {
      return name;
    }

    // Map of common variations to standard names
    Map<String, String> nameMap = Map.ofEntries(
        Map.entry("BANGALORE", "BENGALURU"),
        Map.entry("MADRAS", "CHENNAI"),
        Map.entry("TIRUCHIRAPPALLI", "TRICHY"),
        Map.entry("TIRUCHIRAPALLI", "TRICHY"),
        Map.entry("TUTICORIN", "THOOTHUKUDI"),
        Map.entry("TANJORE", "THANJAVUR"),
        Map.entry("NELLAI", "TIRUNELVELI"));

    String upper = name.toUpperCase().trim();
    return nameMap.getOrDefault(upper, upper);
  }

  /**
   * Download an image from URL and return as base64.
   */
  private String downloadImageAsBase64(String imageUrl) throws IOException, InterruptedException {
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(imageUrl))
        .timeout(Duration.ofSeconds(30))
        .GET()
        .build();

    HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

    if (response.statusCode() != 200) {
      throw new IOException("Failed to download image: HTTP " + response.statusCode());
    }

    byte[] imageBytes = response.body().readAllBytes();
    return Base64.getEncoder().encodeToString(imageBytes);
  }

  /**
   * Guess the MIME type from the image URL.
   */
  private String guessMimeType(String imageUrl) {
    String lower = imageUrl.toLowerCase();
    if (lower.endsWith(".png")) {
      return "image/png";
    } else if (lower.endsWith(".gif")) {
      return "image/gif";
    } else if (lower.endsWith(".webp")) {
      return "image/webp";
    }
    // Default to JPEG
    return "image/jpeg";
  }

  /**
   * Create an error response map.
   */
  private Map<String, Object> createErrorResponse(String message) {
    Map<String, Object> error = new HashMap<>();
    error.put("error", true);
    error.put("message", message);
    error.put("extractedBy", "gemini-vision-error");
    return error;
  }
}
