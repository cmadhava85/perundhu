# Bus Timing Image Contribution System - Implementation Guide

## Overview
This system allows users to upload bus timing board images, which are then reviewed by admins, processed using OCR to extract timing data, and automatically update the database while skipping duplicate records.

## Frontend Implementation ✅ COMPLETE

### Components Created:
1. **BusTimingUpload.tsx** - User upload interface
2. **BusTimingAdminPanel.tsx** - Admin review & approval panel
3. **busTimingService.ts** - API service layer
4. **busTimingTypes.ts** - TypeScript types

### Features:
- Drag & drop image upload
- Tamil & English location support
- Real-time preview
- Admin OCR extraction interface
- Manual editing of extracted data
- Duplicate detection warnings
- Status tracking (PENDING, APPROVED, REJECTED, PROCESSING)

## Backend Implementation Required

### 1. Database Schema

```sql
-- Timing Image Contributions Table
CREATE TABLE timing_image_contributions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(100),
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    origin_location VARCHAR(200) NOT NULL,
    origin_location_tamil VARCHAR(200),
    origin_latitude DECIMAL(10, 8),
    origin_longitude DECIMAL(11, 8),
    board_type ENUM('GOVERNMENT', 'PRIVATE', 'LOCAL', 'INTER_CITY'),
    description TEXT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING') DEFAULT 'PENDING',
    validation_message TEXT,
    processed_date TIMESTAMP,
    processed_by VARCHAR(100),
    submitted_by VARCHAR(100),
    ocr_confidence DECIMAL(3, 2),
    requires_manual_review BOOLEAN DEFAULT FALSE,
    duplicate_check_status ENUM('CHECKED', 'DUPLICATES_FOUND', 'UNIQUE', 'SKIPPED'),
    merged_records INT DEFAULT 0,
    created_records INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_user (user_id),
    INDEX idx_origin (origin_location),
    INDEX idx_submission_date (submission_date)
);

-- Extracted Timings Table (JSON storage)
CREATE TABLE extracted_bus_timings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contribution_id BIGINT NOT NULL,
    destination VARCHAR(200) NOT NULL,
    destination_tamil VARCHAR(200),
    morning_timings JSON,  -- Array of time strings
    afternoon_timings JSON,
    night_timings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contribution_id) REFERENCES timing_image_contributions(id) ON DELETE CASCADE,
    INDEX idx_contribution (contribution_id),
    INDEX idx_destination (destination)
);

-- Bus Timing Records (Final approved data)
CREATE TABLE bus_timing_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bus_id BIGINT,
    from_location_id BIGINT NOT NULL,
    from_location_name VARCHAR(200) NOT NULL,
    to_location_id BIGINT NOT NULL,
    to_location_name VARCHAR(200) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME,
    timing_type ENUM('MORNING', 'AFTERNOON', 'NIGHT') NOT NULL,
    source ENUM('USER_CONTRIBUTION', 'OFFICIAL', 'OCR_EXTRACTED') DEFAULT 'OCR_EXTRACTED',
    contribution_id BIGINT,
    verified BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id),
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (contribution_id) REFERENCES timing_image_contributions(id),
    UNIQUE KEY unique_timing (from_location_id, to_location_id, departure_time, timing_type),
    INDEX idx_route (from_location_id, to_location_id),
    INDEX idx_departure (departure_time),
    INDEX idx_source (source)
);

-- Skipped Timing Records (Audit trail for duplicates)
CREATE TABLE skipped_timing_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contribution_id BIGINT NOT NULL,
    from_location_id BIGINT NOT NULL,
    from_location_name VARCHAR(200) NOT NULL,
    to_location_id BIGINT NOT NULL,
    to_location_name VARCHAR(200) NOT NULL,
    departure_time TIME NOT NULL,
    timing_type ENUM('MORNING', 'AFTERNOON', 'NIGHT') NOT NULL,
    skip_reason ENUM('DUPLICATE_EXACT', 'DUPLICATE_SIMILAR', 'INVALID_TIME', 'INVALID_LOCATION') NOT NULL,
    existing_record_id BIGINT,
    existing_record_source ENUM('USER_CONTRIBUTION', 'OFFICIAL', 'OCR_EXTRACTED'),
    skipped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by VARCHAR(100),
    notes TEXT,
    FOREIGN KEY (contribution_id) REFERENCES timing_image_contributions(id) ON DELETE CASCADE,
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id),
    FOREIGN KEY (existing_record_id) REFERENCES bus_timing_records(id) ON DELETE SET NULL,
    INDEX idx_contribution (contribution_id),
    INDEX idx_route (from_location_id, to_location_id),
    INDEX idx_skip_reason (skip_reason),
    INDEX idx_skipped_at (skipped_at)
);
```

### 2. Java Entities

```java
// TimingImageContribution.java
@Entity
@Table(name = "timing_image_contributions")
public class TimingImageContribution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String userId;
    private String imageUrl;
    private String thumbnailUrl;
    private String originLocation;
    private String originLocationTamil;
    private BigDecimal originLatitude;
    private BigDecimal originLongitude;
    
    @Enumerated(EnumType.STRING)
    private BoardType boardType;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private LocalDateTime submissionDate;
    
    @Enumerated(EnumType.STRING)
    private TimingImageStatus status;
    
    @Column(columnDefinition = "TEXT")
    private String validationMessage;
    
    private LocalDateTime processedDate;
    private String processedBy;
    private String submittedBy;
    private BigDecimal ocrConfidence;
    private Boolean requiresManualReview;
    
    @Enumerated(EnumType.STRING)
    private DuplicateCheckStatus duplicateCheckStatus;
    
    private Integer mergedRecords;
    private Integer createdRecords;
    
    @OneToMany(mappedBy = "contribution", cascade = CascadeType.ALL)
    private List<ExtractedBusTiming> extractedTimings;
}

// ExtractedBusTiming.java
@Entity
@Table(name = "extracted_bus_timings")
public class ExtractedBusTiming {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "contribution_id")
    private TimingImageContribution contribution;
    
    private String destination;
    private String destinationTamil;
    
    @Convert(converter = JsonListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> morningTimings;
    
    @Convert(converter = JsonListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> afternoonTimings;
    
    @Convert(converter = JsonListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> nightTimings;
}

// BusTimingRecord.java
@Entity
@Table(name = "bus_timing_records")
public class BusTimingRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "bus_id")
    private Bus bus;
    
    @ManyToOne
    @JoinColumn(name = "from_location_id")
    private Location fromLocation;
    
    private String fromLocationName;
    
    @ManyToOne
    @JoinColumn(name = "to_location_id")
    private Location toLocation;
    
    private String toLocationName;
    
    private LocalTime departureTime;
    private LocalTime arrivalTime;
    
    @Enumerated(EnumType.STRING)
    private TimingType timingType;
    
    @Enumerated(EnumType.STRING)
    private TimingSource source;
    
    @ManyToOne
    @JoinColumn(name = "contribution_id")
    private TimingImageContribution contribution;
    
    private Boolean verified;
    private LocalDateTime lastUpdated;
}

// SkippedTimingRecord.java
@Entity
@Table(name = "skipped_timing_records")
public class SkippedTimingRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "contribution_id")
    private TimingImageContribution contribution;
    
    @ManyToOne
    @JoinColumn(name = "from_location_id")
    private Location fromLocation;
    
    private String fromLocationName;
    
    @ManyToOne
    @JoinColumn(name = "to_location_id")
    private Location toLocation;
    
    private String toLocationName;
    
    private LocalTime departureTime;
    
    @Enumerated(EnumType.STRING)
    private TimingType timingType;
    
    @Enumerated(EnumType.STRING)
    private SkipReason skipReason;
    
    @ManyToOne
    @JoinColumn(name = "existing_record_id")
    private BusTimingRecord existingRecord;
    
    @Enumerated(EnumType.STRING)
    private TimingSource existingRecordSource;
    
    private LocalDateTime skippedAt;
    private String processedBy;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
}

// Enums
public enum SkipReason {
    DUPLICATE_EXACT,        // Exact match found (same time, route, type)
    DUPLICATE_SIMILAR,      // Similar timing exists (within 5 min window)
    INVALID_TIME,           // Time format incorrect or out of range
    INVALID_LOCATION        // Location not found or invalid
}
```

### 3. OCR Service Integration

#### Option 1: Tesseract OCR (Free, Local)
```java
@Service
public class TesseractOcrService {
    
    public TimingExtractionResult extractTimings(String imagePath, String originLocation) {
        try {
            // Initialize Tesseract
            ITesseract tesseract = new Tesseract();
            tesseract.setDatapath("/usr/share/tesseract-ocr/4.00/tessdata");
            tesseract.setLanguage("tam+eng"); // Tamil + English
            
            // Preprocess image
            BufferedImage image = ImageIO.read(new File(imagePath));
            image = preprocessImage(image);
            
            // Extract text
            String rawText = tesseract.doOCR(image);
            
            // Parse extracted text
            return parseTimingBoard(rawText, originLocation);
            
        } catch (Exception e) {
            throw new OcrException("Failed to extract timings", e);
        }
    }
    
    private BufferedImage preprocessImage(BufferedImage original) {
        // Convert to grayscale
        // Increase contrast
        // Denoise
        // Binarize
        return processed;
    }
    
    private TimingExtractionResult parseTimingBoard(String rawText, String origin) {
        List<ExtractedTiming> timings = new ArrayList<>();
        
        // Parse using regex patterns
        // காலை|morning -> morning timings
        // மாலை|afternoon -> afternoon timings  
        // இரவு|night -> night timings
        
        // Extract destination names and times
        Pattern destinationPattern = Pattern.compile("([\\p{Tamil}\\w\\s]+)\\s+காலை\\s+([\\d:,\\s]+)");
        // ... more patterns
        
        return TimingExtractionResult.builder()
            .origin(origin)
            .timings(timings)
            .confidence(calculateConfidence(rawText))
            .rawText(rawText)
            .build();
    }
}
```

#### Option 2: Google Cloud Vision API (Paid, More Accurate)
```java
@Service
public class GoogleVisionOcrService {
    
    @Value("${google.cloud.vision.api-key}")
    private String apiKey;
    
    public TimingExtractionResult extractTimings(String imageUrl, String originLocation) {
        try {
            // Initialize Vision API
            ImageAnnotatorClient vision = ImageAnnotatorClient.create();
            
            // Create image source
            ImageSource imageSource = ImageSource.newBuilder()
                .setImageUri(imageUrl)
                .build();
            
            Image image = Image.newBuilder()
                .setSource(imageSource)
                .build();
            
            // Detect text (both Tamil and English)
            Feature feature = Feature.newBuilder()
                .setType(Feature.Type.DOCUMENT_TEXT_DETECTION)
                .build();
            
            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                .addFeatures(feature)
                .setImage(image)
                .build();
            
            BatchAnnotateImagesResponse response = vision.batchAnnotateImages(
                Collections.singletonList(request)
            );
            
            AnnotateImageResponse imageResponse = response.getResponsesList().get(0);
            String extractedText = imageResponse.getFullTextAnnotation().getText();
            
            // Parse and structure the timing data
            return parseTimingBoard(extractedText, originLocation);
            
        } catch (Exception e) {
            throw new OcrException("Failed to extract timings with Vision API", e);
        }
    }
}
```

### 4. REST API Controller

```java
@RestController
@RequestMapping("/api/v1/contributions/timing-images")
public class TimingImageContributionController {
    
    @Autowired
    private TimingImageService timingImageService;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    @PostMapping
    public ResponseEntity<TimingImageContribution> uploadTimingImage(
        @RequestParam("image") MultipartFile file,
        @RequestParam("originLocation") String originLocation,
        @RequestParam(value = "originLocationTamil", required = false) String originLocationTamil,
        @RequestParam(value = "description", required = false) String description,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        // Validate file
        if (!isValidImage(file)) {
            throw new BadRequestException("Invalid image file");
        }
        
        // Upload to cloud storage (S3/GCS)
        String imageUrl = fileStorageService.uploadImage(file, "timing-boards");
        String thumbnailUrl = fileStorageService.createThumbnail(file, "timing-boards/thumbs");
        
        // Create contribution
        TimingImageContribution contribution = timingImageService.createContribution(
            userDetails.getUsername(),
            imageUrl,
            thumbnailUrl,
            originLocation,
            originLocationTamil,
            description
        );
        
        return ResponseEntity.ok(contribution);
    }
    
    @GetMapping
    public ResponseEntity<List<TimingImageContribution>> getContributions(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String userId
    ) {
        return ResponseEntity.ok(
            timingImageService.getContributions(status, userId)
        );
    }
}

@RestController
@RequestMapping("/api/v1/admin/contributions/timing-images")
@PreAuthorize("hasRole('ADMIN')")
public class TimingImageAdminController {
    
    @Autowired
    private TimingImageService timingImageService;
    
    @Autowired
    private OcrService ocrService;
    
    @GetMapping("/pending")
    public ResponseEntity<List<TimingImageContribution>> getPendingContributions() {
        return ResponseEntity.ok(
            timingImageService.getPendingContributions()
        );
    }
    
    @PostMapping("/{id}/extract")
    public ResponseEntity<TimingExtractionResult> extractTimings(@PathVariable Long id) {
        TimingImageContribution contribution = timingImageService.getContribution(id);
        
        // Run OCR extraction
        TimingExtractionResult result = ocrService.extractTimings(
            contribution.getImageUrl(),
            contribution.getOriginLocation()
        );
        
        // Save extracted data
        timingImageService.saveExtractedTimings(id, result);
        
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/{id}/approve")
    public ResponseEntity<TimingImageContribution> approveContribution(
        @PathVariable Long id,
        @RequestBody TimingExtractionResult extractedData,
        @AuthenticationPrincipal UserDetails admin
    ) {
        // Approve and update database
        TimingImageContribution approved = timingImageService.approveAndUpdateDatabase(
            id,
            extractedData,
            admin.getUsername()
        );
        
        return ResponseEntity.ok(approved);
    }
    
    @PostMapping("/{id}/reject")
    public ResponseEntity<TimingImageContribution> rejectContribution(
        @PathVariable Long id,
        @RequestBody Map<String, String> request,
        @AuthenticationPrincipal UserDetails admin
    ) {
        String reason = request.get("reason");
        
        TimingImageContribution rejected = timingImageService.rejectContribution(
            id,
            reason,
            admin.getUsername()
        );
        
        return ResponseEntity.ok(rejected);
    }
    
    @GetMapping("/{id}/check-duplicates")
    public ResponseEntity<DuplicateCheckResult> checkDuplicates(@PathVariable Long id) {
        DuplicateCheckResult result = timingImageService.checkDuplicates(id);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}/skipped-records")
    public ResponseEntity<List<SkippedTimingRecord>> getSkippedRecords(@PathVariable Long id) {
        List<SkippedTimingRecord> skipped = timingImageService.getSkippedRecords(id);
        return ResponseEntity.ok(skipped);
    }
    
    @GetMapping("/skipped-records")
    public ResponseEntity<Page<SkippedTimingRecord>> getAllSkippedRecords(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String skipReason
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("skippedAt").descending());
        Page<SkippedTimingRecord> skipped = timingImageService.getAllSkippedRecords(skipReason, pageRequest);
        return ResponseEntity.ok(skipped);
    }
}
```
@Autowired
    private SkippedTimingRepository skippedTimingRepository;
    
    
### 5. Service Implementation with Duplicate Detection

```java
@Service
@Transactional
public class TimingImageService {
    
    @Autowired
    private TimingImageRepository timingImageRepository;
    
    @Autowired
    private BusTimingRecordRepository busTimingRepository;
    
    @Autowired
    private LocationRepository locationRepository;
    
    public TimingImageContribution approveAndUpdateDatabase(
        Long contributionId,
        TimingExtractionResult extractedData,
        String adminUsername
    ) {
        TimingImageContribution contribution = getContribution(contributionId);
        
        // Find or create origin location
        Location originLocation = locationRepository.findByName(extractedData.getOrigin())
            .orElseGet(() -> createLocation(extractedData.getOrigin(), extractedData.getOriginTamil()));
        
        int createdCount = 0;
        int skippedCount = 0;
        
        // Process each destination
        for (ExtractedTiming timing : extractedData.getTimings()) {
            // Find or create destination location
            Location destLocation = locationRepository.findByName(timing.getDestination())
                .orElseGet(() -> createLocation(timing.getDestination(), timing.getDestinationTamil()));
            
            // Process morning timings
            for (String time : timing.getMorningTimings()) {
                if (createTimingRecord(originLocation, destLocation, time, TimingType.MORNING, contribution, adminUsername)) {
                    createdCount++;
                } else {
                    skippedCount++;
                }
            }
            
            // Process afternoon timings
            for (String time : timing.getAfternoonTimings()) {
                if (createTimingRecord(originLocation, destLocation, time, TimingType.AFTERNOON, contribution, adminUsername)) {
                    createdCount++;
                } else {
                    skippedCount++;
                }
            }
            
            // Process night timings
            for (String time : timing.getNightTimings()) {
                if (createTimingRecord(originLocation, destLocation, time, TimingType.NIGHT, contribution, adminUsername)) {
                    createdCount++;
                } else {
                    skippedCount++;
                }
            }
        }
        
        // Update contribution status
        contribution.setStatus(TimingImageStatus.APPROVED);
        contribution.setProcessedDate(LocalDateTime.now());
        contribution.setProcessedBy(adminUsername);
        contribution.setCreatedRecords(createdCount);
        contribution.setMergedRecords(skippedCount);
        contribution.setDuplicateCheckStatus(DuplicateCheckStatus.CHECKED);
        
        return timingImageRepository.save(contribution);
    }
    
    private boolean createTimingRecord(
        Location from,
        Location to,
        String departureTime,
        TimingType type,
        TimingImageContribution contribution,
        String adminUsername
    ) {
        LocalTime time;
        
        try {
            time = LocalTime.parse(departureTime);
        } catch (Exception e) {
            // Invalid time format - log to skipped records
            logSkippedRecord(contribution, from, to, departureTime, type, 
                SkipReason.INVALID_TIME, null, adminUsername, 
                "Failed to parse time: " + e.getMessage());
            return false;
        }
        
        // Check for exact duplicate (same route, time, and type)
        Optional<BusTimingRecord> existingRecord = busTimingRepository
            .findByFromLocationAndToLocationAndDepartureTimeAndTimingType(from, to, time, type);
        
        if (existingRecord.isPresent()) {
            // Log to skipped records table with reference to existing record
            logSkippedRecord(contribution, from, to, departureTime, type, 
                SkipReason.DUPLICATE_EXACT, existingRecord.get(), adminUsername,
                String.format("Exact match found - existing record ID: %d, source: %s", 
                    existingRecord.get().getId(), existingRecord.get().getSource()));
            
            log.info("Skipping duplicate timing: {} -> {} at {} ({}) - already exists as record {}", 
                from.getName(), to.getName(), time, type, existingRecord.get().getId());
            return false; // Skip duplicate
        }
        
        // Create new timing record
        BusTimingRecord record = BusTimingRecord.builder()
            .fromLocation(from)
            .fromLocationName(from.getName())
            .toLocation(to)
            .toLocationName(to.getName())
            .departureTime(time)
            .timingType(type)
            .source(TimingSource.OCR_EXTRACTED)
            .contribution(contribution)
            .verified(false)
            .build();
        
        busTimingRepository.save(record);
        log.info("Created timing record: {} -> {} at {} ({})", 
            from.getName(), to.getName(), time, type);
        
        return true; // Created
    }
    
    private void logSkippedRecord(
        TimingImageContribution contribution,
        Location from,
        Location to,
        String departureTime,
        TimingType type,
        SkipReason reason,
        BusTimingRecord existingRecord,
        String adminUsername,
        String notes
    ) {
        SkippedTimingRecord skipped = SkippedTimingRecord.builder()
            .contribution(contribution)
            .fromLocation(from)
            .fromLocationName(from.getName())
            .toLocation(to)
            .toLocationName(to.getName())
            .departureTime(parseTimeOrNull(departureTime))
            .timingType(type)
            .skipReason(reason)
            .existingRecord(existingRecord)
            .existingRecordSource(existingRecord != null ? existingRecord.getSource() : null)
            .skippedAt(LocalDateTime.now())
            .processedBy(adminUsername)
            .notes(notes)
            .build();
        
        skippedTimingRepository.save(skipped);
    }
    
    private LocalTime parseTimeOrNull(String timeStr) {
        try {
            return LocalTime.parse(timeStr);
        } catch (Exception e) {
            return null;
        }
    }
    
    public DuplicateCheckResult checkDuplicates(Long contributionId) {
        TimingImageContribution contribution = getContribution(contributionId);
        List<ExtractedBusTiming> timings = contribution.getExtractedTimings();
        
        int duplicateCount = 0;
        List<ConflictInfo> conflicts = new ArrayList<>();
        
        Location originLocation = locationRepository.findByName(contribution.getOriginLocation())
            .orElse(null);
        
        if (originLocation == null) {
            return new DuplicateCheckResult(false, 0, conflicts);
        }
        
        for (ExtractedBusTiming timing : timings) {
            Location destLocation = locationRepository.findByName(timing.getDestination())
                .orElse(null);
            
            if (destLocation == null) continue;
            
            // Check all timings for duplicates
            for (String time : timing.getMorningTimings()) {
                if (isDuplicate(originLocation, destLocation, time, TimingType.MORNING)) {
                    duplicateCount++;
                    conflicts.add(new ConflictInfo(timing.getDestination(), time, "Morning"));
                }
            }
            // ... similar for afternoon and night
        }
        
        return new DuplicateCheckResult(duplicateCount > 0, duplicateCount, conflicts);
    }
    
    private boolean isDuplicate(Location from, Location to, String time, TimingType type) {
        try {
            LocalTime localTime = LocalTime.parse(time);
            return busTimingRepository.existsByFromLocationAndToLocationAndDepartureTimeAndTimingType(
                from, to, localTime, type
            );
        } catch (Exception e) {
    
    public List<SkippedTimingRecord> getSkippedRecords(Long contributionId) {
        return skippedTimingRepository.findByContributionId(contributionId);
    }
    
    public Page<SkippedTimingRecord> getAllSkippedRecords(String skipReason, Pageable pageable) {
        if (skipReason != null && !skipReason.isEmpty()) {
            SkipReason reason = SkipReason.valueOf(skipReason);
            return skippedTimingRepository.findBySkipReason(reason, pageable);
        }
        return skippedTimingRepository.findAll(pageable);
    }
            return false;
        }
    }
}
```

### 6. Dependencies (pom.xml)

```xml
<!-- Tesseract OCR -->
<dependency>
    <groupId>net.sourceforge.tess4j</groupId>
    <artifactId>tess4j</artifactId>
    <version>5.7.0</version>
</dependency>

<!-- Google Cloud Vision (Alternative) -->
<dependency>
    <groupId>com.google.cloud</groupId>
    <artifactId>google-cloud-vision</artifactId>
    <version>3.20.0</version>
</dependency>

<!-- Image processing -->
<dependency>
    <groupId>org.imgscalr</groupId>
    <artifactId>imgscalr-lib</artifactId>
    <version>4.2</version>
</dependency>

<!-- File storage (AWS S3 or Google Cloud Storage) -->
<dependency>
    <groupId>com.amazonaws</groupId>
    <artifactId>aws-java-sdk-s3</artifactId>
    <version>1.12.500</version>
</dependency>
```

## Usage Flow

### User Flow:
1. User navigates to "Contribute" tab
2. Selects "Bus Timing Upload" option
3. Takes/uploads photo of bus timing board
4. Enters origin location (English + optional Tamil)
5. Adds optional description
6. Submits contribution
7. Receives confirmation with pending status

### Admin Flow:
1. Admin accesses "Bus Timing Review" panel
2. Views list of pending timing image contributions
3. Selects a contribution to review
4. Views the uploaded image (logged to `skipped_timing_records` table)
    - Updates contribution status
    - Shows summary (X created, Y skipped)
11. Admin can view skipped records:
    - See which timings were skipped and why
    - View reference to existing timing record
    - Audit trail with timestamp and admin info
   - Origin location
   - List of destinations
   - Morning/Afternoon/Night timings for each destination
7. Manually edits any incorrect extractions
8. Checks duplicate warnings
9. Clicks "Approve & Update DB"
10. System:
    - Creates location records if needed
    - Creates timing records
    - Skips duplicate timings automatically
    - Updates contribution status
    - Shows summary (X created, Y skipped)

## Integration with Existing App

Add to RouteContributionComponent.tsx or create new tab:

```tsx
import BusTimingUpload from './BusTimingUpload';

// In the contribution panel, add a new tab/section:
<div className="contribution-type-selector">
  <button onClick={() => setActiveType('route')}>Route Data</button>
  <button onClick={() => setActiveType('timing')}>Bus Timings</button>
  <button onClick={() => setActiveType('image')}>Photos</button>
</div>

{activeType === 'timing' && (
  <BusTimingUpload 
    onUploadSuccess={(contribution) => {
      showNotification('Timing board uploaded successfully!');
    }}
  />
)}
```

Add to AdminDashboard.tsx:

```tsx
impSkipped Records Feature

### Benefits:
1. **Audit Trail**: Complete history of what was skipped and why
2. **Transparency**: Admins can review skip decisions
3. **Data Quality**: Identify patterns in duplicates or errors
4. **Recovery**: If skip was incorrect, data is not lost
5. **Analytics**: Track contribution overlap and data coverage

### Repository Methods Needed:

```java
public interface SkippedTimingRepository extends JpaRepository<SkippedTimingRecord, Long> {
    List<SkippedTimingRecord> findByContributionId(Long contributionId);
    Page<SkippedTimingRecord> findBySkipReason(SkipReason reason, Pageable pageable);
    List<SkippedTimingRecord> findByProcessedBy(String adminUsername);
    Long countBySkipReason(SkipReason reason);
    
    @Query("SELECT s FROM SkippedTimingRecord s WHERE s.fromLocation = :from AND s.toLocation = :to")
    List<SkippedTimingRecord> findByRoute(@Param("from") Location from, @Param("to") Location to);
}

public interface BusTimingRecordRepository extends JpaRepository<BusTimingRecord, Long> {
    Optional<BusTimingRecord> findByFromLocationAndToLocationAndDepartureTimeAndTimingType(
        Location from, Location to, LocalTime time, TimingType type);
    // ... other methods
}
```

### Admin UI Addition:

Add to BusTimingAdminPanel.tsx:

```tsx
// After approval, show skipped records section
{contribution.status === 'APPROVED' && (
  <div className="skipped-records-section">
    <h3>Skipped Records ({skippedRecords.length})</h3>
    <table className="skipped-table">
      <thead>
        <tr>
          <th>Route</th>
          <th>Time</th>
          <th>Type</th>
          <th>Reason</th>
          <th>Existing Record</th>
        </tr>
      </thead>
      <tbody>
        {skippedRecords.map(record => (
          <tr key={record.id}>
            <td>{record.fromLocationName} → {record.toLocationName}</td>
            <td>{record.departureTime}</td>
            <td>{record.timingType}</td>
            <td>
              <span className={`skip-reason ${record.skipReason.toLowerCase()}`}>
                {record.skipReason.replace('_', ' ')}
              </span>
            </td>
            <td>
              {record.existingRecordId ? (
                <a href={`/admin/timings/${record.existingRecordId}`}>
                  Record #{record.existingRecordId} ({record.existingRecordSource})
                </a>
              ) : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
```

## Future Enhancements

1. Auto-translation between Tamil and English
2. Bus schedule prediction based on extracted timings
3. Crowd-sourced timing verification
4. Mobile app for easier photo uploads
5. Batch processing of multiple images
6. AI-powered board type detection
7. Integration with Google Maps for location geocoding
8. Real-time duplicate detection during upload
9. Skipped records analytics dashboard
10. Bulk review/approve skipped records if existing record was incorrect

1. **Unit Tests**: Test OCR parsing logic
2. **Integration Tests**: Test duplicate detection
3. **E2E Tests**: Test complete upload → review → approval flow
4. **Manual Testing**: Upload real timing board images

## Future Enhancements

1. Auto-translation between Tamil and English
2. Bus schedule prediction based on extracted timings
3. Crowd-sourced timing verification
4. Mobile app for easier photo uploads
5. Batch processing of multiple images
6. AI-powered board type detection
7. Integration with Google Maps for location geocoding
8. Real-time duplicate detection during upload
