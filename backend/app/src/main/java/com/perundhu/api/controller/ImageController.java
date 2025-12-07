package com.perundhu.api.controller;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.FileStorageService;
import com.perundhu.domain.port.ImageContributionOutputPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controller for serving and managing user images
 */
@RestController
@RequestMapping("/api/images")
@Slf4j
@RequiredArgsConstructor
public class ImageController {

  private final FileStorageService fileStorageService;
  private final ImageContributionOutputPort imageContributionOutputPort;

  /**
   * Serve an image file - tries filesystem first, then database
   */
  @GetMapping("/{userId}/{filename:.+}")
  public ResponseEntity<Resource> serveImage(
      @PathVariable String userId,
      @PathVariable String filename) {

    try {
      // Construct the image URL that would be stored in the database
      String imageUrl = "/api/images/" + userId + "/" + filename;
      String fullImageUrl = fileStorageService.getBaseUrl() + imageUrl;

      // First try to serve from filesystem
      String filePath = fileStorageService.getImagePath(imageUrl);

      if (filePath != null) {
        Path file = Paths.get(filePath);
        if (Files.exists(file) && Files.isReadable(file)) {
          Resource resource = new UrlResource(file.toUri());
          String contentType = Files.probeContentType(file);
          if (contentType == null || !contentType.startsWith("image/")) {
            log.warn("Attempted to serve non-image file: {}", filePath);
            return ResponseEntity.badRequest().build();
          }
          log.debug("Serving image from filesystem: {}", filePath);
          return ResponseEntity.ok()
              .contentType(MediaType.parseMediaType(contentType))
              .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
              .body(resource);
        }
      }

      // Filesystem not available, try database
      log.info("Image not in filesystem, trying database for: {}", fullImageUrl);
      Optional<ImageContribution> contribution = imageContributionOutputPort.findByImageUrl(fullImageUrl);
      
      if (contribution.isPresent() && contribution.get().getImageData() != null) {
        byte[] imageData = contribution.get().getImageData();
        String contentType = contribution.get().getImageContentType();
        if (contentType == null) {
          contentType = "image/jpeg";
        }
        
        log.debug("Serving image from database: {} bytes", imageData.length);
        ByteArrayResource resource = new ByteArrayResource(imageData);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(imageData.length))
            .body(resource);
      }

      log.warn("Image not found in filesystem or database: {}", imageUrl);
      return ResponseEntity.notFound().build();

    } catch (MalformedURLException e) {
      log.error("Invalid URL for image: {}/{}", userId, filename, e);
      return ResponseEntity.badRequest().build();
    } catch (IOException e) {
      log.error("Error serving image: {}/{}", userId, filename, e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Get image information (metadata)
   */
  @GetMapping("/{userId}/{filename:.+}/info")
  public ResponseEntity<Map<String, Object>> getImageInfo(
      @PathVariable String userId,
      @PathVariable String filename) {

    try {
      String imageUrl = "/api/images/" + userId + "/" + filename;

      if (!fileStorageService.imageExists(imageUrl)) {
        return ResponseEntity.notFound().build();
      }

      String filePath = fileStorageService.getImagePath(imageUrl);
      Path file = Paths.get(filePath);

      Map<String, Object> info = new HashMap<>();
      info.put("filename", filename);
      info.put("userId", userId);
      info.put("size", fileStorageService.getFileSize(imageUrl));
      info.put("contentType", Files.probeContentType(file));
      info.put("lastModified", Files.getLastModifiedTime(file).toString());

      return ResponseEntity.ok(info);

    } catch (IOException e) {
      log.error("Error getting image info: {}/{}", userId, filename, e);
      return ResponseEntity.internalServerError().build();
    }
  }
}