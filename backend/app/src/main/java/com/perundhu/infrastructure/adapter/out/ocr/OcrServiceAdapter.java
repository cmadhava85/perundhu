package com.perundhu.infrastructure.adapter.out.ocr;

import java.math.BigDecimal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import com.perundhu.domain.port.OCREngine;
import com.perundhu.infrastructure.ocr.TesseractOcrService;

/**
 * Outbound adapter that implements the OCREngine port interface.
 * Uses PaddleOCR Python microservice as primary OCR engine with Tesseract
 * fallback.
 * 
 * This adapter bridges the domain layer with external OCR services,
 * following hexagonal architecture principles.
 * 
 * Marked as @Primary so Spring will prefer this over TesseractOCREngineAdapter.
 */
@Component
@Primary
public class OcrServiceAdapter implements OCREngine {

  private static final Logger log = LoggerFactory.getLogger(OcrServiceAdapter.class);

  private final OcrServiceClient ocrServiceClient;
  private final TesseractOcrService tesseractOcrService;

  @Value("${ocr.service.enabled:true}")
  private boolean ocrServiceEnabled;

  @Autowired
  public OcrServiceAdapter(
      OcrServiceClient ocrServiceClient,
      @Autowired(required = false) TesseractOcrService tesseractOcrService) {
    this.ocrServiceClient = ocrServiceClient;
    this.tesseractOcrService = tesseractOcrService;

    log.info("OcrServiceAdapter initialized (Tesseract fallback: {})",
        tesseractOcrService != null ? "available" : "not available");
  }

  @Override
  public ExtractionResult extractText(String imageUrl) throws Exception {
    log.info("Extracting text from image: {}", imageUrl);

    // Try OCR service first if enabled and available
    if (ocrServiceEnabled && ocrServiceClient.isAvailable()) {
      try {
        log.info("Using PaddleOCR service for text extraction");
        OcrServiceClient.OcrResult result = ocrServiceClient.extractText(imageUrl);

        log.info("OCR extraction successful, confidence: {}", result.getConfidence());

        return new ExtractionResult(
            result.getExtractedText(),
            BigDecimal.valueOf(result.getConfidence()));
      } catch (OcrServiceClient.OcrException e) {
        log.warn("OCR service extraction failed: {}", e.getMessage());
        if (tesseractOcrService == null) {
          throw new OcrExtractionException("OCR service failed and Tesseract fallback not available", e);
        }
        log.info("Falling back to Tesseract...");
      }
    }

    // Fallback to Tesseract
    if (tesseractOcrService == null) {
      throw new OcrExtractionException(
          "No OCR engine available - OCR service not running and Tesseract not configured");
    }

    log.info("Using Tesseract for text extraction");
    try {
      TesseractOcrService.TimingExtractionResult result = tesseractOcrService.extractTimings(imageUrl, "Unknown");

      log.info("Tesseract extraction successful, confidence: {}", result.getConfidence());

      return new ExtractionResult(result.getRawText(), result.getConfidence());
    } catch (Exception e) {
      log.error("OCR extraction failed for: {}", imageUrl, e);
      throw e;
    }
  }

  @Override
  public boolean isAvailable() {
    boolean ocrServiceAvailable = ocrServiceEnabled && ocrServiceClient.isAvailable();
    boolean tesseractAvailable = tesseractOcrService != null;

    boolean available = ocrServiceAvailable || tesseractAvailable;
    log.debug("OCR engine available: {} (OCR Service: {}, Tesseract: {})",
        available, ocrServiceAvailable, tesseractAvailable);
    return available;
  }

  /**
   * Check if OCR service (PaddleOCR) specifically is available
   */
  public boolean isOcrServiceAvailable() {
    return ocrServiceEnabled && ocrServiceClient.isAvailable();
  }

  /**
   * Custom exception for OCR extraction failures
   */
  public static class OcrExtractionException extends RuntimeException {
    public OcrExtractionException(String message) {
      super(message);
    }

    public OcrExtractionException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
