# Voice Contribution Feature

## Status: BETA (Disabled by Default)

The voice contribution feature allows users to submit bus route information using voice recording and real-time transcription.

---

## Features

### ✅ Implemented
- **Real-time Speech Recognition** using Web Speech API (FREE)
- **Tamil and English support** (ta-IN, en-IN)
- **Live transcription display** as user speaks
- **Audio recording** with MediaRecorder API
- **NLP text parsing** to extract route data
- **Backend voice endpoint** with rate limiting
- **Feature flag control** for easy enable/disable

### 🎯 Technologies Used
- **Web Speech API** - Browser-native speech recognition (Chrome, Edge, Safari)
- **MediaRecorder API** - Audio recording
- **RouteTextParser.java** - NLP service for route data extraction
- **React + TypeScript** - Frontend components

---

## Enabling the Feature

### Frontend (Quick Enable)

To enable voice contribution, set the environment variable:

```bash
# .env or .env.local
VITE_ENABLE_VOICE_CONTRIBUTION=true
```

Then restart your development server:

```bash
npm run dev
# or
yarn dev
```

### Production Deployment

Update your deployment environment variables:

```bash
# For Vercel, Netlify, etc.
VITE_ENABLE_VOICE_CONTRIBUTION=true
```

Or update `.env.production`:

```bash
VITE_ENABLE_VOICE_CONTRIBUTION=true
```

---

## How It Works

### User Flow

1. User navigates to "Contribute Route" page
2. Selects **"Voice Recording"** method (if enabled)
3. Chooses language (English, Tamil, or Auto-detect)
4. Clicks **"Start Recording"**
5. **Real-time transcription** shows what they're saying
6. Speaks route information naturally:
   - *"Bus 27D from Chennai to Madurai, leaves at 6 AM, arrives at 2 PM"*
7. Clicks **"Stop"** when finished
8. Reviews transcription
9. Clicks **"Transcribe & Continue"**
10. Backend **NLP parser** extracts structured data:
    - Bus Number: 27D
    - From: Chennai
    - To: Madurai
    - Timings: 6:00 AM, 2:00 PM
11. Contribution sent for **admin approval**

### Technical Architecture

```
┌─────────────────┐
│  User speaks    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Web Speech API             │
│  (Browser-native, FREE)     │
│  - Chrome/Edge/Safari       │
│  - Tamil + English support  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Live Transcription Display │
│  - Final text (dark)        │
│  - Interim text (gray)      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  MediaRecorder API          │
│  - Records audio (webm/mp4) │
│  - For playback/backup      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Submit to Backend          │
│  - Transcribed text         │
│  - Audio file               │
│  - Language metadata        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  RouteTextParser.java (NLP) │
│  - Extract bus number       │
│  - Extract locations        │
│  - Extract timings          │
│  - Extract stops            │
│  - Calculate confidence     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Create RouteContribution   │
│  - Status: PENDING          │
│  - Requires admin approval  │
│  - Confidence score         │
└─────────────────────────────┘
```

---

## Browser Compatibility

### ✅ Supported Browsers (Web Speech API)
- **Chrome** 25+ ✅
- **Edge** 79+ ✅
- **Safari** 14.1+ ✅ (macOS, iOS)
- **Opera** 27+ ✅

### ❌ Not Supported
- **Firefox** ❌ (No Web Speech API support)
- **Internet Explorer** ❌

### Fallback Behavior
If Web Speech API is not supported:
- Warning message shown in UI
- User can still record audio
- Backend can use alternative transcription (if configured)
- Or show message to use supported browser

---

## Cost Analysis

### FREE Option (Current Implementation)
- **Web Speech API**: $0/month
- **Browser Coverage**: ~85% of users
- **Language Support**: Tamil + English
- **Accuracy**: ~85%

### Paid Alternative (Not Implemented)
- **Google Cloud Speech-to-Text**: $10-11/month
- **Coverage**: 100% (server-side)
- **Language Support**: Tamil + English
- **Accuracy**: ~95%

**Savings**: $120-132/year by using Web Speech API

---

## Configuration

### Frontend Feature Flag

**File**: `frontend/src/config/featureFlags.ts`

```typescript
export const featureFlags: FeatureFlags = {
  // ... other flags
  
  /**
   * Voice Contribution Feature
   * 
   * Enables voice recording and transcription for route contributions.
   * Uses Web Speech API for free, browser-native speech recognition.
   * 
   * Status: BETA (Disabled by default)
   * Dependencies: Web Speech API (Chrome, Edge, Safari)
   * 
   * To enable: Set VITE_ENABLE_VOICE_CONTRIBUTION=true in .env
   */
  enableVoiceContribution: getEnv('VITE_ENABLE_VOICE_CONTRIBUTION') === 'true',
};
```

### Backend Rate Limiting

**File**: `backend/src/main/java/com/perundhu/controller/ContributionController.java`

```java
// Rate limits for voice contributions
@RateLimiter(name = "voiceTranscription", fallbackMethod = "transcriptionRateLimitFallback")
public ResponseEntity<?> transcribeVoice(...) {
    // 10 transcriptions per hour per user
}

@RateLimiter(name = "voiceContribution", fallbackMethod = "contributionRateLimitFallback")
public ResponseEntity<?> submitVoiceContribution(...) {
    // 5 voice contributions per hour per user
}
```

---

## NLP Parser Capabilities

### Supported Patterns

#### Bus Numbers
```
✅ "Bus 27D"
✅ "27D bus"
✅ "Route 570"
✅ "பஸ் 27D" (Tamil)
✅ "MTC-123"
```

#### Locations
```
✅ "from Chennai to Madurai"
✅ "Chennai to Madurai"
✅ "புறப்பாடு சென்னை வரவு மதுரை" (Tamil)
```

#### Timings
```
✅ "6:00 AM"
✅ "6 AM"
✅ "காலை 6 மணி" (Tamil)
✅ "மாலை 5 மணி" (Tamil evening 5)
```

#### Stops
```
✅ "Stops: Tambaram, Chengalpattu, Villupuram"
✅ "வழி: தாம்பரம், செங்கல்பட்டு" (Tamil)
```

### Confidence Scoring

The NLP parser calculates a confidence score (0.0 - 1.0):

- **30%**: Bus number extracted
- **25%**: From location extracted
- **25%**: To location extracted
- **10%**: Timings extracted
- **10%**: Stops extracted

**Minimum confidence for auto-approval**: 70%

---

## Security & Rate Limiting

### Frontend Validation
- Maximum recording duration: 2 minutes
- Supported audio formats: webm, mp4, wav, mp3, ogg
- Maximum file size: 5MB

### Backend Security
- IP-based rate limiting
- User agent validation
- Audio file validation (size, format)
- Rate limits:
  - 10 transcriptions per hour per user
  - 5 voice contributions per hour per user
- XSS protection on transcribed text
- SQL injection prevention

---

## Testing

### Manual Testing

1. **Enable Feature**:
   ```bash
   echo "VITE_ENABLE_VOICE_CONTRIBUTION=true" >> .env.local
   npm run dev
   ```

2. **Test Flow**:
   - Navigate to `/contribute`
   - Select "Voice Recording"
   - Grant microphone permission
   - Select language (Tamil or English)
   - Click "Start Recording"
   - Speak: *"Bus 27D from Chennai to Madurai leaves at 6 AM"*
   - Verify live transcription appears
   - Click "Stop"
   - Click "Transcribe & Continue"
   - Verify success message

3. **Browser Testing**:
   - ✅ Chrome
   - ✅ Edge
   - ✅ Safari
   - ❌ Firefox (should show warning)

### Automated Testing

```typescript
// Test feature flag
describe('Voice Contribution Feature Flag', () => {
  it('should hide voice option when disabled', () => {
    // Set VITE_ENABLE_VOICE_CONTRIBUTION=false
    expect(screen.queryByText('Voice Recording')).not.toBeInTheDocument();
  });
  
  it('should show voice option when enabled', () => {
    // Set VITE_ENABLE_VOICE_CONTRIBUTION=true
    expect(screen.getByText('Voice Recording')).toBeInTheDocument();
  });
});
```

---

## Troubleshooting

### Issue: Voice option not showing

**Solution**: Check environment variable
```bash
# In .env or .env.local
VITE_ENABLE_VOICE_CONTRIBUTION=true
```

Then restart dev server:
```bash
npm run dev
```

### Issue: "Real-time transcription not supported"

**Cause**: Using Firefox or older browser

**Solution**: Use Chrome, Edge, or Safari

### Issue: Microphone permission denied

**Cause**: User blocked microphone access

**Solution**:
1. Click lock icon in browser address bar
2. Allow microphone permission
3. Reload page

### Issue: No transcription appearing

**Cause**: Noise, accent, or unclear speech

**Solution**:
- Speak clearly and slowly
- Find quiet environment
- Speak closer to microphone
- Try switching language selection

---

## Future Enhancements

### Phase 2 (Optional)
- [ ] Hybrid transcription (Web Speech API + Google Cloud fallback)
- [ ] Offline support with local models
- [ ] Edit transcription before submission
- [ ] Voice command shortcuts
- [ ] Multiple language auto-detection
- [ ] Noise cancellation
- [ ] Speaker identification for group contributions

### Phase 3 (Advanced)
- [ ] Custom Tamil voice models for better accuracy
- [ ] Voice contribution leaderboard
- [ ] Voice contribution badges/rewards
- [ ] Integration with mobile apps
- [ ] Voice verification for high-quality contributions

---

## Related Files

### Frontend
- `frontend/src/components/contribution/VoiceContributionRecorder.tsx` - Main component
- `frontend/src/components/contribution/VoiceContributionRecorder.css` - Styling
- `frontend/src/components/contribution/ContributionMethodSelector.tsx` - Method selector
- `frontend/src/components/RouteContribution.tsx` - Main contribution page
- `frontend/src/config/featureFlags.ts` - Feature flag configuration

### Backend
- `backend/src/main/java/com/perundhu/controller/ContributionController.java` - REST endpoints
- `backend/src/main/java/com/perundhu/service/RouteTextParser.java` - NLP service

### Documentation
- `CONTRIBUTION_METHODS_ROADMAP.md` - All contribution methods roadmap
- `VOICE_CONTRIBUTION_FEATURE.md` - This file

---

## Support

For issues or questions:
1. Check browser compatibility
2. Verify feature flag is enabled
3. Check browser console for errors
4. Test microphone permissions
5. Contact development team

---

**Last Updated**: December 2, 2025  
**Status**: BETA (Disabled by default)  
**Feature Flag**: `VITE_ENABLE_VOICE_CONTRIBUTION`  
**Default Value**: `false`
