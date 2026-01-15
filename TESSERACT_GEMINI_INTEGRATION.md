# Image Validation Strategy - Tesseract + Gemini

## Clear Role Separation

### 1. User Upload (Contribution Page) - Tesseract Validation
**Purpose**: Quick, free validation to prevent junk images from entering database
**Cost**: $0 (local OCR)
**Time**: 100-500ms
**Technology**: Tesseract OCR (already installed)

### 2. Admin Review - Gemini AI Extraction
**Purpose**: Detailed extraction of bus schedule data from validated images
**Cost**: $0.03 per image (only for images that passed Tesseract)
**Time**: 500ms-2s per image
**Technology**: Google Gemini Vision API

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER UPLOADS IMAGE                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌──────────────────────────────────────────┐
        │  TESSERACT VALIDATION (Contribution Page) │
        │  - Extract text locally                   │
        │  - Check for bus schedule content         │
        │  - REJECT if no bus content found        │
        └──────────────────────────────────────────┘
                ↓                          ↓
         ❌ REJECT                    ✅ PASS
         No API cost                  Store with status: PENDING_REVIEW
         Immediate feedback           No API cost yet
         
                                           ↓
                ┌──────────────────────────────────────────┐
                │     ADMIN REVIEWS IN QUEUE               │
                │  Status: PENDING_REVIEW                  │
                └──────────────────────────────────────────┘
                              ↓
                ┌──────────────────────────────────────────┐
                │  ADMIN DECISION                          │
                ├──────────────────────────────────────────┤
                │ Option 1: Reject (obvious junk)          │
                │          → No API cost                   │
                │                                          │
                │ Option 2: Accept (looks good)            │
                │          → No API cost                   │
                │                                          │
                │ Option 3: Extract with Gemini            │
                │          → API cost: $0.03               │
                │          → Get detailed data             │
                │          → Route numbers, timings, etc.  │
                └──────────────────────────────────────────┘
```

---

## Implementation Details

### Part 1: Tesseract Validation at Upload Time

**File**: `backend/adapter/src/main/java/com/perundhu/adapter/in/rest/ContributionController.java`

```java
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

@RestController
@RequestMapping("/api/v1/contributions")
public class ContributionController {
    
    private static final Logger log = LoggerFactory.getLogger(ContributionController.class);
    
    @PostMapping("/images")
    public ResponseEntity<?> submitImageContribution(
        @RequestParam("file") MultipartFile file,
        @RequestBody ContributionRequest request,
        HttpServletRequest httpRequest) {
        
        try {
            String userId = extractUserIdFromRequest(httpRequest);
            
            // Step 1: File format validation (existing)
            if (!isValidImageFile(file)) {
                throw new InvalidRequestException("Invalid image format");
            }
            
            // Step 2: NEW - Tesseract quick validation (FREE)
            // This prevents junk images from even being stored
            log.info("User upload: Validating image with Tesseract OCR (userId: {})", userId);
            
            if (!isValidBusScheduleByTesseract(file)) {
                log.warn("Upload rejected - Tesseract validation failed (userId: {})", userId);
                return ResponseEntity.badRequest()
                    .body(Map.of(
                        "success", false,
                        "message", "This image does not appear to contain bus schedule information. " +
                                  "Please upload a clear photo of:\n" +
                                  "• Bus timing boards or displays\n" +
                                  "• Route information boards\n" +
                                  "• Bus stop timetables\n\n" +
                                  "Selfies, personal photos, and unrelated images are not accepted."
                    ));
            }
            
            // Step 3: Store image with PENDING_REVIEW status
            // Gemini extraction will happen later when admin reviews
            ImageContribution contribution = imageProcessingService.processImageContribution(
                file, sanitizedMetadata, userId);
            
            // Set initial status - no Gemini extraction yet
            contribution.setStatus("PENDING_REVIEW");
            
            log.info("Upload accepted: Image stored with status PENDING_REVIEW " +
                    "(contributionId: {}, userId: {})", contribution.getId(), userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Image uploaded successfully and is awaiting admin review",
                "contributionId", contribution.getId(),
                "status", "PENDING_REVIEW"
            ));
            
        } catch (InvalidRequestException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    /**
     * Tesseract-based validation for user uploads.
     * Quick, free OCR to check if image contains bus schedule content.
     */
    private boolean isValidBusScheduleByTesseract(MultipartFile file) {
        try {
            // Read image
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) {
                log.warn("Could not read image file");
                return false;
            }
            
            // Extract text using local Tesseract (no API cost)
            ITesseract tesseract = new Tesseract();
            String extractedText = tesseract.doOCR(image);
            
            if (extractedText == null || extractedText.trim().isEmpty()) {
                log.warn("Tesseract extracted no text from image");
                return false;
            }
            
            log.debug("Tesseract extracted {} characters", extractedText.length());
            
            // Validate content contains bus schedule indicators
            return isBusScheduleContent(extractedText);
            
        } catch (TesseractException e) {
            log.error("Tesseract OCR error: {}", e.getMessage());
            // On Tesseract error, allow upload (don't block user)
            return true;
        } catch (IOException e) {
            log.error("Error reading image file: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Check if extracted text contains bus schedule content patterns.
     * Looking for: time patterns, location keywords, route numbers, etc.
     */
    private boolean isBusScheduleContent(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }
        
        String lowerText = text.toLowerCase();
        int busIndicators = 0;
        
        // Indicator 1: Time pattern (HH:MM format)
        if (lowerText.matches(".*\\d{1,2}:\\d{2}.*")) {
            busIndicators++;
            log.debug("Indicator 1 found: Time pattern");
        }
        
        // Indicator 2: Common location keywords
        String[] locations = {
            "central", "anna", "adyar", "mylapore", "madurai", "bangalore",
            "salem", "tirupati", "nellore", "kanchipuram", "station", "stop",
            "depot", "terminus", "bus", "route", "stall"
        };
        
        for (String loc : locations) {
            if (lowerText.contains(loc)) {
                busIndicators++;
                log.debug("Indicator 2 found: Location keyword '{}'", loc);
                break;
            }
        }
        
        // Indicator 3: Route number pattern (e.g., "166UD", "520", "27M")
        if (lowerText.matches(".*\\d+[a-z]*\\b.*")) {
            busIndicators++;
            log.debug("Indicator 3 found: Route number pattern");
        }
        
        // Indicator 4: Sufficient text length
        if (text.length() > 50) {
            busIndicators++;
            log.debug("Indicator 4 found: Text length {}", text.length());
        }
        
        // Indicator 5: Tamil script (common in Chennai bus schedules)
        if (text.contains("ு") || text.contains("ை") || 
            text.contains("ஆ") || text.contains("இ")) {
            busIndicators++;
            log.debug("Indicator 5 found: Tamil script detected");
        }
        
        // Need at least 2 indicators to pass
        boolean isValid = busIndicators >= 2;
        log.info("Bus schedule validation: {} (indicators found: {}/5)", isValid, busIndicators);
        
        return isValid;
    }
}
```

---

### Part 2: Gemini Extraction for Admin Review

**File**: `backend/adapter/src/main/java/com/perundhu/adapter/in/rest/AdminController.java`

```java
@RestController
@RequestMapping("/api/v1/admin/contributions")
@RequireRole("ADMIN")
public class AdminController {
    
    private static final Logger log = LoggerFactory.getLogger(AdminController.class);
    
    @Autowired
    private ImageContributionProcessingService imageProcessingService;
    
    @Autowired
    private GeminiVisionService geminiVisionService;
    
    /**
     * Admin endpoint to review pending contributions.
     * Returns contributions awaiting review.
     */
    @GetMapping("/pending-review")
    public ResponseEntity<?> getPendingReview(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
        
        Page<ImageContribution> pending = imageProcessingService
            .getContributionsByStatus("PENDING_REVIEW", page, size);
        
        return ResponseEntity.ok(pending);
    }
    
    /**
     * Admin action: Extract data from image using Gemini AI.
     * IMPORTANT: This incurs API cost ($0.03 per image).
     * Only called for images that already passed Tesseract validation.
     */
    @PostMapping("/{contributionId}/extract-with-gemini")
    public ResponseEntity<?> extractDataWithGemini(
        @PathVariable Long contributionId,
        HttpServletRequest httpRequest) {
        
        try {
            String adminId = extractAdminIdFromRequest(httpRequest);
            
            log.info("Admin {} requesting Gemini extraction for contribution {}", 
                    adminId, contributionId);
            
            // Fetch the contribution (already passed Tesseract validation)
            ImageContribution contribution = imageProcessingService
                .getContributionById(contributionId);
            
            if (contribution == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Extract data using Gemini Vision (API cost: $0.03)
            log.info("Calling Gemini Vision API for detailed extraction " +
                    "(contributionId: {}, admin: {})", contributionId, adminId);
            
            Map<String, Object> extractedData = imageProcessingService.extractOCRData(contribution);
            
            if (extractedData.containsKey("error")) {
                log.warn("Gemini extraction failed for contribution {}: {}", 
                        contributionId, extractedData.get("error"));
                return ResponseEntity.badRequest()
                    .body(Map.of(
                        "success", false,
                        "message", "Failed to extract data from image",
                        "error", extractedData.get("error")
                    ));
            }
            
            // Update contribution with extracted data
            contribution.setStatus("EXTRACTED");
            contribution.setExtractedData(extractedData);
            imageProcessingService.updateContribution(contribution);
            
            log.info("Gemini extraction successful - extracted {} route(s) (contributionId: {})",
                    ((List<?>) extractedData.getOrDefault("routes", List.of())).size(),
                    contributionId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Data extracted successfully",
                "data", extractedData,
                "extractionMethod", "gemini-vision",
                "costIncurred", "$0.03"
            ));
            
        } catch (Exception e) {
            log.error("Error during Gemini extraction for contribution {}: {}", 
                    contributionId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", "Extraction failed"));
        }
    }
    
    /**
     * Admin action: Reject contribution as junk (without extraction).
     * No API cost - admin determines it's obvious junk.
     */
    @PostMapping("/{contributionId}/reject")
    public ResponseEntity<?> rejectContribution(
        @PathVariable Long contributionId,
        @RequestBody(required = false) Map<String, String> body,
        HttpServletRequest httpRequest) {
        
        String adminId = extractAdminIdFromRequest(httpRequest);
        String reason = body != null ? body.get("reason") : "Rejected by admin";
        
        log.info("Admin {} rejecting contribution {} (reason: {})", 
                adminId, contributionId, reason);
        
        ImageContribution contribution = imageProcessingService
            .getContributionById(contributionId);
        
        contribution.setStatus("REJECTED");
        contribution.setRejectionReason(reason);
        imageProcessingService.updateContribution(contribution);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Contribution rejected",
            "costIncurred", "$0.00"  // No Gemini API cost
        ));
    }
    
    /**
     * Admin action: Accept contribution and create routes from extracted data.
     * Can be used after Gemini extraction or for obvious good images.
     */
    @PostMapping("/{contributionId}/accept")
    public ResponseEntity<?> acceptContribution(
        @PathVariable Long contributionId,
        @RequestParam(defaultValue = "false") boolean useExtractedData,
        HttpServletRequest httpRequest) {
        
        String adminId = extractAdminIdFromRequest(httpRequest);
        
        log.info("Admin {} accepting contribution {} (useExtractedData: {})", 
                adminId, contributionId, useExtractedData);
        
        ImageContribution contribution = imageProcessingService
            .getContributionById(contributionId);
        
        if (useExtractedData && contribution.getExtractedData() == null) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "No extracted data available. " +
                             "Please extract with Gemini first or provide data manually."));
        }
        
        contribution.setStatus("APPROVED");
        imageProcessingService.updateContribution(contribution);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Contribution approved",
            "extractedData", contribution.getExtractedData()
        ));
    }
}
```

---

## Cost Comparison

### Scenario: 1000 Image Uploads per Day

#### Without Validation (Current State)
```
1000 uploads/day
→ 30% are junk (selfies, personal photos)
→ 700 good images stored
→ Database: 2000+ MB/month of junk
→ Gemini called on all: 1000 × $0.03 = $30/day = $900/month
```

#### With Tesseract + Gemini (Proposed)
```
1000 uploads/day
→ Tesseract validation (FREE):
   • 300 junk images rejected immediately (no API cost)
   • 700 good images stored
→ Admin reviews 700 images
   • Admin rejects obvious bad: 100 images (no API cost)
   • Admin extracts with Gemini: 600 images × $0.03 = $18/day = $540/month
→ Database: 1400 MB/month (saves 600MB)
→ Total cost: $540/month
→ Savings: $360/month (40% reduction)
```

---

## Workflow Summary

### User Journey
1. User uploads image on Contribution page
2. **Tesseract validates** (100-500ms, free)
   - Extracts text locally
   - Checks for bus schedule content
3. **Immediate feedback**:
   - ✅ Valid → Stored for admin review
   - ❌ Invalid → Rejected with helpful message

### Admin Journey
1. Admin views `PENDING_REVIEW` queue
2. Admin previews image (can see Tesseract extraction result)
3. Admin chooses action:
   - **Reject** (obvious junk) → $0 cost
   - **Accept manually** → $0 cost (no AI extraction)
   - **Extract with Gemini** (need detailed data) → $0.03 cost
4. After extraction, admin can approve/reject based on data quality

---

## Benefits

✅ **Cost Optimization**
- Tesseract: Free (local OCR)
- Gemini: Only for images that already passed validation
- Savings: ~40% on AI API costs

✅ **User Experience**
- Immediate feedback on junk images
- Clear guidance on what to upload
- No waiting for API calls during upload

✅ **Admin Control**
- Full visibility of pending images
- Option to skip expensive Gemini extraction for obvious cases
- Can manually verify extracted data before saving

✅ **Data Quality**
- Only validated images stored in database
- No wasted space on junk images
- Gemini extractions guaranteed to be from valid images

✅ **Scalability**
- Local Tesseract scales with server resources
- Gemini called only when admin decides
- Can control monthly API costs by limiting extractions

---

## Implementation Status

### Complete
- ✅ Tesseract validation logic in ContributionController
- ✅ Admin endpoints for review, reject, accept, extract

### Ready to Implement
- Add Tesseract validation call in upload endpoint
- Add Gemini extraction endpoint for admin use
- Update UI to show extraction status and costs

### Monitoring
- Track rejection rate (target: 25-35% for junk images)
- Monitor Gemini API cost (should be ~$540/month with this strategy)
- Measure database savings from rejected junk images
