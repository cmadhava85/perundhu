# DTO Testing Implementation Guide

**Status**: ✅ READY TO IMPLEMENT  
**Date**: Session Following Code Validation Audit  
**Priority**: HIGH - Testing ensures validation annotations work in real scenarios

## Executive Summary

DTOs have been enhanced with comprehensive validation annotations. This guide provides test implementations to verify serialization, deserialization, and validation work correctly in real-world scenarios.

## 1. Jackson Configuration Testing

### Test: LocalTime Serialization

```java
@SpringBootTest
class JacksonConfigurationTest {
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Test
    void shouldSerializeLocalTimeToISO8601() throws JsonProcessingException {
        LocalTime time = LocalTime.of(9, 30, 0);
        String json = objectMapper.writeValueAsString(time);
        
        assertEquals("\"09:30:00\"", json);
    }
    
    @Test
    void shouldDeserializeISO8601ToLocalTime() throws JsonProcessingException {
        String json = "\"09:30:00\"";
        LocalTime time = objectMapper.readValue(json, LocalTime.class);
        
        assertEquals(LocalTime.of(9, 30, 0), time);
    }
    
    @Test
    void shouldFailOnUnknownProperties() {
        String json = "{\"busId\": 1, \"unknownField\": \"value\"}";
        
        assertThrows(JsonMappingException.class, () ->
            objectMapper.readValue(json, BusLocationReportDTO.class)
        );
    }
}
```

### Test: DTO Serialization Roundtrip

```java
@Test
void shouldSerializeAndDeserializeAnalyticsDataPointDTO() throws JsonProcessingException {
    AnalyticsDataPointDTO original = new AnalyticsDataPointDTO(
        "2024-01-15T10:30:00",
        "2024-01-15",
        1L,
        "Bus A",
        "BUS001",
        "Passenger Count",
        150.0,
        "persons",
        Map.of("accuracy", "high")
    );
    
    String json = objectMapper.writeValueAsString(original);
    AnalyticsDataPointDTO deserialized = 
        objectMapper.readValue(json, AnalyticsDataPointDTO.class);
    
    assertEquals(original, deserialized);
}
```

## 2. Validation Annotations Testing

### Test: BusLocationReportDTO Validation

```java
@SpringBootTest
class BusLocationReportDTOValidationTest {
    
    @Autowired
    private ValidatorFactory validatorFactory;
    
    private Validator validator;
    
    @BeforeEach
    void setup() {
        validator = validatorFactory.getValidator();
    }
    
    @Test
    void shouldRejectNullBusId() {
        BusLocationReportDTO dto = new BusLocationReportDTO(
            null, // busId - INVALID
            null,
            "user1",
            "2024-01-15T10:30:00",
            45.0, 75.0,
            10.0, 25.0, 90.0,
            "device123"
        );
        
        Set<ConstraintViolation<BusLocationReportDTO>> violations = 
            validator.validate(dto);
        
        assertEquals(1, violations.size());
        assertTrue(violations.iterator().next()
            .getMessage().contains("Bus ID is required"));
    }
    
    @Test
    void shouldRejectInvalidLatitude() {
        BusLocationReportDTO dto = new BusLocationReportDTO(
            1L,
            null,
            "user1",
            "2024-01-15T10:30:00",
            95.0, // INVALID: > 90
            75.0,
            10.0, 25.0, 90.0,
            "device123"
        );
        
        Set<ConstraintViolation<BusLocationReportDTO>> violations = 
            validator.validate(dto);
        
        assertFalse(violations.isEmpty());
    }
    
    @Test
    void shouldAcceptValidLocation() {
        BusLocationReportDTO dto = new BusLocationReportDTO(
            1L,
            null,
            "user1",
            "2024-01-15T10:30:00",
            45.0,      // Valid latitude
            75.0,      // Valid longitude
            10.0, 25.0, 90.0,
            "device123"
        );
        
        Set<ConstraintViolation<BusLocationReportDTO>> violations = 
            validator.validate(dto);
        
        assertTrue(violations.isEmpty());
    }
}
```

### Test: AnalyticsDataPointDTO Validation

```java
@SpringBootTest
class AnalyticsDataPointDTOValidationTest {
    
    @Autowired
    private ValidatorFactory validatorFactory;
    
    @Test
    void shouldRejectBlankTimestamp() {
        AnalyticsDataPointDTO dto = new AnalyticsDataPointDTO(
            "", // INVALID: blank
            "2024-01-15",
            1L,
            "Bus A",
            "BUS001",
            "Passenger Count",
            150.0,
            "persons",
            null
        );
        
        Validator validator = validatorFactory.getValidator();
        Set<ConstraintViolation<AnalyticsDataPointDTO>> violations = 
            validator.validate(dto);
        
        assertFalse(violations.isEmpty());
    }
    
    @Test
    void shouldRejectNullMetricValue() {
        AnalyticsDataPointDTO dto = new AnalyticsDataPointDTO(
            "2024-01-15T10:30:00",
            "2024-01-15",
            1L,
            "Bus A",
            "BUS001",
            "Passenger Count",
            null, // INVALID
            "persons",
            null
        );
        
        Validator validator = validatorFactory.getValidator();
        Set<ConstraintViolation<AnalyticsDataPointDTO>> violations = 
            validator.validate(dto);
        
        assertEquals(1, violations.size());
        assertTrue(violations.iterator().next()
            .getMessage().contains("Metric value is required"));
    }
}
```

### Test: BusDTO Validation

```java
@SpringBootTest
class BusDTOValidationTest {
    
    @Autowired
    private ValidatorFactory validatorFactory;
    
    @Test
    void shouldRejectCapacityBelowMinimum() {
        BusDTO dto = new BusDTO(
            1L, "BUS001", "Bus A", "Operator", "AC",
            "10:00", "18:00", 4.5, Map.of(),
            null, null, null, null, null, null,
            0, // INVALID: < 1
            true
        );
        
        Validator validator = validatorFactory.getValidator();
        Set<ConstraintViolation<BusDTO>> violations = 
            validator.validate(dto);
        
        assertFalse(violations.isEmpty());
    }
    
    @Test
    void shouldRejectCapacityAboveMaximum() {
        BusDTO dto = new BusDTO(
            1L, "BUS001", "Bus A", "Operator", "AC",
            "10:00", "18:00", 4.5, Map.of(),
            null, null, null, null, null, null,
            600, // INVALID: > 500
            true
        );
        
        Validator validator = validatorFactory.getValidator();
        Set<ConstraintViolation<BusDTO>> violations = 
            validator.validate(dto);
        
        assertFalse(violations.isEmpty());
    }
    
    @Test
    void shouldAcceptValidCapacity() {
        BusDTO dto = new BusDTO(
            1L, "BUS001", "Bus A", "Operator", "AC",
            "10:00", "18:00", 4.5, Map.of(),
            null, null, null, null, null, null,
            50, // Valid: 1-500
            true
        );
        
        Validator validator = validatorFactory.getValidator();
        Set<ConstraintViolation<BusDTO>> violations = 
            validator.validate(dto);
        
        assertTrue(violations.isEmpty());
    }
}
```

## 3. Request DTO Validation Testing

### Test: RouteContributionRequest Validation

```java
@SpringBootTest
class RouteContributionRequestValidationTest {
    
    @Autowired
    private ValidatorFactory validatorFactory;
    
    @Test
    void shouldRejectInvalidDepartureTime() {
        RouteContributionRequest.StopContributionRequest stop = 
            new RouteContributionRequest.StopContributionRequest(
                "Stop A",
                45.0, 75.0,
                "13:45",
                "25:99", // INVALID: > 23:59
                1
            );
        
        Validator validator = validatorFactory.getValidator();
        Set<ConstraintViolation<RouteContributionRequest.StopContributionRequest>> violations = 
            validator.validate(stop);
        
        assertFalse(violations.isEmpty());
    }
    
    @Test
    void shouldAcceptValidStop() {
        RouteContributionRequest.StopContributionRequest stop = 
            new RouteContributionRequest.StopContributionRequest(
                "Stop A",
                45.0, 75.0,
                "13:45",
                "14:30",
                1
            );
        
        Validator validator = validatorFactory.getValidator();
        Set<ConstraintViolation<RouteContributionRequest.StopContributionRequest>> violations = 
            validator.validate(stop);
        
        assertTrue(violations.isEmpty());
    }
}
```

### Test: BusLocationRequest Validation

```java
@SpringBootTest
class BusLocationRequestValidationTest {
    
    @Autowired
    private ValidatorFactory validatorFactory;
    
    @Test
    void shouldRejectBlankUserId() {
        BusLocationRequest request = new BusLocationRequest(
            1L,
            null,
            "", // INVALID: blank
            "2024-01-15T10:30:00",
            45.0, 75.0,
            10.0, 25.0, 90.0,
            "device123"
        );
        
        Validator validator = validatorFactory.getValidator();
        Set<ConstraintViolation<BusLocationRequest>> violations = 
            validator.validate(request);
        
        assertFalse(violations.isEmpty());
    }
    
    @Test
    void shouldRejectInvalidLatitude() {
        BusLocationRequest request = new BusLocationRequest(
            1L,
            null,
            "user1",
            "2024-01-15T10:30:00",
            91.0, // INVALID: > 90
            75.0,
            10.0, 25.0, 90.0,
            "device123"
        );
        
        Validator validator = validatorFactory.getValidator();
        Set<ConstraintViolation<BusLocationRequest>> violations = 
            validator.validate(request);
        
        assertFalse(violations.isEmpty());
    }
}
```

## 4. REST Controller Integration Testing

### Test: Image Upload with Validation

```java
@SpringBootTest
@AutoConfigureMockMvc
class ImageUploadIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private ImageContributionProcessingService imageProcessingService;
    
    @Test
    void shouldRejectImageContributionWithBlankUserId() throws Exception {
        BusLocationReportDTO reportDto = new BusLocationReportDTO(
            1L, null,
            "", // INVALID: blank userId
            "2024-01-15T10:30:00",
            45.0, 75.0,
            10.0, 25.0, 90.0,
            "device123"
        );
        
        mockMvc.perform(post("/api/contributions/image")
                .param("reportData", objectMapper.writeValueAsString(reportDto))
                .param("language", "en"))
            .andExpect(status().isBadRequest());
    }
    
    @Test
    void shouldAcceptValidImageContribution() throws Exception {
        BusLocationReportDTO reportDto = new BusLocationReportDTO(
            1L, null,
            "user1",
            "2024-01-15T10:30:00",
            45.0, 75.0,
            10.0, 25.0, 90.0,
            "device123"
        );
        
        imageProcessingService.processImageContribution(any(), any())
            .thenReturn(ImageContributionResponse.success("123"));
        
        mockMvc.perform(post("/api/contributions/image")
                .param("reportData", objectMapper.writeValueAsString(reportDto))
                .param("language", "en"))
            .andExpect(status().isOk());
    }
}
```

### Test: Route Contribution with Nested Validation

```java
@SpringBootTest
@AutoConfigureMockMvc
class RouteContributionIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Test
    void shouldRejectRouteWithInvalidStops() throws Exception {
        List<RouteContributionRequest.StopContributionRequest> stops = List.of(
            new RouteContributionRequest.StopContributionRequest(
                "Stop A", 45.0, 75.0,
                "13:45", "25:99", // INVALID time
                1
            )
        );
        
        RouteContributionRequest request = new RouteContributionRequest(
            "user1", "BUS001", "Bus A",
            "Chennai", "Bangalore",
            "en",
            13.0, 80.0, 15.0, 77.0,
            "10:00", "18:00", null, null,
            stops
        );
        
        mockMvc.perform(post("/api/contributions/route")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }
}
```

## 5. Test Files to Create

Create the following test files in `backend/app/src/test/java/com/perundhu/`:

```
application/dto/
  - JacksonConfigurationTest.java
  - BusLocationReportDTOValidationTest.java
  - AnalyticsDataPointDTOValidationTest.java
  - BusDTOValidationTest.java
  - BusLocationRequestValidationTest.java
  - RouteContributionRequestValidationTest.java
  - DTOSerializationRoundtripTest.java

adapter/input/rest/
  - ImageUploadIntegrationTest.java
  - RouteContributionIntegrationTest.java
  - BusLocationReportIntegrationTest.java
```

## 6. Maven/Gradle Dependencies Required

Add to `pom.xml` (for testing):

```xml
<!-- Validation testing -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- Jakarta Validation API -->
<dependency>
    <groupId>jakarta.validation</groupId>
    <artifactId>jakarta.validation-api</artifactId>
</dependency>

<!-- Hibernate Validator -->
<dependency>
    <groupId>org.hibernate.validator</groupId>
    <artifactId>hibernate-validator</artifactId>
</dependency>

<!-- Test dependencies -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<dependency>
    <groupId>com.fasterxml.jackson.datatype</groupId>
    <artifactId>jackson-datatype-jsr310</artifactId>
</dependency>
```

## 7. Running the Tests

```bash
# Run all DTO tests
mvn test -Dtest="*DTO*Test"

# Run specific test class
mvn test -Dtest="BusLocationReportDTOValidationTest"

# Run with coverage
mvn test jacoco:report

# Run integration tests
mvn test -Dtest="*IntegrationTest"
```

## 8. Expected Results

### Pass Criteria:
- ✅ All Jackson serialization/deserialization tests pass
- ✅ All validation annotation tests pass
- ✅ All REST controller integration tests pass
- ✅ Coverage > 80% for DTO classes
- ✅ No constraint violations on valid inputs
- ✅ Expected constraint violations on invalid inputs

### Failure Analysis:
If tests fail, check:

1. **Serialization Failures**: Verify `JacksonConfiguration` is loaded
   ```java
   @Configuration
   public class JacksonConfiguration { ... }
   ```

2. **Validation Failures**: Ensure `@Valid` annotation used in method signatures
   ```java
   public ResponseEntity<String> uploadImage(
       @RequestParam @Valid BusLocationReportDTO reportData
   ) { ... }
   ```

3. **Nested Validation**: Use `@Valid` on nested collections
   ```java
   @Valid List<StopContributionRequest> stops
   ```

## 9. Next Steps After Testing

1. Add test coverage badges to CI/CD pipeline
2. Set up GitHub Actions to run tests on every commit
3. Monitor test results in SonarQube
4. Document validation rules in API documentation (Swagger/OpenAPI)
5. Add validation examples to developer guide

## 10. Integration with Image Upload

The image upload feature now works with validated DTOs:

```java
@PostMapping("/api/contributions/image")
public ResponseEntity<ImageContributionResponse> uploadImage(
    @RequestParam @Valid BusLocationReportDTO reportData,
    @RequestParam("imageFile") MultipartFile imageFile,
    @RequestParam("language") String language
) {
    // Validation happens automatically via @Valid annotation
    // Only valid requests reach this method
    return imageProcessingService.processImageContribution(reportData, imageFile);
}
```

**Status**: ✅ Ready to implement these tests once database migrations (V54, V55) are deployed.

---

## Summary

- **Validation Testing**: Covers all major DTOs and request objects
- **Integration Testing**: Tests REST endpoints with validation
- **Jackson Testing**: Ensures proper serialization configuration
- **Coverage Target**: 85%+ for DTO layer
- **Next Session**: Run these tests after V54/V55 database migrations deployed

