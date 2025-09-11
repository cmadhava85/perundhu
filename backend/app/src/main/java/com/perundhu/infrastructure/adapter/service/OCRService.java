package com.perundhu.infrastructure.adapter.service;

import com.perundhu.domain.model.RouteContribution;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Service interface for OCR (Optical Character Recognition) operations
 * Handles text extraction and parsing from bus schedule images
 */
public interface OCRService {

  /**
   * Extract text from an image file using OCR
   * 
   * @param imageFile The image file to process
   * @return OCRResult containing extracted text and confidence score
   */
  OCRResult extractTextFromImage(MultipartFile imageFile);

  /**
   * Extract text from an image URL using OCR
   * 
   * @param imageUrl The URL of the image to process
   * @return Extracted text from the image
   */
  String extractTextFromImageUrl(String imageUrl);

  /**
   * Parse extracted text into structured schedule data
   * 
   * @param extractedText The raw text extracted from OCR
   * @return Map containing parsed schedule information
   */
  Map<String, Object> parseScheduleTextToMap(String extractedText);

  /**
   * Parse extracted text into multiple route contributions
   * 
   * @param extractedText The raw text extracted from OCR
   * @return List of RouteContribution objects parsed from the text
   */
  List<RouteContribution> parseMultipleRoutes(String extractedText);

  /**
   * Check if the image is a valid bus schedule image
   * 
   * @param imageFile The image file to validate
   * @return true if it appears to be a bus schedule image
   */
  boolean isValidBusScheduleImage(MultipartFile imageFile);

  /**
   * Get the confidence score of text extraction
   * 
   * @param imageFile The image file that was processed
   * @return confidence score between 0.0 and 1.0
   */
  double getExtractionConfidence(MultipartFile imageFile);

  /**
   * Result of OCR text extraction operation
   */
  record OCRResult(
      String extractedText,
      double confidence,
      boolean isSuccess,
      String errorMessage) {
  }
}