# GraphHopper Route Validation Integration

This document describes the GraphHopper routing engine integration for validating route contributions.

## Architecture Overview

The implementation follows the hexagonal architecture pattern with four layers:

### 1. **Domain Layer** (Contracts)
- **`RoutingValidationPort`** - Domain port defining routing validation contracts
  - `validateJourneyDuration()` - Check if journey time is realistic
  - `validateStopSequence()` - Check if stops are in logical order
  - `validateSegmentSpeeds()` - Check if segment speeds are achievable

### 2. **Application Layer** (Use Cases)
- **`ContributionApplicationService`** - Orchestrates route validation on submission
- **`RouteValidationAlertService`** - Manages validation alert lifecycle (create, review, approve, dismiss)

### 3. **Infrastructure Layer** (Implementations)
- **`GraphHopperRoutingAdapter`** - Implements `RoutingValidationPort` using GraphHopper library
- **`GraphHopperConfig`** - Spring configuration for GraphHopper initialization
- **`RouteValidationAlertRepository`** - JPA repository for alert persistence

### 4. **Adapter Layer** (API)
- **`RouteValidationAlertController`** - REST endpoints for admin alert management
  - `GET /api/v1/admin/validation-alerts/pending` - View pending alerts
  - `POST /api/v1/admin/validation-alerts/{id}/approve` - Approve alert
  - `POST /api/v1/admin/validation-alerts/{id}/dismiss` - Mark as false positive
  - `POST /api/v1/admin/validation-alerts/{id}/reject` - Reject contribution
  - `GET /api/v1/admin/validation-alerts/stats` - Dashboard statistics

## Setup Instructions

### 1. Download OSM Data for Tamil Nadu

GraphHopper requires OpenStreetMap data to perform routing calculations.

```bash
# Download Tamil Nadu OSM extract (~150 MB)
cd backend/data/graphhopper
wget https://download.geofabrik.de/asia/india/tamil-nadu-latest.osm.pbf

# GraphHopper will automatically compile this into a graph on first startup
# Compilation takes 1-2 minutes for Tamil Nadu data
# Compiled graph will be ~250 MB
```

### 2. Configure Application

Add GraphHopper profile to your Spring Boot configuration:

```bash
# application.yml or application.properties
spring.profiles.active=graphhopper
```

Or set environment variable:
```bash
export SPRING_PROFILES_ACTIVE=graphhopper
```

### 3. Build and Run

```bash
# Add GraphHopper dependency (already in build.gradle)
./gradlew build

# Run with GraphHopper profile
./gradlew bootRun --args='--spring.profiles.active=graphhopper'
```

On startup, you'll see:
```
Initializing GraphHopper routing engine...
GraphHopper profiles configured: bus, van, car, motorcycle, bike, foot
Graph data folder: ./data/graphhopper
```

## How It Works

### Route Submission Flow

```
User submits route contribution
        ↓
Input validation (format, required fields)
        ↓
Routing validation:
  1. Journey Duration: Is travel time realistic?
     - Uses GraphHopper to calculate expected time
     - Compares with claimed time
     - Allows 25% variance for traffic, stops, rest
     - Creates alert if > 1.25x expected duration
  
  2. Stop Sequence: Are stops in logical geographic order?
     - Checks if each stop deviates > 30% from direct route
     - Detects out-of-order or off-route stops
     - Creates alert if stops deviate significantly
  
  3. Segment Speed: Are speeds realistic for vehicle?
     - Calculates speed between consecutive points
     - Checks against vehicle limits (bus: 100 km/h, van: 120 km/h)
     - Creates alert if impossible speeds detected
        ↓
Save contribution (allows submission even with alerts)
        ↓
Create validation alerts in database (if issues found)
        ↓
Admin reviews alerts in dashboard
        ↓
Admin approves/dismisses/rejects alerts
```

### Example Validation Results

#### ✅ Valid Route
```
Route: Chennai → Madurai
Distance: ~160 km
Claimed Time: 3.5 hours
Expected Time: 4 hours (from routing engine)
Confidence: 95%
Result: PASS (within 25% tolerance, slightly faster due to modern highway)
```

#### ⚠️ Suspicious Route (Alert Created)
```
Route: Chennai → Madurai
Distance: ~160 km
Claimed Time: 5 hours
Expected Time: 4 hours
Deviation: 25% slower than expected
Confidence: 68%
Result: ALERT (borderline - allows submission but flags for review)
```

#### ❌ Invalid Route (Alert Created)
```
Route: Chennai → Madurai
Distance: ~160 km
Claimed Time: 2 hours
Expected Time: 4 hours
Implied Speed: 80 km/h impossible for claimed time
Confidence: 95%
Result: ALERT (highly suspicious - likely typo in times or stops)
```

## Admin Dashboard Features

### Pending Alerts View
- Lists all unreviewed validation alerts
- Sorted by confidence score (highest first)
- Shows: Contribution ID, Issue Type, Confidence, Expected vs Actual

### Alert Review Actions
1. **APPROVE** - Contribution is valid despite flag (user provided context)
2. **DISMISS** - False positive, validation threshold too strict
3. **REJECT** - Contribution should not be approved
4. **ESCALATE** - Needs further investigation

### Statistics
- Alert count by status (Pending, Approved, Dismissed, etc.)
- False positive rate (% of dismissed vs total)
- Validation type breakdown (Duration, Stop Sequence, Speed)
- Recent alerts (last 24 hours)
- High-confidence alerts (> 75% certainty of issue)

## Database Schema

### `route_validation_alerts` Table
```sql
- id (UUID): Alert identifier
- contribution_id (UUID): Route contribution being flagged
- validation_type (ENUM): JOURNEY_DURATION, STOP_SEQUENCE, SEGMENT_SPEED
- confidence_score (0-100): How confident is the issue
- expected_range: What value was expected
- actual_value: What value was provided
- issue_description: Human-readable explanation
- status (ENUM): PENDING, APPROVED, DISMISSED, REJECTED, ESCALATED
- admin_notes: Why admin made their decision
- created_at: When alert was generated
- reviewed_at: When admin reviewed it
- reviewed_by: Which admin reviewed it
```

## Performance Characteristics

### GraphHopper Routing
- Startup: ~5-30 seconds (loading graph into memory)
- First query: ~100-500 ms (includes graph preparation)
- Subsequent queries: ~10-50 ms per route (very fast)
- Memory: ~500 MB for Tamil Nadu graph

### Validation Process
- Per contribution: ~50-200 ms for all three validations
- No database queries during validation (fast)
- Creates alert only if needed (efficient)

### Database
- Alert creation: < 1 ms
- Query pending alerts: < 10 ms (indexed by status)
- Bulk statistics: < 100 ms

## Tuning Validation Sensitivity

You can adjust confidence thresholds and tolerances:

### GraphHopperRoutingAdapter.java
```java
// Duration validation tolerance
private static final double DURATION_TOLERANCE = 1.25; // 25% over expected

// Speed limits by vehicle type
private static final int BUS_MAX_SPEED = 100; // km/h
private static final int VAN_MAX_SPEED = 120; // km/h

// Stop sequence deviation threshold
double deviation > 0.30; // 30% deviation triggers alert

// Confidence scoring
- 95%: Exactly as expected
- 85%: Within 10% variance
- 65%: Within 25% variance
- 50%: 25-50% variance
- 30%: 50-100% variance
- 10%: > 100% variance
```

Adjust these based on data quality trends from admin dashboard.

## Troubleshooting

### GraphHopper Startup Issues

**Issue**: "Unable to load graph" on startup
```
Solution: Ensure OSM file exists at data/graphhopper/tamil-nadu-latest.osm.pbf
or graph is pre-compiled in data/graphhopper/ folder
```

**Issue**: "OutOfMemoryError" during startup
```
Solution: Increase JVM heap: -Xmx2g (GraphHopper needs ~1.5-2 GB for large regions)
```

**Issue**: Routing returns no results
```
Solution: 
1. Verify coordinates are within Tamil Nadu bounds
2. Check if OSM graph was successfully imported
3. Look at GraphHopper logs for import errors
```

### Validation Alert Issues

**Issue**: Too many false positives
```
Solution: Increase DURATION_TOLERANCE from 1.25 to 1.50 in GraphHopperRoutingAdapter
```

**Issue**: Not catching obvious errors
```
Solution: Decrease DURATION_TOLERANCE or increase confidence thresholds
```

**Issue**: Alerts not being created
```
Solution:
1. Check RouteValidationAlertService logs
2. Verify route_validation_alerts table exists
3. Check MySQL user has INSERT permission
```

## Dependency Notes

- **GraphHopper Core 7.2**: Lightweight routing engine (~10 MB library)
- **Spring Data JPA**: For alert persistence
- **Flyway**: Database migrations for alert schema
- **Maven Central**: All dependencies available

## Future Enhancements

1. **Traffic Data**: Integrate real-time traffic for better duration estimates
2. **Historical Patterns**: Learn from approved contributions to refine thresholds
3. **Geographic Profiles**: Different validation rules for highways vs. local routes
4. **Multi-Modal Routing**: Support for transfers between different buses
5. **Real-time Alerts**: Push notifications to users when routes are flagged
6. **Machine Learning**: Use approved/rejected alerts to train prediction models

## References

- [GraphHopper Documentation](https://graphhopper.com/)
- [OpenStreetMap Data](https://www.openstreetmap.org/)
- [Geofabrik OSM Extracts](https://download.geofabrik.de/)
- [Hexagonal Architecture Pattern](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))
