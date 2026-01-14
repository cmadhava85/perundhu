# Terminal Integration: Admin Approval Workflow

## Overview

When an admin approves an image contribution, they must validate and manage terminal information to ensure accurate bus route data. This guide explains the complete approval workflow including terminal handling.

## Admin Approval Workflow

### Step 1: Review Image Contribution

**Location**: Admin Dashboard → Images Tab

```
Admin Panel
    ↓
Pending Image List
    ├─ Image 1 (Status: PROCESSING)
    ├─ Image 2 (Status: PROCESSED - Manual Review Needed)
    └─ Image 3 (Status: LOW_CONFIDENCE_OCR)
    ↓
Admin clicks "View Details"
```

### Step 2: Extract OCR Data

**File**: `ImageContributionAdminPanel.tsx`

```tsx
const handleExtractOCR = async (contributionId: string) => {
  try {
    setExtractingOCRId(contributionId);
    
    // Backend extracts: bus number, from, to, times, stops
    const response = await fetch(
      `/api/admin/contributions/images/${contributionId}/ocr`,
      { headers: { 'Authorization': AdminService.getAuthHeader() } }
    );
    
    const data = await response.json();
    
    // OCR Data extracted:
    // {
    //   busNumber: "166UD",
    //   origin: "Chennai",           ← Will be used for terminal resolution
    //   destination: "Madurai",      ← Will be used for terminal resolution
    //   departureTimes: ["08:00", "10:00"],
    //   arrivalTimes: ["12:00", "14:00"],
    //   stops: ["Chennai CMBT", "Kanchipuram", "Madurai"]
    // }
    
    setOcrData(data);
    setShowOCRModal(true);
  } catch (error) {
    alert('Failed to extract OCR data');
  }
};
```

### Step 3: Validate & Edit Extracted Data

**What Admin Must Check:**

```tsx
// Admin sees extracted data like:
const extractedRoute = {
  fromLocation: "Chennai",          // ← Check this
  toLocation: "Madurai",            // ← Check this
  departureTime: "08:00",
  arrivalTime: "12:00",
  stops: ["Kanchipuram", "Arani"]   // ← Intermediate stops
};

// Admin can edit before approval:
const editRoute = () => {
  enterEditMode();
  // Now can modify:
  updateRoute(0, 'fromLocation', 'Chennai CMBT');    // More specific location
  updateRoute(0, 'toLocation', 'Madurai ARAVIND');   // Corrected terminal name
  updateRoute(0, 'departureTime', '08:30');          // Corrected time
  saveCorrections();  // Saves to backend
};
```

### Step 4: Terminal Resolution Check

**New Enhancement: Admin Should Validate Terminal Before Approval**

```tsx
// During approval workflow, check terminal resolution
const handleApproveWithTerminalValidation = async (contributionId: string) => {
  // Get the from/to locations from extracted data
  const fromLocation = ocrData?.origin || editedRoutes[0]?.fromLocation;
  const toLocation = ocrData?.destination || editedRoutes[0]?.toLocation;
  
  // Resolve terminal BEFORE approving
  const terminalResponse = await fetch(
    `/api/v1/terminals/resolve?source=${fromLocation}&destination=${toLocation}`
  );
  
  const terminalInfo = await terminalResponse.json();
  
  // Display terminal info to admin for validation
  if (terminalInfo.needsTerminalInfo) {
    showTerminalValidationDialog({
      original: fromLocation,
      resolved: terminalInfo.terminal.displayName,
      address: terminalInfo.terminal.address,
      message: "Please verify this is the correct boarding terminal"
    });
  }
};
```

## Complete Approval Workflow Diagram

```
┌─────────────────────────────────────────────┐
│ 1. ADMIN RECEIVES PENDING IMAGE             │
│    Status: PROCESSING / MANUAL_REVIEW_NEEDED│
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. ADMIN CLICKS "EXTRACT OCR"               │
│    Backend extracts:                        │
│    - Bus Number: "166UD"                    │
│    - From: "Chennai" ← Terminal Key         │
│    - To: "Madurai" ← Terminal Key           │
│    - Times: ["08:00", "10:00"]              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. ADMIN REVIEWS OCR DATA                   │
│    - View extracted route info              │
│    - Check for OCR errors                   │
│    - Verify from/to locations               │
│    - Check departure/arrival times          │
└─────────────────────────────────────────────┘
                    ↓
        ┌─────────────┬──────────────┐
        ↓             ↓              ↓
    ✓ Correct    ✗ Has Errors   ? Unsure
        │             │              │
        │         Edit Routes    Manual Entry
        │             │              │
        └─────────────┴──────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. VALIDATE TERMINAL RESOLUTION             │
│    Query: /api/v1/terminals/resolve         │
│    Params: source="Chennai" dest="Madurai"  │
│    Returns:                                 │
│    {                                        │
│      originalSource: "Chennai",             │
│      terminal: {                            │
│        displayName: "Chennai CMBT",         │
│        address: "Chennai Central Bus Stand" │
│      }                                      │
│    }                                        │
│                                             │
│    Admin confirms: "This is correct ✓"      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 5. CHECK MANDATORY FIELDS                   │
│    ✓ From Location: Filled                  │
│    ✓ To Location: Filled                    │
│    ✓ Departure Time: Present                │
│    ✓ Route is valid                         │
│                                             │
│    If Missing Times:                        │
│    → Show "Time Edit Popup"                 │
│    → Admin enters: "08:00 - 12:00"          │
│    → Save and continue                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 6. APPROVE CONTRIBUTION                     │
│    POST /api/admin/contributions/images/    │
│         {id}/approve                        │
│                                             │
│    Body: {                                  │
│      extractOCRData: true,                  │
│      terminalValidated: true,               │
│      adminNotes: "Verified terminal loc"    │
│    }                                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 7. ROUTE INTEGRATION                        │
│    Backend creates RouteContribution        │
│    {                                        │
│      fromLocationName: "Chennai",           │
│      toLocationName: "Madurai",             │
│      busNumber: "166UD",                    │
│      departureTime: "08:00",                │
│      status: "APPROVED"                     │
│    }                                        │
│                                             │
│    Image Status: APPROVED ✓                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 8. TERMINAL INFO AVAILABLE TO USERS         │
│    User searches: "Chennai → Madurai"       │
│    ↓                                        │
│    Terminal Resolution Activates:           │
│    GET /api/v1/terminals/resolve            │
│    ↓                                        │
│    Shows: "Buses depart from Chennai CMBT"  │
│    [View on Map button]                     │
└─────────────────────────────────────────────┘
```

## Code Implementation: Terminal Validation During Approval

### Option 1: Add Terminal Validation Step

**Enhance ImageContributionAdminPanel.tsx**:

```tsx
interface TerminalValidationState {
  showDialog: boolean;
  originalLocation: string;
  resolvedTerminal: {
    displayName: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  isValidated: boolean;
}

const [terminalValidation, setTerminalValidation] = useState<TerminalValidationState | null>(null);

const validateTerminalBeforeApproval = async (fromLoc: string, toLoc: string) => {
  const response = await fetch(
    `/api/v1/terminals/resolve?source=${fromLoc}&destination=${toLoc}`
  );
  const terminalInfo = await response.json();
  
  if (terminalInfo.needsTerminalInfo) {
    setTerminalValidation({
      showDialog: true,
      originalLocation: fromLoc,
      resolvedTerminal: terminalInfo.terminal,
      isValidated: false
    });
  }
};

// In approval handler:
const handleApproveWithTerminalValidation = async (contributionId: string) => {
  const fromLoc = ocrData?.origin || editedRoutes[0]?.fromLocation;
  const toLoc = ocrData?.destination || editedRoutes[0]?.toLocation;
  
  // Check terminal first
  await validateTerminalBeforeApproval(fromLoc, toLoc);
  
  // Only proceed if validated
  if (terminalValidation?.isValidated || !terminalValidation) {
    await approveContribution(contributionId, true);
  }
};
```

### Option 2: Display Terminal Info in Approval Modal

```tsx
// In OCR Modal display section:
{ocrData && (
  <div className="ocr-modal-content">
    <h3>OCR Extracted Data</h3>
    
    <div className="route-info">
      <p><strong>From:</strong> {ocrData.origin}</p>
      <p><strong>To:</strong> {ocrData.destination}</p>
      <p><strong>Departure:</strong> {ocrData.departureTime}</p>
    </div>
    
    {/* NEW: Terminal Information Section */}
    <div className="terminal-info-section">
      <h4>Terminal Information</h4>
      {terminalInfo && terminalInfo.needsTerminalInfo ? (
        <div className="terminal-alert">
          <p>
            <strong>⚠️ Terminal Info:</strong> Buses on this route operate from{' '}
            <strong>{terminalInfo.terminal.displayName}</strong>
          </p>
          <p className="text-sm">{terminalInfo.terminal.address}</p>
          <button 
            className="btn-secondary"
            onClick={() => window.open(
              `https://www.google.com/maps?q=${terminalInfo.terminal.latitude},${terminalInfo.terminal.longitude}`,
              '_blank'
            )}
          >
            View on Map
          </button>
          <label>
            <input 
              type="checkbox"
              checked={terminalValidation?.isValidated || false}
              onChange={(e) => setTerminalValidation(prev => prev ? {
                ...prev,
                isValidated: e.target.checked
              } : null)}
            />
            I have verified this terminal information is correct
          </label>
        </div>
      ) : (
        <p className="text-gray-600">No specific terminal information for this route</p>
      )}
    </div>
    
    {/* Edit and Approve Buttons */}
    <div className="approval-buttons">
      <button onClick={() => enterEditMode()}>Edit Route</button>
      <button 
        onClick={() => handleApproveWithTerminalValidation(selectedContribution.id)}
        disabled={terminalValidation && !terminalValidation.isValidated}
      >
        Approve
      </button>
      <button onClick={() => rejectContribution(selectedContribution.id)}>
        Reject
      </button>
    </div>
  </div>
)}
```

## Admin Checklist for Image Approval

| Step | Action | Check | Result |
|------|--------|-------|--------|
| 1 | View image | Can image be read? | Continue or Reject |
| 2 | Extract OCR | Data extracted correctly? | Valid or Edit |
| 3 | Validate From/To | Locations correct? | Accept or Edit |
| 4 | Check Times | Times reasonable? | Accept or Edit |
| 5 | **Resolve Terminal** | **Terminal validated?** | **Accept or Question** |
| 6 | Verify Stops | Intermediate stops correct? | Accept or Edit |
| 7 | Approve | All checks pass? | Submit |

## Benefits of Terminal Validation During Approval

| Benefit | Description |
|---------|-------------|
| **Data Quality** | Ensures terminal info is correct before it reaches users |
| **User Safety** | Prevents users from going to wrong bus stand |
| **Admin Control** | Admins have last chance to catch errors |
| **Audit Trail** | Terminal validation is logged with approval |
| **Consistency** | All approved routes have validated terminal info |

## Error Scenarios & Resolution

### Scenario 1: OCR Extracted "Chennai" but Terminal is Actually in Suburbs

```
Admin sees:
  From: "Chennai"
  Terminal resolved to: "Chennai Suburban Bus Stand"
  
Admin action:
  → Edit route: Change from "Chennai Suburban" (more specific)
  → Validate: Check that this matches image
  → Approve: Proceed with corrected location
```

### Scenario 2: Terminal Resolution Fails (Backend Down)

```
System shows:
  "Unable to resolve terminal information"
  
Admin options:
  1. Delay approval until service available
  2. Approve without validation (with warning logged)
  3. Manually verify terminal from image
```

### Scenario 3: Multiple Terminals in From Location

```
Admin sees:
  From: "Chennai" 
  Terminal could be: CMBT, Moffusil, Koyambedu
  
Admin action:
  → Check image for bus stand signage
  → Edit route to specific terminal name
  → Terminal resolution will pick correct one
  → Approve with specific location
```

## Summary

**Admin Approval with Terminal Integration:**

1. **Extract** OCR data from image
2. **Edit** if needed (from, to, times)
3. **Validate** terminal resolution matches image
4. **Approve** with confirmed terminal info
5. **Route** becomes searchable with terminal info
6. **Users** see correct boarding terminal

This ensures every approved image contribution results in accurate terminal information for end users.
