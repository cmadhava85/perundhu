package com.perundhu.infrastructure.security;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

import java.util.List;

/**
 * Google reCAPTCHA v3 verification service
 * Provides invisible bot detection with score-based validation
 */
@Service
public class RecaptchaService {

  private static final Logger log = LoggerFactory.getLogger(RecaptchaService.class);
  private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

  @Value("${recaptcha.secret-key:}")
  private String secretKey;

  @Value("${recaptcha.enabled:false}")
  private boolean recaptchaEnabled;

  @Value("${recaptcha.score-threshold:0.5}")
  private float scoreThreshold;

  @Value("${recaptcha.action:submit}")
  private String expectedAction;

  private final RestTemplate restTemplate;

  public RecaptchaService() {
    this.restTemplate = new RestTemplate();
  }

  /**
   * Verify reCAPTCHA token
   *
   * @param token    The reCAPTCHA token from frontend
   * @param action   The expected action name
   * @param clientIp Client IP address (optional, for additional security)
   * @return VerificationResult with success status and score
   */
  @CircuitBreaker(name = "recaptcha", fallbackMethod = "verifyFallback")
  @Retry(name = "externalApi")
  public VerificationResult verify(String token, String action, String clientIp) {
    if (!recaptchaEnabled) {
      log.debug("reCAPTCHA verification skipped - disabled in configuration");
      return VerificationResult.success(1.0f, "recaptcha_disabled");
    }

    if (secretKey == null || secretKey.isEmpty()) {
      log.warn("reCAPTCHA secret key not configured");
      return VerificationResult.success(1.0f, "no_secret_key");
    }

    if (token == null || token.isEmpty()) {
      log.warn("reCAPTCHA token is empty or null");
      return VerificationResult.failure("Missing reCAPTCHA token");
    }

    try {
      // Prepare request
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

      MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
      params.add("secret", secretKey);
      params.add("response", token);
      if (clientIp != null && !clientIp.isEmpty()) {
        params.add("remoteip", clientIp);
      }

      HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

      // Call Google's verification API
      ResponseEntity<RecaptchaResponse> responseEntity = restTemplate.postForEntity(VERIFY_URL, request,
          RecaptchaResponse.class);

      RecaptchaResponse response = responseEntity.getBody();

      if (response == null) {
        log.error("Empty response from reCAPTCHA API");
        return VerificationResult.failure("Empty response from reCAPTCHA");
      }

      // Log for debugging
      log.debug("reCAPTCHA response - success: {}, score: {}, action: {}, hostname: {}",
          response.success, response.score, response.action, response.hostname);

      // Verify success
      if (!response.success) {
        String errorCodes = response.errorCodes != null ? String.join(", ", response.errorCodes) : "unknown";
        log.warn("reCAPTCHA verification failed - errors: {}", errorCodes);
        return VerificationResult.failure("reCAPTCHA verification failed: " + errorCodes);
      }

      // Verify action matches (prevents token reuse across different forms)
      if (action != null && response.action != null && !response.action.equals(action)) {
        log.warn("reCAPTCHA action mismatch - expected: {}, got: {}", action, response.action);
        return VerificationResult.failure("Action mismatch");
      }

      // Check score threshold
      if (response.score < scoreThreshold) {
        log.warn("reCAPTCHA score too low - score: {}, threshold: {}, IP: {}",
            response.score, scoreThreshold, clientIp);
        return VerificationResult.lowScore(response.score, scoreThreshold);
      }

      log.info("reCAPTCHA verification successful - score: {}", response.score);
      return VerificationResult.success(response.score, response.action);

    } catch (RestClientException e) {
      log.error("Error calling reCAPTCHA API", e);
      // In case of API error, we might want to allow the request (fail-open)
      // or reject it (fail-closed) based on security requirements
      return VerificationResult.failure("reCAPTCHA API error: " + e.getMessage());
    }
  }

  /**
   * Simplified verification with default action
   */
  public VerificationResult verify(String token, String clientIp) {
    return verify(token, expectedAction, clientIp);
  }

  /**
   * Convenience method for verifying token with action only (backward
   * compatible).
   * Returns true if verification succeeds.
   *
   * @param token  The reCAPTCHA token from frontend
   * @param action The expected action name
   * @return true if verification is successful, false otherwise
   */
  public boolean verifyToken(String token, String action) {
    VerificationResult result = verify(token, action, null);
    return result.isSuccess();
  }

  /**
   * Check if reCAPTCHA is enabled
   */
  public boolean isEnabled() {
    return recaptchaEnabled && secretKey != null && !secretKey.isEmpty();
  }

  /**
   * Response from Google reCAPTCHA API
   */
  public static class RecaptchaResponse {
    @JsonProperty("success")
    public boolean success;

    @JsonProperty("score")
    public float score;

    @JsonProperty("action")
    public String action;

    @JsonProperty("challenge_ts")
    public String challengeTs;

    @JsonProperty("hostname")
    public String hostname;

    @JsonProperty("error-codes")
    public List<String> errorCodes;
  }

  /**
   * Verification result
   */
  public static class VerificationResult {
    private final boolean success;
    private final float score;
    private final String action;
    private final String errorMessage;
    private final boolean lowScore;

    private VerificationResult(boolean success, float score, String action, String errorMessage, boolean lowScore) {
      this.success = success;
      this.score = score;
      this.action = action;
      this.errorMessage = errorMessage;
      this.lowScore = lowScore;
    }

    public static VerificationResult success(float score, String action) {
      return new VerificationResult(true, score, action, null, false);
    }

    public static VerificationResult failure(String errorMessage) {
      return new VerificationResult(false, 0, null, errorMessage, false);
    }

    public static VerificationResult lowScore(float score, float threshold) {
      return new VerificationResult(false, score, null,
          String.format("Score %.2f below threshold %.2f", score, threshold), true);
    }

    public boolean isSuccess() {
      return success;
    }

    public float getScore() {
      return score;
    }

    public String getAction() {
      return action;
    }

    public String getErrorMessage() {
      return errorMessage;
    }

    public boolean isLowScore() {
      return lowScore;
    }
  }

  // ============================================
  // CIRCUIT BREAKER FALLBACK METHOD
  // ============================================

  /**
   * Fallback method when reCAPTCHA API circuit breaker is open.
   * Allows requests through (fail-open) to prevent blocking legitimate users.
   */
  @SuppressWarnings("unused")
  private VerificationResult verifyFallback(String token, String action, String clientIp, Throwable t) {
    log.warn("reCAPTCHA circuit breaker triggered. Allowing request through (fail-open). Error: {}", t.getMessage());
    // Fail-open: allow the request but log for monitoring
    return VerificationResult.success(0.5f, "circuit_breaker_fallback");
  }
}
