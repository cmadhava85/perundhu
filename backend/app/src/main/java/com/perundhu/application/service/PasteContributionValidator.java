package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

/**
 * Service for validating pasted text contributions.
 * Detects spam, personal messages, and ensures text looks like a route
 * announcement. Provides actionable suggestions for failed validations.
 */
@Service
@Slf4j
public class PasteContributionValidator {

  private static final int MIN_TEXT_LENGTH = 20;
  private static final int MAX_TEXT_LENGTH = 1000;

  /**
   * Validate pasted text to ensure it's suitable for route contribution
   */
  public ValidationResult validatePasteContent(String text) {
    log.debug("Validating paste content: {}", text.substring(0, Math.min(50, text.length())));

    ValidationResult result = new ValidationResult();
    List<String> warnings = new ArrayList<>();
    List<String> suggestions = new ArrayList<>();

    if (text == null || text.trim().isEmpty()) {
      result.setValid(false);
      result.setReason("Text cannot be empty");
      result.setSuggestions(List.of(
          "Paste bus route information like: 'Bus 570 Chennai to Madurai 6:00 AM'",
          "You can copy text from WhatsApp, Facebook, or bus station boards"));
      return result;
    }

    // Check length
    if (text.length() < MIN_TEXT_LENGTH) {
      result.setValid(false);
      result.setReason("Text too short - minimum " + MIN_TEXT_LENGTH + " characters required");
      result.setSuggestions(List.of(
          "Include more details: bus number, from/to cities, and timing",
          "Example: 'Bus 27D from Coimbatore to Salem at 5:30 AM via Erode'"));
      return result;
    }

    if (text.length() > MAX_TEXT_LENGTH) {
      result.setValid(false);
      result.setReason("Text too long - maximum " + MAX_TEXT_LENGTH + " characters allowed");
      result.setSuggestions(List.of(
          "Paste only the relevant route information",
          "Remove chat messages and greetings"));
      return result;
    }

    // Must contain route-related keywords
    boolean hasRouteKeywords = text.matches(
        "(?i).*(bus|route|பஸ்|வண்டி|வழி|schedule|timing|timetable|service|TNSTC|MTC|SETC|express|departure|arrival|புறப்பாடு|வரவு).*");

    if (!hasRouteKeywords) {
      result.setValid(false);
      result.setReason("Text doesn't appear to contain bus route information");
      result.setSuggestions(List.of(
          "Include keywords like 'bus', 'route', or 'பஸ்'",
          "Example formats that work:",
          "• 'Bus 570 Chennai to Madurai'",
          "• '27D Coimbatore → Salem 6:00 AM'",
          "• 'சென்னை லிருந்து மதுரை பஸ் 570'"));
      return result;
    }

    // Must have from/to pattern
    boolean hasFromTo = text.matches(
        "(?i).*(from|to|புறப்பாடு|வரவு|லிருந்து|க்கு|->|→|➡️|–|=>| - ).*");

    if (!hasFromTo) {
      warnings.add("No clear 'from/to' pattern detected - extraction may fail");
      suggestions.add("Try formats like: 'Chennai to Madurai' or 'Chennai → Madurai' or 'சென்னை லிருந்து மதுரை க்கு'");
    }

    // Check for spam keywords
    boolean hasSpamKeywords = text.matches(
        "(?i).*(buy now|click here|download|free prize|win money|lottery|" +
            "call now|limited offer|act now|congratulations|claim your).*");

    if (hasSpamKeywords) {
      result.setValid(false);
      result.setReason("Text contains spam-like content");
      result.setSuggestions(List.of(
          "Please paste only genuine bus route information",
          "Remove promotional or spam content"));
      return result;
    }

    // Check if looks like personal chat/message
    boolean looksLikeChat = text.matches("(?i).*(hey bro|what's up|how are you|" +
        "hi there|hello friend|good morning|thanks bro|welcome da).*");

    if (looksLikeChat) {
      warnings.add("Text looks like personal chat - may not be a route announcement");
      suggestions.add("Extract just the route info from the chat, like: 'Bus 570 Chennai to Madurai 6 AM'");
    }

    // Check for excessive questions (likely asking, not sharing)
    int questionCount = text.split("\\?").length - 1;
    if (questionCount > 2) {
      result.setValid(false);
      result.setReason("Text contains too many questions - looks like an inquiry, not route information");
      result.setSuggestions(List.of(
          "This looks like you're asking about routes, not sharing route info",
          "For contributing, paste actual route details like timing and stops"));
      return result;
    }

    // Check for personal pronouns (likely personal travel plan)
    boolean hasPersonalPronouns = text.matches(
        "(?i).*(I'm going|I am going|we are going|my bus|our trip|I will|we will|" +
            "I need|we need|நான் போகிறேன்|நாங்கள்|என் பஸ்).*");

    if (hasPersonalPronouns) {
      warnings.add("Contains personal travel plan - may not be official route info");
      suggestions.add(
          "Rephrase as route info: Instead of 'I'm taking bus 570', say 'Bus 570 runs from Chennai to Madurai at 6 AM'");
    }

    // Check for future tense (planning, not announcing)
    boolean hasFutureTense = text.matches(
        "(?i).*(will go|going to travel|tomorrow|next week|planning to|போவேன்|போகிறேன்).*");

    if (hasFutureTense) {
      warnings.add("Contains future tense - may be travel plan, not current route info");
    }

    // Check for conversation patterns (greetings + questions)
    boolean hasGreetings = text.matches("(?i).*(hi|hello|hey|வணக்கம்|ஹலோ).*");
    if (hasGreetings && questionCount > 0) {
      warnings.add("Looks like a conversation thread - extract relevant route info only");
    }

    // Add format suggestions if there are warnings
    if (!warnings.isEmpty() && suggestions.isEmpty()) {
      suggestions.add("For best results, use formats like:");
      suggestions.add("• 'Bus 570: Chennai to Madurai, 6:00 AM'");
      suggestions.add("• 'Coimbatore → Salem via Erode, Bus 27D'");
    }

    result.setValid(true);
    result.setWarnings(warnings);
    result.setSuggestions(suggestions);
    log.info("Paste validation passed with {} warnings", warnings.size());
    return result;
  }

  /**
   * Detect if text is likely from WhatsApp
   */
  public boolean isWhatsAppFormat(String text) {
    return text.matches(".*\\[\\d{1,2}/\\d{1,2}/\\d{2,4},\\s*\\d{1,2}:\\d{2}.*");
  }

  /**
   * Detect if text contains emoji-heavy social media content
   */
  public boolean isSocialMediaFormat(String text) {
    // Count emojis (rough check)
    int emojiCount = text.length() - text.replaceAll("[\\p{So}\\p{Sk}]", "").length();
    return emojiCount > 3 || text.contains("🚌") || text.contains("➡️");
  }

  /**
   * Validation result containing status, reason, warnings, and suggestions
   */
  public static class ValidationResult {
    private boolean valid;
    private String reason;
    private List<String> warnings = new ArrayList<>();
    private List<String> suggestions = new ArrayList<>();

    public boolean isValid() {
      return valid;
    }

    public void setValid(boolean valid) {
      this.valid = valid;
    }

    public String getReason() {
      return reason;
    }

    public void setReason(String reason) {
      this.reason = reason;
    }

    public List<String> getWarnings() {
      return warnings;
    }

    public void setWarnings(List<String> warnings) {
      this.warnings = warnings;
    }

    public List<String> getSuggestions() {
      return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
      this.suggestions = suggestions;
    }
  }
}
