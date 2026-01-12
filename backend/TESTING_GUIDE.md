# GraphHopper Integration - Testing Guide

## Unit Testing

### Test GraphHopperRoutingAdapter

```java
// File: backend/app/src/test/java/com/perundhu/infrastructure/adapter/routing/GraphHopperRoutingAdapterTest.java

@SpringBootTest
@ActiveProfiles("test")
class GraphHopperRoutingAdapterTest {
    
    @Autowired
    private GraphHopperRoutingAdapter adapter;
    
    @Test
    void testValidateJourneyDuration_Realistic() {
        // Chennai to Madurai: 160 km, expected 4 hours
        var result = adapter.validateJourneyDuration(
            13.0827, 80.2707,  // Chennai
            9.9252, 78.1198,   // Madurai
            LocalDateTime.parse("2024-01-15T08:00:00"),
            LocalDateTime.parse("2024-01-15T12:00:00"),  // 4 hours
            "bus"
        );
        
        assertTrue(result.isValid());
        assertTrue(result.confidenceScore() > 80);
        assertEquals("JOURNEY_DURATION", result.validationType().name());
    }
    
    @Test
    void testValidateJourneyDuration_Unrealistic() {
        // Same route but claimed in 2 hours (impossible)
        var result = adapter.validateJourneyDuration(
            13.0827, 80.2707,
            9.9252, 78.1198,
            LocalDateTime.parse("2024-01-15T08:00:00"),
            LocalDateTime.parse("2024-01-15T10:00:00"),  // 2 hours
            "bus"
        );
        
        assertFalse(result.isValid());
        assertTrue(result.confidenceScore() > 90);
        assertNotNull(result.issue());
    }
    
    @Test
    void testValidateStopSequence_Ordered() {
        List<RoutingValidationPort.Stop> stops = List.of(
            new RoutingValidationPort.Stop("Stop 1", 12.9352, 79.8432, 
                LocalDateTime.parse("2024-01-15T09:00:00"),
                LocalDateTime.parse("2024-01-15T09:05:00"))
        );
        
        var result = adapter.validateStopSequence(
            13.0827, 80.2707,   // Chennai
            stops,
            9.9252, 78.1198     // Madurai
        );
        
        assertTrue(result.isValid());
        assertTrue(result.confidenceScore() > 80);
    }
    
    @Test
    void testValidateStopSequence_OutOfOrder() {
        // Stop that's way off the route
        List<RoutingValidationPort.Stop> stops = List.of(
            new RoutingValidationPort.Stop("Wrong Stop", 20.0, 80.0,  // Way north
                LocalDateTime.parse("2024-01-15T09:00:00"),
                LocalDateTime.parse("2024-01-15T09:05:00"))
        );
        
        var result = adapter.validateStopSequence(
            13.0827, 80.2707,
            stops,
            9.9252, 78.1198
        );
        
        assertFalse(result.isValid());
        assertTrue(result.confidenceScore() < 50);
    }
    
    @Test
    void testValidateSegmentSpeeds_Normal() {
        List<RoutingValidationPort.RouteSegment> segments = List.of(
            new RoutingValidationPort.RouteSegment(
                13.0827, 80.2707,
                9.9252, 78.1198,
                160000,  // 160 km in meters
                14400    // 4 hours in seconds (40 km/h)
            )
        );
        
        var result = adapter.validateSegmentSpeeds(segments, "bus");
        
        assertTrue(result.isValid());
        assertTrue(result.confidenceScore() > 80);
    }
    
    @Test
    void testValidateSegmentSpeeds_Impossible() {
        List<RoutingValidationPort.RouteSegment> segments = List.of(
            new RoutingValidationPort.RouteSegment(
                13.0827, 80.2707,
                9.9252, 78.1198,
                160000,  // 160 km
                1800     // 30 minutes (320 km/h - impossible!)
            )
        );
        
        var result = adapter.validateSegmentSpeeds(segments, "bus");
        
        assertFalse(result.isValid());
        assertTrue(result.confidenceScore() > 90);
    }
}
```

### Test RouteValidationAlertService

```java
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RouteValidationAlertServiceTest {
    
    @Autowired
    private RouteValidationAlertService alertService;
    
    @Autowired
    private RouteValidationAlertRepository alertRepository;
    
    @Test
    void testCreateAlertFromValidation_CreatesAlert() {
        UUID contributionId = UUID.randomUUID();
        var validationResult = new RoutingValidationPort.RouteValidationResult(
            false,
            95,
            RoutingValidationPort.ValidationType.JOURNEY_DURATION,
            "Journey time 100% faster than realistic",
            "3-4 hours",
            "1.5 hours"
        );
        
        var alert = alertService.createAlertFromValidation(contributionId, validationResult);
        
        assertTrue(alert.isPresent());
        assertEquals(RouteValidationAlertJpaEntity.AlertStatus.PENDING, alert.get().getStatus());
        assertEquals(95, alert.get().getConfidenceScore());
    }
    
    @Test
    void testCreateAlertFromValidation_SkipsIfValid() {
        UUID contributionId = UUID.randomUUID();
        var validationResult = new RoutingValidationPort.RouteValidationResult(
            true,   // isValid = true
            85,
            RoutingValidationPort.ValidationType.JOURNEY_DURATION,
            null,
            "3-4 hours",
            "3.5 hours"
        );
        
        var alert = alertService.createAlertFromValidation(contributionId, validationResult);
        
        assertTrue(alert.isEmpty());
    }
    
    @Test
    void testApproveAlert() {
        var alert = createTestAlert();
        var approved = alertService.approveAlert(alert.getId(), "admin@test.com", "Confirmed timing");
        
        assertEquals(RouteValidationAlertJpaEntity.AlertStatus.APPROVED, approved.getStatus());
        assertEquals("admin@test.com", approved.getReviewedBy());
        assertNotNull(approved.getReviewedAt());
    }
    
    @Test
    void testDismissAlert_FalsePositive() {
        var alert = createTestAlert();
        var dismissed = alertService.dismissAlert(alert.getId(), "admin@test.com", "Route is common express service");
        
        assertEquals(RouteValidationAlertJpaEntity.AlertStatus.DISMISSED, dismissed.getStatus());
    }
    
    @Test
    void testGetDashboardStats() {
        // Create several test alerts with different statuses
        createAlertWithStatus(RouteValidationAlertJpaEntity.AlertStatus.PENDING);
        createAlertWithStatus(RouteValidationAlertJpaEntity.AlertStatus.PENDING);
        createAlertWithStatus(RouteValidationAlertJpaEntity.AlertStatus.APPROVED);
        createAlertWithStatus(RouteValidationAlertJpaEntity.AlertStatus.DISMISSED);
        
        var stats = alertService.getDashboardStats();
        
        assertEquals(2L, stats.get("pendingCount"));
        assertEquals(1L, stats.get("approvedCount"));
        assertEquals(1L, stats.get("dismissedCount"));
    }
    
    @Test
    void testGetHighConfidenceAlerts() {
        createAlertWithConfidence(95);
        createAlertWithConfidence(85);  // Below threshold
        createAlertWithConfidence(80);
        
        var highConfidence = alertService.getHighConfidenceAlerts();
        
        assertEquals(2, highConfidence.size());
        assertTrue(highConfidence.stream().allMatch(a -> a.getConfidenceScore() > 75));
    }
    
    private RouteValidationAlertJpaEntity createTestAlert() {
        return alertRepository.save(
            RouteValidationAlertJpaEntity.builder()
                .contributionId(UUID.randomUUID())
                .validationType(RoutingValidationPort.ValidationType.JOURNEY_DURATION)
                .confidenceScore(95)
                .expectedRange("3-4 hours")
                .actualValue("1.5 hours")
                .issueDescription("Journey time too fast")
                .status(RouteValidationAlertJpaEntity.AlertStatus.PENDING)
                .build()
        );
    }
}
```

### Test ContributionApplicationService Integration

```java
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ContributionApplicationServiceRoutingTest {
    
    @Autowired
    private ContributionApplicationService contributionService;
    
    @Autowired
    private RouteValidationAlertRepository alertRepository;
    
    @Test
    void testSubmitRouteContribution_CreatesAlert_ForUnrealisticTiming() {
        Map<String, Object> data = Map.of(
            "busNumber", "CH01TN001",
            "busName", "Chennai Express",
            "fromLocationName", "Chennai",
            "toLocationName", "Madurai",
            "fromLatitude", 13.0827,
            "fromLongitude", 80.2707,
            "toLatitude", 9.9252,
            "toLongitude", 78.1198,
            "departureTime", "2024-01-15T08:00:00",
            "arrivalTime", "2024-01-15T10:00:00",  // Only 2 hours for 160 km
            "stops", List.of()
        );
        
        var contribution = contributionService.submitRouteContribution(data, "test-user");
        
        assertNotNull(contribution.getId());
        
        // Verify alert was created
        var alerts = alertRepository.findByContributionId(UUID.fromString(contribution.getId()));
        assertFalse(alerts.isEmpty());
        assertEquals(RouteValidationAlertJpaEntity.AlertStatus.PENDING, alerts.get(0).getStatus());
        assertTrue(alerts.get(0).getConfidenceScore() > 80);
    }
    
    @Test
    void testSubmitRouteContribution_NoAlert_ForRealisticTiming() {
        Map<String, Object> data = Map.of(
            "busNumber", "CH01TN001",
            "busName", "Chennai Express",
            "fromLocationName", "Chennai",
            "toLocationName", "Madurai",
            "fromLatitude", 13.0827,
            "fromLongitude", 80.2707,
            "toLatitude", 9.9252,
            "toLongitude", 78.1198,
            "departureTime", "2024-01-15T08:00:00",
            "arrivalTime", "2024-01-15T12:00:00",  // 4 hours - realistic
            "stops", List.of()
        );
        
        var contribution = contributionService.submitRouteContribution(data, "test-user");
        
        assertNotNull(contribution.getId());
        
        // Verify no alert was created
        var alerts = alertRepository.findByContributionId(UUID.fromString(contribution.getId()));
        assertTrue(alerts.isEmpty());
    }
}
```

## Integration Testing

### Test REST Endpoints

```java
@SpringBootTest
@AutoConfigureMockMvc
class RouteValidationAlertControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private RouteValidationAlertRepository alertRepository;
    
    @Test
    void testGetPendingAlerts() throws Exception {
        // Create test alerts
        createTestAlerts(5);
        
        mockMvc.perform(get("/api/v1/admin/validation-alerts/pending")
                .header("Authorization", "Bearer " + generateTestToken())
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(5)))
            .andExpect(jsonPath("$.content[0].status", equalTo("PENDING")));
    }
    
    @Test
    void testApproveAlert() throws Exception {
        var alert = createTestAlert();
        
        mockMvc.perform(post("/api/v1/admin/validation-alerts/" + alert.getId() + "/approve")
                .header("Authorization", "Bearer " + generateTestToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"notes\": \"Confirmed by admin\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status", equalTo("APPROVED")))
            .andExpect(jsonPath("$.adminNotes", equalTo("Confirmed by admin")));
    }
    
    @Test
    void testGetDashboardStats() throws Exception {
        createTestAlerts(10);
        
        mockMvc.perform(get("/api/v1/admin/validation-alerts/stats")
                .header("Authorization", "Bearer " + generateTestToken())
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.pendingCount", greaterThanOrEqualTo(10)))
            .andExpect(jsonPath("$.highConfidenceCount").exists())
            .andExpect(jsonPath("$.falsePositiveRate").exists());
    }
}
```

## Performance Testing

### Load Test Script

```bash
#!/bin/bash
# File: backend/load-test.sh

# Configuration
BACKEND_URL="http://localhost:8080"
ADMIN_TOKEN="<your-admin-token>"
USER_TOKEN="<your-user-token>"
ITERATIONS=100
CONCURRENT=10

echo "Starting load test..."
echo "Backend: $BACKEND_URL"
echo "Iterations: $ITERATIONS"
echo "Concurrent: $CONCURRENT"

# Test 1: Route submission with validation
echo ""
echo "=== Test 1: Route Submission ===
 # Create test route data
ROUTE_DATA='{
  "busNumber": "LT01TN001",
  "busName": "Test Bus",
  "fromLocationName": "Chennai",
  "toLocationName": "Bangalore",
  "fromLatitude": 13.0827,
  "fromLongitude": 80.2707,
  "toLatitude": 12.9716,
  "toLongitude": 77.5946,
  "departureTime": "2024-01-15T08:00:00",
  "arrivalTime": "2024-01-15T14:00:00",
  "stops": []
}'

time ab -n $ITERATIONS -c $CONCURRENT \
  -p <(echo "$ROUTE_DATA") \
  -T application/json \
  -H "Authorization: Bearer $USER_TOKEN" \
  $BACKEND_URL/api/v1/contributions/routes

# Test 2: Get pending alerts
echo ""
echo "=== Test 2: Get Pending Alerts ==="
time ab -n $ITERATIONS -c $CONCURRENT \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  $BACKEND_URL/api/v1/admin/validation-alerts/pending

# Test 3: Get statistics
echo ""
echo "=== Test 3: Get Dashboard Stats ==="
time ab -n $ITERATIONS -c $CONCURRENT \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  $BACKEND_URL/api/v1/admin/validation-alerts/stats

echo ""
echo "Load test completed!"
```

### Run Load Test

```bash
chmod +x backend/load-test.sh
./backend/load-test.sh

# Expected results:
# - Route submission: 50-200 ms per request
# - Get pending alerts: 10-50 ms per request
# - Get stats: 50-150 ms per request
# - Memory usage: ~500 MB (GraphHopper) + application overhead
```

## Manual Testing Checklist

### Before Deployment

- [ ] Start backend: `./gradlew bootRun`
- [ ] Check GraphHopper startup logs for "Ready to serve routes"
- [ ] Verify database migration: `SELECT COUNT(*) FROM route_validation_alerts;`
- [ ] Test route submission with realistic timing (should pass)
- [ ] Test route submission with unrealistic timing (should create alert)
- [ ] Verify alert in database
- [ ] Test GET /api/v1/admin/validation-alerts/pending
- [ ] Test approve/dismiss/reject actions
- [ ] Verify alert status updated in database
- [ ] Test GET /api/v1/admin/validation-alerts/stats

### Test Routes for Validation

#### Route 1: Chennai → Madurai (Realistic)
```json
{
  "busNumber": "CH01TN001",
  "busName": "Chennai Express",
  "fromLocationName": "Chennai",
  "toLocationName": "Madurai",
  "fromLatitude": 13.0827,
  "fromLongitude": 80.2707,
  "toLatitude": 9.9252,
  "toLongitude": 78.1198,
  "departureTime": "2024-01-15T08:00:00",
  "arrivalTime": "2024-01-15T12:00:00",  # 4 hours - PASS
  "stops": []
}
```

#### Route 2: Chennai → Madurai (Too Fast - Should Alert)
```json
{
  "busNumber": "CH01TN002",
  "busName": "Impossible Express",
  "fromLocationName": "Chennai",
  "toLocationName": "Madurai",
  "fromLatitude": 13.0827,
  "fromLongitude": 80.2707,
  "toLatitude": 9.9252,
  "toLongitude": 78.1198,
  "departureTime": "2024-01-15T08:00:00",
  "arrivalTime": "2024-01-15T10:00:00",  # 2 hours - ALERT (95% confidence)
  "stops": []
}
```

#### Route 3: With Out-of-Order Stops
```json
{
  "busNumber": "CH01TN003",
  "busName": "Bad Stops Route",
  "fromLocationName": "Chennai",
  "toLocationName": "Madurai",
  "fromLatitude": 13.0827,
  "fromLongitude": 80.2707,
  "toLatitude": 9.9252,
  "toLongitude": 78.1198,
  "departureTime": "2024-01-15T08:00:00",
  "arrivalTime": "2024-01-15T12:30:00",
  "stops": [
    {
      "name": "Normal Stop",
      "latitude": 12.9352,
      "longitude": 79.8432,
      "arrivalTime": "2024-01-15T09:30:00",
      "departureTime": "2024-01-15T09:35:00"
    },
    {
      "name": "Way Off Stop",
      "latitude": 20.0,
      "longitude": 80.0,  # North of route
      "arrivalTime": "2024-01-15T10:00:00",
      "departureTime": "2024-01-15T10:05:00"
    }
  ]
}
```

## Test Results Documentation

Create `TESTING_RESULTS.md` after running tests:

```markdown
# GraphHopper Integration - Test Results

## Date: 2024-01-15
## Tester: QA Team

### Unit Tests
- GraphHopperRoutingAdapter: ✅ 8/8 passed
- RouteValidationAlertService: ✅ 6/6 passed
- ContributionApplicationService: ✅ 4/4 passed

### Integration Tests
- REST Endpoints: ✅ 10/10 passed
- Database Migrations: ✅ Successful
- End-to-end flow: ✅ Passed

### Performance Tests
- Route submission with validation: 145 ms avg
- Get pending alerts: 28 ms avg
- Dashboard stats: 87 ms avg
- Memory usage: 520 MB (acceptable)

### Load Test Results
- Throughput: 67 requests/sec (100 concurrent)
- Error rate: 0%
- p99 latency: 245 ms

### Manual Testing
- ✅ Realistic route: No alert created
- ✅ Unrealistic route: Alert created with 95% confidence
- ✅ Out-of-order stops: Alert created with 78% confidence
- ✅ Admin approve/dismiss/reject: All working
- ✅ Dashboard stats: Accurate and fast

### Conclusion
✅ **Ready for production deployment**
```

This completes the comprehensive testing guide for GraphHopper integration.
