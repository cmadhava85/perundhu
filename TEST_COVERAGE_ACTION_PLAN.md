# Test Coverage Action Plan

**Priority Level:** CRITICAL - Complete before production release  
**Total Estimated Tests to Add:** 40-60 files  
**Estimated Effort:** 2-3 weeks  
**Current Coverage:** 22.27% → **Target: 70%+**

---

## Phase 1: Critical New Features (Must Complete First)

### 1. OverpassGeocodingService Test
**File:** `backend/app/src/test/java/com/perundhu/application/service/OverpassGeocodingServiceTest.java`  
**Priority:** 🔴 CRITICAL (NEW SERVICE - replaces Nominatim)  
**Risk Level:** HIGH  
**Estimated LOC:** 300-400

**Test Cases Required:**
```java
✓ testSearchTamilNaduLocations_Success()
✓ testSearchTamilNaduLocations_EmptyQuery()
✓ testSearchTamilNaduLocations_SpecialCharacters()
✓ testSearchLocations_WithFilters()
✓ testSearchIndianCities_Success()
✓ testGetCoordinates_ValidLocation()
✓ testGetCoordinates_InvalidLocation()
✓ testCircuitBreakerFallback_OnServiceDown()
✓ testCacheIntegration_LocationCaching()
✓ testErrorHandling_ApiTimeout()
✓ testErrorHandling_MalformedResponse()
✓ testPerformance_BulkSearch()
```

**Dependencies to Mock:**
- `RestTemplate` or `HttpClient`
- `ObjectMapper` (Jackson)
- `CircuitBreaker` (resilience4j)
- `LocationRepository`

---

### 2. FeedbackController Test
**File:** `backend/app/src/test/java/com/perundhu/adapter/in/web/FeedbackControllerTest.java`  
**Priority:** 🔴 CRITICAL (NEW ENDPOINT - file uploads)  
**Risk Level:** HIGH  
**Estimated LOC:** 250-350

**Test Cases Required:**
```java
✓ testSubmitFeedback_ValidFile_Success()
✓ testSubmitFeedback_MultipleFiles()
✓ testSubmitFeedback_FileSizeExceedsLimit()
✓ testSubmitFeedback_InvalidFileType()
✓ testSubmitFeedback_NoFile()
✓ testGetFeedback_ById_Success()
✓ testGetFeedback_NotFound()
✓ testGetFeedbackStats_AllMetrics()
✓ testGetFeedbackStats_DateRangeFilter()
✓ testFileStorageIntegration()
✓ testErrorHandling_DiskFull()
✓ testErrorHandling_PermissionDenied()
```

**Dependencies to Mock:**
- `MultipartFile`
- `FileStorageService`
- `UserFeedbackOutputPort`
- `FileStorageProperties`

---

### 3. ContributionApplicationService Test
**File:** `backend/app/src/test/java/com/perundhu/application/service/ContributionApplicationServiceTest.java`  
**Priority:** 🔴 CRITICAL (ADMIN WORKFLOWS)  
**Risk Level:** CRITICAL  
**Estimated LOC:** 400-500

**Test Cases Required:**
```java
✓ testApproveRouteContribution_Success()
✓ testApproveRouteContribution_InvalidContribution()
✓ testApproveRouteContribution_AuthorizationFail()
✓ testRejectRouteContribution_WithReason()
✓ testRejectRouteContribution_NotificationSent()
✓ testApproveImageContribution_Success()
✓ testRejectImageContribution_WithReason()
✓ testGetPendingRouteContributions_Pagination()
✓ testGetPendingRouteContributions_EmptyResult()
✓ testGetUserContributions_ByUserId()
✓ testGetAllContributions_WithFilters()
✓ testApprovalWorkflow_StateTransition()
✓ testApprovalWorkflow_Idempotency()
✓ testAuditLogging_AdminActions()
```

**Dependencies to Mock:**
- `RouteContributionOutputPort`
- `ImageContributionOutputPort`
- `NotificationService`
- `SecurityMonitoringService`
- `User/AdminContext`

---

### 4. TimingImageContributionController Test
**File:** `backend/app/src/test/java/com/perundhu/adapter/in/rest/TimingImageContributionControllerTest.java`  
**Priority:** 🔴 CRITICAL (NEW ENDPOINT)  
**Risk Level:** HIGH  
**Estimated LOC:** 300-400

**Test Cases Required:**
```java
✓ testUploadTimingImage_Success()
✓ testUploadTimingImage_InvalidImage()
✓ testUploadTimingImage_BusNotFound()
✓ testUploadTimingImage_UnauthorizedUser()
✓ testUploadTimingImage_FileSizeExceedLimit()
✓ testGetContributions_ByBusId()
✓ testGetContribution_ById()
✓ testDeleteContribution_OwnedByUser()
✓ testDeleteContribution_IDOR_Prevention()
✓ testDeleteContribution_AdminOverride()
✓ testGetContributionStats_Aggregations()
✓ testImageValidation_Format()
✓ testImageValidation_Dimensions()
```

**Dependencies to Mock:**
- `MultipartFile`
- `ImageCompressionService`
- `GeminiVisionService`
- `TimingImageContributionOutputPort`
- `SecurityContext`

---

## Phase 2: Core Business Logic Services

### 5. BusScheduleService Test
**File:** `backend/app/src/test/java/com/perundhu/application/service/BusScheduleServiceTest.java`  
**Priority:** 🟠 HIGH (CORE FUNCTIONALITY)  
**Risk Level:** HIGH  
**Estimated LOC:** 400-500

**Focus Areas:**
- Schedule retrieval and filtering
- Enhanced search with multiple parameters
- Route and stop filtering
- Performance optimization validation
- Cache coherency

---

### 6. BusTrackingService Test
**File:** `backend/app/src/test/java/com/perundhu/application/service/BusTrackingServiceTest.java`  
**Priority:** 🟠 HIGH (REAL-TIME TRACKING)  
**Risk Level:** HIGH  
**Estimated LOC:** 350-450

**Focus Areas:**
- Real-time location updates
- Reporter ID validation
- Location accuracy checks
- Stale data cleanup
- Cache management

---

### 7. DuplicateDetectionService Test
**File:** `backend/app/src/test/java/com/perundhu/application/service/DuplicateDetectionServiceTest.java`  
**Priority:** 🔴 CRITICAL (DATA QUALITY)  
**Risk Level:** CRITICAL  
**Estimated LOC:** 300-400

**Focus Areas:**
- Duplicate detection algorithms
- Fuzzy matching edge cases
- Performance with large datasets
- False positive rates

---

### 8. LocationValidationService Test
**File:** `backend/app/src/test/java/com/perundhu/application/service/LocationValidationServiceTest.java`  
**Priority:** 🟠 HIGH  
**Risk Level:** MEDIUM  
**Estimated LOC:** 250-300

**Focus Areas:**
- Coordinate validation
- Known city resolution
- Location bounds checking
- Invalid location handling

---

## Phase 3: Security & Filters

### 9. Security Filter Tests (6 tests)
**Priority:** 🔴 CRITICAL (SECURITY)  
**Risk Level:** CRITICAL  
**Total LOC:** 400-500

#### 9a. JwtAuthenticationFilterTest
```java
✓ testValidJwtToken_Success()
✓ testInvalidJwtToken_Rejected()
✓ testExpiredJwtToken_Rejected()
✓ testMissingToken_UnauthorizedResponse()
✓ testMalformedToken_BadRequest()
```

#### 9b. RateLimitingFilterTest
```java
✓ testWithinRateLimit_AllowRequest()
✓ testExceedsRateLimit_TooManyRequests()
✓ testRateLimitReset_TimeWindow()
✓ testBypassForWhitelistedIPs()
```

#### 9c. ApiKeyValidationFilterTest
```java
✓ testValidApiKey_Success()
✓ testInvalidApiKey_Unauthorized()
✓ testMissingApiKey_Forbidden()
✓ testRevokedApiKey_Rejected()
```

#### 9d. AdminBasicAuthFilterTest
```java
✓ testValidCredentials_Success()
✓ testInvalidCredentials_Unauthorized()
✓ testMissingCredentials_Rejected()
```

#### 9e. TraceIdFilterTest
```java
✓ testTraceIdGeneration()
✓ testTraceIdPropagation()
✓ testTraceIdLogging()
```

#### 9f. OriginValidationFilterTest
```java
✓ testAllowedOrigin_Success()
✓ testDisallowedOrigin_Rejected()
✓ testWildcardOrigin()
```

---

## Phase 4: Controller Tests (REST Endpoints)

### 10. BusScheduleController Tests
**Priority:** 🟠 HIGH  
**Estimated LOC:** 300-400

```java
✓ testGetBusesForRoute_Success()
✓ testGetBusesForRoute_RouteNotFound()
✓ testSearchBuses_WithMultipleFilters()
✓ testSearchBuses_Pagination()
✓ testEnhancedSearch_Integration()
✓ testErrorHandling_BadRequest()
```

---

### 11. BusTrackingController Tests
**Priority:** 🟠 HIGH  
**Estimated LOC:** 250-350

```java
✓ testReportBusLocation_Success()
✓ testReportBusLocation_ReporterIdValidation()
✓ testGetBusLocation_Current()
✓ testGetBusRouteHistory_TimePeriod()
✓ testGetCachedLocation_Performance()
```

---

### 12. Additional Controller Tests
**Priority:** 🟡 MEDIUM  
**Estimated LOC:** 500-700

Create tests for:
- AdminController (operations)
- LocationController (search/validation)
- ReviewController (submission/retrieval)
- ContributionController (workflows)
- RouteIssueController (issue management)

---

## Phase 5: Adapter & Repository Tests

### 13. Repository Adapter Tests (10 tests)
**Priority:** 🟡 MEDIUM  
**Estimated LOC:** 400-500

Test JPA repository adapters:
- BusJpaRepositoryAdapter
- LocationJpaRepositoryAdapter
- RouteContributionRepositoryAdapter
- ImageContributionRepositoryAdapter
- etc.

---

### 14. Persistence Adapter Tests
**Priority:** 🟡 MEDIUM  
**Estimated LOC:** 300-400

Test persistence layer:
- Transaction handling
- Cascade behavior
- Query performance

---

## Test Implementation Checklist

### For Each New Test File:

- [ ] Create test class with @SpringBootTest or @DataJpaTest
- [ ] Configure H2 database and test properties
- [ ] Add @ExtendWith(SpringExtension.class)
- [ ] Implement setUp() with test data builders
- [ ] Add @DisplayName annotations for clarity
- [ ] Use parameterized tests for edge cases
- [ ] Mock external dependencies
- [ ] Test both success and error paths
- [ ] Add assertions with meaningful messages
- [ ] Include integration tests where applicable
- [ ] Add performance benchmarks for critical paths
- [ ] Document test assumptions
- [ ] Run full test suite locally before commit

---

## Test Data Strategy

### Use Test Data Builders:
```java
// Example pattern
private Bus createTestBus() {
    return Bus.builder()
        .busId(new BusId("BUS-001"))
        .route("Route-42")
        .licensePlate("TN-01-AA-0001")
        .build();
}

private TimingImageContribution createTestContribution() {
    return TimingImageContribution.builder()
        .id(UUID.randomUUID())
        .busId(new BusId("BUS-001"))
        .contributorId("user-123")
        .imageData(testImageBytes)
        .build();
}
```

---

## Integration Test Strategy

### Test End-to-End Workflows:
1. **Contribution Workflow**
   - User submits image
   - Admin reviews
   - System approves/rejects
   - Notification sent

2. **Search Workflow**
   - User enters location/route
   - System searches (Overpass API)
   - Results filtered/ranked
   - Cache updated

3. **Tracking Workflow**
   - Reporter submits location
   - System validates/stores
   - Cache invalidated
   - Results available to users

---

## Continuous Integration

### Add to CI/CD Pipeline:
```yaml
test:
  stage: test
  script:
    - ./gradlew test jacocoTestReport
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: build/reports/jacoco/test/jacocoTestReport.xml
  coverage: '/TOTAL.*/\s+(\d+%)$/'
  allow_failure: false
```

### Coverage Gates:
- ✅ Pass: Overall > 50%
- ⚠️ Warning: 30-50%
- ❌ Fail: < 30%

Target: **70%+ before production**

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Overall Coverage | 22.27% | 70% | 2 weeks |
| Service Coverage | 23.23% | 80% | 2 weeks |
| Controller Coverage | 6.69% | 75% | 1 week |
| Security Coverage | 6.19% | 85% | 3 days |
| Test Count | 36 | 75-100 | 2 weeks |
| Untested Classes | 198 | <50 | 2 weeks |

---

## Implementation Roadmap

### Week 1 (Days 1-5): Critical New Features
- Day 1-2: OverpassGeocodingService tests
- Day 2-3: FeedbackController tests
- Day 3-4: ContributionApplicationService tests
- Day 4-5: TimingImageContributionController tests
- **Target Coverage: 35%**

### Week 2 (Days 6-10): Core Business Logic
- Day 6-7: BusScheduleService + Controller tests
- Day 7-8: BusTrackingService + Controller tests
- Day 8-9: DuplicateDetectionService tests
- Day 9-10: LocationValidationService tests
- **Target Coverage: 50%**

### Week 2-3 (Days 11-15): Security & Remaining
- Day 11-12: All Security Filter tests (6 tests)
- Day 12-13: Remaining Controller tests
- Day 13-14: Repository Adapter tests
- Day 14-15: Integration & Performance tests
- **Target Coverage: 70%+**

---

## Notes & Best Practices

1. **Use Spring Test Slices** for faster tests:
   - `@WebMvcTest` for controllers
   - `@DataJpaTest` for repositories
   - `@SpringBootTest` for integration tests

2. **Mock External Services:**
   - Overpass API
   - Gemini Vision API
   - Social Media APIs
   - File Storage

3. **Test Data Isolation:**
   - Use `@DirtiesContext` sparingly
   - Rollback transactions with `@Transactional`
   - Clean test database between runs

4. **Performance Considerations:**
   - Use H2 in-memory database
   - Parallel test execution with Maven Surefire
   - Skip slow integration tests in fast builds

5. **Assertion Patterns:**
   ```java
   assertThat(result)
       .isNotNull()
       .extracting(Object::getId)
       .isEqualTo(expectedId);
   ```

---

## Related Documents

- [Logging Analysis](LOGGING_ERROR_TRACKING_ANALYSIS.md)
- [Logger Additions Summary](MISSING_LOGGER_FIXES_SUMMARY.md)
- [Architecture Guidelines](HEXAGONAL_ARCHITECTURE_GUIDELINES.md)
