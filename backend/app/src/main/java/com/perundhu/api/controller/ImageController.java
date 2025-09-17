package com.perundhu.api.controller;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.domain.port.FileStorageService;

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

  /**
   * Serve an image file
   */
  @GetMapping("/{userId}/{filename:.+}")
  public ResponseEntity<Resource> serveImage(
      @PathVariable String userId,
      @PathVariable String filename) {

    try {
      // Construct the image URL that would be stored in the database
      String imageUrl = "/api/images/" + userId + "/" + filename;

      // Get the actual file path from the storage service
      String filePath = fileStorageService.getImagePath(imageUrl);

      if (filePath == null) {
        log.warn("Image not found: {}", imageUrl);
        return ResponseEntity.notFound().build();
      }

      Path file = Paths.get(filePath);
      Resource resource = new UrlResource(file.toUri());

      if (!resource.exists() || !resource.isReadable()) {
        log.warn("Image file not readable: {}", filePath);
        return ResponseEntity.notFound().build();
      }

      // Security check: ensure the file is actually an image
      String contentType = Files.probeContentType(file);
      if (contentType == null || !contentType.startsWith("image/")) {
        log.warn("Attempted to serve non-image file: {}", filePath);
        return ResponseEntity.badRequest().build();
      }

      log.debug("Serving image: {}", filePath);

      return ResponseEntity.ok()
          .contentType(MediaType.parseMediaType(contentType))
          .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
          .body(resource);

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