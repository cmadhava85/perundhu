package com.perundhu.domain.service;

import org.springframework.web.multipart.MultipartFile;
import com.perundhu.domain.model.RouteContribution;
import java.util.List;
import java.util.Map;

/**
 * OCR service interface for extracting text and data from images
 */
public interface OCRService {

    /**
     * Extract text from an image file
     */
    String extractTextFromImage(MultipartFile imageFile);

    /**
     * Extract text from an image URL
     */
    String extractTextFromImage(String imageUrl);

    /**
     * Check if an image contains valid bus schedule information
     */
    boolean isValidBusScheduleImage(MultipartFile imageFile);

    /**
     * Get confidence score for OCR extraction
     */
    double getExtractionConfidence(MultipartFile imageFile);

    /**
     * Parse extracted text into structured route data
     */
    RouteContribution parseRouteFromText(String extractedText);

    /**
     * Parse extracted text into multiple route contributions
     */
    List<RouteContribution> parseMultipleRoutes(String extractedText);

    /**
     * Parse schedule text into a map of key-value pairs
     */
    Map<String, Object> parseScheduleTextToMap(String extractedText);

    /**
     * Extract specific information from text
     */
    Map<String, String> extractBusScheduleInfo(String text);

    /**
     * Validate extracted bus schedule data
     */
    boolean validateExtractedData(Map<String, String> data);

    /**
     * Get supported image formats for OCR
     */
    List<String> getSupportedFormats();
}