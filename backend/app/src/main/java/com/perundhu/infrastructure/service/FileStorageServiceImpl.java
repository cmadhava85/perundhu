package com.perundhu.infrastructure.service;

import com.perundhu.domain.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of file storage service for handling image uploads
 * In production, this could be extended to use cloud storage (AWS S3, Google
 * Cloud Storage, etc.)
 */
@Service
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
    public String storeImageFile(MultipartFile file, String userId) throws IOException {
        String secureFilename = generateSecureFilename(file.getOriginalFilename(), userId);
        return storeImageFile(file, userId, secureFilename);
    }

    @Override
    public String storeImageFile(MultipartFile file, String userId, String customFilename) throws IOException {
        // Validate file
        if (!isValidImageFile(file)) {
            throw new IllegalArgumentException("Invalid image file format or size");
        }

        try {
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
            Path destinationFile = userDir.resolve(customFilename);
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

            // Generate accessible URL
            String imageUrl = String.format("%s/api/images/%s/%s", baseUrl, userId, customFilename);

            log.info("Successfully stored image file: {} -> {}", file.getOriginalFilename(), imageUrl);
            return imageUrl;

        } catch (IOException e) {
            log.error("Failed to store image file {}: {}", file.getOriginalFilename(), e.getMessage(), e);
            throw new IOException("Failed to store image file: " + e.getMessage(), e);
        }
    }

    @Override
    public String getImagePath(String imageUrl) {
        try {
            // Extract relative path from URL
            // URL format: http://localhost:8080/api/images/{userId}/{filename}
            String[] parts = imageUrl.split("/api/images/");
            if (parts.length != 2) {
                log.warn("Invalid image URL format: {}", imageUrl);
                return null;
            }

            String relativePath = parts[1]; // userId/filename
            Path fullPath = Paths.get(uploadDir).resolve(relativePath);

            return fullPath.toString();

        } catch (Exception e) {
            log.error("Error getting image path for URL {}: {}", imageUrl, e.getMessage(), e);
            return null;
        }
    }

    @Override
    public boolean deleteImageFile(String imageUrl) {
        try {
            String imagePath = getImagePath(imageUrl);
            if (imagePath == null) {
                return false;
            }

            Path filePath = Paths.get(imagePath);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Successfully deleted image file: {}", imageUrl);
                return true;
            } else {
                log.warn("Image file not found for deletion: {}", imageUrl);
                return false;
            }

        } catch (Exception e) {
            log.error("Error deleting image file {}: {}", imageUrl, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean isValidImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            log.debug("File is null or empty");
            return false;
        }

        // Check file size
        if (file.getSize() > maxFileSize) {
            log.debug("File size {} exceeds maximum allowed size {}", file.getSize(), maxFileSize);
            return false;
        }

        // Check content type
        String contentType = file.getContentType();
        if (contentType == null || !SUPPORTED_FORMATS.contains(contentType.toLowerCase())) {
            log.debug("Unsupported content type: {}", contentType);
            return false;
        }

        // Check file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            log.debug("Original filename is null");
            return false;
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            log.debug("Unsupported file extension: {}", extension);
            return false;
        }

        // Additional security check - verify it's actually an image by reading header
        try {
            byte[] header = file.getInputStream().readNBytes(10);
            if (!isValidImageHeader(header)) {
                log.debug("Invalid image file header");
                return false;
            }
        } catch (IOException e) {
            log.debug("Error reading file header: {}", e.getMessage());
            return false;
        }

        return true;
    }

    @Override
    public long getMaxFileSize() {
        return maxFileSize;
    }

    @Override
    public List<String> getSupportedFormats() {
        return SUPPORTED_FORMATS;
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
            if (imagePath == null) {
                return false;
            }

            Path filePath = Paths.get(imagePath);
            return Files.exists(filePath) && Files.isReadable(filePath);

        } catch (Exception e) {
            log.error("Error checking if image exists {}: {}", imageUrl, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public long getFileSize(String imageUrl) {
        try {
            String imagePath = getImagePath(imageUrl);
            if (imagePath == null) {
                return -1;
            }

            Path filePath = Paths.get(imagePath);
            if (Files.exists(filePath)) {
                return Files.size(filePath);
            }

            return -1;

        } catch (Exception e) {
            log.error("Error getting file size for {}: {}", imageUrl, e.getMessage(), e);
            return -1;
        }
    }

    @Override
    public Resource loadAsResource(String userId, String filename) {
        try {
            Path userDir = Paths.get(uploadDir).resolve(userId);
            Path filePath = userDir.resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                log.warn("File not found or not readable: {} for user: {}", filename, userId);
                throw new RuntimeException("File not found: " + filename);
            }
        } catch (Exception e) {
            log.error("Failed to load file as resource: {} for user: {}", filename, userId, e);
            throw new RuntimeException("Failed to load file: " + filename);
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