# Security Analysis Report - API Endpoint Exposure

## Executive Summary

**⚠️ SECURITY ALERT:** Yes, many endpoints are **exposed to anonymous users without authentication**. However, this is **intentional by design** for a public transit information platform.

---

## 1. Public Endpoints (No Authentication Required)

### ✅ Intentionally Public - Safe to Expose

These endpoints are **open by design** for public access to transit information:

#### Bus Schedule & Location Services (Core Platform Features)
- `GET /api/v1/bus-schedules/**` - All bus schedule operations
  - `/api/v1/bus-schedules/buses` - List all buses
  - `/api/v1/bus-schedules/search` - Search routes
  - `/api/v1/bus-schedules/locations` - Get locations
  - `/api/v1/bus-schedules/buses/{busId}` - Get bus details
  - `/api/v1/bus-schedules/discover-routes` - Route discovery
  - `/api/v1/bus-schedules/public-stats` - Public statistics

- `GET /api/v1/locations/**` - Location management
  - `/api/v1/locations` - List all locations
  - `/api/v1/locations/autocomplete` - Location autocomplete
  - `/api/v1/locations/search-comprehensive` - Advanced search

- `GET /api/v1/buses/**` - Bus information
  - `/api/v1/buses` - List buses
  - `/api/v1/buses/{id}` - Bus details

- `GET /api/v1/stops/**` - Stop information
  - `/api/v1/stops` - List stops
  - `/api/v1/stops/{id}` - Stop details

#### User Contributions (Community Features)
- `POST /api/v1/contributions/routes` - **Anonymous route contributions allowed**
- `POST /api/v1/contributions/routes/stops` - **Anonymous stop contributions allowed**
- `POST /api/v1/contributions/buses/**` - **Anonymous bus contributions allowed**
- `POST /api/v1/contributions/stops/**` - **Anonymous stop contributions allowed**
- `POST /api/v1/contributions/analyze-image` - **Anonymous image analysis allowed**

#### Other Public Features
- `GET /api/v1/analytics/**` - Public analytics
- `GET /api/images/**` - Public image access
- `POST /api/v1/route-issues/report` - **Anonymous route issue reporting**
- `GET /actuator/health` - Health check

---

## 2. Protected Endpoints (Authentication Required)

### 🔒 Requires Valid User Login

#### User-Owned Operations
- `POST /api/reviews` - Submit review (requires login if feature enabled)
- `GET /api/reviews/my-reviews` - User's own reviews (requires X-User-Id header)
- `DELETE /api/reviews/{reviewId}` - Delete own review (requires X-User-Id header)
- `PUT /api/reviews/{reviewId}` - Edit own review (requires X-User-Id header)
- `GET /api/v1/contributions/manage/**` - Manage own contributions

#### Admin Operations (Role-Based Access)
- `GET /api/v1/admin/**` - All admin operations (requires ADMIN role)
- `GET /api/admin/**` - All admin operations (requires ADMIN role)
- `GET /api/v1/route-issues/admin/**` - Admin issue management
- Includes:
  - Contribution approval/rejection
  - Route management
  - Image OCR extraction
  - Admin analytics
  - Security management (IP blocking)
  - Feature flag management

---

## 3. Review Endpoint Security Analysis

### Current Implementation (Vulnerable)

**⚠️ CRITICAL ISSUE FOUND:**

The ReviewController has **NO @PreAuthorize annotations** on admin endpoints:

```java
@GetMapping("/admin/pending")
public ResponseEntity<?> getPendingReviews() {
    // ❌ NO AUTHENTICATION CHECK!
    List<Review> reviews = reviewService.getPendingReviews();
    ...
}

@PutMapping("/admin/{reviewId}/approve")
public ResponseEntity<?> approveReview(@PathVariable Long reviewId) {
    // ❌ NO AUTHENTICATION CHECK!
    Review review = reviewService.approveReview(reviewId);
    ...
}

@PutMapping("/admin/{reviewId}/reject")
public ResponseEntity<?> rejectReview(@PathVariable Long reviewId) {
    // ❌ NO AUTHENTICATION CHECK!
    Review review = reviewService.rejectReview(reviewId);
    ...
}
```

### Security Risk Details

| Endpoint | Current State | Risk Level | Impact |
|----------|--------------|-----------|---------|
| `GET /api/reviews/admin/pending` | **PUBLIC** | 🔴 CRITICAL | Anyone can view all pending reviews |
| `PUT /api/reviews/admin/{id}/approve` | **PUBLIC** | 🔴 CRITICAL | Anyone can approve any review |
| `PUT /api/reviews/admin/{id}/reject` | **PUBLIC** | 🔴 CRITICAL | Anyone can reject any review |

---

## 4. Authentication Mechanism

### OAuth2 & JWT Configuration
```
Type: OAuth2 Resource Server with JWT
Location: SecurityConfig.java
Profile: Non-production environments (dev, test, preprod)
Session: Stateless (STATELESS)
```

### How Authentication Works

1. **Public Endpoints**: No token required
   - Directly accessible via HTTP requests
   - No security filters applied

2. **Protected Endpoints**: JWT token required
   - Token passed in `Authorization: Bearer <token>` header
   - Validated via JWK Set URI (if configured)
   - Falls back to MockJwtDecoder for development

3. **Admin Endpoints**: Role-based access control
   - Requires JWT with `ADMIN` role
   - Controlled via `@PreAuthorize("hasRole('ADMIN')")`

### User Identification

Currently using **header-based user ID** (NOT OAuth2):
```
X-User-Id: user123
```

**⚠️ Problem**: This is **NOT secure** because:
- Client can send any user ID
- No server-side validation
- Vulnerable to user impersonation

---

## 5. Security Filter Chain

```
Order of Filters:
1. RateLimitingFilter - Rate limiting protection
2. OriginValidationFilter - CORS validation
3. ApiKeyValidationFilter - API key validation
4. AdminBasicAuthFilter - Basic auth for admins
5. JWT Authentication (Spring Security)
```

### CORS Configuration
```
Allowed Origins: http://localhost:5173, 5174, 5175, 4173
Allowed Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD
Credentials: Allowed
Max Age: 3600 seconds
```

---

## 6. Security Vulnerabilities Found

### 🔴 CRITICAL Issues

#### Issue 1: Missing Admin Authorization on Review Admin Endpoints
**Severity**: CRITICAL  
**Endpoint**: `/api/reviews/admin/**`  
**Problem**: No @PreAuthorize check on admin endpoints  
**Fix Required**:
```java
@GetMapping("/admin/pending")
@PreAuthorize("hasRole('ADMIN')")  // ADD THIS
public ResponseEntity<?> getPendingReviews() { ... }

@PutMapping("/admin/{reviewId}/approve")
@PreAuthorize("hasRole('ADMIN')")  // ADD THIS
public ResponseEntity<?> approveReview(@PathVariable Long reviewId) { ... }

@PutMapping("/admin/{reviewId}/reject")
@PreAuthorize("hasRole('ADMIN')")  // ADD THIS
public ResponseEntity<?> rejectReview(@PathVariable Long reviewId) { ... }
```

#### Issue 2: User Impersonation via X-User-Id Header
**Severity**: CRITICAL  
**Problem**: Using custom header for user ID instead of JWT claims  
**Why It's Bad**:
```
# Client can claim to be any user:
curl http://localhost:8080/api/reviews/my-reviews \
  -H "X-User-Id: admin-user-id"
# System thinks request is from "admin-user-id"
```
**Fix Required**: Extract user ID from JWT token, not headers

#### Issue 3: Anonymous Route Contributions
**Severity**: MEDIUM (by design, but risky)  
**Issue**: Anyone can submit route data without authentication  
**Impact**: Spam, vandalism, incorrect data  
**Mitigation**: Implement rate limiting + review process (already in place)

### 🟡 MEDIUM Issues

#### Issue 4: No IP-Based Rate Limiting Enforcement
**Issue**: RateLimitingFilter exists but no clear enforcement  
**Recommendation**: Configure rate limit thresholds in properties

#### Issue 5: API Key Validation Without Key Management
**Issue**: ApiKeyValidationFilter exists but no key management UI  
**Recommendation**: Implement API key management dashboard

#### Issue 6: Mock JWT Decoder in Development
**Issue**: `MockJwtDecoder` bypasses token validation  
**Reason**: For development convenience  
**Recommendation**: Use proper JWT tokens even in dev

---

## 7. Current Authentication Coverage

### By Endpoint Category

```
Bus Schedules (Core)
├── Public: ✅ Intentional - transit info should be public
├── Rate Limited: ✅ Yes
└── Requires Auth: ❌ No

Contributions (Community)
├── Public: ✅ Intentional - encourage community participation
├── Requires Review: ✅ Yes (admin approval)
└── Requires Auth: ❌ No (anonymous allowed)

Reviews (User Feedback)
├── Submit: 🟡 Requires login if feature enabled (via X-User-Id)
├── View Public: ✅ Yes (anyone can see approved reviews)
├── View Own: 🟡 Requires X-User-Id header
├── Manage (Admin): ❌ NO PROTECTION - CRITICAL ISSUE
└── Delete Own: 🟡 Requires X-User-Id header

Admin Operations
├── Contributions: ❌ Requires auth, no @PreAuthorize
├── Integration: ❌ Requires auth, no @PreAuthorize
├── Settings: ❌ Requires auth, no @PreAuthorize
├── Security: ❌ Requires auth, no @PreAuthorize
└── Analytics: ❌ Requires auth, no @PreAuthorize
```

---

## 8. Recommended Security Improvements

### Immediate Actions (Critical)

1. **Add @PreAuthorize to Review Admin Endpoints**
   ```java
   @PreAuthorize("hasRole('ADMIN')")
   ```

2. **Replace Header-Based User ID with JWT Claims**
   ```java
   @PostMapping
   public ResponseEntity<?> submitReview(
       @Valid @RequestBody SubmitReviewRequest request,
       @AuthenticationPrincipal Jwt jwt) {
       String userId = jwt.getClaimAsString("sub");
       // Use jwt.getClaimAsString for all user identification
   }
   ```

3. **Add @PreAuthorize to All Admin Endpoints**
   - AdminController
   - IntegrationController
   - All `/api/admin/**` routes

### Short-Term (Security Hardening)

4. **Implement API Key Management**
   - Create dashboard to manage API keys
   - Track API key usage
   - Revoke compromised keys

5. **Configure Rate Limiting**
   - Set thresholds in properties
   - Implement per-IP limits
   - Implement per-user limits

6. **Add Request Validation**
   - Add CSRF tokens for state-changing operations
   - Validate content-type headers
   - Sanitize user inputs

### Long-Term (Best Practices)

7. **Implement OAuth2 Flow**
   - Real OAuth2 token exchange
   - Secure token storage
   - Token refresh mechanism

8. **Add Audit Logging**
   - Log all admin actions
   - Track data changes
   - Monitor access patterns

9. **Implement Web Application Firewall (WAF)**
   - Detect malicious patterns
   - Block SQL injection attempts
   - Prevent XSS attacks

---

## 9. Default Security Settings

### In SecurityConfig.java

**Line 109-128**: Public Endpoint Configuration
```java
.authorizeHttpRequests(authz -> authz
    // Public endpoints
    .requestMatchers("/api/v1/bus-schedules/**").permitAll()
    .requestMatchers("/api/v1/analytics/**").permitAll()
    .requestMatchers("/api/v1/contributions/routes").permitAll()
    ...
    // Protected endpoints - user management and admin
    .requestMatchers("/api/v1/contributions/manage/**").authenticated()
    .requestMatchers("/api/v1/admin/**").authenticated()
    .requestMatchers("/api/admin/**").authenticated()
    ...
    // Allow all other requests for development
    .anyRequest().permitAll());
```

**⚠️ Issue**: The last line `.anyRequest().permitAll()` allows **ANY** unmatched endpoint!

---

## 10. Summary Table

| Endpoint Type | Public | Authenticated | Role-Based | Status |
|---------------|--------|---------------|-----------|--------|
| Bus Schedules | ✅ | ❌ | ❌ | ✅ Secure (intentional) |
| Locations | ✅ | ❌ | ❌ | ✅ Secure (intentional) |
| Contributions | ✅ | ❌ | ⚠️ | ⚠️ Has review process |
| Reviews (User) | ⚠️ | 🟡 | ❌ | 🟡 Header-based auth (weak) |
| Reviews (Admin) | ❌ | ⚠️ | ❌ | 🔴 CRITICAL - NO AUTH CHECK |
| Admin Operations | ❌ | ⚠️ | ❌ | 🔴 Missing @PreAuthorize |
| Health Check | ✅ | ❌ | ❌ | ✅ Secure (intentional) |

---

## Conclusion

**Current State**: 🟡 **PARTIALLY SECURE**

### What's Good ✅
- Public endpoints are appropriately exposed
- CORS is properly configured
- Rate limiting filter is in place
- Security filter chain is implemented
- OAuth2/JWT infrastructure is ready

### What's Bad 🔴
- **Admin endpoints have NO role-based access control**
- **User identification relies on untrustworthy headers**
- **Weak authentication on review management**
- **Overly permissive default rule** (.anyRequest().permitAll())

### Priority Fixes (in order)
1. Add @PreAuthorize("hasRole('ADMIN')") to all admin endpoints
2. Replace X-User-Id header with JWT subject claim
3. Remove or restrict the .anyRequest().permitAll() rule
4. Implement proper OAuth2 token validation

---

## How to Test for Vulnerabilities

```bash
# Test 1: Access admin review endpoints without auth
curl http://localhost:8080/api/reviews/admin/pending
# Expected: 401 Unauthorized
# Actual: 200 OK (VULNERABLE!)

# Test 2: Approve review as anonymous user
curl -X PUT http://localhost:8080/api/reviews/admin/1/approve
# Expected: 401 Unauthorized
# Actual: Success (VULNERABLE!)

# Test 3: Impersonate user via header
curl http://localhost:8080/api/reviews/my-reviews \
  -H "X-User-Id: someone-else"
# Expected: Should use JWT identity, not header
# Actual: Uses header value (VULNERABLE!)
```

---

## References

- **File**: SecurityConfig.java - Primary security configuration
- **File**: ReviewController.java - Vulnerable review endpoints
- **File**: AdminController.java - May have similar issues
- **Framework**: Spring Security 6.x with OAuth2 Resource Server
- **Authentication**: JWT (development) + Header-based (current)

---

*Report Generated: January 5, 2026*  
*Status: SECURITY AUDIT COMPLETE*
