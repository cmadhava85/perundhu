package com.perundhu.security;

import com.google.cloud.recaptchaenterprise.v1.RecaptchaEnterpriseServiceClient;
import com.google.recaptchaenterprise.v1.Assessment;
import com.google.recaptchaenterprise.v1.CreateAssessmentRequest;
import com.google.recaptchaenterprise.v1.Event;
import com.google.recaptchaenterprise.v1.ProjectName;
import com.google.recaptchaenterprise.v1.RiskAnalysis.ClassificationReason;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;

/**
 * Service for validating reCAPTCHA Enterprise tokens
 * 
 * Implements Google's official reCAPTCHA Enterprise validation pattern
 * Reference: https://cloud.google.com/recaptcha-enterprise/docs
 */
@Service
public class RecaptchaValidationService {

  private static final Logger logger = LoggerFactory.getLogger(RecaptchaValidationService.class);

  @Value("${recaptcha.enabled:false}")
  private boolean recaptchaEnabled;

  @Value("${recaptcha.project-id}")
  private String projectId;

  @Value("${recaptcha.site-key}")
  private String siteKey;

  @Value("${recaptcha.min-score:0.5}")
  private double minScore;

  /**
   * Validate reCAPTCHA Enterprise token using Google's official pattern
   * 
   * This method:
   * 1. Creates a reCAPTCHA Enterprise client
   * 2. Builds an assessment request with the token
   * 3. Calls Google's reCAPTCHA API to analyze the token
   * 4. Validates token validity, action, and risk score
   * 
   * @param token          reCAPTCHA token from frontend (X-reCAPTCHA-Token
   *                       header)
   * @param expectedAction Expected action name (e.g., "LOGIN",
   *                       "SUBMIT_CONTRIBUTION")
   * @return true if token is valid and meets all criteria, false otherwise
   */
  public boolean validateToken(String token, String expectedAction) {
    // If reCAPTCHA is disabled, skip validation (allow all)
    if (!recaptchaEnabled) {
      logger.debug("reCAPTCHA validation disabled, allowing request");
      return true;
    }

    // If no token provided, reject
    if (token == null || token.isEmpty()) {
      logger.warn("reCAPTCHA validation failed: no token provided");
      return false;
    }

    try (RecaptchaEnterpriseServiceClient client = RecaptchaEnterpriseServiceClient.create()) {

      // Step 1: Set the properties of the event to be tracked
      Event event = Event.newBuilder()
          .setSiteKey(siteKey)
          .setToken(token)
          .build();

      // Step 2: Build the assessment request
      CreateAssessmentRequest createAssessmentRequest = CreateAssessmentRequest.newBuilder()
          .setParent(ProjectName.of(projectId).toString())
          .setAssessment(Assessment.newBuilder().setEvent(event).build())
          .build();

      // Step 3: Call reCAPTCHA Enterprise API
      Assessment response = client.createAssessment(createAssessmentRequest);

      // Step 4: Validate the assessment result
      return isValidAssessment(response, expectedAction);

    } catch (IOException e) {
      logger.error("reCAPTCHA validation error: {}", e.getMessage(), e);
      // Fail securely: reject request if validation fails
      return false;
    }
  }

  /**
   * Get risk score for a token (for monitoring/logging purposes)
   * Useful for dynamically adjusting thresholds or collecting metrics
   * 
   * @param token reCAPTCHA token from frontend
   * @return Risk score (0.0-1.0), or 0.0 on error (fail secure)
   */
  public double getRiskScore(String token) {
    if (!recaptchaEnabled || token == null || token.isEmpty()) {
      return 1.0; // Assume safe if disabled or no token
    }

    try (RecaptchaEnterpriseServiceClient client = RecaptchaEnterpriseServiceClient.create()) {
      Event event = Event.newBuilder()
          .setSiteKey(siteKey)
          .setToken(token)
          .build();

      CreateAssessmentRequest request = CreateAssessmentRequest.newBuilder()
          .setParent(ProjectName.of(projectId).toString())
          .setAssessment(Assessment.newBuilder().setEvent(event).build())
          .build();

      Assessment response = client.createAssessment(request);
      return response.getRiskAnalysis().getScore();

    } catch (IOException e) {
      logger.error("Error getting risk score: {}", e.getMessage());
      return 0.0; // Return low score on error (fail secure)
    }
  }

  /**
   * Internal method to validate all aspects of the assessment response
   * 
   * Checks:
   * 1. Token is valid (not malformed or tampered)
   * 2. Action matches expected action
   * 3. Risk score meets minimum threshold
   * 
   * @param assessment     Response from reCAPTCHA Enterprise API
   * @param expectedAction Expected action name
   * @return true if all checks pass, false otherwise
   */
  private boolean isValidAssessment(Assessment assessment, String expectedAction) {
    // Check 1: Verify token is valid (not malformed, expired, or tampered)
    if (!assessment.getTokenProperties().getValid()) {
      String invalidReason = assessment.getTokenProperties().getInvalidReason().name();
      logger.warn("Invalid reCAPTCHA token: reason={}", invalidReason);
      return false;
    }

    // Check 2: Verify the action matches what we expect
    String responseAction = assessment.getTokenProperties().getAction();
    if (!responseAction.equals(expectedAction)) {
      logger.warn("Action mismatch: expected={}, got={}", expectedAction, responseAction);
      return false;
    }

    // Check 3: Analyze risk score and classification reasons
    float riskScore = assessment.getRiskAnalysis().getScore();

    // Log all classification reasons for monitoring
    for (ClassificationReason reason : assessment.getRiskAnalysis().getReasonsList()) {
      logger.debug("reCAPTCHA classification reason: {}", reason.name());
    }

    // Evaluate if score meets threshold
    // Score interpretation:
    // - 1.0: Very likely genuine user
    // - 0.5: Medium risk
    // - 0.0: Very likely a bot
    if (riskScore < minScore) {
      logger.warn("Low risk score: {} (threshold: {}), action={}",
          riskScore, minScore, expectedAction);
      return false;
    }

    logger.debug("reCAPTCHA validation successful: action={}, score={}",
        expectedAction, riskScore);
    return true;
  }
}
