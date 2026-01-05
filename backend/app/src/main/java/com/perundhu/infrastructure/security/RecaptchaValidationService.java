package com.perundhu.infrastructure.security;

import com.google.cloud.recaptchaenterprise.v1.RecaptchaEnterpriseServiceClient;
import com.google.recaptchaenterprise.v1.Assessment;
import com.google.recaptchaenterprise.v1.CreateAssessmentRequest;
import com.google.recaptchaenterprise.v1.Event;
import com.google.recaptchaenterprise.v1.ProjectName;
import com.google.recaptchaenterprise.v1.RiskAnalysis.ClassificationReason;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for validating reCAPTCHA Enterprise tokens.
 * Uses Google Cloud reCAPTCHA Enterprise API to assess risk of user actions.
 */
@Service
public class RecaptchaValidationService {

  private static final Logger logger = LoggerFactory.getLogger(RecaptchaValidationService.class);

  @Value("${recaptcha.enabled:false}")
  private boolean recaptchaEnabled;

  @Value("${recaptcha.project-id:}")
  private String projectId;

  @Value("${recaptcha.site-key:}")
  private String siteKey;

  @Value("${recaptcha.min-score:0.5}")
  private float minScore;

  @Value("${recaptcha.max-age-seconds:120}")
  private int maxAgeSec;

  /**
   * Validate reCAPTCHA Enterprise token.
   *
   * @param token          reCAPTCHA token from frontend
   * @param expectedAction Expected action name (e.g., "LOGIN",
   *                       "SUBMIT_CONTRIBUTION")
   * @return true if token is valid and meets risk score threshold
   */
  public boolean validateToken(String token, String expectedAction) {
    // If reCAPTCHA is disabled or not configured, skip validation
    if (!recaptchaEnabled || projectId == null || projectId.isEmpty()) {
      logger.debug("reCAPTCHA validation disabled in configuration or not configured");
      return true;
    }

    // If no token provided, fail validation
    if (token == null || token.isEmpty()) {
      logger.warn("reCAPTCHA validation failed: no token provided");
      return false;
    }

    try (RecaptchaEnterpriseServiceClient client = RecaptchaEnterpriseServiceClient.create()) {
      // Create the event with token and site key
      Event event = Event.newBuilder()
          .setToken(token)
          .setSiteKey(siteKey)
          .build();

      // Create the assessment request
      CreateAssessmentRequest createAssessmentRequest = CreateAssessmentRequest.newBuilder()
          .setParent(ProjectName.of(projectId).toString())
          .setAssessment(Assessment.newBuilder().setEvent(event).build())
          .build();

      // Call reCAPTCHA Enterprise API
      Assessment response = client.createAssessment(createAssessmentRequest);

      // Validate the assessment response
      return isValidAssessment(response, expectedAction);

    } catch (IOException e) {
      logger.error("reCAPTCHA validation error: IOException - {}", e.getMessage(), e);
      // Fail securely - if reCAPTCHA is enabled, reject on validation error
      return false;
    } catch (Exception e) {
      logger.error("reCAPTCHA validation error: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
      // Fail securely - if reCAPTCHA is enabled, reject on validation error
      return false;
    }
  }

  /**
   * Validate the reCAPTCHA assessment response.
   *
   * @param assessment     The assessment response from reCAPTCHA API
   * @param expectedAction Expected action name
   * @return true if assessment is valid and meets all criteria
   */
  private boolean isValidAssessment(Assessment assessment, String expectedAction) {
    // Check if token is valid
    if (!assessment.getTokenProperties().getValid()) {
      logger.warn("reCAPTCHA token validation failed: invalid token. Reason: {}",
          assessment.getTokenProperties().getInvalidReason());
      return false;
    }

    // Check if action matches expected action
    String actualAction = assessment.getTokenProperties().getAction();
    if (!actualAction.equalsIgnoreCase(expectedAction)) {
      logger.warn("reCAPTCHA action mismatch: expected={}, actual={}",
          expectedAction, actualAction);
      return false;
    }

    // Check token age (should be recent, typically within 2 minutes)
    long tokenTime = assessment.getTokenProperties().getCreateTime().getSeconds();
    long currentTime = System.currentTimeMillis() / 1000;
    long tokenAge = currentTime - tokenTime;

    if (tokenAge > maxAgeSec) {
      logger.warn("reCAPTCHA token too old: {} seconds (max: {})",
          tokenAge, maxAgeSec);
      return false;
    }

    // Get risk score and classification reasons
    float riskScore = assessment.getRiskAnalysis().getScore();
    List<ClassificationReason> reasons = new ArrayList<>(assessment.getRiskAnalysis().getReasonsList());

    // Log classification reasons
    if (!reasons.isEmpty()) {
      logger.debug("reCAPTCHA classification reasons: {}", reasons);
    }

    // Check if risk score meets threshold
    if (riskScore < minScore) {
      logger.warn("reCAPTCHA score below threshold: score={}, threshold={}. Reasons: {}",
          riskScore, minScore, reasons);
      return false;
    }

    // Assessment is valid
    logger.debug("reCAPTCHA validation successful: action={}, score={}, age={}s",
        actualAction, riskScore, tokenAge);

    return true;
  }

  /**
   * Get assessment details for logging/monitoring purposes.
   *
   * @param token          reCAPTCHA token from frontend
   * @param expectedAction Expected action name
   * @return AssessmentDetails object with all validation information
   */
  public AssessmentDetails getAssessmentDetails(String token, String expectedAction) {
    if (!recaptchaEnabled || token == null || token.isEmpty()) {
      return null;
    }

    try (RecaptchaEnterpriseServiceClient client = RecaptchaEnterpriseServiceClient.create()) {
      Event event = Event.newBuilder()
          .setToken(token)
          .setSiteKey(siteKey)
          .build();

      CreateAssessmentRequest createAssessmentRequest = CreateAssessmentRequest.newBuilder()
          .setParent(ProjectName.of(projectId).toString())
          .setAssessment(Assessment.newBuilder().setEvent(event).build())
          .build();

      Assessment response = client.createAssessment(createAssessmentRequest);

      return new AssessmentDetails(
          response.getTokenProperties().getValid(),
          response.getTokenProperties().getAction(),
          response.getRiskAnalysis().getScore(),
          response.getRiskAnalysis().getReasonsList(),
          response.getTokenProperties().getCreateTime().getSeconds(),
          System.currentTimeMillis() / 1000);

    } catch (Exception e) {
      logger.error("Error getting assessment details: {}", e.getMessage(), e);
      return null;
    }
  }

  /**
   * Assessment details data class for monitoring and logging.
   */
  public static class AssessmentDetails {
    public final boolean valid;
    public final String action;
    public final float score;
    public final List<ClassificationReason> reasons;
    public final long tokenCreatedAt;
    public final long validatedAt;

    public AssessmentDetails(boolean valid, String action, float score,
        List<ClassificationReason> reasons,
        long tokenCreatedAt, long validatedAt) {
      this.valid = valid;
      this.action = action;
      this.score = score;
      this.reasons = new ArrayList<>(reasons);
      this.tokenCreatedAt = tokenCreatedAt;
      this.validatedAt = validatedAt;
    }

    public long getTokenAgeSeconds() {
      return validatedAt - tokenCreatedAt;
    }

    @Override
    public String toString() {
      return "AssessmentDetails{" +
          "valid=" + valid +
          ", action='" + action + '\'' +
          ", score=" + score +
          ", reasons=" + reasons +
          ", tokenAge=" + getTokenAgeSeconds() + "s" +
          '}';
    }
  }
}
