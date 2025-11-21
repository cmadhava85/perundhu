package com.perundhu.infrastructure.exception;

/**
 * Exception thrown when rate limit is exceeded
 */
public class RateLimitException extends RuntimeException {

  public RateLimitException(String message) {
    super(message);
  }

  public RateLimitException() {
    super("Rate limit exceeded. Please try again later.");
  }
}
