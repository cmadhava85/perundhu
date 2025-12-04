package com.perundhu.infrastructure.adapter.out.ocr;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.perundhu.domain.port.OCREngine;
import com.perundhu.infrastructure.ocr.TesseractOcrService;

/**
 * Outbound adapter that implements the OCREngine port using Tesseract.
 * 
 * This adapter bridges the domain layer with Tesseract OCR,
 * following hexagonal architecture principles.
 * 
 * Note: OcrServiceAdapter is marked as @Primary and will be preferred when
 * available.
 */
@Component
public class TesseractOcrAdapter implements OCREngine {

  private static final Logger log = LoggerFactory.getLogger(TesseractOcrAdapter.class);

  private final TesseractOcrService tesseractOcrService;

  @Autowired
  public TesseractOcrAdapter(TesseractOcrService tesseractOcrService) {
    this.tesseractOcrService = tesseractOcrService;
    log.info("TesseractOcrAdapter initialized");
  }

  @Override
  public ExtractionResult extractText(String imageUrl) throws Exception {
    log.info("Extracting text from image using Tesseract: {}", imageUrl);

    try {
      TesseractOcrService.TimingExtractionResult result = tesseractOcrService.extractTimings(imageUrl, "Unknown");

      log.info("Tesseract extraction successful, confidence: {}", result.getConfidence());

      return new ExtractionResult(result.getRawText(), result.getConfidence());
    } catch (Exception e) {
      log.error("Tesseract OCR extraction failed for: {}", imageUrl, e);
      throw e;
    }
  }

  @Override
  public boolean isAvailable() {
    boolean available = tesseractOcrService != null;
    log.debug("Tesseract OCR available: {}", available);
    return available;
  }
}
