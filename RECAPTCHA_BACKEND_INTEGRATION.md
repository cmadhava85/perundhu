# reCAPTCHA Enterprise Integration Guide

## Overview

This document provides backend developers with the complete reCAPTCHA Enterprise integration requirements for validating tokens sent from the frontend.

## Frontend Implementation Summary

The frontend now includes complete reCAPTCHA Enterprise support:

### 1. **Script Loading**
- reCAPTCHA Enterprise script is loaded in `index.html` via:
  ```html
  <script src="https://www.google.com/recaptcha/enterprise.js" async defer></script>
  ```

### 2. **Custom Hook: `useRecaptcha`**
- Location: `src/hooks/useRecaptcha.ts`
- Handles token generation for different actions
- Provides error handling and configuration checks

### 3. **Integrated Actions**

#### Admin Login (Authentication)
- **File**: `src/contexts/AdminAuthContext.tsx`
- **Action**: `LOGIN`
- **Endpoint**: `POST /api/admin/contributions/routes/pending`
- **Token Header**: `X-reCAPTCHA-Token`

#### Route Contribution Submission
- **File**: `src/components/RouteContribution.tsx`
- **Action**: `SUBMIT_CONTRIBUTION`
- **Endpoints**: 
  - `POST /api/v1/contributions/routes`
  - `POST /api/v1/contributions/images`
- **Token Header**: `X-reCAPTCHA-Token`

### 4. **Environment Configuration**

**Production (.env.production)**:
```dotenv
VITE_RECAPTCHA_ENABLED=true
VITE_RECAPTCHA_ENTERPRISE=true
VITE_RECAPTCHA_SITE_KEY=6Lf-qkAsAAAAAMsufKTr2pb6mh9_OSEYcDyl7juE
```

**Preprod (.env.preprod)**:
```dotenv
VITE_RECAPTCHA_ENABLED=true
VITE_RECAPTCHA_ENTERPRISE=true
VITE_RECAPTCHA_SITE_KEY=6Lf-qkAsAAAAAMsufKTr2pb6mh9_OSEYcDyl7juE
```

**Development (.env.development)**:
```dotenv
VITE_RECAPTCHA_ENABLED=false
VITE_RECAPTCHA_ENTERPRISE=false
```

---

## Backend Integration Requirements

### 1. **Token Validation Endpoint**

You must create a backend endpoint to validate reCAPTCHA tokens:

```java
/**
 * Validate reCAPTCHA Enterprise token
 * 
 * @param token reCAPTCHA token from frontend
 * @param expectedAction Expected action name (e.g., "LOGIN", "SUBMIT_CONTRIBUTION")
 * @param scoreThreshold Minimum score (0.0-1.0) to accept token
 * @return true if token is valid and meets threshold
 */
public boolean validateRecaptchaToken(String token, String expectedAction, double scoreThreshold) {
    // Implementation using Google reCAPTCHA Enterprise SDK
}
```

### 2. **Required Dependencies**

Add to `backend/build.gradle`:

```gradle
dependencies {
    // Google reCAPTCHA Enterprise (official Google Cloud library)
    implementation 'com.google.cloud:google-cloud-recaptchaenterprise:2.0.0'
}
```

**Status**: ✅ **ALREADY ADDED** - See `backend/build.gradle` line 124

**Import statements used in implementation**:
```java
import com.google.cloud.recaptchaenterprise.v1.RecaptchaEnterpriseServiceClient;
import com.google.recaptchaenterprise.v1.Assessment;
import com.google.recaptchaenterprise.v1.CreateAssessmentRequest;
import com.google.recaptchaenterprise.v1.Event;
import com.google.recaptchaenterprise.v1.ProjectName;
import com.google.recaptchaenterprise.v1.RiskAnalysis.ClassificationReason;
import java.io.IOException;
```

### 3. **Configuration**

Create application properties for reCAPTCHA:

**application-production.properties**:
```properties
# reCAPTCHA Enterprise Configuration
recaptcha.enabled=true
recaptcha.project-id=perundhu-prod-001
recaptcha.site-key=6Lf-qkAsAAAAAMsufKTr2pb6mh9_OSEYcDyl7juE
recaptcha.secret-key=${RECAPTCHA_SECRET_KEY}
recaptcha.min-score=0.5
recaptcha.max-age-seconds=120
```

**application-preprod.properties**:
```properties
# reCAPTCHA Enterprise Configuration
recaptcha.enabled=true
recaptcha.project-id=perundhu-preprod-001
recaptcha.site-key=6Lf-qkAsAAAAAMsufKTr2pb6mh9_OSEYcDyl7juE
recaptcha.secret-key=${RECAPTCHA_SECRET_KEY}
recaptcha.min-score=0.5
recaptcha.max-age-seconds=120
```

### 4. **Service Implementation (Spring Boot)**

**Location**: `/backend/app/src/main/java/com/perundhu/infrastructure/security/RecaptchaValidationService.java`

**Status**: ✅ **ALREADY CREATED** - Production-ready service with Google's official implementation

Key features:
- ✅ Token validation using Google Cloud reCAPTCHA Enterprise API
- ✅ Risk score assessment (configurable threshold)
- ✅ Token age validation
- ✅ Action name verification
- ✅ Classification reasons logging
- ✅ Comprehensive error handling
- ✅ Assessment details for monitoring

**Usage**:
```java
@Autowired
private RecaptchaValidationService recaptchaService;

// In your controller
if (!recaptchaService.validateToken(token, "LOGIN")) {
    return ResponseEntity.status(403).body("reCAPTCHA validation failed");
}

// For monitoring
RecaptchaValidationService.AssessmentDetails details = 
    recaptchaService.getAssessmentDetails(token, "LOGIN");
```

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
    
    @Value("${recaptcha.max-age-seconds:120}")
    private int maxAgeSec;
    
    /**
     * Validate reCAPTCHA Enterprise token (Google official pattern)
     * 
     * @param token reCAPTCHA token from frontend
     * @param expectedAction Expected action (e.g., "LOGIN", "SUBMIT_CONTRIBUTION")
     * @return true if token is valid and meets score threshold
     */
    public boolean validateToken(String token, String expectedAction) {
        // If reCAPTCHA is disabled, skip validation
        if (!recaptchaEnabled) {
            logger.debug("reCAPTCHA validation disabled");
            return true;
        }
        
        // If no token provided, reject
        if (token == null || token.isEmpty()) {
            logger.warn("reCAPTCHA validation failed: no token provided");
            return false;
        }
        
        try (RecaptchaEnterpriseServiceClient client = RecaptchaEnterpriseServiceClient.create()) {
            
            // Set the properties of the event to be tracked
            Event event = Event.newBuilder()
                .setSiteKey(siteKey)
                .setToken(token)
                .build();
            
            // Build the assessment request
            CreateAssessmentRequest createAssessmentRequest =
                CreateAssessmentRequest.newBuilder()
                    .setParent(ProjectName.of(projectId).toString())
                    .setAssessment(Assessment.newBuilder().setEvent(event).build())
                    .build();
            
            // Call reCAPTCHA Enterprise API
            Assessment response = client.createAssessment(createAssessmentRequest);
            
            // Validate the token
            if (!response.getTokenProperties().getValid()) {
                String invalidReason = response.getTokenProperties().getInvalidReason().name();
                logger.warn("reCAPTCHA token invalid: {}", invalidReason);
                return false;
            }
            
            // Verify the action matches
            String responseAction = response.getTokenProperties().getAction();
            if (!responseAction.equals(expectedAction)) {
                logger.warn("Action mismatch: expected={}, got={}", expectedAction, responseAction);
                return false;
            }
            
            // Check risk score
            float riskScore = response.getRiskAnalysis().getScore();
            
            // Log classification reasons
            for (ClassificationReason reason : response.getRiskAnalysis().getReasonsList()) {
                logger.debug("reCAPTCHA classification reason: {}", reason.name());
            }
            
            // Evaluate if score meets threshold
            if (riskScore < minScore) {
                logger.warn("Low risk score: {} (threshold: {})", riskScore, minScore);
                return false;
            }
            
            logger.debug("reCAPTCHA validation successful: action={}, score={}", expectedAction, riskScore);
            return true;
            
        } catch (IOException e) {
            logger.error("reCAPTCHA validation error: {}", e.getMessage(), e);
            // Fail securely: if reCAPTCHA is enabled and validation fails, reject
            return false;
        }
    }
    
    /**
     * Get risk score for logging/monitoring (without validation)
     * Useful for adjusting thresholds dynamically
     */
    public double getRiskScore(String token) {
        if (!recaptchaEnabled || token == null || token.isEmpty()) {
            return 1.0; // Assume safe if disabled
        }
        
        try (RecaptchaEnterpriseServiceClient client = RecaptchaEnterpriseServiceClient.create()) {
            Event event = Event.newBuilder()
                .setSiteKey(siteKey)
                .setToken(token)
                .build();
            
            CreateAssessmentRequest request =
                CreateAssessmentRequest.newBuilder()
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
}

### 5. **Controller Implementation**

Update your endpoints to validate reCAPTCHA tokens:

```java
@RestController
@RequestMapping("/api/admin/contributions")
public class AdminController {
    
    @Autowired
    private RecaptchaValidationService recaptchaService;
    
    @GetMapping("/routes/pending")
    public ResponseEntity<?> getPendingRoutes(
            @RequestHeader(name = "X-reCAPTCHA-Token", required = false) String recaptchaToken,
            @RequestHeader(name = "Authorization") String authHeader) {
        
        // Validate reCAPTCHA token
        if (!recaptchaService.validateToken(recaptchaToken, "LOGIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiError("reCAPTCHA validation failed"));
        }
        
        // Validate credentials
        // ... rest of implementation
    }
}

@RestController
@RequestMapping("/api/v1/contributions")
public class ContributionController {
    
    @Autowired
    private RecaptchaValidationService recaptchaService;
    
    @PostMapping("/routes")
    public ResponseEntity<?> submitRoute(
            @RequestBody RouteContribution contribution,
            @RequestHeader(name = "X-reCAPTCHA-Token", required = false) String recaptchaToken) {
        
        // Validate reCAPTCHA token
        if (!recaptchaService.validateToken(recaptchaToken, "SUBMIT_CONTRIBUTION")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiError("reCAPTCHA validation failed"));
        }
        
        // Process contribution
        // ... rest of implementation
    }
    
    @PostMapping("/images")
    public ResponseEntity<?> submitImage(
            @RequestParam("image") MultipartFile image,
            @RequestParam("busName") String busName,
            // ... other params
            @RequestHeader(name = "X-reCAPTCHA-Token", required = false) String recaptchaToken) {
        
        // Validate reCAPTCHA token
        if (!recaptchaService.validateToken(recaptchaToken, "SUBMIT_CONTRIBUTION")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiError("reCAPTCHA validation failed"));
        }
        
        // Process image contribution
        // ... rest of implementation
    }
}
```

### 6. **Error Handling**

Implement graceful fallback:

```java
@ControllerAdvice
public class RecaptchaExceptionHandler {
    
    @ExceptionHandler(RecaptchaValidationException.class)
    public ResponseEntity<?> handleRecaptchaError(RecaptchaValidationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of(
                "error", "Security validation failed",
                "message", "Please try again or contact support",
                "timestamp", System.currentTimeMillis()
            ));
    }
}
```

---

## Secret Manager Integration

### GCP Secret Manager Configuration

The reCAPTCHA secret key should be stored in GCP Secret Manager and injected at runtime:

**Terraform Configuration** (already in `infrastructure/terraform/modules/secrets/main.tf`):

```hcl
# Create reCAPTCHA secret
resource "google_secret_manager_secret" "recaptcha_secret_key" {
  secret_id = "recaptcha-secret-key"
  
  replication {
    automatic = true
  }
}

# Store the secret value
resource "google_secret_manager_secret_version" "recaptcha_secret_key" {
  secret      = google_secret_manager_secret.recaptcha_secret_key.id
  secret_data = var.recaptcha_secret_key
}
```

**Cloud Run Deployment** (environment variable injection):

```hcl
resource "google_cloud_run_service" "backend" {
  # ... other configuration
  
  template {
    spec {
      containers {
        image = "..."
        env {
          name  = "RECAPTCHA_SECRET_KEY"
          value_source {
            secret_key_ref {
              secret  = "recaptcha-secret-key"
              version = "latest"
            }
          }
        }
      }
    }
  }
}
```

---

## Testing reCAPTCHA Integration

### Frontend Testing

```typescript
// Test with mock token
import { useRecaptcha } from './hooks/useRecaptcha';

function TestComponent() {
  const { executeRecaptcha, isConfigured } = useRecaptcha();
  
  const handleTest = async () => {
    if (isConfigured()) {
      const token = await executeRecaptcha('TEST_ACTION');
      console.log('Token:', token);
    }
  };
  
  return <button onClick={handleTest}>Test reCAPTCHA</button>;
}
```

### Backend Testing

```java
@SpringBootTest
public class RecaptchaValidationServiceTest {
    
    @Autowired
    private RecaptchaValidationService recaptchaService;
    
    @Test
    public void testValidToken() {
        // Test with valid token
        boolean result = recaptchaService.validateToken(validToken, "LOGIN");
        assertTrue(result);
    }
    
    @Test
    public void testInvalidToken() {
        // Test with invalid token
        boolean result = recaptchaService.validateToken("invalid-token", "LOGIN");
        assertFalse(result);
    }
    
    @Test
    public void testActionMismatch() {
        // Test with mismatched action
        boolean result = recaptchaService.validateToken(validToken, "WRONG_ACTION");
        assertFalse(result);
    }
}
```

---

## Monitoring & Logging

### Metrics to Track

1. **Validation Success Rate**
   - `recaptcha.validation.success` counter
   - `recaptcha.validation.failed` counter

2. **Risk Scores**
   - `recaptcha.risk_score` histogram

3. **Action Distribution**
   - `recaptcha.action.login` counter
   - `recaptcha.action.submit_contribution` counter

### Log Examples

```
2026-01-12 10:30:45.123 [INFO] reCAPTCHA validation successful: action=LOGIN, score=0.87
2026-01-12 10:30:46.456 [WARN] Low risk score: 0.35 (threshold: 0.5)
2026-01-12 10:30:47.789 [WARN] Invalid reCAPTCHA token: valid=false
```

---

## Migration & Rollout Plan

### Phase 1: Preprod Testing (Jan 7-10, 2026)
- Deploy to preprod environment
- Test with real users
- Monitor for false positives

### Phase 2: Production Deployment (Jan 11-12, 2026)
- Deploy to production
- Gradual rollout (10% → 50% → 100%)
- Monitor metrics and logs

### Phase 3: Monitoring (Jan 12+, 2026)
- Daily review of validation logs
- Adjust score thresholds if needed
- Notify on validation failures

---

## Reference Links

- [Google reCAPTCHA Enterprise Documentation](https://cloud.google.com/recaptcha-enterprise/docs)
- [reCAPTCHA Java Client Library](https://github.com/googleapis/java-recaptchaenterprise)
- [Risk Analysis Documentation](https://cloud.google.com/recaptcha-enterprise/docs/risk-analysis)
