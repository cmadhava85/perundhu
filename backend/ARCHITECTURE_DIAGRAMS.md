# GraphHopper Integration - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  - Route contribution form                                      │
│  - Admin validation alerts dashboard                            │
│  - Statistics visualization                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                  INBOUND ADAPTERS (REST)                        │
├─────────────────────────────────────────────────────────────────┤
│ ContributionController                                          │
│  POST /api/v1/contributions/routes                              │
│  POST /api/v1/contributions/image                               │
│                                                                 │
│ RouteValidationAlertController (NEW)                            │
│  GET  /api/v1/admin/validation-alerts/pending                  │
│  POST /api/v1/admin/validation-alerts/{id}/approve             │
│  POST /api/v1/admin/validation-alerts/{id}/dismiss             │
│  GET  /api/v1/admin/validation-alerts/stats                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Dependency Injection
                     │
┌────────────────────▼────────────────────────────────────────────┐
│              APPLICATION SERVICE LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│ ContributionApplicationService                                  │
│  implements ContributionInputPort                               │
│                                                                 │
│  submitRouteContribution()                                      │
│    1. InputValidationPort.validateContributionData()            │
│    2. performRoutingValidation() (NEW)                          │
│       ├─ routingValidationPort.validateJourneyDuration()       │
│       ├─ routingValidationPort.validateStopSequence()          │
│       └─ routingValidationPort.validateSegmentSpeeds()         │
│    3. routeContributionOutputPort.save()                        │
│    4. Create alerts if validation failed                        │
│                                                                 │
│ RouteValidationAlertService (NEW)                               │
│  - Create alerts from validation results                        │
│  - Query alerts (pending, by type, etc.)                        │
│  - Approve/dismiss/reject alerts                                │
│  - Generate statistics                                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ Uses ports/interfaces
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌─────────┐ ┌──────────┐ ┌────────────┐
   │ Input   │ │ Routing  │ │ Route      │
   │ Valid.  │ │ Valid.   │ │ Contrib.   │
   │ Port    │ │ Port     │ │ Output     │
   │         │ │ (NEW)    │ │ Port       │
   └────┬────┘ └────┬─────┘ └─────┬──────┘
        │           │            │
        │           │ Interface  │
        │           │            │
        │    ┌──────▼──────┐     │
        │    │   DOMAIN    │     │
        │    │   CONTRACTS │     │
        │    │ (Ports only)│     │
        │    └──────┬──────┘     │
        │           │            │
        │    ┌──────▼──────────────┐
        │    │ ContributionInputPort│
        │    │ (implemented by app  │
        │    │  service)           │
        │    └─────────────────────┘
        │
        └────────────────────────┐
                                 │
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│         INFRASTRUCTURE ADAPTER LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ GraphHopperRoutingAdapter (NEW)                                │
│  implements RoutingValidationPort                              │
│                                                                 │
│  ├─ validateJourneyDuration()                                  │
│  │   ├─ graphHopper.route() → ResponsePath                    │
│  │   ├─ Calculate expected duration                            │
│  │   ├─ Compare with actual                                    │
│  │   └─ Return RouteValidationResult                           │
│  │                                                              │
│  ├─ validateStopSequence()                                     │
│  │   ├─ haversineDistance() for each segment                  │
│  │   ├─ Check deviation from direct route                     │
│  │   └─ Return RouteValidationResult                           │
│  │                                                              │
│  └─ validateSegmentSpeeds()                                    │
│      ├─ Calculate km/h for each segment                        │
│      ├─ Compare with vehicle limits                            │
│      └─ Return RouteValidationResult                           │
│                                                                 │
│ GraphHopperConfig (NEW)                                        │
│  - Create GraphHopper bean                                     │
│  - Load OSM graph from data/graphhopper/                       │
│  - Configure vehicle profiles (bus, car, etc.)                 │
│  - Enable Contraction Hierarchies                              │
│                                                                 │
│ RouteValidationAlertRepository (NEW)                            │
│  extends JpaRepository<RouteValidationAlertJpaEntity>          │
│  - findByStatus()                                               │
│  - findByContributionId()                                       │
│  - findHighConfidenceAlerts()                                   │
│  - getStatisticsByValidationType()                              │
│  - etc. (20+ custom queries)                                   │
│                                                                 │
│ Other Adapters (existing)                                       │
│  - InputValidationPort impl                                     │
│  - RouteContributionOutputPort impl (JPA)                       │
│  - ImageContributionOutputPort impl (JPA)                       │
│  - SecurityMonitoringPort impl                                  │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ JPA/JDBC
                     │
┌────────────────────▼────────────────────────────────────────────┐
│              PERSISTENCE LAYER (Database)                      │
├─────────────────────────────────────────────────────────────────┤
│ MySQL Database: perundhu                                       │
│                                                                 │
│ route_validation_alerts (NEW)                                  │
│  ├─ id (UUID)                                                   │
│  ├─ contribution_id (UUID) → FK to route_contributions         │
│  ├─ validation_type (ENUM)                                      │
│  │   ├─ JOURNEY_DURATION                                        │
│  │   ├─ STOP_SEQUENCE                                           │
│  │   └─ SEGMENT_SPEED                                           │
│  ├─ confidence_score (0-100)                                    │
│  ├─ expected_range (VARCHAR)                                    │
│  ├─ actual_value (VARCHAR)                                      │
│  ├─ issue_description (TEXT)                                    │
│  ├─ status (ENUM)                                               │
│  │   ├─ PENDING                                                 │
│  │   ├─ APPROVED                                                │
│  │   ├─ DISMISSED                                               │
│  │   ├─ REJECTED                                                │
│  │   └─ ESCALATED                                               │
│  ├─ admin_notes (TEXT)                                          │
│  ├─ created_at (TIMESTAMP)                                      │
│  ├─ reviewed_at (TIMESTAMP)                                     │
│  ├─ reviewed_by (VARCHAR)                                       │
│  └─ Indexes: status, contribution_id, confidence_score         │
│                                                                 │
│ route_contributions (existing)                                 │
│  - id, bus_number, from_location, to_location, etc.           │
│                                                                 │
│ [other contribution tables]                                     │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ OSM Data / Routing
                     │
┌────────────────────▼────────────────────────────────────────────┐
│         EXTERNAL DEPENDENCIES                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ GraphHopper 7.2 (Java Library)                                 │
│  ├─ Routing engine                                              │
│  ├─ Distance/duration calculations                              │
│  ├─ Vehicle profile support                                     │
│  └─ Contraction Hierarchies for fast queries                    │
│                                                                 │
│ OpenStreetMap (OSM) Data                                       │
│  ├─ Tamil Nadu extract                                          │
│  ├─ Downloaded from Geofabrik                                   │
│  └─ Compiled into graph format                                  │
│                                                                 │
│ Data Files (./data/graphhopper/)                                │
│  ├─ tamil-nadu-latest.osm.pbf (~150 MB)                        │
│  ├─ Compiled graphs (~250 MB)                                   │
│  └─ Cache files for CH preparation                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow: Route Submission with Validation

```
User submits route from "Add Stops to Route"
│
├─ [Frontend] RouteContribution.tsx
│   ├─ Detects method="add-stops" + fromSearch=true
│   ├─ Sends DISABLED state to ContributionMethodSelector
│   └─ POST /api/v1/contributions/routes
│
└─ [Backend] ContributionController (REST Adapter)
   │
   ├─ POST /api/v1/contributions/routes
   ├─ Security checks (auth, rate limit, honeypot)
   ├─ Deserialize request body
   │
   └─ Inject into → ContributionApplicationService.submitRouteContribution()
      │
      ├─ InputValidationPort.validateContributionData()
      │  ├─ Check required fields
      │  ├─ Validate formats (time, coordinates)
      │  └─ Sanitize input
      │
      ├─ createRouteContributionFromData()
      │  └─ Build RouteContribution domain model
      │
      ├─ performRoutingValidation() (NEW)
      │  │
      │  ├─ Extract vehicle type from bus name
      │  │
      │  ├─ Validate Journey Duration:
      │  │  │
      │  │  ├─ Parse departure/arrival times
      │  │  │
      │  │  └─ RoutingValidationPort.validateJourneyDuration()
      │  │     │
      │  │     └─ GraphHopperRoutingAdapter
      │  │        ├─ graphHopper.route(from, to, "bus") → ResponsePath
      │  │        ├─ Extract expected duration from route
      │  │        ├─ Calculate actual duration from times
      │  │        ├─ Compare: actual / expected = deviation
      │  │        ├─ Calculate confidence score
      │  │        └─ Return RouteValidationResult
      │  │
      │  ├─ If validation failed (isValid=false):
      │  │  └─ RouteValidationAlertService.createAlertFromValidation()
      │  │     └─ Alert saved to database
      │  │
      │  ├─ Validate Stop Sequence (if stops present):
      │  │  │
      │  │  └─ RoutingValidationPort.validateStopSequence()
      │  │     │
      │  │     └─ GraphHopperRoutingAdapter
      │  │        ├─ For each stop, calculate:
      │  │        │  ├─ Direct distance: prev → next
      │  │        │  ├─ Via-stop distance: prev → stop → next
      │  │        │  └─ Deviation = (via - direct) / direct
      │  │        ├─ Flag if deviation > 30%
      │  │        └─ Return RouteValidationResult
      │  │
      │  └─ Validate Segment Speeds (if stops present):
      │     │
      │     └─ RoutingValidationPort.validateSegmentSpeeds()
      │        │
      │        └─ GraphHopperRoutingAdapter
      │           ├─ buildRouteSegments() → List<RouteSegment>
      │           ├─ For each segment:
      │           │  ├─ Distance (meters)
      │           │  ├─ Duration (seconds)
      │           │  ├─ Speed = distance/duration
      │           │  └─ Check: speed <= vehicle_max_speed
      │           ├─ Flag if speed > limit
      │           └─ Return RouteValidationResult
      │
      ├─ routeContributionOutputPort.save()
      │  └─ JPA Repository saves to route_contributions table
      │
      └─ Return RouteContribution (with ID)
         │
         └─ [Frontend] Display success message
            └─ Optional: Show "Route flagged for quality review" if alerts exist
```

## Data Quality Flow: Alert Review (Admin)

```
Admin views validation alerts dashboard
│
├─ [Frontend] Admin Dashboard
│   ├─ Shows: Pending alerts, High-confidence, Recent, Statistics
│   │
│   └─ Clicks: Review pending alert
│
└─ [Backend] RouteValidationAlertController (REST Adapter)
   │
   ├─ GET /api/v1/admin/validation-alerts/pending
   │  │
   │  └─ RouteValidationAlertService.getPendingAlerts()
   │     └─ RouteValidationAlertRepository.findByStatusOrderBy...()
   │        └─ Query: SELECT * FROM route_validation_alerts WHERE status='PENDING'
   │
   ├─ [Frontend] Display alert details
   │  ├─ Contribution ID
   │  ├─ Validation Type (Duration/Sequence/Speed)
   │  ├─ Confidence Score (95% = certain, 50% = uncertain)
   │  ├─ Expected Range vs Actual Value
   │  ├─ Issue Description
   │  └─ Action buttons: [Approve] [Dismiss] [Reject] [Escalate]
   │
   └─ Admin makes decision → clicks button
      │
      ├─ If clicks [Approve]:
      │  └─ POST /api/v1/admin/validation-alerts/{id}/approve
      │     │
      │     └─ RouteValidationAlertService.approveAlert()
      │        ├─ Set status = APPROVED
      │        ├─ Set reviewed_by = admin_id
      │        ├─ Set reviewed_at = NOW()
      │        ├─ Save admin_notes
      │        └─ Save to database
      │
      ├─ If clicks [Dismiss]:
      │  └─ POST /api/v1/admin/validation-alerts/{id}/dismiss
      │     │
      │     └─ RouteValidationAlertService.dismissAlert()
      │        ├─ Set status = DISMISSED (false positive)
      │        ├─ Use reason to tune thresholds
      │        └─ Save to database
      │
      ├─ If clicks [Reject]:
      │  └─ POST /api/v1/admin/validation-alerts/{id}/reject
      │     │
      │     └─ RouteValidationAlertService.rejectAlert()
      │        ├─ Set status = REJECTED
      │        ├─ Contribution should be blocked/flagged
      │        └─ Save to database
      │
      └─ Dashboard updates automatically
         └─ Alert moves from PENDING to [Approved/Dismissed/Rejected]
```

## Hexagonal Architecture Layers

```
                    INBOUND
                   ADAPTERS
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐  ┌──────────────┐  ┌─────────────────┐
│ REST    │  │ Contribution │  │ Validation Alert│
│ Web     │  │ Controller   │  │ Controller      │
│ Browser │  │ (existing)   │  │ (NEW)           │
└────┬────┘  └──────┬───────┘  └────────┬────────┘
     │               │                  │
     └───────────────┼──────────────────┘
                     │
          ┌──────────▼──────────┐
          │  DEPENDENCY         │
          │  INJECTION          │
          └──────────┬──────────┘
                     │
   ┌─────────────────┼─────────────────┐
   │                 │                 │
   ▼                 ▼                 ▼
┌────────────┐ ┌──────────────────┐ ┌────────────────┐
│Contribution│ │Contribution      │ │Route Validation│
│Application │ │Admin Service     │ │Alert Service   │
│Service     │ │(existing)        │ │(NEW)           │
└──────┬─────┘ └────────┬─────────┘ └────────┬───────┘
       │                │                    │
       └────────────────┼────────────────────┘
                        │
             ┌──────────▼──────────┐
             │  USES PORTS/        │
             │  INTERFACES         │
             └──────────┬──────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    ▼                   ▼                   ▼
┌─────────────┐  ┌─────────────────┐  ┌──────────────┐
│InputValidate│  │RoutingValidate  │  │RouteContrib.│
│Port         │  │Port (DOMAIN)    │  │OutputPort    │
│(contract)   │  │(contract)       │  │(contract)    │
└──────┬──────┘  └────────┬────────┘  └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
          ┌───────────────▼────────────┐
          │  OUTBOUND ADAPTERS         │
          │  (Implementations)         │
          └───────────────┬────────────┘
                          │
    ┌─────────────────────┼──────────────────┐
    │                     │                  │
    ▼                     ▼                  ▼
┌──────────────┐ ┌────────────────────┐ ┌──────────────┐
│Input Validation│GraphHopperRouting │ │JPA Adapter   │
│Adapter (impl)  │Adapter (NEW impl)  │ │(persist)     │
└──────────────┘ └────────┬───────────┘ └──────────────┘
                          │
                 ┌────────▼─────────┐
                 │ GraphHopper 7.2  │
                 │ (external library)│
                 └──────────────────┘
                          │
                 ┌────────▼─────────┐
                 │ OSM Data         │
                 │ Tamil Nadu Graph │
                 └──────────────────┘
```

## Class Dependency Diagram

```
ContributionApplicationService
├── depends on ContributionInputPort (implements)
├── depends on RouteContributionOutputPort
├── depends on ImageContributionOutputPort
├── depends on InputValidationPort
├── depends on SecurityMonitoringPort
├── depends on RoutingValidationPort (NEW)
└── depends on RouteValidationAlertService (NEW)

RouteValidationAlertService (NEW)
├── depends on RouteValidationAlertRepository (NEW)
└── depends on RoutingValidationPort (uses validation results)

RouteValidationAlertController (NEW)
├── depends on RouteValidationAlertService
└── returns RouteValidationAlertDTO

GraphHopperRoutingAdapter (NEW) implements RoutingValidationPort
├── depends on GraphHopper bean
├── depends on GHPoint (GraphHopper)
├── depends on ResponsePath (GraphHopper)
└── returns RouteValidationResult (nested in port interface)

GraphHopperConfig (NEW) - @Configuration
└── provides GraphHopper bean

RouteValidationAlertRepository (NEW) extends JpaRepository
└── persistence for RouteValidationAlertJpaEntity (NEW)

RouteValidationAlertJpaEntity (NEW)
└── maps to route_validation_alerts table (NEW)
```

## Validation Logic Flow (Detailed)

```
JOURNEY DURATION VALIDATION
──────────────────────────

Input: from_lat, from_lng, to_lat, to_lng, departure_time, arrival_time, vehicle_type
│
└─ GraphHopperRoutingAdapter.validateJourneyDuration()
   │
   ├─ mapVehicleTypeToProfile("bus") → "bus"
   │
   ├─ graphHopper.route(from_point, to_point, "bus")
   │  └─ Returns ResponsePath with time, distance
   │
   ├─ expectedSeconds = path.getTime() / 1000
   │
   ├─ actualSeconds = ChronoUnit.SECONDS.between(departure, arrival)
   │
   ├─ tolerance = expectedSeconds × 1.25 (25% allowance)
   │
   ├─ isValid = actualSeconds <= tolerance
   │
   ├─ deviation = actualSeconds / expectedSeconds
   │
   ├─ calculateConfidence(deviation):
   │  ├─ if deviation <= 1.0: confidence = 95%
   │  ├─ if deviation <= 1.1: confidence = 85%
   │  ├─ if deviation <= 1.25: confidence = 65%
   │  ├─ if deviation <= 1.5: confidence = 50%
   │  ├─ if deviation <= 2.0: confidence = 30%
   │  └─ else: confidence = 10%
   │
   └─ return RouteValidationResult(isValid, confidence, JOURNEY_DURATION, issue, expectedRange, actual)


STOP SEQUENCE VALIDATION
────────────────────────

Input: start_lat, start_lng, stops[], end_lat, end_lng
│
└─ GraphHopperRoutingAdapter.validateStopSequence()
   │
   ├─ for each stop in stops:
   │  │
   │  ├─ Calculate direct distance: prev → next
   │  │  └─ directDist = haversineDistance(prev.lat, prev.lng, next.lat, next.lng)
   │  │
   │  ├─ Calculate via-stop distance: prev → stop → next
   │  │  └─ viaStopDist = haversineDistance(prev, stop) + haversineDistance(stop, next)
   │  │
   │  ├─ Calculate deviation: (viaStopDist - directDist) / directDist
   │  │
   │  └─ if deviation > 0.30: mark as off-route
   │
   ├─ Count deviating stops
   │
   ├─ isValid = deviatingStops == 0
   │
   ├─ confidence = 100 - (deviatingStops × 20)
   │
   └─ return RouteValidationResult


SEGMENT SPEED VALIDATION
────────────────────────

Input: segments[], vehicle_type
│
└─ GraphHopperRoutingAdapter.validateSegmentSpeeds()
   │
   ├─ maxSpeed = getMaxSpeed(vehicle_type)  // 100 km/h for bus
   │
   ├─ for each segment:
   │  │
   │  ├─ speedKmh = (distance_m / 1000) / (duration_s / 3600)
   │  │
   │  ├─ if speedKmh > maxSpeed:
   │  │  └─ excessiveSegments++
   │  │
   │  └─ maxCalculatedSpeed = max(maxCalculatedSpeed, speedKmh)
   │
   ├─ isValid = excessiveSegments == 0
   │
   ├─ confidence = 100 - (excessiveSegments × 15)
   │
   └─ return RouteValidationResult(isValid, confidence, SEGMENT_SPEED, issue, "≤100 km/h", "150 km/h max")
```

This completes the GraphHopper integration architecture documentation.
