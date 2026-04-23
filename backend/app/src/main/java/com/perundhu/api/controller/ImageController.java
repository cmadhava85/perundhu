package com.perundhu.api.controller;

import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
 * Controller for serving image contribution files.
 * Redirects requests to GCS public URLs — no binary data served from the backend.
 */
@RestController
@RequestMapping("/images")
@Slf4j
@RequiredArgsConstructor
public class ImageController {

  private final FileStorageService fileStorageService;
  private final ImageContributionOutputPort imageContributionOutputPort;

  /**
   * Redirect image requests to GCS.
   * The image_url stored in the DB is the authoritative GCS URL.
   */
  @GetMapping("/{userId}/{filename:.+}")
  public ResponseEntity<Void> serveImage(
      @PathVariable String userId,
      @PathVariable String filename) {

    String imageUrl = "/api/images/" + userId + "/" + filename;
    String fullImageUrl = fileStorageService.getBaseUrl() + "/contributions/" + userId + "/" + filename;

    Optional<ImageContribution> contribution = imageContributionOutputPort.findByImageUrl(fullImageUrl);
    if (contribution.isEmpty()) {
      // Try legacy suffix match
      contribution = imageContributionOutputPort.findByImageUrl(imageUrl);
    }

    if (contribution.isPresent() && contribution.get().getImageUrl() != null) {
      String gcsUrl = contribution.get().getImageUrl();
      log.debug("Redirecting image request to GCS: {}", gcsUrl);
      return ResponseEntity.status(HttpStatus.FOUND)
          .header(HttpHeaders.LOCATION, gcsUrl)
          .build();
    }

    log.warn("Image not found: {}", imageUrl);
    return ResponseEntity.notFound().build();
  }
}