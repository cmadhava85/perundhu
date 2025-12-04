package com.perundhu.infrastructure.adapter.out.ocr;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * HTTP client for the OCR Python microservice (PaddleOCR).
 * This is an infrastructure component that handles the external service
 * communication.
 * 
 * Part of the outbound adapter layer in hexagonal architecture.
 */
@Component
public class OcrServiceClient {

  private static final Logger logger = LoggerFactory.getLogger(OcrServiceClient.class);

  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;

  @Value("${ocr.service.url:http://localhost:8081}")
  private String ocrServiceUrl;

  @Value("${ocr.service.timeout:60}")
  private int timeoutSeconds;

  public OcrServiceClient() {
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();
    this.objectMapper = new ObjectMapper();
  }

  /**
   * Check if OCR service is available
   */
  public boolean isAvailable() {
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(ocrServiceUrl + "/health"))
          .timeout(Duration.ofSeconds(5))
          .GET()
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      return response.statusCode() == 200;
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      logger.warn("OCR service health check interrupted: {}", e.getMessage());
      return false;
    } catch (Exception e) {
      logger.debug("OCR service not available at {}: {}", ocrServiceUrl, e.getMessage());
      return false;
    }
  }

  /**
   * Extract text from an image file or URL using OCR service
   * 
   * @param imagePathOrUrl Path to the image file or HTTP URL
   * @return OCR result with extracted text and confidence
   */
  public OcrResult extractText(String imagePathOrUrl) throws OcrException {
    try {
      // Check if it's a URL or a local file path
      if (imagePathOrUrl.startsWith("http://") || imagePathOrUrl.startsWith("https://")) {
        return extractTextFromUrl(imagePathOrUrl);
      }

      // Local file path
      Path path = Path.of(imagePathOrUrl);
      if (!Files.exists(path)) {
        throw new OcrException("Image file not found: " + imagePathOrUrl);
      }

      byte[] imageBytes = Files.readAllBytes(path);
      String fileName = path.getFileName().toString();

      return extractTextFromBytes(imageBytes, fileName);

    } catch (IOException e) {
      throw new OcrException("Failed to read image file: " + e.getMessage(), e);
    }
  }

  /**
   * Extract text from an image URL using OCR service
   * Downloads the image first, then sends to OCR service
   */
  private OcrResult extractTextFromUrl(String imageUrl) throws OcrException {
    try {
      logger.info("Downloading image from URL: {}", imageUrl);

      HttpRequest downloadRequest = HttpRequest.newBuilder()
          .uri(URI.create(imageUrl))
          .timeout(Duration.ofSeconds(30))
          .GET()
          .build();

      HttpResponse<byte[]> downloadResponse = httpClient.send(downloadRequest, HttpResponse.BodyHandlers.ofByteArray());

      if (downloadResponse.statusCode() != 200) {
        throw new OcrException("Failed to download image: HTTP " + downloadResponse.statusCode());
      }

      byte[] imageBytes = downloadResponse.body();
      String fileName = extractFilenameFromUrl(imageUrl);

      logger.info("Downloaded image: {} ({} bytes)", fileName, imageBytes.length);

      return extractTextFromBytes(imageBytes, fileName);

    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new OcrException("Image download interrupted: " + e.getMessage(), e);
    } catch (IOException e) {
      throw new OcrException("Failed to download image: " + e.getMessage(), e);
    }
  }

  private String extractFilenameFromUrl(String imageUrl) {
    String fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
    if (fileName.contains("?")) {
      fileName = fileName.substring(0, fileName.indexOf('?'));
    }
    if (fileName.isEmpty() || !fileName.contains(".")) {
      fileName = "image.jpg";
    }
    return fileName;
  }

  /**
   * Extract text from image bytes using OCR service
   */
  public OcrResult extractTextFromBytes(byte[] imageBytes, String fileName) throws OcrException {
    try {
      logger.info("Sending image to OCR service: {} ({} bytes)", fileName, imageBytes.length);

      String boundary = "----WebKitFormBoundary" + System.currentTimeMillis();
      byte[] bodyBytes = buildMultipartBody(boundary, imageBytes, fileName);

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(ocrServiceUrl + "/extract"))
          .timeout(Duration.ofSeconds(timeoutSeconds))
          .header("Content-Type", "multipart/form-data; boundary=" + boundary)
          .POST(HttpRequest.BodyPublishers.ofByteArray(bodyBytes))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() != 200) {
        throw new OcrException("OCR service returned error: " + response.statusCode() + " - " + response.body());
      }

      return parseOcrResponse(response.body());

    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new OcrException("OCR service call interrupted: " + e.getMessage(), e);
    } catch (IOException e) {
      throw new OcrException("Failed to call OCR service: " + e.getMessage(), e);
    }
  }

  private OcrResult parseOcrResponse(String responseBody) throws OcrException {
    try {
      JsonNode jsonResponse = objectMapper.readTree(responseBody);

      boolean success = jsonResponse.get("success").asBoolean();
      if (!success) {
        String error = jsonResponse.has("error") ? jsonResponse.get("error").asText() : "Unknown error";
        throw new OcrException("OCR extraction failed: " + error);
      }

      String extractedText = jsonResponse.get("extracted_text").asText();
      double confidence = jsonResponse.get("confidence").asDouble();

      List<String> lines = new ArrayList<>();
      JsonNode linesNode = jsonResponse.get("lines");
      if (linesNode != null && linesNode.isArray()) {
        for (JsonNode lineNode : linesNode) {
          lines.add(lineNode.asText());
        }
      }

      logger.info("OCR extracted {} lines with confidence {}", lines.size(), confidence);

      return new OcrResult(extractedText, lines, confidence);

    } catch (IOException e) {
      throw new OcrException("Failed to parse OCR response: " + e.getMessage(), e);
    }
  }

  private byte[] buildMultipartBody(String boundary, byte[] fileBytes, String fileName) throws IOException {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();

    String fileHeader = "--" + boundary + "\r\n" +
        "Content-Disposition: form-data; name=\"file\"; filename=\"" + fileName + "\"\r\n" +
        "Content-Type: image/jpeg\r\n\r\n";
    baos.write(fileHeader.getBytes());
    baos.write(fileBytes);
    baos.write("\r\n".getBytes());
    baos.write(("--" + boundary + "--\r\n").getBytes());

    return baos.toByteArray();
  }

  /**
   * OCR extraction result value object
   */
  public static class OcrResult {
    private final String extractedText;
    private final List<String> lines;
    private final double confidence;

    public OcrResult(String extractedText, List<String> lines, double confidence) {
      this.extractedText = extractedText;
      this.lines = lines;
      this.confidence = confidence;
    }

    public String getExtractedText() {
      return extractedText;
    }

    public List<String> getLines() {
      return lines;
    }

    public double getConfidence() {
      return confidence;
    }
  }

  /**
   * Exception for OCR failures
   */
  public static class OcrException extends RuntimeException {
    public OcrException(String message) {
      super(message);
    }

    public OcrException(String message, Throwable cause) {
      super(message, cause);
    }
  }
}
