# DTO Validation - Common Issues & Solutions

## Quick Reference Guide for DTO Issues

### 1. JSON Serialization Issues

#### Problem: LocalTime appears as `[9, 30, 0, 0]`
**Cause**: Jackson doesn't know how to serialize Java time types

**Solution**:
```java
// Add to pom.xml
<dependency>
    <groupId>com.fasterxml.jackson.datatype</groupId>
    <artifactId>jackson-datatype-jsr310</artifactId>
    <version>2.15.2</version>
</dependency>

// Add to ObjectMapper config
ObjectMapper mapper = new ObjectMapper();
mapper.registerModule(new JavaTimeModule());
mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
```

---

### 2. Records with Deserialization Issues

#### Problem: Record constructor argument name mismatch
**Example**:
```json
{"bus_number": "TN-01-1234"}
// Fails because Java field is busNumber, not bus_number
```

**Solution**:
```java
public record BusDTO(
    @JsonProperty("bus_number")
    String busNumber,
    @JsonProperty("bus_name")
    String busName
) {}
```

---

### 3. Lombok @Data Issues

#### Problem: `@Data` generates setters (mutable, thread-unsafe)
**Current Code**:
```java
@Data  // Creates setters!
public class AnnouncementDTO {
    private Long id;
    private String title;
}
```

**Better Approach**:
```java
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementDTO {
    private Long id;
    private String title;
    // No setters - immutable after construction
}
// Or just use Record
```

---

### 4. Null Pointer Exceptions in DTOs

#### Problem: No null checks in DTO constructors
**Unsafe Code**:
```java
public record BusDTO(String name, List<String> features) {}

// Later...
new BusDTO("MyBus", null);  // NPE when features.stream() called
```

**Safe Code**:
```java
public record BusDTO(String name, List<String> features) {
    public BusDTO {
        Objects.requireNonNull(name, "name cannot be null");
        features = features != null ? List.copyOf(features) : List.of();
    }
}
```

---

### 5. Large DTO Anti-pattern

#### Problem: Single DTO with 20+ fields
```java
@Data
public class AnnouncementDTO {
    private Long id;
    private String title;
    private String message;
    // ... 21 more fields!
}
```

#### Solution: Split into Smaller DTOs
```java
// Read-only DTO for list endpoints
public record AnnouncementSummaryDTO(
    Long id,
    String title,
    String category,
    Integer priority
) {}

// Detail DTO for full view
public record AnnouncementDetailDTO(
    Long id,
    String title,
    String message,
    String link,
    LocalDateTime expiresAt,
    // ... only relevant fields
) {}

// Request DTO for updates
public record AnnouncementUpdateRequest(
    @NotBlank String title,
    @NotBlank String message,
    @NotNull LocalDateTime expiresAt
) {}
```

---

### 6. Field Type Consistency Issues

#### Problem: Type mismatch between layers
```java
// Domain
public class Bus {
    private LocalTime departureTime;  // Java time type
}

// Entity
@Entity
public class BusJpaEntity {
    private LocalTime departureTime;  // Stored as TIME
}

// DTO
public record BusDTO(String departureTime) {}  // String!
```

**Why This Matters**:
- Domain: Strongly typed
- Database: Native type
- API: Human-readable string

**Solution**: Document the pattern
```java
/**
 * Times are stored as HH:mm:ss format in database
 * Serialized as ISO-8601 strings in API (e.g., "09:30:00")
 * Converted to LocalTime in domain layer
 */
public record BusDTO(
    @JsonFormat(pattern = "HH:mm:ss")
    String departureTime
) {}
```

---

### 7. Immutability Violations

#### Problem: Mutable collections in DTOs
```java
public record RouteDTO(List<StopDTO> stops) {}

// User code
RouteDTO route = ...;
route.stops().add(new StopDTO(...));  // Modifies internal state!
```

**Solution**: Defensive copying
```java
public record RouteDTO(List<StopDTO> stops) {
    public RouteDTO {
        stops = stops != null ? List.copyOf(stops) : List.of();
        // Now immutable!
    }
}
```

---

### 8. Validation Not Applied

#### Problem: No validation on incoming DTOs
```java
@PostMapping
public void saveAnnouncement(@RequestBody AnnouncementDTO dto) {
    // dto.title could be null, blank, or 1000+ chars!
    announcementService.save(dto);
}
```

**Solution**: Add validation
```java
@Data
@Validated
public class AnnouncementDTO {
    @NotNull(message = "ID required")
    private Long id;
    
    @NotBlank(message = "Title required")
    @Size(min = 3, max = 255, message = "Title must be 3-255 chars")
    private String title;
    
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Invalid category")
    private String category;
}

@PostMapping
public void saveAnnouncement(@Valid @RequestBody AnnouncementDTO dto) {
    // Now validated!
}
```

---

### 9. Missing Factory Methods

#### Problem: Complex DTO creation in controllers
```java
// In controller - shouldn't do this!
BusDTO dto = new BusDTO(
    bus.id(),
    bus.busNumber(),
    bus.name(),
    // ... 10 more field assignments
);
```

**Solution**: Add factory method to DTO
```java
public record BusDTO(...) {
    public static BusDTO fromDomain(Bus bus) {
        return new BusDTO(
            bus.id(),
            bus.busNumber(),
            // ... properly mapped
        );
    }
}

// In controller
BusDTO dto = BusDTO.fromDomain(bus);
```

---

### 10. Inconsistent Naming Conventions

#### Problem: Field names don't match JSON
```json
{
  "bus_number": "TN-01-1234",
  "busName": "Express",
  "departure_time": "09:30"
}
```

**Solution**: Use consistent naming
```java
public record BusDTO(
    @JsonProperty("bus_number")
    String busNumber,
    
    @JsonProperty("bus_name")
    String busName,
    
    @JsonProperty("departure_time")
    String departureTime
) {}

// Or use Jackson configuration
@Configuration
public class JacksonConfig {
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        return mapper;
    }
}
```

---

## DTO Testing Patterns

### Pattern 1: Serialization Test
```java
@Test
void testBusDTOSerialization() throws JsonProcessingException {
    BusDTO original = new BusDTO(1L, "TN-01-1234", "Express");
    String json = objectMapper.writeValueAsString(original);
    BusDTO restored = objectMapper.readValue(json, BusDTO.class);
    assertEquals(original, restored);
}
```

### Pattern 2: Null Safety Test
```java
@Test
void testBusDTOWithNullName() {
    assertThrows(NullPointerException.class, () ->
        new BusDTO(1L, null, "Express")
    );
}
```

### Pattern 3: Validation Test
```java
@Test
void testAnnouncementDTOValidation() {
    AnnouncementDTO invalid = new AnnouncementDTO();
    invalid.setTitle("");  // Blank!
    invalid.setPriority(-1);  // Negative!
    
    Set<ConstraintViolation<AnnouncementDTO>> violations =
        validator.validate(invalid);
    
    assertEquals(2, violations.size());
}
```

### Pattern 4: Deserialization Error Handling
```java
@Test
void testInvalidJsonDeserialization() {
    String invalidJson = "{\"id\": \"not-a-number\"}";
    
    assertThrows(JsonMappingException.class, () ->
        objectMapper.readValue(invalidJson, BusDTO.class)
    );
}
```

---

## Best Practices Summary

| Practice | Benefit | Effort |
|----------|---------|--------|
| Use Records for new DTOs | Immutable, concise | Low |
| Add validation annotations | Prevent invalid data | Low |
| Defensive copying in constructors | Thread-safe immutability | Medium |
| Factory methods (fromDomain) | Cleaner code | Low |
| Javadoc comments | Better documentation | Low |
| Unit tests for serialization | Catch issues early | Medium |
| Jackson configuration | Consistent serialization | Low |
| Keep DTOs small (<10 fields) | Easier to maintain | Low |

---

## Red Flags (Problems to Watch For)

🚩 DTO with 20+ fields → Split it
🚩 Mutable collections without defensive copy → Fix it
🚩 No validation annotations → Add them
🚩 Using @Data with setters → Use @Getter instead
🚩 LocalTime as is without format → Add @JsonFormat
🚩 Tests that don't cover serialization → Add tests
🚩 No factory methods from domain → Create them
🚩 Missing Javadoc → Document purpose

