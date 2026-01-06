# AI Extraction (OCR) Failure Diagnosis

**Endpoint:** `POST /api/admin/contributions/images/{id}/extract-ocr`  
**Image ID:** `95f6b947-7088-4f97-915a-94cfd3dee4be`  
**Status:** ❌ FAILED - AI extraction not available

## Root Cause

### **Gemini Vision API Key Not Configured**

The OCR extraction failed because the **Gemini Vision API key is not set** in your local environment.

**Flow:**
1. User clicks "Extract OCR" in admin panel
2. Backend calls `imageProcessingService.extractOCRData(contribution)`
3. Service checks: `if (geminiVisionService.isAvailable())`
4. **Service returns `false`** because:
   - `GEMINI_API_KEY` environment variable is **NOT SET**
   - `gemini.api.key` config is **empty** (defaults to empty string)
5. Service logs: `"AI extraction failed, marking contribution for manual entry"`
6. Returns error response: `{"error": "AI extraction failed - manual entry required", "requiresManualEntry": true}`

## Configuration Status

**File:** `application.properties` (Lines 225-227)

```properties
gemini.api.enabled=${GEMINI_API_ENABLED:true}    # ✅ Enabled
gemini.api.key=${GEMINI_API_KEY:}                # ❌ KEY NOT SET (empty)
gemini.api.model=${GEMINI_API_MODEL:gemini-2.0-flash}  # ✅ Model configured
```

**Current State:**
- ✅ Service is **enabled** (true)
- ✅ Model selected (gemini-2.0-flash)
- ❌ **API Key missing** (empty string)

## Service Behavior (isAvailable() check)

```java
public boolean isAvailable() {
    if (!enabled) {
        log.debug("Gemini Vision service is disabled");
        return false;
    }
    if (apiKey == null || apiKey.isBlank()) {
        log.warn("Gemini API key is not configured");  // ← THIS IS YOUR ERROR
        return false;
    }
    return true;
}
```

**Your Case:** Returns `false` because `apiKey.isBlank()` is true

## What Happens on Failure

When Gemini Vision is unavailable, the service:

```java
// Falls back to manual entry requirement
Map<String, Object> manualEntryResult = new HashMap<>();
manualEntryResult.put("error", "AI extraction failed - manual entry required");
manualEntryResult.put("requiresManualEntry", true);
manualEntryResult.put("confidence", 0.0);
manualEntryResult.put("extractedText", "");
manualEntryResult.put("extractedAt", LocalDateTime.now().toString());
manualEntryResult.put("extractionMethod", "manual-required");

return manualEntryResult;
```

**Response to Frontend:**
```json
{
  "error": "AI extraction failed - manual entry required",
  "requiresManualEntry": true,
  "confidence": 0.0,
  "extractedText": "",
  "extractedAt": "2026-01-06T15:45:30",
  "extractionMethod": "manual-required"
}
```

## Solution: Set Gemini API Key

### Step 1: Get Your Gemini API Key

1. Go to: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### Step 2: Set Environment Variable (Local Development)

**Option A: Export in Terminal**
```bash
export GEMINI_API_KEY="your-key-here"
./gradlew bootRun
```

**Option B: Add to `.env` file**
```bash
# In /Users/mchand69/Documents/perundhu/.env
GEMINI_API_KEY=your-key-here
```

**Option C: Add to IDE run configuration**
- In VS Code: Create `.vscode/launch.json`
- In IntelliJ: Run → Edit Configurations → Environment variables

### Step 3: Start Backend with API Key

```bash
cd /Users/mchand69/Documents/perundhu/backend
export GEMINI_API_KEY="your-actual-key"
./gradlew bootRun
```

### Step 4: Verify API Key is Loaded

Check the logs:
```bash
grep -i "gemini" /tmp/backend.log
```

**Expected log output:**
```
DEBUG - Gemini Vision service is initialized and available
DEBUG - Model: gemini-2.0-flash
```

**NOT seeing initialization logs?** The key is still not set.

## Testing the Fix

### Test 1: Check if service is available

```bash
curl -X GET http://localhost:8080/api/admin/health \
  -H "Authorization: Basic YWRtaW46YWRtaW4xMjM="
```

Look for `geminiVisionAvailable: true` in response.

### Test 2: Try OCR extraction again

```bash
curl -X POST 'http://localhost:8080/api/admin/contributions/images/95f6b947-7088-4f97-915a-94cfd3dee4be/extract-ocr' \
  -H 'Authorization: Basic YWRtaW46YWRtaW4xMjM='
```

**Expected response (with valid key):**
```json
{
  "busNumber": "166UD",
  "fromLocation": "Chennai",
  "toLocation": "Hosur",
  "departureTime": "06:45",
  "arrivalTime": "10:30",
  "confidence": 0.95,
  "extractionMethod": "gemini-vision",
  "extractedAt": "2026-01-06T15:47:20"
}
```

## Free Tier Limits

Google Generative AI free tier:
- **Requests per minute:** 15
- **Requests per day:** 1,500
- **Cost:** Free (until you exceed limits)

⚠️ If you exceed limits, requests will be rate-limited. No charges apply on free tier.

## Preprod Deployment

For preprod (Cloud Run):

1. **Add to Google Cloud Secret Manager**
   ```bash
   gcloud secrets create GEMINI_API_KEY \
     --data-file=- <<< "your-key-here"
   ```

2. **Reference in Cloud Run deployment**
   ```yaml
   - name: GEMINI_API_KEY
     valueFrom:
       secretKeyRef:
         name: GEMINI_API_KEY
         version: latest
   ```

3. **Or in Terraform**
   ```hcl
   env {
     name  = "GEMINI_API_KEY"
     value_from {
       secret_key_ref {
         name = "GEMINI_API_KEY"
         key  = "latest"
       }
     }
   }
   ```

## Related Code Locations

| Component | File | Line |
|-----------|------|------|
| **Admin Controller** | `AdminController.java` | 337 |
| **OCR Extraction Service** | `ImageContributionProcessingService.java` | 790 |
| **Gemini Service** | `GeminiVisionServiceImpl.java` | 422 |
| **Configuration** | `application.properties` | 225 |
| **Service Check** | `GeminiVisionServiceImpl.java` | 422 |

## Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| OCR extraction failed | Gemini API key not set | Set `GEMINI_API_KEY` environment variable |
| Service unavailable | `apiKey.isBlank()` returns true | Provide valid Google Generative AI key |
| Returns "manual entry required" | Fallback when API unavailable | Initialize with API key |

**Once you set the `GEMINI_API_KEY` environment variable and restart the backend, OCR extraction should work successfully.**

---

**Next Action:** Set your Gemini API key and restart the backend
