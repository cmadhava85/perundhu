package com.perundhu.domain.port;

import java.util.List;

/**
 * Port interface for fuzzy string matching operations.
 * Used for OCR error correction and location name matching.
 */
public interface FuzzyMatcherPort {

  /**
   * Calculate similarity between two strings (0.0 to 1.0)
   * 
   * @param s1 First string
   * @param s2 Second string
   * @return Similarity score between 0.0 and 1.0
   */
  double similarity(String s1, String s2);

  /**
   * Find the best match for a string from a list of candidates
   * 
   * @param target      The string to match
   * @param candidates  List of candidate strings
   * @param maxDistance Maximum edit distance allowed
   * @return The best matching string, or null if no good match found
   */
  String findBestMatch(String target, List<String> candidates, int maxDistance);

  /**
   * Correct common OCR errors in text
   * 
   * @param text Text with potential OCR errors
   * @return Corrected text
   */
  String correctCommonOCRErrors(String text);
}
