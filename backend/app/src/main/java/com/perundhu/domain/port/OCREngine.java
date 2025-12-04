package com.perundhu.domain.port;

import java.math.BigDecimal;

/**
 * Port interface for OCR engine implementations
 * This allows the domain to depend on an abstraction rather than concrete
 * implementations
 */
public interface OCREngine {

  /**
   * Result object containing extracted text and metadata
   */
  class ExtractionResult {
    private final String rawText;
    private final BigDecimal confidence;

    public ExtractionResult(String rawText, BigDecimal confidence) {
      this.rawText = rawText;
      this.confidence = confidence;
    }

    public String getRawText() {
      return rawText;
    }

    public BigDecimal getConfidence() {
      return confidence;
    }
  }

  /**
   * Extract text from an image URL
   * 
   * @param imageUrl URL or file path of the image
   * @return Extraction result containing raw text and confidence score
   * @throws Exception if extraction fails
   */
  ExtractionResult extractText(String imageUrl) throws Exception;

  /**
   * Check if the OCR engine is available and configured
   * 
   * @return true if the engine is ready to use
   */
  boolean isAvailable();
}
