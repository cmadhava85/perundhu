# Route Validation Alerts - Admin API Quick Reference

## Overview
REST API for managing route validation alerts. All endpoints require ADMIN role and Bearer token authentication.

## Base URL
```
GET/POST /api/v1/admin/validation-alerts
```

## Endpoints

### 1. Get Pending Alerts (Paginated)
```http
GET /api/v1/admin/validation-alerts/pending?page=0&size=20&sort=confidenceScore,desc
```

**Response:**
```json
{
  "content": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "contributionId": "550e8400-e29b-41d4-a716-446655440001",
      "validationType": "JOURNEY_DURATION",
      "confidenceScore": 95,
      "expectedRange": "6-8 hours",
      "actualValue": "3 hours",
      "issueDescription": "Journey time 150% faster than realistic for this route",
      "status": "PENDING",
      "createdAt": "2024-01-15T10:30:00Z",
      "reviewedAt": null,
      "reviewedBy": null
    }
  ],
  "totalElements": 45,
  "totalPages": 3,
  "currentPage": 0
}
```

---

### 2. Get High-Confidence Alerts
```http
GET /api/v1/admin/validation-alerts/high-confidence
```
Returns alerts with confidence score > 75 (most likely to be real issues).

---

### 3. Get Alerts for Specific Contribution
```http
GET /api/v1/admin/validation-alerts/contribution/{contributionId}
```

**Example:**
```http
GET /api/v1/admin/validation-alerts/contribution/550e8400-e29b-41d4-a716-446655440001
```

---

### 4. Get Alerts by Validation Type
```http
GET /api/v1/admin/validation-alerts/by-type/{validationType}
```

**Valid types:** `JOURNEY_DURATION`, `STOP_SEQUENCE`, `SEGMENT_SPEED`

**Example:**
```http
GET /api/v1/admin/validation-alerts/by-type/JOURNEY_DURATION
```

---

### 5. Get Recent Alerts
```http
GET /api/v1/admin/validation-alerts/recent?hoursAgo=24
```

Returns alerts created in the last N hours.

---

### 6. Approve Alert
```http
POST /api/v1/admin/validation-alerts/{alertId}/approve
Content-Type: application/json

{
  "notes": "User confirmed - bus was traveling faster on highway"
}
```

**Response:** Updated alert with status = "APPROVED"

---

### 7. Dismiss Alert (False Positive)
```http
POST /api/v1/admin/validation-alerts/{alertId}/dismiss
Content-Type: application/json

{
  "reason": "This is a common route with predictable timing"
}
```

**Response:** Updated alert with status = "DISMISSED"

---

### 8. Reject Alert (Invalid Contribution)
```http
POST /api/v1/admin/validation-alerts/{alertId}/reject
Content-Type: application/json

{
  "reason": "Impossible travel time for distance"
}
```

**Response:** Updated alert with status = "REJECTED"

---

### 9. Escalate Alert
```http
POST /api/v1/admin/validation-alerts/{alertId}/escalate
Content-Type: application/json

{
  "reason": "Needs further investigation - unusual route pattern"
}
```

**Response:** Updated alert with status = "ESCALATED"

---

### 10. Get Dashboard Statistics
```http
GET /api/v1/admin/validation-alerts/stats
```

**Response:**
```json
{
  "pendingCount": 45,
  "approvedCount": 120,
  "dismissedCount": 30,
  "rejectedCount": 15,
  "alertsLast24h": 12,
  "highConfidenceCount": 8,
  "falsePositiveRate": 20.0
}
```

---

### 11. Get Statistics by Validation Type
```http
GET /api/v1/admin/validation-alerts/stats/by-type
```

**Response:**
```json
[
  {
    "type": "JOURNEY_DURATION",
    "avgConfidence": 78.5,
    "count": 120
  },
  {
    "type": "STOP_SEQUENCE",
    "avgConfidence": 65.2,
    "count": 45
  },
  {
    "type": "SEGMENT_SPEED",
    "avgConfidence": 82.1,
    "count": 30
  }
]
```

---

### 12. Check for Pending Alerts on Contribution
```http
GET /api/v1/admin/validation-alerts/contribution/{contributionId}/has-pending
```

**Response:** `true` or `false`

---

### 13. Get Latest Alert for Contribution
```http
GET /api/v1/admin/validation-alerts/contribution/{contributionId}/latest
```

Returns most recent alert, useful for quick status check.

---

## Common Workflows

### Workflow 1: Review Daily Queue
```bash
# Get pending alerts from last 24 hours
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.perundhu.local/api/v1/admin/validation-alerts/recent?hoursAgo=24"

# Get high-confidence ones first
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.perundhu.local/api/v1/admin/validation-alerts/high-confidence"

# Review each one and approve/dismiss/reject
```

### Workflow 2: Analyze Data Quality Trends
```bash
# Get statistics by type
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.perundhu.local/api/v1/admin/validation-alerts/stats/by-type"

# If false positive rate is high (> 30%), validation thresholds are too strict
# If too many false positives, adjust DURATION_TOLERANCE in GraphHopperRoutingAdapter
```

### Workflow 3: Investigate Specific Route
```bash
# Get all alerts for a contribution
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.perundhu.local/api/v1/admin/validation-alerts/contribution/{id}"

# If multiple alerts of different types, contribution is likely invalid
# If single low-confidence alert, might be legitimate edge case
```

## Status Definitions

| Status | Meaning | Action |
|--------|---------|--------|
| **PENDING** | Awaiting admin review | Review and take action |
| **APPROVED** | Contribution is valid despite flag | Data is trusted |
| **DISMISSED** | False positive, route is valid | Threshold too strict? |
| **REJECTED** | Contribution should not be approved | User provided bad data |
| **ESCALATED** | Needs further investigation | Ticket/follow-up needed |

## Validation Types

| Type | What It Checks | Example Alert |
|------|---|---|
| **JOURNEY_DURATION** | Is travel time realistic? | "Journey 3 hours faster than expected" |
| **STOP_SEQUENCE** | Are stops in logical order? | "2 stops significantly off-route" |
| **SEGMENT_SPEED** | Are speeds achievable? | "150 km/h max - impossible for bus" |

## Confidence Score Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| 90-100 | Certain issue/valid | Act confidently |
| 75-89 | Likely issue/valid | Probably correct |
| 65-74 | Possible issue/valid | Review carefully |
| 50-64 | Uncertain | Consider context |
| < 50 | Probably valid despite flag | Likely false positive |

## Error Responses

```json
{
  "error": "NOT_FOUND",
  "message": "Alert not found: 550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

## Rate Limits
- No specific rate limiting (adjust as needed)
- Alerts are created asynchronously (non-blocking)
- Admin dashboard queries are cached (5 minute TTL)

## Authentication
Include Bearer token in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Examples (cURL)

### Get pending alerts
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/admin/validation-alerts/pending?page=0&size=10"
```

### Approve an alert
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "User confirmed timing"}' \
  "http://localhost:8080/api/v1/admin/validation-alerts/{alertId}/approve"
```

### Get statistics
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/admin/validation-alerts/stats"
```
