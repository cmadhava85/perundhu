package com.perundhu.domain.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Value object representing detected languages in OCR text
 */
public class LanguageDetectionResult {
  private String primaryLanguage;
  private List<DetectedLanguage> detectedLanguages;
  private String originalText;
  private String translatedText; // English translation if original was not English

  public LanguageDetectionResult() {
    this.detectedLanguages = new ArrayList<>();
  }

  public static LanguageDetectionResultBuilder builder() {
    return new LanguageDetectionResultBuilder();
  }

  // Getters and Setters
  public String getPrimaryLanguage() {
    return primaryLanguage;
  }

  public void setPrimaryLanguage(String primaryLanguage) {
    this.primaryLanguage = primaryLanguage;
  }

  public List<DetectedLanguage> getDetectedLanguages() {
    return detectedLanguages;
  }

  public void setDetectedLanguages(List<DetectedLanguage> detectedLanguages) {
    this.detectedLanguages = detectedLanguages;
  }

  public String getOriginalText() {
    return originalText;
  }

  public void setOriginalText(String originalText) {
    this.originalText = originalText;
  }

  public String getTranslatedText() {
    return translatedText;
  }

  public void setTranslatedText(String translatedText) {
    this.translatedText = translatedText;
  }

  /**
   * Nested class for individual language detection
   */
  public static class DetectedLanguage {
    private String code; // ISO 639-1 code (en, ta, hi, etc.)
    private String name; // Full name (English, Tamil, Hindi)
    private double confidence; // 0.0 to 1.0

    public DetectedLanguage() {
    }

    public DetectedLanguage(String code, String name, double confidence) {
      this.code = code;
      this.name = name;
      this.confidence = confidence;
    }

    public String getCode() {
      return code;
    }

    public void setCode(String code) {
      this.code = code;
    }

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }

    public double getConfidence() {
      return confidence;
    }

    public void setConfidence(double confidence) {
      this.confidence = confidence;
    }
  }

  /**
   * Builder for LanguageDetectionResult
   */
  public static class LanguageDetectionResultBuilder {
    private final LanguageDetectionResult result = new LanguageDetectionResult();

    public LanguageDetectionResultBuilder primaryLanguage(String primaryLanguage) {
      result.setPrimaryLanguage(primaryLanguage);
      return this;
    }

    public LanguageDetectionResultBuilder detectedLanguages(List<DetectedLanguage> detectedLanguages) {
      result.setDetectedLanguages(detectedLanguages);
      return this;
    }

    public LanguageDetectionResultBuilder addDetectedLanguage(String code, String name, double confidence) {
      if (result.getDetectedLanguages() == null) {
        result.setDetectedLanguages(new ArrayList<>());
      }
      result.getDetectedLanguages().add(new DetectedLanguage(code, name, confidence));
      return this;
    }

    public LanguageDetectionResultBuilder originalText(String originalText) {
      result.setOriginalText(originalText);
      return this;
    }

    public LanguageDetectionResultBuilder translatedText(String translatedText) {
      result.setTranslatedText(translatedText);
      return this;
    }

    public LanguageDetectionResult build() {
      return result;
    }
  }

  /**
   * Convert to JSON string for database storage
   */
  public String toJson() {
    StringBuilder json = new StringBuilder("{\"languages\":[");
    for (int i = 0; i < detectedLanguages.size(); i++) {
      DetectedLanguage lang = detectedLanguages.get(i);
      json.append("{")
          .append("\"code\":\"").append(lang.getCode()).append("\",")
          .append("\"name\":\"").append(lang.getName()).append("\",")
          .append("\"confidence\":").append(lang.getConfidence())
          .append("}");
      if (i < detectedLanguages.size() - 1) {
        json.append(",");
      }
    }
    json.append("],\"primary\":\"").append(primaryLanguage).append("\"}");
    return json.toString();
  }
}
