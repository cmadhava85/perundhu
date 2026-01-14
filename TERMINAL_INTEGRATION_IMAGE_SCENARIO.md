# Terminal Integration for Image Contribution Scenario

## Overview

When users contribute bus route information via images (e.g., uploading a photo of a bus ticket or schedule), the terminal integration helps resolve and display the correct boarding/alighting terminals. This ensures users know exactly where to catch or board off the bus.

## Workflow Architecture

```
User Uploads Image of Bus Route
    ↓
Image Contribution Component (ImageContributionUpload.tsx)
    ↓
Backend Process Image:
  - Extract route info (from, to, bus number, times)
  - Create route contribution record
    ↓
Route Gets Approved by Admin
    ↓
Integrate Route into Search Database
    ↓
Terminal Resolution Hook Activates
    ↓
Terminal Info Alert Shows to Users
```

## Implementation Scenarios

### Scenario 1: Image Contribution → Terminal Resolution

**Current Flow (Already Implemented):**

```tsx
// In SearchResults.tsx
const { data: terminalInfo } = useTerminalResolution(
  fromLocation.name,      // Extracted from image data
  toLocation.name,        // Extracted from image data
  buses.length > 0        // Enabled after approval & integration
);

// Display to users who searched for this route
{terminalInfo?.needsTerminalInfo && terminalInfo.terminal && (
  <TerminalInfoAlert terminal={terminalInfo.terminal} />
)}
```

### Scenario 2: How to Integrate Terminal Info at Contribution Submission Level

**This would show users where to board based on their contribution image:**

```tsx
// In ImageContributionUpload.tsx - Enhancement Needed

import { useTerminalResolution } from '../hooks/queries/useTerminalResolution';

interface ImageContributionUploadProps {
  onSuccess?: (contributionId: string) => void;
  onError?: (error: string) => void;
  onClearStatus?: () => void;
  preSelectedFrom?: string;  // Pre-filled from search
  preSelectedTo?: string;    // Pre-filled from search
}

const ImageContributionUpload: React.FC<ImageContributionUploadProps> = ({
  preSelectedFrom = '',
  preSelectedTo = ''
}) => {
  const [location, setLocation] = useState(preSelectedFrom);
  const [routeName, setRouteName] = useState(preSelectedTo);
  
  // Resolve terminal for the route being contributed
  const { data: terminalInfo } = useTerminalResolution(
    location,
    routeName,
    location.length > 0 && routeName.length > 0  // Enabled when route info provided
  );

  return (
    <div>
      {/* Contribution Form */}
      <div className="image-contribution-form">
        <input 
          type="text" 
          value={location}
          placeholder="From Location"
          onChange={(e) => setLocation(e.target.value)}
        />
        <input 
          type="text" 
          value={routeName}
          placeholder="To Location"
          onChange={(e) => setRouteName(e.target.value)}
        />
      </div>

      {/* Terminal Preview - Shows where bus actually boards from */}
      {terminalInfo?.needsTerminalInfo && terminalInfo.terminal && (
        <div className="terminal-preview-info">
          <TerminalInfoAlert terminal={terminalInfo.terminal} />
          <p className="info-message">
            This is the actual boarding terminal for your contributed route.
            Ensure your image matches this location.
          </p>
        </div>
      )}

      {/* Image Upload Section */}
      {/* ... rest of form ... */}
    </div>
  );
};
```

## Data Flow from Image to Terminal Display

### Step 1: User Uploads Image

```
User navigates to Contribute → Image Method
    ↓
Selects image file (e.g., bus ticket photo)
    ↓
Enters route details (From, To, Bus Number, Times)
    ↓
May pre-populate if coming from Search with terminal info context
```

### Step 2: Image Extraction (Backend)

```java
// Backend processes the image using OCR
@PostMapping("/contributions/image")
public ResponseEntity<?> submitImageContribution(
    @RequestParam String source,      // "Chennai"
    @RequestParam String destination, // "Madurai"
    @RequestParam String description, // User's description
    @RequestPart MultipartFile image  // The image file
) {
    // Extract from image
    String extractedSource = ocrService.extractSource(image);
    String extractedDest = ocrService.extractDestination(image);
    
    // Create contribution with extracted data
    RouteContribution contribution = new RouteContribution();
    contribution.setFromLocationName(extractedSource);
    contribution.setToLocationName(extractedDest);
    // ... save ...
    
    return ResponseEntity.ok(contribution);
}
```

### Step 3: Admin Approves & Integrates

```
Admin Panel → Pending Image Contributions
    ↓
Admin reviews extracted data
    ↓
Clicks "Approve" → Integration runs
    ↓
Route integrated into search database
```

### Step 4: Terminal Resolution Activates

```
User searches "Chennai → Madurai"
    ↓
SearchResults component loads with buses
    ↓
useTerminalResolution hook queries:
  GET /api/v1/terminals/resolve?source=Chennai&destination=Madurai
    ↓
Backend checks:
  - Does route need terminal info?
  - Which terminal in Chennai?
  - Different from searched location?
    ↓
Returns TerminalResolutionResponse
    ↓
TerminalInfoAlert displays to user
```

## Terminal Resolution Scenarios

### Scenario A: Direct Match (No Alert Needed)
```
User searches: "Chennai Central → Madurai"
Backend finds: "Chennai Central → Madurai"
Result: {
  needsTerminalInfo: false,
  message: "Direct route available"
}
→ No alert shown
```

### Scenario B: Terminal Difference
```
User searches: "Chennai → Madurai"
Backend resolves: "Chennai CMBT (Main Bus Stand) → Madurai Aravind Bus Stand"
Result: {
  needsTerminalInfo: true,
  terminal: {
    displayName: "Chennai CMBT (Main Bus Stand)",
    address: "Chennai Central Bus Terminus",
    latitude: 13.0827,
    longitude: 80.2708,
    message: "Buses from this route depart from Chennai CMBT, not other terminals"
  }
}
→ TerminalInfoAlert displayed
```

### Scenario C: Missing Terminal Data
```
User uploads image but OCR fails to extract clear location
Result: {
  needsTerminalInfo: false,
  message: "Insufficient data for terminal resolution"
}
→ No alert shown (data insufficient)
```

## Integration Points

### 1. Contribution Form Pre-population
**File**: `RouteContribution.tsx`

```tsx
const preSelectedFromLocation = navigationState?.fromLocation;
const preSelectedToLocation = navigationState?.toLocation;

// Pass to ImageContributionUpload
<ImageContributionUpload
  preSelectedFrom={preSelectedFromLocation?.name}
  preSelectedTo={preSelectedToLocation?.name}
/>
```

### 2. Terminal Info in Search Results
**File**: `SearchResults.tsx` (Already Implemented ✅)

```tsx
const { data: terminalInfo } = useTerminalResolution(
  fromLocation.name,
  toLocation.name,
  buses.length > 0
);

{terminalInfo?.needsTerminalInfo && terminalInfo.terminal && (
  <TerminalInfoAlert terminal={terminalInfo.terminal} />
)}
```

### 3. Backend Endpoint
**File**: `TerminalController.java`

```java
@GetMapping("/resolve")
public ResponseEntity<Map<String, Object>> resolveTerminal(
    @RequestParam String source,
    @RequestParam String destination
) {
    TerminalResolutionResult result = 
        terminalResolutionService.resolveTerminal(source, destination);
    
    Map<String, Object> response = new HashMap<>();
    response.put("originalSource", result.getOriginalSource());
    response.put("destination", result.getDestination());
    response.put("needsTerminalInfo", result.isNeedsTerminalInfo());
    
    if (result.isNeedsTerminalInfo()) {
        response.put("terminal", result.getTerminal());
    }
    
    return ResponseEntity.ok(response);
}
```

## Benefits for Image Contributors

| Benefit | Description |
|---------|-------------|
| **Validation** | When uploading an image, see if extracted terminal matches expected location |
| **Confidence** | Know exactly where their contributed route buses operate from |
| **Quality** | Helps catch OCR errors (e.g., "Chennai" extracted but terminal is actually in different city) |
| **Learning** | Users understand the bus terminal system better |

## Benefits for Search Users

| Benefit | Description |
|---------|-------------|
| **Clarity** | Know exact boarding terminal even if they just searched "Chennai" |
| **Accuracy** | Avoid going to wrong bus stand/terminal |
| **Planning** | Can plan arrival time to correct terminal |
| **Confidence** | Trust the route information came from user-contributed images |

## Recommended Enhancement

To further improve the image contribution flow, add terminal validation:

```tsx
// ImageContributionUpload.tsx - Enhanced Version

const [extractedFrom, setExtractedFrom] = useState('');
const [extractedTo, setExtractedTo] = useState('');

// Check terminal AFTER image extraction
const { data: terminalInfo } = useTerminalResolution(
  extractedFrom,
  extractedTo,
  extractedFrom.length > 0 && extractedTo.length > 0
);

// Show validation suggestion
{terminalInfo?.needsTerminalInfo && (
  <div className="terminal-validation-hint">
    <Info />
    <p>
      The route you've contributed departs from{' '}
      <strong>{terminalInfo.terminal.displayName}</strong>
    </p>
    <p className="text-sm text-gray-600">
      Make sure your image shows this terminal location
    </p>
  </div>
)}

// Warn if terminal is too different
{terminalInfo?.terminal && isDifferentCity(extractedTo, terminalInfo.terminal) && (
  <div className="warning-alert">
    <AlertTriangle />
    <p>
      Warning: The extracted destination seems different from the 
      terminal location. Please review your image.
    </p>
  </div>
)}
```

## Summary

The terminal integration for image contributions works as follows:

1. **User contributes image** with route info
2. **Image is extracted** by backend OCR
3. **Admin approves** and integrates into database
4. **Future users search** for that route
5. **Terminal resolution activates** and displays correct terminal
6. **Users know exactly** where to catch the bus

This creates a complete feedback loop where image contributions directly improve the search experience for all users through accurate terminal information.
