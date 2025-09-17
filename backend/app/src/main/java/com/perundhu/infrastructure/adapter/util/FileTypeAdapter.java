package com.perundhu.infrastructure.adapter.util;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.perundhu.domain.model.FileResource;
import com.perundhu.domain.model.FileUpload;

/**
 * Utility class for converting between Spring Framework types and domain models
 */
public final class FileTypeAdapter {

  private FileTypeAdapter() {
    // Utility class
  }

  /**
   * Convert Spring MultipartFile to domain FileUpload
   */
  public static FileUpload toDomainModel(MultipartFile multipartFile) {
    if (multipartFile == null) {
      return null;
    }

    try {
      return new FileUpload(
          multipartFile.getOriginalFilename(),
          multipartFile.getContentType(),
          multipartFile.getSize(),
          multipartFile.getInputStream());
    } catch (IOException e) {
      throw new RuntimeException("Failed to convert MultipartFile to FileUpload", e);
    }
  }

  /**
   * Convert domain FileResource to Spring Resource
   */
  public static Resource toSpringResource(FileResource fileResource) {
    if (fileResource == null) {
      return null;
    }

    return new org.springframework.core.io.InputStreamResource(fileResource.getInputStream()) {
      @Override
      public String getFilename() {
        return fileResource.getFilename();
      }

      @Override
      public long contentLength() {
        return fileResource.getContentLength();
      }
    };
  }

  /**
   * Create FileResource from InputStream and metadata
   */
  public static FileResource createFileResource(InputStream inputStream, String filename,
      String contentType, long contentLength) {
    return new FileResource(inputStream, filename, contentType, contentLength);
  }
}