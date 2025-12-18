package com.perundhu.infrastructure.adapter.service.impl;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.retry.annotation.Retry;

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
      You are an expert OCR system specialized in extracting bus schedule information from Tamil Nadu bus timing boards.

      TASK: Extract ALL bus routes and schedules from this image with maximum accuracy.

      IMAGE ANALYSIS TIPS:
      - Look carefully at ALL rows/columns in the image
      - Bus boards often have faded or low-contrast text - extract everything visible
      - Times may be displayed in various formats (digital, handwritten, printed)
      - Route numbers often include suffixes like UD, D, E, A, B, C (e.g., 166UD, 42A)
      - Board headers usually show the station name (origin)

      LANGUAGE HANDLING:
      The text may be in Tamil (தமிழ்), English, or mixed. Always output in English.

      Tamil City Name Translations (use these exact spellings):
      | Tamil | English |
      |-------|---------|
      | சென்னை | Chennai |
      | மதுரை | Madurai |
      | கோயம்புத்தூர் / கோவை | Coimbatore |
      | திருச்சி / திருச்சிராப்பள்ளி | Trichy |
      | சேலம் | Salem |
      | திருநெல்வேலி / நெல்லை | Tirunelveli |
      | சிவகாசி | Sivakasi |
      | அருப்புக்கோட்டை | Aruppukkottai |
      | விருதுநகர் | Virudhunagar |
      | ராமேஸ்வரம் | Rameswaram |
      | இராமநாதபுரம் | Ramanathapuram |
      | தேனி | Theni |
      | திண்டுக்கல் | Dindigul |
      | நாகர்கோவில் | Nagercoil |
      | கன்னியாகுமரி | Kanyakumari |
      | தூத்துக்குடி | Thoothukudi |
      | தஞ்சாவூர் | Thanjavur |
      | கும்பகோணம் | Kumbakonam |
      | வேலூர் | Vellore |
      | ஈரோடு | Erode |
      | திருப்பூர் | Tiruppur |
      | கரூர் | Karur |
      | நாமக்கல் | Namakkal |
      | ஓசூர் | Hosur |
      | பெங்களூர் | Bengaluru |
      | மைசூர் | Mysuru |
      | திருப்பதி | Tirupati |
      | புதுச்சேரி | Puducherry |
      | திருவனந்தபுரம் | Thiruvananthapuram |
      | கொச்சி | Kochi |
      | பாலக்காடு | Palakkad |

      Tamil Bus Terms:
      | Tamil | English |
      |-------|---------|
      | பேருந்து நிலையம் | Bus Station |
      | புறப்பாடு | Departure |
      | வரவு | Arrival |
      | வழி | Via |
      | மணி | hour/time |
      | காலை | Morning/AM |
      | மாலை | Evening/PM |
      | இரவு | Night |

      OUTPUT FORMAT (strict - no markdown, no explanation):

      ORIGIN:station_name
      TYPE:departure_board|route_schedule|destination_table|arrival_board
      ROUTES:
      bus_num|from_location|to_location|via_stops|dep_time|arr_time|bus_type
      END

      FIELD RULES:
      - bus_num: Route number exactly as shown (e.g., 166UD, 42A, 520, T.N.01, etc.)
      - from_location: Origin station (use ORIGIN if same as board location, or - if not shown)
      - to_location: Final destination in English (REQUIRED - never leave blank)
      - via_stops: Intermediate stops comma-separated (use - if none shown)
      - dep_time: Departure time(s) in HH:MM 24-hour format, comma-separated for multiple times
      - arr_time: Arrival time(s) in HH:MM format (use - if not shown)
      - bus_type: Bus category (EXPRESS, DELUXE, ORDINARY, SUPER DELUXE, AC, ULTRA DELUXE, MUFSAL, TOWN, etc.)

      TIME EXTRACTION RULES:
      - Convert 12-hour to 24-hour format (6:00 AM → 06:00, 6:00 PM → 18:00)
      - If time shows seconds (19:41:00), output as HH:MM only (19:41)
      - Tamil time indicators: காலை = AM, மாலை/இரவு = PM
      - Extract ALL times shown for each route, comma-separated

      EXAMPLES:

      Example 1 - Departure board:
      ORIGIN:ARUPPUKKOTTAI
      TYPE:departure_board
      ROUTES:
      -|ARUPPUKKOTTAI|MADURAI|-|19:41|-|ORDINARY
      101|ARUPPUKKOTTAI|CHENNAI|Madurai,Trichy|21:00|-|EXPRESS
      END

      Example 2 - Full route schedule:
      ORIGIN:MADURAI
      TYPE:route_schedule
      ROUTES:
      166UD|MADURAI|CHENNAI|Dindigul,Trichy,Villupuram|06:00,14:30|12:00,20:30|EXPRESS
      42A|MADURAI|COIMBATORE|Palani,Pollachi|07:30,15:00|-|ORDINARY
      END

      CRITICAL INSTRUCTIONS:
      1. Count all visible routes and extract EVERY one - do not skip
      2. If you cannot read a field clearly, use your best interpretation
      3. Always use - for genuinely missing/unavailable information
      4. Route numbers can be missing (use -) but destinations are usually always shown
      5. Pay special attention to:
         - Faded or low-contrast text
         - Handwritten additions or corrections
         - Multiple time columns (weekday/weekend/holiday schedules)
      6. For boards showing only times without route numbers, still extract each row as a separate route
      7. Double-check your count matches the visible rows in the image
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
  @CircuitBreaker(name = "gemini", fallbackMethod = "extractBusScheduleFallback")
  @Bulkhead(name = "gemini")
  @Retry(name = "externalApi")
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
  @CircuitBreaker(name = "gemini", fallbackMethod = "extractBusScheduleBase64Fallback")
  @Bulkhead(name = "gemini")
  @Retry(name = "externalApi")
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

  @Override
  @CircuitBreaker(name = "gemini", fallbackMethod = "extractBusScheduleBase64WithContextFallback")
  @Bulkhead(name = "gemini")
  @Retry(name = "externalApi")
  public Map<String, Object> extractBusScheduleFromBase64WithContext(String base64ImageData, String mimeType, String userContext) {
    if (!isAvailable()) {
      log.warn("Gemini Vision service is not available");
      return createErrorResponse("Gemini Vision service is not available");
    }

    try {
      // Build the Gemini API request with user context
      String requestBody = buildGeminiRequestWithContext(base64ImageData, mimeType, userContext);

      // Call the Gemini API
      String response = callGeminiApi(requestBody);

      // Parse the response
      return parseGeminiResponse(response);
    } catch (Exception e) {
      log.error("Error calling Gemini Vision API with context: {}", e.getMessage(), e);
      return createErrorResponse("Gemini API error: " + e.getMessage());
    }
  }

  /**
   * Build the JSON request body for Gemini API with user context.
   */
  private String buildGeminiRequestWithContext(String base64ImageData, String mimeType, String userContext) throws JsonProcessingException {
    ObjectNode root = objectMapper.createObjectNode();

    // Create contents array
    ArrayNode contents = objectMapper.createArrayNode();
    ObjectNode content = objectMapper.createObjectNode();

    // Create parts array with text prompt and image
    ArrayNode parts = objectMapper.createArrayNode();

    // Build enhanced prompt with user context
    String enhancedPrompt = BUS_SCHEDULE_PROMPT;
    if (userContext != null && !userContext.trim().isEmpty()) {
      enhancedPrompt = """
          USER PROVIDED CONTEXT (use this to fill in missing information):
          %s

          IMPORTANT: Use the user's context above to determine:
          - Origin/departure location if mentioned (e.g., "Buses from Chennai" means origin is Chennai)
          - Destination if mentioned (e.g., "to Madurai" means destination is Madurai)
          - Any other hints about routes, timing, or bus type

          %s
          """.formatted(userContext.trim(), BUS_SCHEDULE_PROMPT);
    }

    // Add text prompt
    ObjectNode textPart = objectMapper.createObjectNode();
    textPart.put("text", enhancedPrompt);
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
    generationConfig.put("maxOutputTokens", 8192); // Increased for extracting all routes
    root.set("generationConfig", generationConfig);

    return objectMapper.writeValueAsString(root);
  }

  /**
   * Fallback method for extractBusScheduleFromBase64WithContext.
   */
  private Map<String, Object> extractBusScheduleBase64WithContextFallback(String base64ImageData, String mimeType, String userContext, Throwable t) {
    log.warn("Gemini Vision API with context failed, using fallback. Error: {}", t.getMessage());
    Map<String, Object> result = new HashMap<>();
    result.put("error", "Gemini Vision service temporarily unavailable");
    result.put("message", t.getMessage());
    result.put("requiresManualEntry", true);
    return result;
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
    generationConfig.put("maxOutputTokens", 8192); // Increased for extracting all routes
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

      // Java 21 Sequenced Collections - getFirst()
      JsonNode firstCandidate = candidates.iterator().next();

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
            if (looksLikeTime(time)) {
              String normalized = normalizeTime(time);
              if (normalized != null) {
                allTimes.add(normalized);
              }
            }
          }
        }
      } else if (line.equals("ROUTES:")) {
        inRoutes = true;
      } else if (inRoutes && line.contains("|")) {
        // Parse route:
        // bus_num|from_location|to_location|via_stops|dep_time|arr_time|bus_type
        // Also supports legacy format:
        // bus_num|destination|via1,via2|time1,time2|bus_type
        String[] parts = line.split("\\|", -1);
        if (parts.length >= 2) {
          Map<String, Object> route = new HashMap<>();

          // Field 0: Route/Bus number
          if (parts.length > 0 && !parts[0].trim().equals("-") && !parts[0].trim().isEmpty()) {
            route.put("routeNumber", parts[0].trim());
          }

          // Detect format based on number of fields
          boolean isNewFormat = parts.length >= 6;

          if (isNewFormat) {
            // NEW FORMAT:
            // bus_num|from_location|to_location|via_stops|dep_time|arr_time|bus_type

            // Field 1: From location
            if (parts.length > 1 && !parts[1].trim().equals("-") && !parts[1].trim().isEmpty()) {
              String fromLoc = parts[1].trim();
              // Handle "ORIGIN" keyword - use the board origin
              if (fromLoc.equalsIgnoreCase("ORIGIN") && result.containsKey("fromLocation")) {
                route.put("fromLocation", result.get("fromLocation"));
              } else {
                route.put("fromLocation", normalizeLocationName(fromLoc));
              }
            } else if (result.containsKey("fromLocation")) {
              route.put("fromLocation", result.get("fromLocation"));
            }

            // Field 2: To location (destination)
            if (parts.length > 2 && !parts[2].trim().equals("-") && !parts[2].trim().isEmpty()) {
              route.put("destination", normalizeLocationName(parts[2].trim()));
              route.put("toLocation", normalizeLocationName(parts[2].trim()));
            }

            // Field 3: Via stops (intermediate stops)
            if (parts.length > 3 && !parts[3].trim().equals("-") && !parts[3].trim().isEmpty()) {
              List<String> via = new ArrayList<>();
              for (String v : parts[3].split(",")) {
                v = v.trim();
                if (!v.isEmpty()) {
                  via.add(normalizeLocationName(v));
                }
              }
              if (!via.isEmpty()) {
                route.put("via", via);
                route.put("intermediateStops", via);
              }
            }

            // Field 4: Departure times
            List<String> depTimes = new ArrayList<>();
            if (parts.length > 4 && !parts[4].trim().equals("-") && !parts[4].trim().isEmpty()) {
              for (String t : parts[4].split(",")) {
                t = t.trim();
                if (looksLikeTime(t)) {
                  String normalized = normalizeTime(t);
                  if (normalized != null) {
                    depTimes.add(normalized);
                  }
                }
              }
            }
            if (!depTimes.isEmpty()) {
              route.put("departureTimes", depTimes);
              route.put("timings", depTimes);
              // Java 21 Sequenced Collections - getFirst()
              route.put("departureTime", depTimes.getFirst());
            }

            // Field 5: Arrival times
            List<String> arrTimes = new ArrayList<>();
            if (parts.length > 5 && !parts[5].trim().equals("-") && !parts[5].trim().isEmpty()) {
              for (String t : parts[5].split(",")) {
                t = t.trim();
                if (looksLikeTime(t)) {
                  String normalized = normalizeTime(t);
                  if (normalized != null) {
                    arrTimes.add(normalized);
                  }
                }
              }
            }
            if (!arrTimes.isEmpty()) {
              route.put("arrivalTimes", arrTimes);
              // Java 21 Sequenced Collections - getFirst()
              route.put("arrivalTime", arrTimes.getFirst());
            }

            // Field 6: Bus type
            if (parts.length > 6 && !parts[6].trim().equals("-") && !parts[6].trim().isEmpty()) {
              route.put("busType", parts[6].trim().toUpperCase());
            }

          } else {
            // LEGACY FORMAT: bus_num|destination|via1,via2|time1,time2|bus_type

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
              if (!via.isEmpty()) {
                route.put("via", via);
                route.put("intermediateStops", via);
              }
            }

            // Parse times from field 3 (expected position)
            List<String> times = new ArrayList<>();
            if (parts.length > 3 && !parts[3].trim().equals("-") && !parts[3].trim().isEmpty()) {
              for (String t : parts[3].split(",")) {
                t = t.trim();
                if (looksLikeTime(t)) {
                  String normalized = normalizeTime(t);
                  if (normalized != null) {
                    times.add(normalized);
                  }
                }
              }
            }

            // If no times found in field 3, check field 4
            if (times.isEmpty() && parts.length > 4 && !parts[4].trim().equals("-") && !parts[4].trim().isEmpty()) {
              String field4 = parts[4].trim();
              for (String t : field4.split(",")) {
                t = t.trim();
                if (looksLikeTime(t)) {
                  String normalized = normalizeTime(t);
                  if (normalized != null) {
                    times.add(normalized);
                  }
                }
              }
            }

            if (!times.isEmpty()) {
              route.put("departureTimes", times);
              route.put("timings", times);
              // Java 21 Sequenced Collections - getFirst()
              route.put("departureTime", times.getFirst());
            }

            // Bus type from field 4 if not times
            if (parts.length > 4 && !parts[4].trim().equals("-") && !parts[4].trim().isEmpty()) {
              String field4 = parts[4].trim();
              if (!looksLikeTime(field4)) {
                route.put("busType", field4.toUpperCase());
              }
            }

            // Set from location from origin
            if (result.containsKey("fromLocation")) {
              route.put("fromLocation", result.get("fromLocation"));
            }
          }

          routes.add(route);
          log.debug("Parsed route {}: {} ({} -> {}) via {} at {}",
              routes.size(), route.get("routeNumber"),
              route.get("fromLocation"), route.get("destination"),
              route.get("via"), route.get("departureTimes"));
        }
      }
    }

    if (!allTimes.isEmpty()) {
      result.put("allDepartureTimes", allTimes);
      result.put("timing", allTimes);
      if (!result.containsKey("departureTime")) {
        // Java 21 Sequenced Collections - getFirst()
        result.put("departureTime", allTimes.getFirst());
      }
    }

    if (!routes.isEmpty()) {
      result.put("routes", routes);
      // Log details of each route for debugging
      for (int i = 0; i < routes.size(); i++) {
        Map<String, Object> r = routes.get(i);
        log.info("Route {}: {} - {} -> {} via {} (dep: {}, arr: {}, type: {})",
            i + 1, r.get("routeNumber"), r.get("fromLocation"),
            r.get("destination"), r.get("via"),
            r.get("departureTimes"), r.get("arrivalTimes"), r.get("busType"));
      }
    }

    // Calculate confidence score based on extracted data quality
    double confidence = calculateConfidence(result, routes);
    result.put("confidence", confidence);

    log.info("Parsed {} times and {} routes from Gemini response (confidence: {})",
        allTimes.size(), routes.size(), confidence);
    return result;
  }

  /**
   * Calculate confidence score based on extracted data quality.
   * Score ranges from 0.0 (very low) to 1.0 (very high).
   */
  @SuppressWarnings("unchecked")
  private double calculateConfidence(Map<String, Object> result, List<Map<String, Object>> routes) {
    double score = 0.5; // Base score

    // +0.1 if origin is detected
    if (result.get("origin") != null && !result.get("origin").toString().isEmpty()) {
      score += 0.1;
    }

    // +0.1 if board type is detected
    if (result.get("boardType") != null && !result.get("boardType").toString().isEmpty()) {
      score += 0.05;
    }

    // Evaluate routes quality
    if (routes != null && !routes.isEmpty()) {
      score += 0.1; // At least some routes found

      int routesWithTimes = 0;
      int routesWithDestination = 0;
      int routesWithBusType = 0;
      int routesWithRouteNumber = 0;

      for (Map<String, Object> route : routes) {
        if (route.get("departureTimes") != null) {
          List<?> times = (List<?>) route.get("departureTimes");
          if (!times.isEmpty())
            routesWithTimes++;
        }
        if (route.get("destination") != null && !route.get("destination").toString().equals("-")) {
          routesWithDestination++;
        }
        if (route.get("busType") != null && !route.get("busType").toString().equals("-")) {
          routesWithBusType++;
        }
        if (route.get("routeNumber") != null && !route.get("routeNumber").toString().equals("-")) {
          routesWithRouteNumber++;
        }
      }

      int totalRoutes = routes.size();

      // Score based on completeness of route data
      if (routesWithDestination == totalRoutes)
        score += 0.1;
      else if (routesWithDestination > totalRoutes / 2)
        score += 0.05;

      if (routesWithTimes == totalRoutes)
        score += 0.1;
      else if (routesWithTimes > totalRoutes / 2)
        score += 0.05;

      if (routesWithBusType > totalRoutes / 2)
        score += 0.05;
      if (routesWithRouteNumber > totalRoutes / 2)
        score += 0.05;

      // Bonus for multiple routes (indicates complete extraction)
      if (totalRoutes >= 5)
        score += 0.05;
      if (totalRoutes >= 10)
        score += 0.05;
    }

    // Cap at 0.95 (never 100% confident with OCR)
    return Math.min(0.95, Math.max(0.1, score));
  }

  /**
   * Normalize time to HH:MM format.
   * Handles various formats:
   * - HH:MM (standard)
   * - HH:MM:SS (with seconds)
   * - H:MM (single digit hour)
   * - HH.MM or H.MM (dot separator)
   * - HH:MM AM/PM (12-hour format)
   * - HHMM (no separator)
   */
  private String normalizeTime(String time) {
    if (time == null || time.trim().isEmpty())
      return null;

    time = time.trim();

    // Remove common prefixes/suffixes
    time = time.replaceAll("(?i)^(at|@|time[:\\s]*)\\s*", "");
    time = time.replaceAll("(?i)\\s*(hrs?|hours?)$", "");

    // Handle 12-hour format with AM/PM
    boolean isPM = time.toUpperCase().contains("PM");
    boolean isAM = time.toUpperCase().contains("AM");
    time = time.replaceAll("(?i)\\s*(AM|PM|A\\.M\\.|P\\.M\\.)\\s*", "").trim();

    // Handle dot separator (e.g., "19.41" -> "19:41")
    time = time.replace(".", ":");

    // Handle no separator format (e.g., "1941" -> "19:41")
    if (time.matches("\\d{4}") && !time.contains(":")) {
      time = time.substring(0, 2) + ":" + time.substring(2);
    } else if (time.matches("\\d{3}") && !time.contains(":")) {
      // e.g., "941" -> "9:41"
      time = time.substring(0, 1) + ":" + time.substring(1);
    }

    // Strip seconds if present (e.g., "19:41:00" -> "19:41")
    if (time.matches("\\d{1,2}:\\d{2}:\\d{2}")) {
      time = time.substring(0, time.lastIndexOf(':'));
    }

    // Pad single digit hour (e.g., "9:30" -> "09:30")
    if (time.matches("\\d:\\d{2}")) {
      time = "0" + time;
    }

    // Convert 12-hour to 24-hour format
    if (isPM || isAM) {
      String[] parts = time.split(":");
      if (parts.length >= 2) {
        int hour = Integer.parseInt(parts[0]);
        if (isPM && hour < 12) {
          hour += 12;
        } else if (isAM && hour == 12) {
          hour = 0;
        }
        time = String.format("%02d:%s", hour, parts[1]);
      }
    }

    // Final validation - return null if not a valid time
    if (!time.matches("\\d{2}:\\d{2}")) {
      return null;
    }

    return time;
  }

  /**
   * Check if a string looks like a time value.
   * More flexible pattern to catch various formats.
   */
  private boolean looksLikeTime(String str) {
    if (str == null || str.trim().isEmpty())
      return false;
    str = str.trim();

    // Various time patterns
    return str.matches("\\d{1,2}[:\\.。]\\d{2}(:\\d{2})?") || // HH:MM or HH:MM:SS
        str.matches("\\d{1,2}[:\\.。]\\d{2}\\s*(AM|PM|am|pm|A\\.M\\.|P\\.M\\.)?") || // With AM/PM
        str.matches("\\d{3,4}") || // HHMM or HMM
        str.matches("\\d{1,2}\\s*(AM|PM|am|pm)"); // Just hour with AM/PM
  }

  /**
   * Validate that a time string is a valid 24-hour time.
   * Returns true if the time is between 00:00 and 23:59.
   */
  private boolean isValidTime(String time) {
    if (time == null || !time.matches("\\d{2}:\\d{2}")) {
      return false;
    }
    try {
      String[] parts = time.split(":");
      int hour = Integer.parseInt(parts[0]);
      int minute = Integer.parseInt(parts[1]);
      return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
    } catch (NumberFormatException e) {
      return false;
    }
  }

  /**
   * Validate that a location name is reasonable.
   * Returns true if it looks like a valid location.
   */
  private boolean isValidLocation(String location) {
    if (location == null || location.trim().isEmpty() || location.equals("-")) {
      return false;
    }
    String trimmed = location.trim();

    // Length validation: min 2 chars, max 50 chars (longest city name reasonable
    // limit)
    if (trimmed.length() < 2 || trimmed.length() > 50) {
      return false;
    }

    // Reject if purely numeric
    if (trimmed.matches("\\d+")) {
      return false;
    }

    // Reject common OCR garbage patterns
    if (isOcrGarbage(trimmed)) {
      return false;
    }

    // Check for valid characters: letters (English/Tamil), spaces, dots, hyphens,
    // apostrophes
    // Tamil Unicode range: \u0B80-\u0BFF
    if (!trimmed.matches("[A-Za-z\\u0B80-\\u0BFF\\s.\\-']+")) {
      return false;
    }

    // After normalization, check if it's a known location
    String normalized = normalizeLocationName(trimmed);
    if (isKnownLocation(normalized)) {
      return true;
    }

    // If not in known list, apply heuristic validation
    // Must have at least one vowel (likely a real word)
    String upperNorm = normalized.toUpperCase();
    if (!upperNorm.matches(".*[AEIOU].*") && !trimmed.matches(".*[\\u0B80-\\u0BFF].*")) {
      return false;
    }

    // Reject if too many consecutive consonants (likely garbage)
    if (upperNorm.matches(".*[BCDFGHJKLMNPQRSTVWXYZ]{5,}.*")) {
      return false;
    }

    // Accept if it passes all checks (could be a new/unknown valid location)
    return true;
  }

  /**
   * Check if the string looks like OCR garbage or noise.
   */
  private boolean isOcrGarbage(String text) {
    if (text == null || text.isEmpty()) {
      return true;
    }

    String upper = text.toUpperCase().trim();

    // Common OCR noise patterns
    String[] garbagePatterns = {
        "^[^A-Za-z\\u0B80-\\u0BFF]+$", // No letters at all
        "^[\\W_]+$", // Only special characters
        "^(NA|N/A|NIL|NULL|NONE|UNKNOWN|TBD|N\\.A\\.)$", // Placeholder values
        "^[X]+$", // Just X's
        "^[-]+$", // Just dashes
        "^[.]+$", // Just dots
        "^\\d+[A-Z]?$", // Mostly numbers with optional letter
        "^[A-Z]\\d+$", // Letter followed by numbers
        "^(BUS|STAND|STATION|DEPOT|TERMINUS|STOP)$", // Just suffix words
        "^(THE|TO|FROM|VIA|AND|OR)$", // Common prepositions/conjunctions only
        "^[A-Z]{1,2}$", // Single or double letters only (too short)
    };

    for (String pattern : garbagePatterns) {
      if (upper.matches(pattern)) {
        return true;
      }
    }

    // Check for excessive repetition (e.g., "AAAA", "ABAB")
    if (hasExcessiveRepetition(upper)) {
      return true;
    }

    // Check for random-looking strings (high entropy)
    if (looksRandom(upper)) {
      return true;
    }

    return false;
  }

  /**
   * Check if string has excessive character repetition.
   */
  private boolean hasExcessiveRepetition(String text) {
    if (text.length() < 4) {
      return false;
    }

    // Check for 4+ same consecutive characters
    if (text.matches(".*(.)\\1{3,}.*")) {
      return true;
    }

    // Check for repeating 2-char patterns (e.g., "ABAB")
    if (text.length() >= 6) {
      String twoChar = text.substring(0, 2);
      String repeated = twoChar.repeat(3);
      if (text.startsWith(repeated)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if string looks like random characters (high entropy, no word
   * patterns).
   */
  private boolean looksRandom(String text) {
    if (text.length() < 4) {
      return false;
    }

    // Calculate vowel to consonant ratio - valid words usually have 20-40% vowels
    long vowelCount = text.chars().filter(c -> "AEIOU".indexOf(c) >= 0).count();
    double vowelRatio = (double) vowelCount / text.length();

    // If very few vowels (except for known abbreviations) or too many vowels
    if (text.length() > 4 && (vowelRatio < 0.1 || vowelRatio > 0.7)) {
      // Exception for known abbreviations like CMBT, KSRTC
      if (!isKnownAbbreviation(text)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if the location is a known valid location name.
   */
  private boolean isKnownLocation(String normalizedName) {
    if (normalizedName == null || normalizedName.isEmpty()) {
      return false;
    }

    String upper = normalizedName.toUpperCase().trim();

    // Known Tamil Nadu and South India locations (comprehensive list)
    Set<String> knownLocations = new HashSet<>(Arrays.asList(
        // Tamil Nadu - Major Cities
        "CHENNAI", "MADURAI", "COIMBATORE", "TRICHY", "TIRUCHIRAPPALLI", "SALEM",
        "TIRUNELVELI", "THANJAVUR", "VELLORE", "ERODE", "TIRUPPUR", "THOOTHUKUDI",
        "DINDIGUL", "KANYAKUMARI", "NAGERCOIL",

        // Tamil Nadu - Districts/Towns
        "SIVAKASI", "VIRUDHUNAGAR", "ARUPPUKKOTTAI", "RAMANATHAPURAM", "RAMESWARAM",
        "THENI", "KARUR", "NAMAKKAL", "KUMBAKONAM", "NAGAPATTINAM", "MAYILADUTHURAI",
        "TIRUVARUR", "PUDUKKOTTAI", "PERAMBALUR", "ARIYALUR", "CUDDALORE",
        "VILUPPURAM", "KALLAKURICHI", "TIRUVANNAMALAI", "RANIPET", "TIRUPATTUR",
        "KRISHNAGIRI", "DHARMAPURI", "HOSUR", "OOTY", "COONOOR", "NILGIRIS",
        "POLLACHI", "PALANI", "KODAIKANAL", "KANCHIPURAM", "CHENGALPATTU",

        // Chennai Areas
        "KOYAMBEDU", "TAMBARAM", "EGMORE", "BROADWAY", "GUINDY", "ADYAR",
        "THIRUVANMIYUR", "VELACHERY", "PORUR", "AVADI", "AMBATTUR", "POONAMALLEE",
        "MADHAVARAM", "MATHAVARAM", "PERAMBUR", "TONDIARPET", "ROYAPURAM",

        // Madurai Areas
        "PERIYAR", "THIRUMANGALAM", "USILAMPATTI", "MELUR", "VADIPATTI",

        // South Tamil Nadu
        "SANKARANKOVIL", "TENKASI", "SRIVILLIPUTHUR", "SATTUR", "KOVILPATTI",
        "OTTAPIDARAM", "TIRUCHENDUR", "KAYALPATTINAM", "KULASEKHARAPATNAM",
        "MANAPPADU", "SRIVAIKUNDAM", "PALAYAMKOTTAI", "AMBASAMUDRAM",
        "CHERANMAHADEVI", "KADAYANALLUR", "RAJAPALAYAM", "WATRAP",
        "SRIPERUMBUDUR", "MARAIMALAINAGAR", "CHIDAMBARAM", "SIRKALI",

        // Karnataka
        "BENGALURU", "BANGALORE", "MYSURU", "MYSORE", "MANGALURU", "MANGALORE",
        "HUBBALLI", "HUBLI", "DHARWAD", "BELGAUM", "BELAGAVI", "DAVANGERE",
        "BELLARY", "BALLARI", "TUMKUR", "SHIMOGA", "SHIVAMOGGA", "HASSAN",
        "CHITRADURGA", "KOLAR", "MANDYA", "RAICHUR", "BIDAR", "GULBARGA",

        // Kerala
        "THIRUVANANTHAPURAM", "TRIVANDRUM", "KOCHI", "COCHIN", "ERNAKULAM",
        "KOZHIKODE", "CALICUT", "THRISSUR", "TRICHUR", "KOLLAM", "QUILON",
        "ALAPPUZHA", "ALLEPPEY", "PALAKKAD", "PALGHAT", "KANNUR", "CANNANORE",
        "MALAPPURAM", "KOTTAYAM", "PATHANAMTHITTA", "IDUKKI", "WAYANAD",
        "KASARAGOD", "MUNNAR",

        // Andhra Pradesh / Telangana
        "HYDERABAD", "SECUNDERABAD", "VISAKHAPATNAM", "VIZAG", "VIJAYAWADA",
        "TIRUPATI", "TIRUMALA", "GUNTUR", "NELLORE", "KURNOOL", "KADAPA",
        "ANANTAPUR", "RAJAHMUNDRY", "KAKINADA", "ELURU", "ONGOLE", "CHITTOOR",
        "WARANGAL", "KARIMNAGAR", "NIZAMABAD", "KHAMMAM", "MAHBUBNAGAR",

        // Puducherry
        "PUDUCHERRY", "PONDICHERRY", "KARAIKAL", "MAHE", "YANAM",

        // Other Major South Indian Cities
        "MUMBAI", "BOMBAY", "PUNE", "GOA", "PANAJI", "MARGAO",

        // Known bus stand codes/abbreviations
        "CMBT", "MGBS", "KSRTC", "TNSTC", "SETC", "APSRTC", "MSRTC"));

    return knownLocations.contains(upper);
  }

  /**
   * Check if the string is a known abbreviation.
   */
  private boolean isKnownAbbreviation(String text) {
    if (text == null || text.isEmpty()) {
      return false;
    }

    Set<String> abbreviations = new HashSet<>(Arrays.asList(
        "CMBT", "MGBS", "KSRTC", "TNSTC", "SETC", "KPN", "SRM", "VRL", "SRS",
        "APSRTC", "MSRTC", "GSRTC", "RSRTC", "UPSRTC", "OSRTC", "WBTC",
        "TPJ", "MAS", "CHN", "CBE", "MDU", "TEN", "NCL", "TVL", "SLM",
        "VLR", "ERD", "TPR", "DGL", "KRR", "NMK", "TJR", "RMD", "BZA"));

    return abbreviations.contains(text.toUpperCase().trim());
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
          // Java 21 Sequenced Collections - getFirst()
          normalizedRoute.put("departureTime", departureTimes.getFirst());

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
        // Java 21 Sequenced Collections - getFirst()
        Map<String, Object> firstRoute = groupedRoutes.getFirst();
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
        // Java 21 Sequenced Collections - getFirst()
        data.put("departureTime", allDepartureTimes.getFirst());
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
   * Strips common suffixes, handles abbreviations, standardizes names,
   * and converts Tamil script to English.
   */
  private String normalizeLocationName(String name) {
    if (name == null || name.isEmpty()) {
      return name;
    }

    String original = name.trim();

    // First, check for Tamil script and convert to English
    // Tamil script range: \u0B80-\u0BFF
    if (original.matches(".*[\\u0B80-\\u0BFF].*")) {
      String converted = convertTamilToEnglish(original);
      if (converted != null && !converted.equals(original)) {
        original = converted;
      }
    }

    String upper = original.toUpperCase().trim();

    // Remove extra whitespace
    upper = upper.replaceAll("\\s+", " ");

    // Remove common noise patterns
    upper = upper.replaceAll("\\(.*?\\)", "").trim(); // Remove parenthetical info
    upper = upper.replaceAll("\\[.*?\\]", "").trim(); // Remove bracket info
    upper = upper.replaceAll("\\d+$", "").trim(); // Remove trailing numbers

    // Strip common suffixes (order matters - longer patterns first)
    String[] suffixesToRemove = {
        " NEW BUS STAND", " OLD BUS STAND", " CENTRAL BUS STAND",
        " MOFUSSIL BUS STAND", " MOFUSSIL BUS STATION", " MOFUSSIL BUS TERMINUS",
        " BUS TERMINUS", " BUS STAND", " BUS STATION", " BUS DEPOT",
        " BUSSTAND", " BUSSTATION", " BUSTAND",
        " STAND", " STATION", " TERMINAL", " TERMINUS", " DEPOT",
        " JUNCTION", " JN", " JN.", " TOWN", " CITY",
        "BUSSTAND", "BUSSTATION", "BUSTAND" // For cases without spaces
    };
    for (String suffix : suffixesToRemove) {
      if (upper.endsWith(suffix)) {
        upper = upper.substring(0, upper.length() - suffix.length()).trim();
        break;
      }
    }

    // Strip common prefixes
    String[] prefixesToRemove = {
        "NEW ", "OLD ", "CENTRAL ", "MAIN "
    };
    for (String prefix : prefixesToRemove) {
      if (upper.startsWith(prefix) && upper.length() > prefix.length() + 3) {
        upper = upper.substring(prefix.length()).trim();
        break;
      }
    }

    // Known abbreviations - keep as-is
    String[] knownAbbreviations = {
        "CMBT", "MGBS", "KSRTC", "TNSTC", "SETC", "KPN", "SRM", "VRL", "SRS",
        "APSRTC", "MSRTC", "GSRTC", "RSRTC", "UPSRTC", "OSRTC", "WBTC"
    };
    for (String abbr : knownAbbreviations) {
      if (upper.equals(abbr)) {
        return upper;
      }
    }

    // Comprehensive map of variations to standard names (Tamil Nadu focus)
    Map<String, String> nameMap = new HashMap<>();

    // Major cities - alternate spellings
    nameMap.put("BANGALORE", "BENGALURU");
    nameMap.put("BANGLORE", "BENGALURU");
    nameMap.put("BLORE", "BENGALURU");
    nameMap.put("BLR", "BENGALURU");
    nameMap.put("MADRAS", "CHENNAI");
    nameMap.put("MAS", "CHENNAI");
    nameMap.put("CHN", "CHENNAI");
    nameMap.put("CHNAI", "CHENNAI");
    nameMap.put("BOMBAY", "MUMBAI");
    nameMap.put("CALCUTTA", "KOLKATA");

    // Tamil Nadu cities
    nameMap.put("TIRUCHIRAPPALLI", "TRICHY");
    nameMap.put("TIRUCHIRAPALLI", "TRICHY");
    nameMap.put("TIRUCHI", "TRICHY");
    nameMap.put("TIRUCHY", "TRICHY");
    nameMap.put("TPJ", "TRICHY");
    nameMap.put("TUTICORIN", "THOOTHUKUDI");
    nameMap.put("TUTI", "THOOTHUKUDI");
    nameMap.put("TANJORE", "THANJAVUR");
    nameMap.put("TJR", "THANJAVUR");
    nameMap.put("NELLAI", "TIRUNELVELI");
    nameMap.put("TINELVELI", "TIRUNELVELI");
    nameMap.put("TVL", "TIRUNELVELI");
    nameMap.put("COIMBATORE", "COIMBATORE");
    nameMap.put("KOVAI", "COIMBATORE");
    nameMap.put("CBE", "COIMBATORE");
    nameMap.put("KANYAKUMARI", "KANYAKUMARI");
    nameMap.put("CAPE COMORIN", "KANYAKUMARI");
    nameMap.put("NAGERCOIL", "NAGERCOIL");
    nameMap.put("NAGARCOIL", "NAGERCOIL");
    nameMap.put("NCL", "NAGERCOIL");

    // South Tamil Nadu
    nameMap.put("ARUPPUKOTTAI", "ARUPPUKKOTTAI");
    nameMap.put("ARUPPUKOTAI", "ARUPPUKKOTTAI");
    nameMap.put("A.KOTTAI", "ARUPPUKKOTTAI");
    nameMap.put("VIRUDUNAGAR", "VIRUDHUNAGAR");
    nameMap.put("VIRUDHU NAGAR", "VIRUDHUNAGAR");
    nameMap.put("VNR", "VIRUDHUNAGAR");
    nameMap.put("SIVAKASHI", "SIVAKASI");
    nameMap.put("SIVA KASI", "SIVAKASI");
    nameMap.put("SKS", "SIVAKASI");
    nameMap.put("RAMANATHAPURAM", "RAMANATHAPURAM");
    nameMap.put("RAMNAD", "RAMANATHAPURAM");
    nameMap.put("RMD", "RAMANATHAPURAM");
    nameMap.put("RAMESHWARAM", "RAMESWARAM");
    nameMap.put("RAMESVARAM", "RAMESWARAM");

    // Central Tamil Nadu
    nameMap.put("DINDUGAL", "DINDIGUL");
    nameMap.put("DINDIKAL", "DINDIGUL");
    nameMap.put("DGL", "DINDIGUL");
    nameMap.put("THENI", "THENI");
    nameMap.put("TNI", "THENI");
    nameMap.put("KARUR", "KARUR");
    nameMap.put("KRR", "KARUR");
    nameMap.put("NAMAKKAL", "NAMAKKAL");
    nameMap.put("NMK", "NAMAKKAL");
    nameMap.put("ERODE", "ERODE");
    nameMap.put("ERD", "ERODE");
    nameMap.put("TIRUPUR", "TIRUPPUR");
    nameMap.put("TIRUPR", "TIRUPPUR");
    nameMap.put("TPR", "TIRUPPUR");
    nameMap.put("KUMBAKONAM", "KUMBAKONAM");
    nameMap.put("KUMBKONAM", "KUMBAKONAM");
    nameMap.put("KMB", "KUMBAKONAM");

    // North Tamil Nadu
    nameMap.put("VELLORE", "VELLORE");
    nameMap.put("VLR", "VELLORE");
    nameMap.put("GUDIYATTAM", "GUDIYATHAM");
    nameMap.put("GUDIYATAM", "GUDIYATHAM");
    nameMap.put("VILLUPURAM", "VILUPPURAM");
    nameMap.put("VPM", "VILUPPURAM");
    nameMap.put("CUDDALORE", "CUDDALORE");
    nameMap.put("CDLR", "CUDDALORE");
    nameMap.put("PONDICHERRY", "PUDUCHERRY");
    nameMap.put("PONDY", "PUDUCHERRY");
    nameMap.put("PDY", "PUDUCHERRY");

    // Chennai areas
    nameMap.put("MATHAVARAMBUSSTAND", "MATHAVARAM");
    nameMap.put("MATHAVARAMBUSSTATION", "MATHAVARAM");
    nameMap.put("KOYAMBEDU", "KOYAMBEDU");
    nameMap.put("CMBT KOYAMBEDU", "KOYAMBEDU");
    nameMap.put("TAMBARAM", "TAMBARAM");
    nameMap.put("TBM", "TAMBARAM");
    nameMap.put("EGMORE", "EGMORE");
    nameMap.put("EGM", "EGMORE");
    nameMap.put("BROADWAY", "BROADWAY");
    nameMap.put("GUINDY", "GUINDY");

    // Karnataka
    nameMap.put("MYSORE", "MYSURU");
    nameMap.put("MYSUR", "MYSURU");
    nameMap.put("MYS", "MYSURU");
    nameMap.put("MANGALORE", "MANGALURU");
    nameMap.put("MANGALOR", "MANGALURU");
    nameMap.put("MNG", "MANGALURU");
    nameMap.put("HUBLI", "HUBBALLI");
    nameMap.put("DHARWAD", "DHARWAD");

    // Kerala
    nameMap.put("TRIVANDRUM", "THIRUVANANTHAPURAM");
    nameMap.put("TVM", "THIRUVANANTHAPURAM");
    nameMap.put("CALICUT", "KOZHIKODE");
    nameMap.put("CCT", "KOZHIKODE");
    nameMap.put("COCHIN", "KOCHI");
    nameMap.put("ERNAKULAM", "KOCHI");
    nameMap.put("EKM", "KOCHI");
    nameMap.put("PALGHAT", "PALAKKAD");
    nameMap.put("PGT", "PALAKKAD");
    nameMap.put("QUILON", "KOLLAM");
    nameMap.put("ALLEPPEY", "ALAPPUZHA");
    nameMap.put("TRICHUR", "THRISSUR");
    nameMap.put("TCR", "THRISSUR");
    nameMap.put("CANNANORE", "KANNUR");

    // Andhra Pradesh / Telangana
    nameMap.put("HYDRABAD", "HYDERABAD");
    nameMap.put("HYD", "HYDERABAD");
    nameMap.put("SECUNDRABAD", "SECUNDERABAD");
    nameMap.put("VISHAKAPATNAM", "VISAKHAPATNAM");
    nameMap.put("VIZAG", "VISAKHAPATNAM");
    nameMap.put("VSP", "VISAKHAPATNAM");
    nameMap.put("VIJAYAWADA", "VIJAYAWADA");
    nameMap.put("BZA", "VIJAYAWADA");
    nameMap.put("TIRUPATHI", "TIRUPATI");
    nameMap.put("TIRUMALA", "TIRUPATI");

    return nameMap.getOrDefault(upper, upper);
  }

  /**
   * Convert Tamil script location names to English.
   * Maps common Tamil Nadu city names from Tamil to standard English spellings.
   */
  private String convertTamilToEnglish(String tamilName) {
    if (tamilName == null || tamilName.isEmpty()) {
      return tamilName;
    }

    String trimmed = tamilName.trim();

    // Tamil to English city name mappings
    Map<String, String> tamilToEnglish = new HashMap<>();

    // Major cities
    tamilToEnglish.put("சென்னை", "CHENNAI");
    tamilToEnglish.put("மதுரை", "MADURAI");
    tamilToEnglish.put("கோயம்புத்தூர்", "COIMBATORE");
    tamilToEnglish.put("கோவை", "COIMBATORE");
    tamilToEnglish.put("திருச்சி", "TRICHY");
    tamilToEnglish.put("திருச்சிராப்பள்ளி", "TRICHY");
    tamilToEnglish.put("சேலம்", "SALEM");
    tamilToEnglish.put("திருநெல்வேலி", "TIRUNELVELI");
    tamilToEnglish.put("நெல்லை", "TIRUNELVELI");
    tamilToEnglish.put("தஞ்சாவூர்", "THANJAVUR");
    tamilToEnglish.put("தஞ்சை", "THANJAVUR");
    tamilToEnglish.put("வேலூர்", "VELLORE");
    tamilToEnglish.put("ஈரோடு", "ERODE");
    tamilToEnglish.put("திருப்பூர்", "TIRUPPUR");

    // South Tamil Nadu
    tamilToEnglish.put("சிவகாசி", "SIVAKASI");
    tamilToEnglish.put("விருதுநகர்", "VIRUDHUNAGAR");
    tamilToEnglish.put("அருப்புக்கோட்டை", "ARUPPUKKOTTAI");
    tamilToEnglish.put("இராமநாதபுரம்", "RAMANATHAPURAM");
    tamilToEnglish.put("ராமநாதபுரம்", "RAMANATHAPURAM");
    tamilToEnglish.put("ராமேஸ்வரம்", "RAMESWARAM");
    tamilToEnglish.put("தூத்துக்குடி", "THOOTHUKUDI");
    tamilToEnglish.put("கன்னியாகுமரி", "KANYAKUMARI");
    tamilToEnglish.put("நாகர்கோவில்", "NAGERCOIL");
    tamilToEnglish.put("நாகர்கோயில்", "NAGERCOIL");

    // Central Tamil Nadu
    tamilToEnglish.put("திண்டுக்கல்", "DINDIGUL");
    tamilToEnglish.put("தேனி", "THENI");
    tamilToEnglish.put("கரூர்", "KARUR");
    tamilToEnglish.put("நாமக்கல்", "NAMAKKAL");
    tamilToEnglish.put("கும்பகோணம்", "KUMBAKONAM");
    tamilToEnglish.put("புதுக்கோட்டை", "PUDUKKOTTAI");
    tamilToEnglish.put("பெரம்பலூர்", "PERAMBALUR");
    tamilToEnglish.put("அரியலூர்", "ARIYALUR");

    // North Tamil Nadu
    tamilToEnglish.put("காஞ்சிபுரம்", "KANCHIPURAM");
    tamilToEnglish.put("திருவண்ணாமலை", "TIRUVANNAMALAI");
    tamilToEnglish.put("கிருஷ்ணகிரி", "KRISHNAGIRI");
    tamilToEnglish.put("தர்மபுரி", "DHARMAPURI");
    tamilToEnglish.put("விழுப்புரம்", "VILUPPURAM");
    tamilToEnglish.put("கடலூர்", "CUDDALORE");
    tamilToEnglish.put("செங்கல்பட்டு", "CHENGALPATTU");
    tamilToEnglish.put("திருவள்ளூர்", "TIRUVALLUR");
    tamilToEnglish.put("ஓசூர்", "HOSUR");

    // Chennai areas
    tamilToEnglish.put("கோயம்பேடு", "KOYAMBEDU");
    tamilToEnglish.put("தாம்பரம்", "TAMBARAM");
    tamilToEnglish.put("எழும்பூர்", "EGMORE");
    tamilToEnglish.put("மத்தவரம்", "MATHAVARAM");
    tamilToEnglish.put("குரோம்பேட்டை", "CHROMEPET");
    tamilToEnglish.put("பல்லாவரம்", "PALLAVARAM");

    // Coastal towns
    tamilToEnglish.put("நாகப்பட்டினம்", "NAGAPATTINAM");
    tamilToEnglish.put("காரைக்கால்", "KARAIKAL");
    tamilToEnglish.put("வேதாரண்யம்", "VEDARANYAM");
    tamilToEnglish.put("சிதம்பரம்", "CHIDAMBARAM");

    // Other important towns
    tamilToEnglish.put("பொள்ளாச்சி", "POLLACHI");
    tamilToEnglish.put("பாளையங்கோட்டை", "PALAYAMKOTTAI");
    tamilToEnglish.put("மேட்டூர்", "METTUR");
    tamilToEnglish.put("ஆத்தூர்", "ATTUR");
    tamilToEnglish.put("உதகமண்டலம்", "OOTY");
    tamilToEnglish.put("ஊட்டி", "OOTY");
    tamilToEnglish.put("கொடைக்கானல்", "KODAIKANAL");
    tamilToEnglish.put("யாழ்ப்பாணம்", "JAFFNA");

    // Other states - common destinations
    tamilToEnglish.put("பெங்களூர்", "BENGALURU");
    tamilToEnglish.put("பெங்களூரு", "BENGALURU");
    tamilToEnglish.put("மைசூர்", "MYSURU");
    tamilToEnglish.put("மைசூரு", "MYSURU");
    tamilToEnglish.put("மங்களூர்", "MANGALURU");
    tamilToEnglish.put("ஹைதராபாத்", "HYDERABAD");
    tamilToEnglish.put("திருப்பதி", "TIRUPATI");
    tamilToEnglish.put("திருமலை", "TIRUPATI");
    tamilToEnglish.put("புதுச்சேரி", "PUDUCHERRY");
    tamilToEnglish.put("பாண்டிச்சேரி", "PUDUCHERRY");

    // Kerala cities
    tamilToEnglish.put("கேரளா", "KERALA");
    tamilToEnglish.put("திருவனந்தபுரம்", "THIRUVANANTHAPURAM");
    tamilToEnglish.put("கொச்சி", "KOCHI");
    tamilToEnglish.put("கோழிக்கோடு", "KOZHIKODE");
    tamilToEnglish.put("பாலக்காடு", "PALAKKAD");
    tamilToEnglish.put("திருச்சூர்", "THRISSUR");
    tamilToEnglish.put("கண்ணூர்", "KANNUR");
    tamilToEnglish.put("கொல்லம்", "KOLLAM");
    tamilToEnglish.put("ஆலப்புழா", "ALAPPUZHA");

    // Check for exact match first
    if (tamilToEnglish.containsKey(trimmed)) {
      return tamilToEnglish.get(trimmed);
    }

    // Check if the input contains any Tamil city name (for compound names like
    // "மதுரை பேருந்து நிலையம்")
    for (Map.Entry<String, String> entry : tamilToEnglish.entrySet()) {
      if (trimmed.contains(entry.getKey())) {
        return entry.getValue();
      }
    }

    // Remove Tamil suffixes for bus station/stand
    String[] tamilSuffixes = {
        " பேருந்து நிலையம்", // Bus Station
        " பஸ் ஸ்டாண்ட்", // Bus Stand
        " நிலையம்", // Station
        " மையம்", // Center
        "பேருந்து நிலையம்",
        "பஸ் ஸ்டாண்ட்",
        "நிலையம்"
    };
    for (String suffix : tamilSuffixes) {
      if (trimmed.endsWith(suffix)) {
        String stripped = trimmed.substring(0, trimmed.length() - suffix.length()).trim();
        if (tamilToEnglish.containsKey(stripped)) {
          return tamilToEnglish.get(stripped);
        }
      }
    }

    return tamilName; // Return original if no match found
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

  // Prompt for extracting bus schedule from pasted text
  private static final String TEXT_EXTRACTION_PROMPT = """
      You are a bus route information extractor for Tamil Nadu, India.
      Extract bus route information from this pasted text.
      The text may be from WhatsApp, Facebook, Twitter, bus station boards, or other sources.
      The text may be in Tamil (தமிழ்), English, or mixed.

      COMMON TEXT FORMATS TO RECOGNIZE:
      1. WhatsApp format: "[12/01/25, 6:30 AM] User: 570 Chennai to Madurai 6:00 AM"
      2. Arrow format: "Chennai → Madurai" or "Chennai -> Madurai" or "Chennai - Madurai"
      3. Official format: "Route No: 570, From: Chennai, To: Madurai, Departure: 06:00"
      4. Tamil format: "சென்னை லிருந்து மதுரை வரை பஸ் எண் 570"
      5. Simple format: "Bus 27D runs from Coimbatore to Salem at 5:30 AM"
      6. Schedule format: "TNSTC 570: Chennai-Madurai via Trichy, timings: 6:00, 8:00, 10:00"
      7. Announcement format: "New service! 123A Express Chennai to Tirunelveli daily"

      TAMIL TEXT HANDLING - Convert Tamil to English:
      CITIES: சென்னை→Chennai, மதுரை→Madurai, கோயம்புத்தூர்→Coimbatore, திருச்சி→Trichy,
              சேலம்→Salem, திருநெல்வேலி→Tirunelveli, சிவகாசி→Sivakasi, அருப்புக்கோட்டை→Aruppukkottai,
              விருதுநகர்→Virudhunagar, தேனி→Theni, திண்டுக்கல்→Dindigul, தஞ்சாவூர்→Thanjavur,
              கன்னியாகுமரி→Kanyakumari, திருப்பூர்→Tiruppur, ஈரோடு→Erode, நாமக்கல்→Namakkal,
              கரூர்→Karur, வேலூர்→Vellore, குடியாத்தம்→Gudiyatham, கும்பகோணம்→Kumbakonam,
              திருவனந்தபுரம்→Thiruvananthapuram, பெங்களூர்→Bangalore, ஹைதராபாத்→Hyderabad,
              புதுச்சேரி→Pondicherry, தூத்துக்குடி→Thoothukudi, நாகர்கோவில்→Nagercoil,
              ராமநாதபுரம்→Ramanathapuram, கடலூர்→Cuddalore, விழுப்புரம்→Villupuram,
              செங்கல்பட்டு→Chengalpattu, தாம்பரம்→Tambaram, மதுரந்தகம்→Madurantakam
      BUS TERMS: பஸ்/வண்டி→Bus, எண்→Number, புறப்பாடு→Departure, வரவு→Arrival,
                 நிலையம்→Station, வழி→Via, மணி→hour, காலை→Morning/AM, மாலை→Evening/PM

      Return ONLY valid JSON (no markdown code blocks, no explanation):
      {
        "busNumber": "route/bus number like 570, 27D, MTC-45, or null if not found",
        "fromLocation": "departure city in English (e.g., Chennai, Madurai) or null",
        "toLocation": "destination city in English or null",
        "departureTimes": ["06:00", "08:30"],
        "arrivalTimes": ["14:00", "16:30"],
        "stops": ["Tambaram", "Chengalpattu", "Villupuram", "Trichy"],
        "busType": "EXPRESS/ORDINARY/DELUXE/AC/SUPER DELUXE or null",
        "via": "route description like 'via Trichy' or null",
        "confidence": 0.85,
        "extractedFields": ["busNumber", "fromLocation", "toLocation", "departureTimes", "arrivalTimes"],
        "warnings": [],
        "suggestions": []
      }

      ===================== CRITICAL EXTRACTION RULES =====================

      1. BUS NUMBER:
         - Look for patterns: 570, 27D, A1, MTC-45, TNSTC-123, SETC-456
         - Keywords: "Bus", "Route", "No", "Number", "பஸ்", "எண்"

      2. LOCATIONS (fromLocation, toLocation):
         - These are the START and END cities/towns, NOT intermediate stops
         - Common patterns: "X to Y", "X → Y", "X - Y", "from X to Y", "X லிருந்து Y க்கு"
         - "Departure: Chennai" means fromLocation is Chennai
         - "Arrival: Madurai" means toLocation is Madurai
         - Always output city names in English, even if input is Tamil
         - Do NOT include intermediate stops in fromLocation or toLocation

      3. TIME EXTRACTION (VERY IMPORTANT):
         - DEPARTURE TIME: Look for "Departure:", "Departs:", "Dep:", "starts at", "leaves at", "புறப்பாடு"
         - ARRIVAL TIME: Look for "Arrival:", "Arrives:", "Arr:", "reaches at", "ends at", "வரவு"
         - Convert ALL times to 24-hour HH:MM format:
           * "6:00 AM" → "06:00"
           * "6 AM" → "06:00"
           * "2:00 PM" → "14:00"
           * "2 PM" → "14:00"
           * "18:30" stays as "18:30"
           * "காலை 6 மணி" (morning 6) → "06:00"
           * "மாலை 5 மணி" (evening 5) → "17:00"
           * "இரவு 10 மணி" (night 10) → "22:00"
         - If text says "Departure: 6:00 AM, Arrival: 2:00 PM":
           * departureTimes: ["06:00"]
           * arrivalTimes: ["14:00"]
         - If multiple departure times mentioned (e.g., "6:00 AM, 8:00 AM, 10:00 AM"):
           * departureTimes: ["06:00", "08:00", "10:00"]

      4. STOPS (Intermediate Stops):
         - These are cities/towns BETWEEN fromLocation and toLocation
         - Look for keywords: "Stops:", "Via:", "வழி:", "through", "stopping at"
         - Example: "Chennai to Madurai, Stops: Tambaram, Chengalpattu, Villupuram, Trichy"
           * fromLocation: "Chennai"
           * toLocation: "Madurai"
           * stops: ["Tambaram", "Chengalpattu", "Villupuram", "Trichy"]
         - Do NOT include fromLocation or toLocation in the stops array
         - Always output stop names in English

      ===================== CONFIDENCE SCORING =====================
      
      - 0.9-1.0: Found busNumber + fromLocation + toLocation + departureTimes + arrivalTimes
      - 0.8-0.89: Found busNumber + fromLocation + toLocation + at least one time
      - 0.7-0.79: Found fromLocation + toLocation + time (no bus number)
      - 0.5-0.69: Found fromLocation + toLocation only
      - 0.3-0.49: Found partial information (only one location or only bus number)
      - 0.0-0.29: Cannot extract meaningful route data

      REDUCE CONFIDENCE BY 0.3 IF:
      - Text contains personal travel plans ("I'm going", "we will travel", "நான் போகிறேன்")
      - Text is asking a question about routes ("Which bus?", "எந்த பஸ்?")
      - Text is informal chat/conversation

      ADD HELPFUL SUGGESTIONS when data is incomplete:
      - If no bus number: "Add bus/route number for complete info"
      - If no times: "Include departure time like '6:00 AM' or 'காலை 6 மணி'"
      - If locations unclear: "Specify cities clearly like 'Chennai to Madurai'"

      TEXT TO ANALYZE:
      %s
      """;

  @Override
  @CircuitBreaker(name = "gemini", fallbackMethod = "extractBusScheduleFromTextFallback")
  @Bulkhead(name = "gemini")
  @Retry(name = "externalApi")
  public Map<String, Object> extractBusScheduleFromText(String text) {
    if (!isAvailable()) {
      log.warn("Gemini service is not available for text extraction");
      return createErrorResponse("Gemini service is not available");
    }

    if (text == null || text.trim().isEmpty()) {
      return createErrorResponse("Text is empty");
    }

    try {
      // Build the text-only request
      String requestBody = buildTextExtractionRequest(text);

      // Call the Gemini API
      String response = callGeminiApi(requestBody);

      // Parse the JSON response
      return parseTextExtractionResponse(response);

    } catch (Exception e) {
      log.error("Error extracting bus schedule from text: {}", e.getMessage(), e);
      return createErrorResponse("Text extraction failed: " + e.getMessage());
    }
  }

  /**
   * Build the JSON request body for text extraction.
   */
  private String buildTextExtractionRequest(String text) throws JsonProcessingException {
    ObjectNode root = objectMapper.createObjectNode();

    // Create contents array
    ArrayNode contents = objectMapper.createArrayNode();
    ObjectNode content = objectMapper.createObjectNode();

    // Create parts array with text prompt only (no image)
    ArrayNode parts = objectMapper.createArrayNode();

    // Add text prompt with the pasted text
    ObjectNode textPart = objectMapper.createObjectNode();
    String prompt = String.format(TEXT_EXTRACTION_PROMPT, text);
    textPart.put("text", prompt);
    parts.add(textPart);

    content.set("parts", parts);
    contents.add(content);
    root.set("contents", contents);

    // Add generation config for JSON output
    ObjectNode generationConfig = objectMapper.createObjectNode();
    generationConfig.put("temperature", 0.1); // Low temperature for consistent output
    generationConfig.put("maxOutputTokens", 2048);
    root.set("generationConfig", generationConfig);

    return objectMapper.writeValueAsString(root);
  }

  /**
   * Parse the JSON response from text extraction.
   */
  private Map<String, Object> parseTextExtractionResponse(String response) {
    try {
      JsonNode root = objectMapper.readTree(response);

      // Navigate to the text content
      JsonNode candidates = root.get("candidates");
      if (candidates == null || !candidates.isArray() || candidates.isEmpty()) {
        log.error("No candidates in Gemini response for text extraction");
        return createErrorResponse("No response from Gemini");
      }

      // Java 21 Sequenced Collections - getFirst() via iterator
      JsonNode firstCandidate = candidates.iterator().next();
      JsonNode content = firstCandidate.get("content");
      if (content == null) {
        return createErrorResponse("No content in Gemini response");
      }

      JsonNode parts = content.get("parts");
      if (parts == null || !parts.isArray() || parts.isEmpty()) {
        return createErrorResponse("No parts in Gemini response");
      }

      String textContent = parts.get(0).get("text").asText();
      log.info("Gemini text extraction response: {}", textContent);

      // Clean up markdown if present
      textContent = textContent.trim();
      if (textContent.startsWith("```json")) {
        textContent = textContent.substring(7);
      } else if (textContent.startsWith("```")) {
        textContent = textContent.substring(3);
      }
      if (textContent.endsWith("```")) {
        textContent = textContent.substring(0, textContent.length() - 3);
      }
      textContent = textContent.trim();

      // Parse JSON response
      Map<String, Object> result = objectMapper.readValue(textContent, new TypeReference<Map<String, Object>>() {
      });
      result.put("extractedBy", "gemini-text");
      result.put("model", modelName);

      log.info("Extracted from text - Bus: {}, From: {}, To: {}, Confidence: {}",
          result.get("busNumber"), result.get("fromLocation"),
          result.get("toLocation"), result.get("confidence"));

      return result;

    } catch (Exception e) {
      log.error("Error parsing Gemini text extraction response: {}", e.getMessage(), e);
      return createErrorResponse("Failed to parse response: " + e.getMessage());
    }
  }

  // ============================================
  // CIRCUIT BREAKER FALLBACK METHODS
  // ============================================

  /**
   * Fallback method when Gemini API circuit breaker is open for image URL
   * extraction.
   */
  @SuppressWarnings("unused")
  private Map<String, Object> extractBusScheduleFallback(String imageUrl, Throwable t) {
    log.warn("Gemini Vision circuit breaker triggered for image URL extraction. Error: {}", t.getMessage());
    Map<String, Object> response = createErrorResponse(
        "Gemini Vision service temporarily unavailable. Please try again in a few moments.");
    response.put("circuitBreakerTriggered", true);
    response.put("retryAfterSeconds", 30);
    return response;
  }

  /**
   * Fallback method when Gemini API circuit breaker is open for base64
   * extraction.
   */
  @SuppressWarnings("unused")
  private Map<String, Object> extractBusScheduleBase64Fallback(String base64ImageData, String mimeType, Throwable t) {
    log.warn("Gemini Vision circuit breaker triggered for base64 extraction. Error: {}", t.getMessage());
    Map<String, Object> response = createErrorResponse(
        "Gemini Vision service temporarily unavailable. Please try again in a few moments.");
    response.put("circuitBreakerTriggered", true);
    response.put("retryAfterSeconds", 30);
    return response;
  }

  /**
   * Fallback method when Gemini API circuit breaker is open for text extraction.
   */
  @SuppressWarnings("unused")
  private Map<String, Object> extractBusScheduleFromTextFallback(String text, Throwable t) {
    log.warn("Gemini Vision circuit breaker triggered for text extraction. Error: {}", t.getMessage());
    Map<String, Object> response = createErrorResponse(
        "Gemini Vision service temporarily unavailable. Please try again in a few moments.");
    response.put("circuitBreakerTriggered", true);
    response.put("retryAfterSeconds", 30);
    return response;
  }
}
