package com.perundhu.domain.model;

import java.io.InputStream;

/**
 * Domain model representing a file upload
 */
public class FileUpload {
  private final String originalFilename;
  private final String contentType;
  private final long size;
  private final InputStream inputStream;

  public FileUpload(String originalFilename, String contentType, long size, InputStream inputStream) {
    this.originalFilename = originalFilename;
    this.contentType = contentType;
    this.size = size;
    this.inputStream = inputStream;
  }

  public String getOriginalFilename() {
    return originalFilename;
  }

  public String getContentType() {
    return contentType;
  }

  public long getSize() {
    return size;
  }

  public InputStream getInputStream() {
    return inputStream;
  }

  public boolean isEmpty() {
    return size == 0;
  }
}