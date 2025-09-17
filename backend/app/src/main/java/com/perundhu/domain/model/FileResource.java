package com.perundhu.domain.model;

import java.io.InputStream;

/**
 * Domain model representing a file resource that can be served
 */
public class FileResource {
  private final InputStream inputStream;
  private final String filename;
  private final String contentType;
  private final long contentLength;

  public FileResource(InputStream inputStream, String filename, String contentType, long contentLength) {
    this.inputStream = inputStream;
    this.filename = filename;
    this.contentType = contentType;
    this.contentLength = contentLength;
  }

  public InputStream getInputStream() {
    return inputStream;
  }

  public String getFilename() {
    return filename;
  }

  public String getContentType() {
    return contentType;
  }

  public long getContentLength() {
    return contentLength;
  }
}