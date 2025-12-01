# Contribution Methods - Roadmap & Implementation Guide

This document outlines all planned contribution methods for the Perundhu bus route platform, including current implementations and future enhancements.

## Current Implementation Status

### ✅ Implemented Methods

#### 1. Manual Entry
**Status:** Production Ready  
**Component:** `SimpleRouteForm.tsx`

- Fill detailed forms with route information
- Add intermediate stops with timings
- Location autocomplete
- Journey duration calculation
- Template: Bus number, route name, origin, destination, stops, operating hours

#### 2. Image Upload with OCR
**Status:** Production Ready  
**Components:** `ImageContributionUpload.tsx`, `ImageContributionProcessingService.java`

- Upload photos of bus schedules
- Take screenshots and upload
- AI-powered OCR processing
- Tamil and English text recognition
- Automatic route data extraction

**Backend Support:**
- `/api/v1/contributions/images` - Submit image
- `/api/v1/contributions/images/{id}/status` - Check processing status
- `/api/v1/contributions/images/{id}/retry` - Retry failed processing

---

## Proposed Enhancement Methods

### 🎤 1. Voice/Audio Contribution

**Use Case:** Users share route information verbally while traveling or at bus stands

**Priority:** HIGH - Phase 1 (Week 1-2)

**Benefits:**
- Easy data entry while traveling
- No typing required
- Natural language input
- Multilingual support (Tamil + English)

**Technical Implementation:**

**Frontend:**
```typescript
// New contribution method type
type ContributionMethod = 'manual' | 'image' | 'voice';

// Add voice recording component
<VoiceContributionRecorder 
  onTranscription={(text) => handleVoiceSubmission(text)}
  language="ta" // Tamil support
  maxDuration={120} // 2 minutes
/>
```

**Backend:**
```java
// New endpoint
@PostMapping("/contributions/voice")
public ResponseEntity<?> submitVoiceContribution(
  @RequestParam("audio") MultipartFile audioFile,
  @RequestParam("language") String language,
  @RequestParam Map<String, String> metadata,
  HttpServletRequest request
) {
  // Use Google Cloud Speech-to-Text API
  SpeechClient speechClient = SpeechClient.create();
  
  // Configure recognition
  RecognitionConfig config = RecognitionConfig.newBuilder()
    .setLanguageCode(language) // "ta-IN" or "en-IN"
    .setEnableAutomaticPunctuation(true)
    .build();
  
  // Transcribe audio
  RecognizeResponse response = speechClient.recognize(config, audio);
  String transcribedText = response.getResultsList().get(0)
    .getAlternativesList().get(0)
    .getTranscript();
  
  // Parse transcribed text for route info
  RouteData routeData = nlpParser.extractRouteFromText(transcribedText);
  
  // Create contribution
  RouteContribution contribution = createContribution(routeData, "VOICE");
  contribution.setRawContent(transcribedText);
  
  return ResponseEntity.ok(contribution);
}
```

**Dependencies:**
- Google Cloud Speech-to-Text API (already using GCP)
- Frontend: Web Speech API or recording library
- NLP parser for Tamil/English mixed text

**Example User Flow:**
1. User clicks "Record Voice" button
2. Speaks: "Bus 27D, Chennai to Madurai, leaves 6 AM, arrives 2 PM"
3. System transcribes and extracts data
4. User confirms/edits extracted information
5. Submit contribution

---

### 📍 2. GPS Track Contribution

**Use Case:** Users contribute real-time route data while traveling on the bus

**Priority:** HIGH - Phase 1 (Week 3-4)

**Benefits:**
- Most accurate route data
- Real-time stop timings
- Actual path taken by bus
- Automatic distance calculations
- Verifiable data

**Technical Implementation:**

**Frontend:**
```typescript
<GPSRouteTracker 
  onJourneyComplete={(trackData) => handleGPSContribution(trackData)}
  minAccuracy={20} // meters
  recordingInterval={10000} // 10 seconds
/>

interface GPSTrackData {
  startLocation: Coordinates;
  endLocation: Coordinates;
  waypoints: Array<{
    coordinates: Coordinates;
    timestamp: Date;
    speed: number;
    accuracy: number;
  }>;
  detectedStops: Array<{
    coordinates: Coordinates;
    arrivalTime: Date;
    departureTime: Date;
    stopDuration: number;
    detectedStopName?: string;
  }>;
  totalDistance: number;
  totalDuration: number;
}
```

**Backend:**
```java
@PostMapping("/contributions/gps-track")
public ResponseEntity<?> submitGPSTrackContribution(
  @RequestBody GPSTrackData trackData,
  @RequestParam String busNumber,
  HttpServletRequest request
) {
  // Validate track data
  if (!isValidGPSTrack(trackData)) {
    return ResponseEntity.badRequest()
      .body("Invalid GPS track data");
  }
  
  // Detect stops (where speed < 5 km/h for > 30 seconds)
  List<Stop> detectedStops = stopDetectionService.detectStops(trackData);
  
  // Reverse geocode to get location names
  detectedStops.forEach(stop -> {
    String locationName = geocodingService.reverseGeocode(
      stop.getCoordinates()
    );
    stop.setName(locationName);
  });
  
  // Create route contribution
  RouteContribution contribution = RouteContribution.builder()
    .source("GPS_TRACK")
    .busNumber(busNumber)
    .fromLocationName(trackData.getStartLocation().getName())
    .toLocationName(trackData.getEndLocation().getName())
    .intermediateStops(detectedStops)
    .totalDistance(trackData.getTotalDistance())
    .totalDuration(trackData.getTotalDuration())
    .gpsData(trackData.getWaypoints())
    .build();
  
  return ResponseEntity.ok(contribution);
}
```

**Stop Detection Algorithm:**
```java
public List<Stop> detectStops(GPSTrackData trackData) {
  List<Stop> stops = new ArrayList<>();
  
  for (int i = 0; i < trackData.getWaypoints().size(); i++) {
    Waypoint current = trackData.getWaypoints().get(i);
    
    // Check if speed is low
    if (current.getSpeed() < 5) { // km/h
      int stopDuration = 0;
      Coordinates stopLocation = current.getCoordinates();
      LocalDateTime arrivalTime = current.getTimestamp();
      
      // Count consecutive low-speed waypoints
      while (i < trackData.getWaypoints().size() && 
             trackData.getWaypoints().get(i).getSpeed() < 5) {
        stopDuration += 10; // 10 second intervals
        i++;
      }
      
      // If stopped for more than 30 seconds, it's a valid stop
      if (stopDuration >= 30) {
        Stop stop = Stop.builder()
          .coordinates(stopLocation)
          .arrivalTime(arrivalTime)
          .departureTime(arrivalTime.plusSeconds(stopDuration))
          .stopDuration(stopDuration)
          .build();
        stops.add(stop);
      }
    }
  }
  
  return stops;
}
```

**User Flow:**
1. User boards bus and clicks "Track This Journey"
2. App records GPS coordinates every 10 seconds
3. User enters bus number at start
4. App automatically detects when bus stops
5. At journey end, user clicks "Complete Journey"
6. System shows detected stops for confirmation
7. User verifies/edits stop names
8. Submit contribution

---

### 📋 3. Smart Copy-Paste from Social Media

**Use Case:** Users copy route information from WhatsApp groups, Facebook posts, Twitter threads

**Priority:** HIGH - Phase 1 (Week 1-2) - QUICK WIN

**Benefits:**
- Zero friction - users already have the data
- Leverages existing information sharing
- Works with any text source
- Handles multiple formats

**Technical Implementation:**

**Frontend:**
```typescript
<SmartPasteContribution 
  onPaste={(extractedData) => handleSmartPaste(extractedData)}
/>

const analyzeText = async (text: string) => {
  const response = await api.post('/api/v1/contributions/analyze-text', {
    text,
    language: detectLanguage(text)
  });
  
  return response.data;
};

// Handle various paste formats
const handlePaste = async (e: React.ClipboardEvent) => {
  const text = e.clipboardData.getData('text');
  
  // Detect if it's WhatsApp format
  const isWhatsApp = text.match(/\[\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}/);
  
  // Analyze and extract
  const extracted = await analyzeText(text);
  
  setExtractedData({
    ...extracted,
    source: isWhatsApp ? 'WHATSAPP' : 'PASTE',
    rawText: text
  });
};
```

**Backend - NLP Parser:**
```java
@Service
public class RouteTextParser {
  
  public RouteData extractRouteFromText(String text) {
    RouteData data = new RouteData();
    
    // Extract bus number (patterns: 27D, 570, MTC-123)
    Pattern busPattern = Pattern.compile(
      "(?i)bus\\s*[:#-]?\\s*([A-Z0-9-]+)|" +
      "route\\s*[:#-]?\\s*([A-Z0-9-]+)|" +
      "பஸ்\\s*([A-Z0-9-]+)"
    );
    Matcher busMatcher = busPattern.matcher(text);
    if (busMatcher.find()) {
      data.setBusNumber(
        busMatcher.group(1) != null ? busMatcher.group(1) : 
        busMatcher.group(2) != null ? busMatcher.group(2) : 
        busMatcher.group(3)
      );
    }
    
    // Extract locations (from/to pattern)
    Pattern locationPattern = Pattern.compile(
      "(?i)(from|புறப்பாடு)\\s*[:-]?\\s*([a-zA-Z\\s]+)" +
      "\\s+(to|வரவு)\\s*[:-]?\\s*([a-zA-Z\\s]+)"
    );
    Matcher locationMatcher = locationPattern.matcher(text);
    if (locationMatcher.find()) {
      data.setFromLocation(locationMatcher.group(2).trim());
      data.setToLocation(locationMatcher.group(4).trim());
    }
    
    // Extract timings
    data.setTimings(extractTimings(text));
    
    // Extract stops
    data.setStops(extractStops(text));
    
    // Calculate confidence score
    data.setConfidence(calculateConfidence(data));
    
    return data;
  }
  
  private List<String> extractTimings(String text) {
    List<String> timings = new ArrayList<>();
    
    // English time patterns
    Pattern timePattern = Pattern.compile(
      "\\b(\\d{1,2}):?(\\d{2})\\s*(AM|PM|am|pm)?\\b"
    );
    
    // Tamil time patterns
    Pattern tamilTimePattern = Pattern.compile(
      "(காலை|மாலை|இரவு)\\s*(\\d{1,2})\\s*மணி"
    );
    
    Matcher matcher = timePattern.matcher(text);
    while (matcher.find()) {
      String time = matcher.group(0);
      timings.add(normalizeTime(time));
    }
    
    return timings;
  }
  
  private List<String> extractStops(String text) {
    List<String> stops = new ArrayList<>();
    
    // Pattern: numbered or bulleted lists
    Pattern stopsPattern = Pattern.compile(
      "(?:stops?|வழி|Stops)\\s*[:-]?\\s*([^\n]+)",
      Pattern.CASE_INSENSITIVE
    );
    
    Matcher matcher = stopsPattern.matcher(text);
    if (matcher.find()) {
      String stopsText = matcher.group(1);
      // Split by comma, semicolon, or newline
      String[] stopArray = stopsText.split("[,;\\n]");
      for (String stop : stopArray) {
        String cleaned = stop.trim()
          .replaceAll("^\\d+\\.?\\s*", "") // Remove numbering
          .replaceAll("^[-•*]\\s*", "");    // Remove bullets
        if (!cleaned.isEmpty()) {
          stops.add(cleaned);
        }
      }
    }
    
    return stops;
  }
}
```

**Example Inputs Handled:**

```
Input 1 - WhatsApp Format:
"[01/12/2025, 10:30:45 AM] Ramesh: 27D bus from Chennai to Madurai
Departure: 6:00 AM
Stops: Tambaram, Chengalpattu, Villupuram, Trichy
Arrival: 2:00 PM"

Input 2 - Tamil Mixed:
"மதுரை to சென்னை பஸ் 570
காலை 5 மணி புறப்பாடு
இரவு 11 மணி வரவு
வழி: தாம்பரம், செங்கல்பட்டு"

Input 3 - Informal Format:
"Route 570 schedule:
Start - Koyambedu 5:30am
1. Guindy 6:00am  
2. Chromepet 6:20am
3. Tambaram 6:45am
End - Chengalpattu 7:30am"

Input 4 - Social Media:
"Guys, the new express bus 27E
Chennai Central → Madurai
Morning 6am, reaches by 1pm
Super fast! Only 3 stops
#TNSTCbus"
```

**API Endpoint:**
```java
@PostMapping("/contributions/analyze-text")
public ResponseEntity<?> analyzeTextContribution(
  @RequestBody Map<String, String> request,
  HttpServletRequest httpRequest
) {
  String text = request.get("text");
  String language = request.getOrDefault("language", "mixed");
  
  // Parse text
  RouteData routeData = routeTextParser.extractRouteFromText(text);
  
  // Return extracted data with confidence score
  Map<String, Object> response = new HashMap<>();
  response.put("extracted", routeData);
  response.put("confidence", routeData.getConfidence());
  response.put("needsReview", routeData.getConfidence() < 0.7);
  
  return ResponseEntity.ok(response);
}
```

---

### 📺 4. YouTube Video/Description Parsing

**Use Case:** Transport corporations and users post schedules in YouTube video descriptions or thumbnails

**Priority:** MEDIUM - Phase 2 (Week 3)

**Technical Implementation:**

**Frontend:**
```typescript
<YouTubeContributionForm 
  onExtract={(data) => handleYouTubeContribution(data)}
/>
```

**Backend:**
```java
@PostMapping("/contributions/youtube")
public ResponseEntity<?> submitYouTubeContribution(
    @RequestParam String youtubeUrl,
    @RequestParam(required = false) String timestamp,
    HttpServletRequest request) {
    
    // Validate YouTube URL
    String videoId = extractYouTubeVideoId(youtubeUrl);
    
    // Use YouTube Data API v3
    YouTube youtube = new YouTube.Builder(
      new NetHttpTransport(),
      new JacksonFactory(),
      null
    ).setApplicationName("Perundhu").build();
    
    // Fetch video details
    YouTube.Videos.List videoRequest = youtube.videos()
      .list("snippet")
      .setId(videoId)
      .setKey(youtubeApiKey);
    
    VideoListResponse response = videoRequest.execute();
    Video video = response.getItems().get(0);
    
    List<RouteContribution> contributions = new ArrayList<>();
    
    // Parse description
    String description = video.getSnippet().getDescription();
    List<RouteData> descriptionRoutes = routeTextParser
      .extractRoutesFromText(description);
    
    descriptionRoutes.forEach(route -> {
      RouteContribution contribution = createContribution(route, "YOUTUBE_DESCRIPTION");
      contribution.setSourceUrl(youtubeUrl);
      contribution.setRawContent(description);
      contributions.add(contribution);
    });
    
    // Optional: Extract frame and OCR
    if (timestamp != null) {
      BufferedImage frame = videoFrameExtractor.extractFrame(youtubeUrl, timestamp);
      OCRResult ocrData = ocrService.processImage(frame);
      
      List<RouteData> ocrRoutes = routeTextParser
        .extractRoutesFromText(ocrData.getText());
      
      ocrRoutes.forEach(route -> {
        RouteContribution contribution = createContribution(route, "YOUTUBE_VIDEO_OCR");
        contribution.setSourceUrl(youtubeUrl + "&t=" + timestamp);
        contributions.add(contribution);
      });
    }
    
    // Save all contributions
    contributions.forEach(c -> 
      contributionInputPort.submitRouteContribution(c.toMap(), userId)
    );
    
    return ResponseEntity.ok(Map.of(
      "success", true,
      "contributionsCreated", contributions.size(),
      "contributions", contributions
    ));
}
```

**Dependencies:**
- Google YouTube Data API v3
- FFmpeg (for frame extraction)
- OCR service (already implemented)

---

### 🐦 5. Twitter/X Hashtag Monitoring

**Use Case:** Real-time route updates shared via Twitter

**Priority:** MEDIUM - Phase 2 (Week 4)

**Technical Implementation:**

```java
@Service
@Slf4j
public class TwitterMonitoringService {
    
    private final TwitterAPI twitterAPI;
    private final RouteTextParser routeTextParser;
    private final ContributionInputPort contributionInputPort;
    
    private final List<String> MONITORED_HASHTAGS = Arrays.asList(
        "#TNSTCbus", 
        "#MTCBus", 
        "#TamilNaduBus", 
        "#பேருந்து",
        "#PerundhuRoute",
        "#BusTimings",
        "#ChennaiToMadurai"
    );
    
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void monitorHashtags() {
        for (String hashtag : MONITORED_HASHTAGS) {
            try {
                // Search recent tweets
                List<Tweet> tweets = twitterAPI.searchRecent(
                    hashtag, 
                    100, // max results
                    LocalDateTime.now().minusMinutes(5) // since last check
                );
                
                log.info("Found {} tweets for hashtag {}", tweets.size(), hashtag);
                
                tweets.forEach(tweet -> processTweet(tweet));
                
            } catch (Exception e) {
                log.error("Error monitoring hashtag {}: {}", hashtag, e.getMessage());
            }
        }
    }
    
    private void processTweet(Tweet tweet) {
        // Parse tweet content
        RouteData routeData = routeTextParser.extractRouteFromText(tweet.getText());
        
        if (routeData.isValid() && routeData.getConfidence() > 0.6) {
            // Create contribution
            RouteContribution contribution = RouteContribution.builder()
                .source("TWITTER")
                .sourceUrl(tweet.getUrl())
                .submittedBy("twitter_" + tweet.getAuthorId())
                .status("PENDING_SOCIAL_MEDIA_REVIEW")
                .busNumber(routeData.getBusNumber())
                .fromLocationName(routeData.getFromLocation())
                .toLocationName(routeData.getToLocation())
                .rawContent(tweet.getText())
                .confidenceScore(routeData.getConfidence())
                .build();
            
            // Save contribution
            RouteContribution saved = contributionInputPort
              .submitRouteContribution(contribution.toMap(), contribution.getSubmittedBy());
            
            // Reply to tweet to thank contributor
            try {
                String replyText = String.format(
                    "@%s Thanks for sharing! We've added this to our database. " +
                    "Track status: https://perundhu.app/contribution/%s #PerundhuRoute",
                    tweet.getAuthor().getUsername(),
                    saved.getId()
                );
                
                twitterAPI.reply(tweet.getId(), replyText);
                
            } catch (Exception e) {
                log.warn("Failed to reply to tweet {}: {}", tweet.getId(), e.getMessage());
            }
        }
    }
}
```

**Monitored Patterns:**
- Direct route information in tweets
- Links to official schedule PDFs
- User complaints/suggestions about routes
- Real-time delay/cancellation updates

---

### 👥 6. Facebook Group Monitoring

**Use Case:** Tamil Nadu bus traveler groups share route information

**Priority:** MEDIUM - Phase 2

**Monitored Groups:**
- TN Bus Travelers
- Chennai Bus Updates  
- TNSTC Passengers Forum
- Madurai Bus Commuters
- Tamil Nadu Transport Network

**Implementation:** Similar to Twitter monitoring with Facebook Graph API

---

### 📸 7. Instagram Post/Story Extraction

**Use Case:** Users share bus schedule photos on Instagram

**Priority:** LOW - Phase 3

**Implementation:**
- Parse Instagram post URLs
- Extract images and captions
- Run OCR on images
- Parse captions for route info
- Support Instagram Stories (with 24-hour window)

---

### ✏️ 8. Route Edit Suggestions

**Use Case:** Users suggest corrections to existing routes

**Priority:** HIGH - Phase 1

**Technical Implementation:**

```typescript
<RouteEditSuggestion 
  existingRoute={route}
  onSuggestEdit={(changes) => handleEditContribution(changes)}
/>

interface EditSuggestion {
  routeId: string;
  editType: 'update_timing' | 'add_stop' | 'remove_stop' | 'update_info';
  changes: Record<string, any>;
  reason: string;
  verificationCount: number;
}
```

**Backend:**
```java
@PostMapping("/contributions/route-edit")
public ResponseEntity<?> submitRouteEdit(
    @RequestBody EditSuggestion editSuggestion,
    HttpServletRequest request
) {
    String userId = authenticationService.getCurrentUserId();
    
    // Validate route exists
    Optional<Route> route = routeRepository.findById(editSuggestion.getRouteId());
    if (route.isEmpty()) {
        return ResponseEntity.notFound().build();
    }
    
    // Create edit contribution
    RouteEditContribution contribution = RouteEditContribution.builder()
        .routeId(editSuggestion.getRouteId())
        .editType(editSuggestion.getEditType())
        .proposedChanges(editSuggestion.getChanges())
        .reason(editSuggestion.getReason())
        .submittedBy(userId)
        .status("PENDING_VERIFICATION")
        .verificationCount(0)
        .build();
    
    RouteEditContribution saved = routeEditRepository.save(contribution);
    
    return ResponseEntity.ok(saved);
}

// Allow other users to verify the edit
@PostMapping("/contributions/route-edit/{id}/verify")
public ResponseEntity<?> verifyEdit(
    @PathVariable String id,
    HttpServletRequest request
) {
    String userId = authenticationService.getCurrentUserId();
    
    RouteEditContribution edit = routeEditRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Edit not found"));
    
    // Check if user already verified
    if (edit.getVerifiedBy().contains(userId)) {
        return ResponseEntity.badRequest()
            .body("You have already verified this edit");
    }
    
    // Add verification
    edit.getVerifiedBy().add(userId);
    edit.setVerificationCount(edit.getVerificationCount() + 1);
    
    // Auto-approve after 3 verifications
    if (edit.getVerificationCount() >= 3) {
        edit.setStatus("AUTO_APPROVED");
        applyRouteEdit(edit);
    }
    
    routeEditRepository.save(edit);
    
    return ResponseEntity.ok(edit);
}
```

---

### 📥 9. Import from External Sources

**Use Case:** Bulk import from official transport websites/PDFs

**Priority:** LOW - Phase 3

**Supported Sources:**
- TNSTC official website
- MTC Chennai website
- Government PDF schedules
- CSV exports

---

### ⚡ 10. Template-Based Quick Entry

**Use Case:** Power users frequently add similar routes

**Priority:** MEDIUM - Phase 2

**Features:**
- Save route templates
- Duplicate and modify
- Favorite stops
- Auto-fill from history

---

## Implementation Priority Summary

### **Phase 1 - Quick Wins (2-3 weeks)**
1. ✅ Smart Copy-Paste - HIGHEST PRIORITY
2. ✅ Voice Contribution
3. ✅ Route Edit Suggestions

### **Phase 2 - Medium Term (1-2 months)**
4. GPS Track Contribution
5. YouTube Integration
6. Twitter Monitoring
7. Template System

### **Phase 3 - Long Term (2-3 months)**
8. Facebook/Instagram Integration
9. External Source Imports
10. SMS/WhatsApp Integration

### **Phase 4 - Future**
11. Gamification
12. Collaborative Route Building
13. QR Code Infrastructure

---

## Technical Dependencies

### Frontend
- Web Speech API (for voice)
- Geolocation API (for GPS tracking)
- Clipboard API (for paste detection)
- React components for each method

### Backend
- Google Cloud Speech-to-Text (voice)
- YouTube Data API v3 (video parsing)
- Twitter API v2 (monitoring)
- Facebook Graph API (group monitoring)
- Instagram Basic Display API
- NLP libraries for text parsing
- OCR service (already implemented)

### Infrastructure
- Scheduled jobs for social media monitoring
- Webhook endpoints for real-time updates
- Rate limiting for API calls
- Caching for frequently accessed data

---

## Success Metrics

### Contribution Volume
- Increase contribution rate by 200%
- Target: 500+ contributions per month
- Reduce manual entry time by 50%

### Data Quality
- Maintain >90% accuracy rate
- Auto-verify >60% of contributions
- Reduce admin review time by 40%

### User Engagement
- 30% of users try new methods
- 15% retention for voice/GPS methods
- 50% of contributions from copy-paste

---

## Future Considerations

### AI/ML Enhancements
- Improve NLP parsing accuracy
- Auto-detect duplicate contributions
- Predict missing route information
- Anomaly detection for suspicious data

### Community Features
- Contribution leaderboards
- Badges and rewards
- Verified contributor status
- Community voting on accuracy

### Integration Opportunities
- Google Maps integration
- Apple Maps data sharing
- Government transport APIs
- Third-party travel apps

---

## Notes

- All new contribution methods should maintain security standards
- Rate limiting applies to all methods
- Admin review required for low-confidence data
- User privacy must be protected (anonymize social media data)
- Multilingual support (Tamil + English) is mandatory
- All contributions tracked with source attribution

---

**Last Updated:** December 1, 2025  
**Document Owner:** Engineering Team  
**Review Cycle:** Monthly
