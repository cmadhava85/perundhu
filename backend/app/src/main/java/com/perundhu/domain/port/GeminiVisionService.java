package com.perundhu.domain.port;

import java.util.Map;

/**
 * Port interface for Gemini Vision AI service.
 * Used for intelligent OCR extraction from bus schedule images.
 * 
 * Gemini Vision can understand the semantic structure of bus schedules,
 * identifying origins, destinations, routes, and timings with high accuracy.
 */
public interface GeminiVisionService {

  /**
   * Extract structured bus schedule data from an image using Gemini Vision.
   * 
   * @param imageUrl URL of the image to analyze
   * @return Structured data including origin, destination, routes, timings, etc.
   */
  Map<String, Object> extractBusScheduleFromImage(String imageUrl);

  /**
   * Extract structured bus schedule data from base64-encoded image data.
   * 
   * @param base64ImageData Base64-encoded image data
   * @param mimeType        The MIME type of the image (e.g., "image/jpeg",
   *                        "image/png")
   * @return Structured data including origin, destination, routes, timings, etc.
   */
  Map<String, Object> extractBusScheduleFromBase64(String base64ImageData, String mimeType);

  /**
   * Extract structured bus schedule data from base64-encoded image data with additional context.
   * The context can include user-provided descriptions that help identify origin/destination
   * when the image alone doesn't make it clear.
   * 
   * @param base64ImageData Base64-encoded image data
   * @param mimeType        The MIME type of the image (e.g., "image/jpeg", "image/png")
   * @param userContext     Additional context from user (e.g., "Buses from Chennai to Madurai")
   * @return Structured data including origin, destination, routes, timings, etc.
   */
  Map<String, Object> extractBusScheduleFromBase64WithContext(String base64ImageData, String mimeType, String userContext);

  /**
   * Check if the Gemini Vision service is available and configured.
   * 
   * @return true if the service is available, false otherwise
   */
  boolean isAvailable();

  /**
   * Get the provider name for logging/debugging purposes.
   * 
   * @return Provider name (e.g., "gemini-1.5-flash", "vertex-ai")
   */
  String getProviderName();

  /**
   * Extract structured bus schedule data from plain text using Gemini AI.
   * This is used for paste contributions where users paste text from WhatsApp,
   * Facebook, or other sources.
   * 
   * @param text The pasted text containing bus route information
   * @return Structured data including origin, destination, routes, timings, etc.
   */
  Map<String, Object> extractBusScheduleFromText(String text);
}
