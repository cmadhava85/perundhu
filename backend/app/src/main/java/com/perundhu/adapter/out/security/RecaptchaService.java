package com.perundhu.adapter.out.security;

import java.util.Map;

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
import org.springframework.web.client.RestTemplate;

/**
 * Service for verifying Google reCAPTCHA v3 tokens.
 * 
 * @author Perundhu Team
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
  private double scoreThreshold;

  private final RestTemplate restTemplate;

  public RecaptchaService() {
    this.restTemplate = new RestTemplate();
  }

  /**
   * Verify a reCAPTCHA token with action verification.
   *
   * @param token          The reCAPTCHA token from the frontend
   * @param expectedAction The expected action (e.g., "image_upload",
   *                       "voice_upload")
   * @return true if verification succeeds, false otherwise
   */
  public boolean verifyToken(String token, String expectedAction) {
    // If reCAPTCHA is disabled (not configured), allow all requests
    if (!recaptchaEnabled || secretKey == null || secretKey.isEmpty()) {
      log.warn("reCAPTCHA is disabled or not configured. Skipping verification.");
      return true;
    }

    if (token == null || token.isEmpty()) {
      log.warn("reCAPTCHA token is null or empty");
      return false;
    }

    try {
      // Prepare request parameters
      MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
      params.add("secret", secretKey);
      params.add("response", token);

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

      HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

      // Call Google reCAPTCHA API
      @SuppressWarnings("rawtypes")
      ResponseEntity<Map> response = restTemplate.postForEntity(VERIFY_URL, request, Map.class);

      if (response.getBody() == null) {
        log.error("reCAPTCHA verification failed: empty response");
        return false;
      }

      Map<String, Object> responseBody = response.getBody();
      Boolean success = (Boolean) responseBody.get("success");

      if (!Boolean.TRUE.equals(success)) {
        log.warn("reCAPTCHA verification failed: success=false. Errors: {}",
            responseBody.get("error-codes"));
        return false;
      }

      // Check score (reCAPTCHA v3)
      Object scoreObj = responseBody.get("score");
      if (scoreObj != null) {
        double score = ((Number) scoreObj).doubleValue();
        if (score < scoreThreshold) {
          log.warn("reCAPTCHA score {} is below threshold {}", score, scoreThreshold);
          return false;
        }
      }

      // Verify action matches expected action
      String action = (String) responseBody.get("action");
      if (expectedAction != null && !expectedAction.equals(action)) {
        log.warn("reCAPTCHA action mismatch. Expected: {}, Actual: {}", expectedAction, action);
        return false;
      }

      log.debug("reCAPTCHA verification successful for action: {}", action);
      return true;

    } catch (Exception e) {
      log.error("reCAPTCHA verification error: {}", e.getMessage(), e);
      // Fail open in case of service issues (configurable)
      return false;
    }
  }

  /**
   * Verify token without action check.
   */
  public boolean verifyToken(String token) {
    return verifyToken(token, null);
  }

  /**
   * Check if reCAPTCHA is enabled and configured.
   */
  public boolean isEnabled() {
    return recaptchaEnabled && secretKey != null && !secretKey.isEmpty();
  }
}
