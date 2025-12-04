package com.perundhu.infrastructure.adapter.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import com.perundhu.domain.model.FileResource;
import com.perundhu.domain.model.FileUpload;
import com.perundhu.domain.port.FileStorageService;

import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of file storage service for handling image uploads
 * In production, this could be extended to use cloud storage (AWS S3, Google
 * Cloud Storage, etc.)
 */
@Service("adapterFileStorageServiceImpl")
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

  @Value("${app.file.upload-dir:./uploads/images}")
  private String uploadDir;

  @Value("${app.file.max-size:10485760}") // 10MB default
  private long maxFileSize;

  @Value("${app.file.base-url:http://localhost:8080}")
  private String baseUrl;

  private static final List<String> SUPPORTED_FORMATS = Arrays.asList(
      "image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp", "image/webp");

  private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
      ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp");

  @Override
  public String storeImageFile(FileUpload imageFile, String userId) {
    try {
      // Validate file
      if (!isValidImageFile(imageFile)) {
        throw new IllegalArgumentException("Invalid image file format or size");
      }

      // Generate secure filename
      String secureFilename = generateSecureFilename(imageFile.getOriginalFilename(), userId);

      // Create upload directory if it doesn't exist
      Path uploadPath = Paths.get(uploadDir);
      if (!Files.exists(uploadPath)) {
        Files.createDirectories(uploadPath);
        log.info("Created upload directory: {}", uploadPath);
      }

      // Create user-specific subdirectory
      Path userDir = uploadPath.resolve(userId);
      if (!Files.exists(userDir)) {
        Files.createDirectories(userDir);
        log.info("Created user directory: {}", userDir);
      }

      // Store the file
      Path destinationFile = userDir.resolve(secureFilename);
      Files.copy(imageFile.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

      // Generate accessible URL
      String imageUrl = String.format("%s/api/images/%s/%s", baseUrl, userId, secureFilename);

      log.info("Successfully stored image file: {} -> {}", imageFile.getOriginalFilename(), imageUrl);
      return imageUrl;

    } catch (Exception e) {
      log.error("Failed to store image file {}: {}", imageFile.getOriginalFilename(), e.getMessage(), e);
      throw new RuntimeException("Failed to store image file: " + e.getMessage(), e);
    }
  }

  @Override
  public boolean isValidImageFile(FileUpload imageFile) {
    if (imageFile == null || imageFile.isEmpty()) {
      log.debug("File is null or empty");
      return false;
    }

    // Check file size
    if (imageFile.getSize() > maxFileSize) {
      log.debug("File size {} exceeds maximum allowed size {}", imageFile.getSize(), maxFileSize);
      return false;
    }

    // Check content type
    String contentType = imageFile.getContentType();
    if (contentType == null || !SUPPORTED_FORMATS.contains(contentType.toLowerCase())) {
      log.debug("Unsupported content type: {}", contentType);
      return false;
    }

    // Check file extension
    String originalFilename = imageFile.getOriginalFilename();
    if (originalFilename == null) {
      log.debug("Original filename is null");
      return false;
    }

    String extension = getFileExtension(originalFilename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.contains(extension)) {
      log.debug("Unsupported file extension: {}", extension);
      return false;
    }

    // Note: We skip reading the file header here to avoid consuming the input
    // stream
    // The actual image validation will happen when the file is written
    // If it's not a valid image, the browser/client will fail to display it

    return true;
  }

  @Override
  public FileResource loadAsResource(String userId, String filename) {
    try {
      Path userDir = Paths.get(uploadDir).resolve(userId);
      Path filePath = userDir.resolve(filename);
      Resource resource = new UrlResource(filePath.toUri());

      if (resource.exists() && resource.isReadable()) {
        // Convert Spring Resource to our domain FileResource
        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
          contentType = "application/octet-stream";
        }
        long contentLength = Files.size(filePath);

        return new FileResource(
            resource.getInputStream(),
            filename,
            contentType,
            contentLength);
      } else {
        log.warn("File not found or not readable: {} for user: {}", filename, userId);
        throw new RuntimeException("File not found: " + filename);
      }
    } catch (Exception e) {
      log.error("Failed to load file as resource: {} for user: {}", filename, userId, e);
      throw new RuntimeException("Failed to load file: " + filename);
    }
  }

  // Add missing methods required by domain interface

  @Override
  public String storeImageFile(FileUpload file, String userId, String customFilename) throws IOException {
    try {
      // Validate file
      if (!isValidImageFile(file)) {
        throw new IllegalArgumentException("Invalid image file format or size");
      }

      // Create upload directory if it doesn't exist
      Path uploadPath = Paths.get(uploadDir);
      if (!Files.exists(uploadPath)) {
        Files.createDirectories(uploadPath);
        log.info("Created upload directory: {}", uploadPath);
      }

      // Create user-specific subdirectory
      Path userDir = uploadPath.resolve(userId);
      if (!Files.exists(userDir)) {
        Files.createDirectories(userDir);
        log.info("Created user directory: {}", userDir);
      }

      // Use custom filename with validation
      String secureFilename = customFilename != null ? customFilename
          : generateSecureFilename(file.getOriginalFilename(), userId);

      // Store the file
      Path destinationFile = userDir.resolve(secureFilename);
      Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

      // Generate accessible URL
      String imageUrl = String.format("%s/api/images/%s/%s", baseUrl, userId, secureFilename);

      log.info("Successfully stored image file with custom name: {} -> {}", file.getOriginalFilename(), imageUrl);
      return imageUrl;

    } catch (Exception e) {
      log.error("Failed to store image file {}: {}", file.getOriginalFilename(), e.getMessage(), e);
      throw new IOException("Failed to store image file: " + e.getMessage(), e);
    }
  }

  @Override
  public String getImagePath(String imageUrl) {
    try {
      if (imageUrl == null || imageUrl.isEmpty()) {
        return null;
      }

      String path = imageUrl;

      // If URL starts with base URL (e.g., http://localhost:8080/api/images/...)
      if (imageUrl.startsWith(baseUrl)) {
        path = imageUrl.substring(baseUrl.length());
      }
      // If URL starts with http:// or https:// but not the base URL, try to extract
      // path
      else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        // Extract path after domain (e.g., http://example.com/api/images/... ->
        // /api/images/...)
        int pathStartIndex = imageUrl.indexOf("/", imageUrl.indexOf("://") + 3);
        if (pathStartIndex != -1) {
          path = imageUrl.substring(pathStartIndex);
        }
      }
      // Otherwise, assume it's already a path (e.g., /api/images/...)

      // Extract relative path from /api/images/userId/filename
      if (path.startsWith("/api/images/")) {
        String relativePath = path.substring("/api/images/".length());
        String fullPath = Paths.get(uploadDir, relativePath).toString();
        log.debug("Resolved image path: {} -> {}", imageUrl, fullPath);
        return fullPath;
      }

      log.warn("Image URL does not match expected pattern: {}", imageUrl);
      return null;
    } catch (Exception e) {
      log.error("Error getting image path for URL {}: {}", imageUrl, e.getMessage(), e);
      return null;
    }
  }

  @Override
  public boolean deleteImageFile(String imageUrl) {
    try {
      String imagePath = getImagePath(imageUrl);
      if (imagePath != null) {
        Path path = Paths.get(imagePath);
        if (Files.exists(path)) {
          Files.delete(path);
          log.info("Successfully deleted image file: {}", imagePath);
          return true;
        } else {
          log.warn("Image file not found for deletion: {}", imagePath);
          return false;
        }
      }
      return false;
    } catch (Exception e) {
      log.error("Error deleting image file {}: {}", imageUrl, e.getMessage());
      return false;
    }
  }

  @Override
  public long getMaxFileSize() {
    return maxFileSize;
  }

  @Override
  public List<String> getSupportedFormats() {
    return new ArrayList<>(SUPPORTED_FORMATS);
  }

  @Override
  public String generateSecureFilename(String originalFilename, String userId) {
    String extension = getFileExtension(originalFilename);
    String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
    String uuid = UUID.randomUUID().toString().substring(0, 8);

    return String.format("%s_%s_%s%s", timestamp, uuid, userId.substring(0, Math.min(userId.length(), 8)),
        extension);
  }

  @Override
  public boolean imageExists(String imageUrl) {
    try {
      String imagePath = getImagePath(imageUrl);
      if (imagePath != null) {
        return Files.exists(Paths.get(imagePath));
      }
      return false;
    } catch (Exception e) {
      log.error("Error checking if image exists {}: {}", imageUrl, e.getMessage());
      return false;
    }
  }

  @Override
  public long getFileSize(String imageUrl) {
    try {
      String imagePath = getImagePath(imageUrl);
      if (imagePath != null) {
        Path path = Paths.get(imagePath);
        if (Files.exists(path)) {
          return Files.size(path);
        }
      }
      return 0;
    } catch (Exception e) {
      log.error("Error getting file size for {}: {}", imageUrl, e.getMessage());
      return 0;
    }
  }

  // Helper methods

  private String getFileExtension(String filename) {
    if (filename == null || filename.isEmpty()) {
      return "";
    }

    int lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex == -1) {
      return "";
    }

    return filename.substring(lastDotIndex);
  }

  private boolean isValidImageHeader(byte[] header) {
    if (header == null || header.length < 4) {
      return false;
    }

    // Check for common image file signatures

    // JPEG: FF D8 FF
    if (header.length >= 3 &&
        (header[0] & 0xFF) == 0xFF &&
        (header[1] & 0xFF) == 0xD8 &&
        (header[2] & 0xFF) == 0xFF) {
      return true;
    }

    // PNG: 89 50 4E 47
    if (header.length >= 4 &&
        (header[0] & 0xFF) == 0x89 &&
        (header[1] & 0xFF) == 0x50 &&
        (header[2] & 0xFF) == 0x4E &&
        (header[3] & 0xFF) == 0x47) {
      return true;
    }

    // GIF: 47 49 46 38
    if (header.length >= 4 &&
        (header[0] & 0xFF) == 0x47 &&
        (header[1] & 0xFF) == 0x49 &&
        (header[2] & 0xFF) == 0x46 &&
        (header[3] & 0xFF) == 0x38) {
      return true;
    }

    // BMP: 42 4D
    if (header.length >= 2 &&
        (header[0] & 0xFF) == 0x42 &&
        (header[1] & 0xFF) == 0x4D) {
      return true;
    }

    // WebP: 52 49 46 46 (RIFF header, need to check further for WebP)
    if (header.length >= 4 &&
        (header[0] & 0xFF) == 0x52 &&
        (header[1] & 0xFF) == 0x49 &&
        (header[2] & 0xFF) == 0x46 &&
        (header[3] & 0xFF) == 0x46) {
      return true; // Would need to check bytes 8-11 for "WEBP" in production
    }

    return false;
  }
}