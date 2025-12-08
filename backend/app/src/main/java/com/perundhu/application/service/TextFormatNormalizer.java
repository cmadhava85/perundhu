package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for normalizing various text formats (WhatsApp, Facebook, Twitter)
 * into a standardized format for route parsing.
 */
@Service
@Slf4j
public class TextFormatNormalizer {

  private static final Map<String, String> CITY_ABBREVIATIONS = new HashMap<>();

  static {
    // Common city abbreviations in Tamil Nadu
    CITY_ABBREVIATIONS.put("CHE", "Chennai");
    CITY_ABBREVIATIONS.put("MDU", "Madurai");
    CITY_ABBREVIATIONS.put("CBE", "Coimbatore");
    CITY_ABBREVIATIONS.put("TRY", "Trichy");
    CITY_ABBREVIATIONS.put("TCH", "Tiruchirapalli");
    CITY_ABBREVIATIONS.put("SLM", "Salem");
    CITY_ABBREVIATIONS.put("ERD", "Erode");
    CITY_ABBREVIATIONS.put("TNR", "Thanjavur");
    CITY_ABBREVIATIONS.put("TUP", "Tiruppur");
    CITY_ABBREVIATIONS.put("DGL", "Dindigul");
    CITY_ABBREVIATIONS.put("VLR", "Vellore");
    CITY_ABBREVIATIONS.put("TVR", "Tirunelveli");
    CITY_ABBREVIATIONS.put("KNY", "Kanyakumari");
    CITY_ABBREVIATIONS.put("TUT", "Tuticorin");
  }

  /**
   * Normalize text to standard format regardless of source
   */
  public String normalizeToStandardFormat(String text) {
    if (text == null || text.trim().isEmpty()) {
      return text;
    }

    log.debug("Normalizing text format");

    // Detect and normalize based on format using Java 17 switch expression
    FormatType format = detectFormat(text);
    String normalized = switch (format) {
      case WHATSAPP -> normalizeWhatsApp(text);
      case FACEBOOK -> normalizeFacebook(text);
      case TWITTER -> normalizeTwitter(text);
      case PLAIN -> normalizePlainText(text);
    };

    log.info("Normalized {} format text", format);
    return normalized;
  }

  /**
   * Detect the format type of the pasted text
   */
  public FormatType detectFormat(String text) {
    // WhatsApp format: "[01/12/2025, 10:30] Name: "
    if (text.matches(".*\\[\\d{1,2}/\\d{1,2}/\\d{2,4},\\s*\\d{1,2}:\\d{2}.*")) {
      return FormatType.WHATSAPP;
    }

    // Facebook/Instagram: Heavy emoji usage
    int emojiCount = countEmojis(text);
    if (emojiCount > 3 || text.contains("🚌") || text.contains("➡️")) {
      return FormatType.FACEBOOK;
    }

    // Twitter: Contains hashtags and short length
    if (text.contains("#") && text.length() < 280) {
      return FormatType.TWITTER;
    }

    return FormatType.PLAIN;
  }

  /**
   * Normalize WhatsApp format text
   */
  private String normalizeWhatsApp(String text) {
    // Remove timestamps: "[01/12/2025, 10:30:45] Ramesh: "
    text = text.replaceAll(
        "\\[\\d{1,2}/\\d{1,2}/\\d{2,4},\\s*\\d{1,2}:\\d{2}(?::\\d{2})?(?:\\s*[AP]M)?\\]\\s*[^:]+:\\s*",
        "");

    // Remove "forwarded message" markers
    text = text.replaceAll("(?i)\\*?forwarded.*?\\*?\\n", "");
    text = text.replaceAll("(?i)\\*?forwarded.*?\\*?\\s", "");

    // Remove WhatsApp media placeholders
    text = text.replaceAll("(?i)<Media omitted>", "");
    text = text.replaceAll("(?i)\\[image\\]", "");
    text = text.replaceAll("(?i)\\[video\\]", "");

    return text.trim();
  }

  /**
   * Normalize Facebook/Instagram format text
   */
  private String normalizeFacebook(String text) {
    // Remove excessive emojis while keeping route-relevant ones
    text = removeNonRouteEmojis(text);

    // Normalize arrow symbols to standard format
    text = text.replaceAll("[➡️→➜⇒⟶]", " to ");
    text = text.replaceAll("[⬅️←⬅]", " from ");

    // Remove Facebook-specific markers
    text = text.replaceAll("(?i)See more\\.\\.\\.?", "");
    text = text.replaceAll("(?i)See less", "");
    text = text.replaceAll("(?i)\\d+\\s*likes?", "");
    text = text.replaceAll("(?i)\\d+\\s*comments?", "");

    return text.trim();
  }

  /**
   * Normalize Twitter format text
   */
  private String normalizeTwitter(String text) {
    // Remove hashtags from the text (keep the words)
    text = text.replaceAll("#(\\w+)", "$1");

    // Remove @mentions
    text = text.replaceAll("@\\w+", "");

    // Expand city abbreviations common in Twitter
    text = expandCityAbbreviations(text);

    // Remove "RT" prefix for retweets
    text = text.replaceAll("^RT\\s*:?\\s*", "");

    return text.trim();
  }

  /**
   * Normalize plain text (basic cleanup)
   */
  private String normalizePlainText(String text) {
    // Normalize arrows and special characters
    text = text.replaceAll("[→➡️⇒]", " to ");
    text = text.replaceAll("[←⬅️]", " from ");

    // Remove multiple spaces
    text = text.replaceAll("\\s+", " ");

    // Remove leading/trailing whitespace
    return text.trim();
  }

  /**
   * Expand city abbreviations (CHE -> Chennai, MDU -> Madurai)
   */
  private String expandCityAbbreviations(String text) {
    for (Map.Entry<String, String> entry : CITY_ABBREVIATIONS.entrySet()) {
      // Match abbreviation with word boundaries and arrows
      String pattern = "\\b" + entry.getKey() + "\\b";
      text = text.replaceAll(pattern, entry.getValue());

      // Also match with arrow patterns like "CHE->MDU"
      String arrowPattern = entry.getKey() + "(?=->|→)";
      text = text.replaceAll(arrowPattern, entry.getValue());
    }
    return text;
  }

  /**
   * Remove non-route-related emojis while keeping bus emojis
   */
  private String removeNonRouteEmojis(String text) {
    // Keep bus/transport emojis: 🚌 🚍 🚎 🚐 ➡️ ⬅️ 🚏
    String keepEmojis = "🚌🚍🚎🚐➡️⬅️🚏→←";

    StringBuilder result = new StringBuilder();
    for (char c : text.toCharArray()) {
      // Keep if it's not an emoji OR it's a transport emoji
      if (!Character.isSupplementaryCodePoint(c) || keepEmojis.indexOf(c) >= 0) {
        result.append(c);
      }
    }
    return result.toString();
  }

  /**
   * Count emojis in text (rough estimate)
   */
  private int countEmojis(String text) {
    if (text == null || text.isEmpty()) {
      return 0;
    }

    // Count characters that are in emoji ranges
    int count = 0;
    for (char c : text.toCharArray()) {
      if (Character.isSupplementaryCodePoint(c)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get format metadata for logging/display
   */
  public FormatMetadata getFormatMetadata(String text) {
    FormatType type = detectFormat(text);
    int originalLength = text.length();
    String normalized = normalizeToStandardFormat(text);
    int normalizedLength = normalized.length();

    return new FormatMetadata(type, originalLength, normalizedLength);
  }

  /**
   * Format types supported
   */
  public enum FormatType {
    WHATSAPP,
    FACEBOOK,
    TWITTER,
    PLAIN
  }

  /**
   * Metadata about format detection and normalization
   */
  public static class FormatMetadata {
    private final FormatType type;
    private final int originalLength;
    private final int normalizedLength;

    public FormatMetadata(FormatType type, int originalLength, int normalizedLength) {
      this.type = type;
      this.originalLength = originalLength;
      this.normalizedLength = normalizedLength;
    }

    public FormatType getType() {
      return type;
    }

    public int getOriginalLength() {
      return originalLength;
    }

    public int getNormalizedLength() {
      return normalizedLength;
    }

    public int getRemovedCharacters() {
      return originalLength - normalizedLength;
    }
  }
}
