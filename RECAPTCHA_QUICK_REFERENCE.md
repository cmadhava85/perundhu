# reCAPTCHA Quick Reference for Developers

## 🚀 Quick Start

### Frontend: Using reCAPTCHA Token in Components

```typescript
import { useRecaptcha } from '../hooks/useRecaptcha';

function MyComponent() {
  const { executeRecaptcha, isConfigured } = useRecaptcha();

  const handleSubmit = async () => {
    // Generate token for custom action
    const token = isConfigured() ? await executeRecaptcha('MY_ACTION') : null;
    
    // Send to API with token
    await api.post('/my-endpoint', data, {
      headers: { 'X-reCAPTCHA-Token': token }
    });
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

---

## 🔧 Backend: Validating Token

### Quick Service Call (Spring Boot)

```java
import com.google.cloud.recaptchaenterprise.v1.RecaptchaEnterpriseServiceClient;
import com.google.recaptchaenterprise.v1.Assessment;
import com.google.recaptchaenterprise.v1.CreateAssessmentRequest;
import com.google.recaptchaenterprise.v1.Event;
import com.google.recaptchaenterprise.v1.ProjectName;

@Autowired
private RecaptchaValidationService recaptchaService;

@PostMapping("/api/my-endpoint")
public ResponseEntity<?> myEndpoint(
        @RequestBody MyData data,
        @RequestHeader(name = "X-reCAPTCHA-Token") String token) {
    
    // Validate token using service
    if (!recaptchaService.validateToken(token, "MY_ACTION")) {
        return ResponseEntity.status(403).body("reCAPTCHA validation failed");
    }
    
    // Process request...
    return ResponseEntity.ok("Success");
}
```

**Service Implementation** (see RECAPTCHA_BACKEND_INTEGRATION.md for complete code):
- Uses Google's official `RecaptchaEnterpriseServiceClient`
- Validates token, action, and risk score
- Returns true/false for easy integration

---

## 📝 Configuration

### Environment Variables

**Frontend (.env files)**:
```dotenv
VITE_RECAPTCHA_ENABLED=true           # Enable/disable reCAPTCHA
VITE_RECAPTCHA_ENTERPRISE=true        # Use Enterprise mode
VITE_RECAPTCHA_SITE_KEY=6Lf-qk...    # Site key for frontend
```

**Backend (application.properties)**:
```properties
recaptcha.enabled=true
recaptcha.project-id=perundhu-prod-001
recaptcha.site-key=6Lf-qk...
recaptcha.secret-key=${RECAPTCHA_SECRET_KEY}
recaptcha.min-score=0.5               # Risk threshold (0.0-1.0)
recaptcha.max-age-seconds=120         # Token lifetime
```

---

## 🎯 Actions Reference

### Standard Actions

| Action | Purpose | Where Used |
|--------|---------|-----------|
| `LOGIN` | Admin authentication | AdminAuthContext.tsx |
| `SUBMIT_CONTRIBUTION` | Form submission | RouteContribution.tsx |
| `SEARCH` | Search query protection | (Future) |
| `SIGNUP` | New user registration | (Future) |

### Adding Custom Action

1. **Frontend**:
```typescript
const token = await executeRecaptcha('MY_ACTION');
```

2. **Backend**:
```java
recaptchaService.validateToken(token, "MY_ACTION")
```

---

## 🔐 Security Best Practices

✅ **DO:**
- Always validate token on backend
- Use HTTPS for all requests
- Store secrets in GCP Secret Manager
- Check risk score (threshold: 0.5+)
- Log validation failures
- Implement rate limiting

❌ **DON'T:**
- Rely solely on frontend validation
- Store secrets in code/git
- Use same site key across environments
- Accept tokens older than 2 minutes
- Share reCAPTCHA secret key
- Expose secret key to frontend

---

## 🧪 Testing

### Frontend Test

```typescript
import { renderHook, act } from '@testing-library/react';
import { useRecaptcha } from '../hooks/useRecaptcha';

test('should execute recaptcha', async () => {
  const { result } = renderHook(() => useRecaptcha());
  
  let token;
  await act(async () => {
    token = await result.current.executeRecaptcha('TEST');
  });
  
  expect(token).toBeDefined();
});
```

### Backend Test

```java
@Test
public void testValidToken() {
    boolean valid = recaptchaService.validateToken(validToken, "LOGIN");
    assertTrue(valid);
}

@Test
public void testInvalidToken() {
    boolean valid = recaptchaService.validateToken("invalid", "LOGIN");
    assertFalse(valid);
}
```

---

## 📊 Monitoring

### Key Metrics to Track

```properties
# Success rates
recaptcha.validation.success=count
recaptcha.validation.failed=count

# Risk scores
recaptcha.risk_score=histogram

# Actions
recaptcha.action.login=count
recaptcha.action.submit_contribution=count
```

### Sample Log Lines

```
[INFO] reCAPTCHA validation successful: action=LOGIN, score=0.87
[WARN] Low risk score: 0.35 (threshold: 0.5)
[ERROR] reCAPTCHA validation error: invalid token
```

---

## 🐛 Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Token is null | reCAPTCHA disabled | Check `VITE_RECAPTCHA_ENABLED` |
| 403 Forbidden | Validation failed | Check token age, action name, score |
| Script not loading | CDN issue | Check network tab, CDN status |
| Low score repeatedly | Legitimate bot activity | Review logs, adjust threshold |

---

## 🔗 Useful Links

- [reCAPTCHA Console](https://console.cloud.google.com/security/recaptcha)
- [Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager)
- [reCAPTCHA Enterprise Docs](https://cloud.google.com/recaptcha-enterprise/docs)
- [Risk Analysis Guide](https://cloud.google.com/recaptcha-enterprise/docs/risk-analysis)

---

## 💡 Common Implementation Patterns

### Pattern 1: Protecting Form Submission

```typescript
const handleFormSubmit = async (formData) => {
  const token = await executeRecaptcha('SUBMIT_FORM');
  
  try {
    await submitForm(formData, token);
    showSuccess('Form submitted');
  } catch (error) {
    showError('Submission failed');
  }
};
```

### Pattern 2: Protecting API Calls

```typescript
const protectedApiCall = async (endpoint, data) => {
  const token = isConfigured() ? await executeRecaptcha(endpoint.toUpperCase()) : null;
  
  return await api.post(endpoint, data, {
    headers: { 'X-reCAPTCHA-Token': token || '' }
  });
};
```

### Pattern 3: Silent Token Generation

```typescript
// Generate token silently in background
useEffect(() => {
  if (isConfigured()) {
    // Warm up token for faster submissions
    executeRecaptcha('PAGE_LOAD').catch(() => {});
  }
}, [executeRecaptcha, isConfigured]);
```

---

## 📞 Support

For issues or questions:
1. Check `RECAPTCHA_BACKEND_INTEGRATION.md` for detailed docs
2. Review test cases in component files
3. Check GCP console for secret configuration
4. Review backend validation logs

---

**Last Updated**: January 5, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
