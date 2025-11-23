package com.perundhu.infrastructure.ocr;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.imageio.ImageIO;

import org.imgscalr.Scalr;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;

/**
 * OCR Service using Tesseract for extracting timing data from bus timing board
 * images
 * Supports Tamil + English text recognition
 */
@Service
public class TesseractOcrService {
  private static final Logger logger = LoggerFactory.getLogger(TesseractOcrService.class);

  private final ITesseract tesseract;

  // Tamil keywords for timing categories
  private static final String TAMIL_MORNING = "காலை";
  private static final String TAMIL_AFTERNOON = "மாலை";
  private static final String TAMIL_NIGHT = "இரவு";

  // Pattern to match time formats: 5:30, 05:30, 5.30, 530, etc.
  private static final Pattern TIME_PATTERN = Pattern.compile(
      "\\b([0-2]?[0-9]):?([0-5][0-9])\\b");

  public TesseractOcrService() {
    this.tesseract = new Tesseract();

    // Configure Tesseract
    // Note: You need to install Tesseract and Tamil language data
    // macOS: brew install tesseract tesseract-lang
    // Linux: apt-get install tesseract-ocr tesseract-ocr-tam

    String tessDataPath = System.getenv("TESSDATA_PREFIX");
    if (tessDataPath == null) {
      // Default paths for common installations
      if (System.getProperty("os.name").toLowerCase().contains("mac")) {
        tessDataPath = "/opt/homebrew/share/tessdata";
      } else {
        tessDataPath = "/usr/share/tesseract-ocr/4.00/tessdata";
      }
    }

    tesseract.setDatapath(tessDataPath);
    tesseract.setLanguage("tam+eng"); // Tamil + English
    tesseract.setPageSegMode(1); // Automatic page segmentation with OSD
    tesseract.setOcrEngineMode(1); // Neural nets LSTM engine only
  }

  /**
   * Extract timing data from a bus timing board image
   */
  public TimingExtractionResult extractTimings(String imageUrl, String originLocation) {
    try {
      // Download and preprocess image
      BufferedImage originalImage = downloadImage(imageUrl);
      BufferedImage preprocessedImage = preprocessImage(originalImage);

      // Extract raw text using OCR
      String rawText = tesseract.doOCR(preprocessedImage);
      logger.info("Raw OCR text extracted: {} characters", rawText.length());
      logger.debug("Raw text: {}", rawText);

      // Parse the extracted text to structured timing data
      TimingExtractionResult result = parseTimingBoard(rawText, originLocation);

      // Calculate confidence based on OCR quality
      result.setConfidence(calculateConfidence(rawText, result));
      result.setRawText(rawText);

      return result;

    } catch (Exception e) {
      logger.error("Failed to extract timings from image: {}", imageUrl, e);
      throw new OcrException("Failed to extract timings: " + e.getMessage(), e);
    }
  }

  /**
   * Download image from URL
   */
  private BufferedImage downloadImage(String imageUrl) throws IOException {
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return ImageIO.read(new URL(imageUrl));
    } else {
      return ImageIO.read(new File(imageUrl));
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  private BufferedImage preprocessImage(BufferedImage original) {
    // Resize if too large (maintain aspect ratio)
    int maxDimension = 2000;
    BufferedImage resized = original;
    if (original.getWidth() > maxDimension || original.getHeight() > maxDimension) {
      resized = Scalr.resize(original, Scalr.Method.QUALITY, Scalr.Mode.FIT_TO_WIDTH,
          maxDimension, maxDimension, Scalr.OP_ANTIALIAS);
    }

    // Convert to grayscale
    BufferedImage grayscale = new BufferedImage(
        resized.getWidth(), resized.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
    Graphics2D g = grayscale.createGraphics();
    g.drawImage(resized, 0, 0, null);
    g.dispose();

    // Increase contrast (simple approach)
    return enhanceContrast(grayscale);
  }

  /**
   * Enhance image contrast for better OCR
   */
  private BufferedImage enhanceContrast(BufferedImage image) {
    // Simple contrast enhancement by adjusting brightness
    for (int y = 0; y < image.getHeight(); y++) {
      for (int x = 0; x < image.getWidth(); x++) {
        int pixel = image.getRGB(x, y);
        int gray = pixel & 0xFF;

        // Increase contrast: make dark darker, light lighter
        gray = (int) (((gray - 128) * 1.5) + 128);
        gray = Math.max(0, Math.min(255, gray));

        int newPixel = (gray << 16) | (gray << 8) | gray;
        image.setRGB(x, y, newPixel);
      }
    }
    return image;
  }

  /**
   * Parse raw OCR text into structured timing data
   */
  private TimingExtractionResult parseTimingBoard(String rawText, String originLocation) {
    TimingExtractionResult result = new TimingExtractionResult();
    result.setOrigin(originLocation);
    result.setTimings(new ArrayList<>());
    result.setWarnings(new ArrayList<>());

    // Split text into lines
    String[] lines = rawText.split("\\r?\\n");

    String currentDestination = null;
    List<String> currentMorning = new ArrayList<>();
    List<String> currentAfternoon = new ArrayList<>();
    List<String> currentNight = new ArrayList<>();
    String currentCategory = null;

    for (String line : lines) {
      line = line.trim();
      if (line.isEmpty())
        continue;

      // Check for timing category headers
      if (line.contains(TAMIL_MORNING) || line.toLowerCase().contains("morning")) {
        currentCategory = "MORNING";
        continue;
      } else if (line.contains(TAMIL_AFTERNOON) || line.toLowerCase().contains("afternoon")) {
        currentCategory = "AFTERNOON";
        continue;
      } else if (line.contains(TAMIL_NIGHT) || line.toLowerCase().contains("night")) {
        currentCategory = "NIGHT";
        continue;
      }

      // Check if line contains a destination name (letters, not just times)
      boolean hasLetters = line.matches(".*[a-zA-Z\\p{Tamil}]+.*");
      boolean hasTimes = TIME_PATTERN.matcher(line).find();

      if (hasLetters && !hasTimes) {
        // This is likely a destination name
        // Save previous destination if exists
        if (currentDestination != null) {
          ExtractedTiming timing = new ExtractedTiming();
          timing.setDestination(currentDestination);
          timing.setMorningTimings(new ArrayList<>(currentMorning));
          timing.setAfternoonTimings(new ArrayList<>(currentAfternoon));
          timing.setNightTimings(new ArrayList<>(currentNight));
          result.getTimings().add(timing);

          currentMorning.clear();
          currentAfternoon.clear();
          currentNight.clear();
        }

        currentDestination = cleanDestinationName(line);

      } else if (hasTimes) {
        // This line contains timing information
        List<String> times = extractTimes(line);

        // Add times to appropriate category
        if ("MORNING".equals(currentCategory)) {
          currentMorning.addAll(times);
        } else if ("AFTERNOON".equals(currentCategory)) {
          currentAfternoon.addAll(times);
        } else if ("NIGHT".equals(currentCategory)) {
          currentNight.addAll(times);
        } else {
          // No category specified, try to infer from time
          for (String time : times) {
            inferTimingCategory(time, currentMorning, currentAfternoon, currentNight);
          }
        }
      }
    }

    // Add last destination
    if (currentDestination != null) {
      ExtractedTiming timing = new ExtractedTiming();
      timing.setDestination(currentDestination);
      timing.setMorningTimings(new ArrayList<>(currentMorning));
      timing.setAfternoonTimings(new ArrayList<>(currentAfternoon));
      timing.setNightTimings(new ArrayList<>(currentNight));
      result.getTimings().add(timing);
    }

    // Add warnings if needed
    if (result.getTimings().isEmpty()) {
      result.getWarnings().add("No destinations or timings found in the image");
    }

    return result;
  }

  /**
   * Extract all time values from a line
   */
  private List<String> extractTimes(String line) {
    List<String> times = new ArrayList<>();
    Matcher matcher = TIME_PATTERN.matcher(line);

    while (matcher.find()) {
      String hour = matcher.group(1);
      String minute = matcher.group(2);

      // Normalize to HH:MM format
      if (hour.length() == 1) {
        hour = "0" + hour;
      }
      times.add(hour + ":" + minute);
    }

    return times;
  }

  /**
   * Infer timing category based on hour value
   */
  private void inferTimingCategory(String time, List<String> morning,
      List<String> afternoon, List<String> night) {
    try {
      String[] parts = time.split(":");
      int hour = Integer.parseInt(parts[0]);

      if (hour >= 5 && hour < 12) {
        morning.add(time);
      } else if (hour >= 12 && hour < 18) {
        afternoon.add(time);
      } else {
        night.add(time);
      }
    } catch (Exception e) {
      logger.warn("Failed to infer timing category for: {}", time);
    }
  }

  /**
   * Clean destination name by removing extra characters
   */
  private String cleanDestinationName(String name) {
    // Remove special characters but keep Tamil and English letters, spaces
    // Tamil Unicode range: U+0B80-U+0BFF
    return name.replaceAll("[^a-zA-Z\\u0B80-\\u0BFF\\s]", "").trim();
  }

  /**
   * Calculate OCR confidence score
   */
  private BigDecimal calculateConfidence(String rawText, TimingExtractionResult result) {
    double score = 0.5; // Base score

    // Increase confidence if we found destinations
    if (!result.getTimings().isEmpty()) {
      score += 0.2;
    }

    // Increase confidence if we found multiple timings
    int totalTimings = result.getTimings().stream()
        .mapToInt(t -> t.getMorningTimings().size() +
            t.getAfternoonTimings().size() +
            t.getNightTimings().size())
        .sum();

    if (totalTimings > 5) {
      score += 0.2;
    } else if (totalTimings > 0) {
      score += 0.1;
    }

    // Check text quality (presence of Tamil/English characters)
    // Tamil Unicode range: U+0B80-U+0BFF
    if (rawText.matches(".*[a-zA-Z\\u0B80-\\u0BFF]+.*")) {
      score += 0.1;
    }

    return BigDecimal.valueOf(Math.min(1.0, score));
  }

  /**
   * Custom exception for OCR failures
   */
  public static class OcrException extends RuntimeException {
    public OcrException(String message, Throwable cause) {
      super(message, cause);
    }
  }

  /**
   * Result of timing extraction
   */
  public static class TimingExtractionResult {
    private String origin;
    private List<ExtractedTiming> timings;
    private BigDecimal confidence;
    private String rawText;
    private List<String> warnings;

    // Getters and Setters
    public String getOrigin() {
      return origin;
    }

    public void setOrigin(String origin) {
      this.origin = origin;
    }

    public List<ExtractedTiming> getTimings() {
      return timings;
    }

    public void setTimings(List<ExtractedTiming> timings) {
      this.timings = timings;
    }

    public BigDecimal getConfidence() {
      return confidence;
    }

    public void setConfidence(BigDecimal confidence) {
      this.confidence = confidence;
    }

    public String getRawText() {
      return rawText;
    }

    public void setRawText(String rawText) {
      this.rawText = rawText;
    }

    public List<String> getWarnings() {
      return warnings;
    }

    public void setWarnings(List<String> warnings) {
      this.warnings = warnings;
    }
  }

  /**
   * Extracted timing for a single destination
   */
  public static class ExtractedTiming {
    private String destination;
    private List<String> morningTimings;
    private List<String> afternoonTimings;
    private List<String> nightTimings;

    // Getters and Setters
    public String getDestination() {
      return destination;
    }

    public void setDestination(String destination) {
      this.destination = destination;
    }

    public List<String> getMorningTimings() {
      return morningTimings;
    }

    public void setMorningTimings(List<String> morningTimings) {
      this.morningTimings = morningTimings;
    }

    public List<String> getAfternoonTimings() {
      return afternoonTimings;
    }

    public void setAfternoonTimings(List<String> afternoonTimings) {
      this.afternoonTimings = afternoonTimings;
    }

    public List<String> getNightTimings() {
      return nightTimings;
    }

    public void setNightTimings(List<String> nightTimings) {
      this.nightTimings = nightTimings;
    }
  }
}
