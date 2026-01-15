# Image Validation Strategy - Cost Optimized

## Problem Statement
Users may upload irrelevant images (selfies, personal photos, random images) instead of bus schedule boards, wasting database storage and processing resources.

## Cost Constraint
**Gemini Vision API is expensive** and should **only be used for admin-side extraction**, not for validating every user upload.

---

## Multi-Layer Validation (Without AI Costs)

### Layer 1: Frontend Validation (Client-Side - Zero Cost)
**Location**: `frontend/src/components/ImageContributionUpload.tsx`

**Validations**:
1. ✅ File type check (JPG, PNG, WebP, HEIC/HEIF only)
2. ✅ Dimension validation (100x100 to 10000x10000 pixels)
3. ✅ Aspect ratio check (0.1 to 10 - prevents extremely narrow/wide images)
4. ✅ File loading test (verify image can be decoded)
5. ✅ Upload guidelines displayed to users

**Benefits**:
- No API costs
- Immediate feedback
- Reduces bad uploads before they reach server
- Saves bandwidth

### Layer 2: Backend File Validation (Server-Side - Zero Cost)
**Location**: `backend/app/src/main/java/com/perundhu/adapter/in/rest/TimingImageContributionController.java`

**Validations**:
1. ✅ File size limits (1KB minimum, 10MB maximum)
2. ✅ Filename security (block path traversal: ../, ..\)
3. ✅ MIME type whitelist (strict allowlist of image types)
4. ✅ File signature verification (magic bytes match declared type)
5. ✅ Duplicate detection (image hash check within 24-hour window)

**Benefits**:
- Security hardening
- Prevents malicious uploads
- Blocks duplicate submissions
- No AI costs

### Layer 3: Admin-Side AI Extraction (Manual Review - Controlled Cost)
**Location**: `backend/app/src/main/java/com/perundhu/infrastructure/adapter/service/impl/GeminiVisionServiceImpl.java`

**How It Works**:
1. User uploads image → Passes frontend + backend validation
2. Contribution stored with status: `PENDING_REVIEW`
3. **Admin manually reviews** contribution queue
4. Admin can:
   - Reject obvious junk images (no AI cost)
   - Accept obviously good images (no AI cost)
   - **Trigger Gemini extraction** for uncertain images (API cost incurred)

**Gemini Vision Extracts**:
- Bus route numbers
- Timing information
- Stop names
- Origin/destination
- Confidence score (0.0 to 1.0)

**Cost Control**:
- ✅ Gemini only called when admin triggers extraction
- ✅ Not called on every upload
- ✅ Admin filters obvious junk before using AI
- ✅ Estimated: $0.01-0.05 per extraction (only for reviewed images)

---

## User Education Strategy

**Upload Guidelines** (displayed in UI):
```
📸 Upload Guidelines
✓ Take clear photos of bus timing boards or route displays
✓ Ensure text is readable and not blurry
✓ Include the full schedule with route numbers and times
❌ Do not upload selfies, personal photos, or unrelated images
```

**Error Messages**:
- Clear, actionable feedback
- Explains what makes a valid upload
- Helps users understand requirements

---

## Cost Analysis

### Without Cost Optimization (Hypothetical Old Approach)
If Gemini was called on every upload:
- 1000 uploads/day × $0.03/image = **$30/day = $900/month**
- Many junk images processed unnecessarily

### With Cost Optimization (Current Approach)
Gemini only called during admin review:
- Assume 20% of uploads reach admin review (rest caught by validation)
- Admin rejects 50% of reviewed images without AI (obvious junk)
- Only 10% of total uploads use Gemini (100 images/day)
- 100 reviews/day × $0.03/image = **$3/day = $90/month**

**Savings: 90% cost reduction** ($810/month saved)

---

## Workflow Summary

```
User Uploads Image
        ↓
Frontend Validation (dimensions, file type, aspect ratio)
        ↓ PASS
Backend Validation (security, size, format, duplicates)
        ↓ PASS
Store Contribution (status: PENDING_REVIEW)
        ↓
Admin Reviews Queue
        ↓
    ┌───┴───┐
    ↓       ↓
Obvious  Uncertain
Junk     Image
    ↓       ↓
 Reject  Trigger
(no cost) Gemini
          ↓
      Extract Data
      (AI cost)
          ↓
      Accept/Reject
      Based on Results
```

---

## Implementation Status

✅ **Completed**:
- Frontend dimension and file type validation
- Backend security and format validation
- Upload guidelines UI
- Duplicate image detection
- Admin review workflow structure

✅ **Removed** (to save costs):
- Automatic Gemini validation on every upload
- Confidence-based auto-rejection

---

## Alternative Low-Cost Enhancements (Optional)

If you want additional filtering without Gemini costs:

### Option 1: Client-Side Text Density Detection
Reject images with very low text content (likely not schedules):

```typescript
const hasMinimumTextDensity = async (canvas: HTMLCanvasElement): Promise<boolean> => {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Simple edge detection to find text-like patterns
  // Bus schedules have high edge density due to text
  const edgeDensity = detectEdges(imageData);
  
  return edgeDensity > 0.15; // Threshold for text-heavy images
};
```

**Cost**: Zero (runs in browser)

### Option 2: Server-Side OCR (Tesseract)
Use free open-source OCR before Gemini:

```java
// Quick pre-filter with Tesseract OCR
String extractedText = tesseractOCR.extractText(imageFile);

if (extractedText.length() < 50) {
  // Reject if very little text found
  return "Image must contain readable bus schedule information";
}

// Only call Gemini if Tesseract finds text
```

**Cost**: Free (self-hosted) or $0.001/image (cloud OCR services)  
**Accuracy**: Lower than Gemini but good enough for filtering

---

## Monitoring Recommendations

Track these metrics to optimize admin workflow:

```sql
-- Daily upload and review metrics
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_uploads,
  COUNT(CASE WHEN status = 'PENDING_REVIEW' THEN 1 END) as pending_review,
  COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected,
  COUNT(CASE WHEN gemini_extracted = true THEN 1 END) as gemini_calls,
  COUNT(*) FILTER (WHERE gemini_extracted = true) * 0.03 as estimated_ai_cost
FROM image_contributions
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Summary

**Cost-Optimized Approach**:
1. ✅ Frontend + Backend validation filters obvious issues (zero cost)
2. ✅ Images stored for admin review (no automatic AI processing)
3. ✅ Admin manually triggers Gemini extraction only when needed
4. ✅ **90% cost reduction** compared to validating every upload

**Benefits**:
- Controlled AI costs
- Quality assurance through manual review
- User education prevents most junk uploads
- Scalable without proportional cost increase

**Trade-off**:
- Requires admin time to review queue
- Not fully automated (but saves significant cost)
