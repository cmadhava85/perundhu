package com.perundhu.application.port.input;

import com.perundhu.domain.model.ImageContribution;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Input port for image contribution use cases
 * Defines the contract for image contribution processing operations
 */
public interface ImageContributionInputPort {

  /**
   * Process an uploaded bus schedule image
   * This is the main entry point for image contribution processing
   * 
   * @param imageFile The uploaded image file
   * @param metadata  Additional metadata about the image
   * @param userId    The ID of the user submitting the contribution
   * @return The created ImageContribution record
   */
  ImageContribution processImageContribution(
      MultipartFile imageFile,
      Map<String, String> metadata,
      String userId);

  /**
   * Get processing statistics for admin dashboard
   * 
   * @return Map containing various processing statistics
   */
  Map<String, Object> getProcessingStatistics();
}