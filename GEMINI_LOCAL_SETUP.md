# Setting Up Gemini API Key for Local Development

**Goal:** Use preprod Gemini API key (`secrets/gemini-api-key`) for local development

## Quick Setup

### Option 1: Using gcloud (Recommended)

Retrieve the preprod secret and set it as an environment variable:

```bash
# Get the preprod Gemini API key from Google Secrets
export GEMINI_API_KEY=$(gcloud secrets versions access latest --secret=gemini-api-key)

# Start the backend
cd /Users/mchand69/Documents/perundhu/backend
./gradlew bootRun
```

### Option 2: Manual Setup (if gcloud is not available)

1. **Get the secret from Google Cloud Console**
   - Go to: https://console.cloud.google.com/security/secret-manager
   - Find: `gemini-api-key`
   - Click it and view the secret value for preprod
   - Copy the value

2. **Set as environment variable**
   ```bash
   export GEMINI_API_KEY="your-preprod-api-key-here"
   cd /Users/mchand69/Documents/perundhu/backend
   ./gradlew bootRun
   ```

3. **Or add to your shell profile** (`.zshrc` or `.bashrc`)
   ```bash
   # Add this line to ~/.zshrc
   export GEMINI_API_KEY="your-preprod-api-key-here"
   
   # Reload shell
   source ~/.zshrc
   ```

### Option 3: Using `.env` file in project root

1. **Create `.env` file** in `/Users/mchand69/Documents/perundhu/`
   ```bash
   # .env
   GEMINI_API_KEY=your-preprod-api-key-here
   ```

2. **Load it before starting**
   ```bash
   cd /Users/mchand69/Documents/perundhu
   source .env
   cd backend
   ./gradlew bootRun
   ```

## Configuration

**File Updated:** `application-development.properties`

```properties
# Gemini Vision AI Configuration (Development)
# Uses preprod secret value from: secrets/gemini-api-key
gemini.api.enabled=true
gemini.api.key=${GEMINI_API_KEY:}
gemini.api.model=${GEMINI_API_MODEL:gemini-2.0-flash}
```

The configuration:
- ✅ Reads from `GEMINI_API_KEY` environment variable
- ✅ Enabled by default for development
- ✅ Uses `gemini-2.0-flash` model
- ✅ Falls back to empty if env var not set (graceful degradation)

## Verify Setup

After starting the backend with the API key set:

### 1. Check logs
```bash
grep -i "gemini" /tmp/backend.log | head -10
```

**Expected output:**
```
INFO  - Gemini Vision service is initialized
DEBUG - Using model: gemini-2.0-flash
```

### 2. Test OCR extraction endpoint
```bash
curl -X POST 'http://localhost:8080/api/admin/contributions/images/test-id/extract-ocr' \
  -H 'Authorization: Basic YWRtaW46YWRtaW4xMjM='
```

**Expected:** Should connect to Gemini API (no "API key not configured" error)

### 3. Check API health
```bash
curl http://localhost:8080/api/admin/health \
  -H 'Authorization: Basic YWRtaW46YWRtaW4xMjM='
```

Look for: `"geminiVisionAvailable": true`

## Troubleshooting

### ❌ "Gemini API key is not configured"

**Cause:** Environment variable not set

**Fix:**
```bash
# Verify variable is set
echo $GEMINI_API_KEY

# If empty, set it
export GEMINI_API_KEY="your-key"

# Restart backend
```

### ❌ "Invalid API key" / 401 errors

**Cause:** Expired or incorrect key

**Fix:**
1. Go to https://console.cloud.google.com/security/secret-manager
2. Find `gemini-api-key` secret
3. Verify you copied the entire value (no extra spaces)
4. Update your `GEMINI_API_KEY` with the correct value

### ✅ "AI extraction working"

Congrats! OCR extraction is now enabled for local development.

## Next Steps

Once working locally:
1. Test the admin panel image upload and OCR extraction
2. Try uploading a bus schedule image
3. Click "Extract OCR" button
4. Should see extracted data (routes, times, etc.)

## For Preprod Deployment

The preprod Cloud Run instance will automatically:
1. Read `secrets/gemini-api-key` from Google Secret Manager
2. Inject as `GEMINI_API_KEY` environment variable
3. Start with Gemini Vision enabled

No additional setup needed for preprod!

---

**Last Updated:** January 6, 2026
