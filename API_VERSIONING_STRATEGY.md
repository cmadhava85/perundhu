# API Versioning Strategy

## Overview
This document defines the API versioning strategy for the Perundhu Bus Tracking Platform. Following a consistent versioning approach ensures backward compatibility, smooth migrations, and clear communication with API consumers.

## Current Status
- **Current Version**: v1
- **Base Path**: `/api/v1`
- **Status**: Production-ready
- **Stability**: Stable

## Versioning Approach

### URL Path Versioning (Chosen Strategy)
We use **URL path versioning** for its clarity and explicit nature:

```
/api/v1/bus-schedules
/api/v2/bus-schedules  (future)
```

**Rationale:**
- ✅ Clear and explicit in URLs
- ✅ Easy to route and cache
- ✅ Works with all HTTP clients
- ✅ Simple to test and document
- ✅ Industry standard practice

**Alternative Approaches Considered:**
- ❌ Header versioning: Less visible, harder to debug
- ❌ Query parameter versioning: Not RESTful, caching issues
- ❌ Content negotiation: Complex, less discoverable

## Version Lifecycle

### Version States
1. **Alpha** (α): Internal testing only
2. **Beta** (β): Limited external testing
3. **Stable**: Production-ready
4. **Deprecated**: Scheduled for removal
5. **Sunset**: No longer available

### Support Timeline
- **New versions**: Support for minimum 18 months
- **Deprecation notice**: Minimum 6 months before sunset
- **Parallel versions**: Maximum 2 concurrent stable versions
- **Bug fixes**: Current and previous stable version only

## Version Compatibility Rules

### Breaking Changes (Require New Version)
- ❌ Removing endpoints
- ❌ Removing request/response fields
- ❌ Changing field types
- ❌ Changing endpoint behavior
- ❌ Adding required fields
- ❌ Changing authentication requirements
- ❌ Modifying error codes

### Non-Breaking Changes (Same Version)
- ✅ Adding new endpoints
- ✅ Adding optional request fields
- ✅ Adding response fields
- ✅ Expanding enum values
- ✅ Bug fixes
- ✅ Performance improvements
- ✅ Internal refactoring

## API Version v1 Structure

### Current Endpoints (v1)

#### Bus Schedule Endpoints
```
GET    /api/v1/bus-schedules/search
GET    /api/v1/bus-schedules/locations
GET    /api/v1/bus-schedules/{id}
GET    /api/v1/bus-schedules/by-terminal/{terminalId}
```

#### Location Endpoints
```
GET    /api/v1/locations
GET    /api/v1/locations/search
```

#### Analytics Endpoints
```
POST   /api/v1/analytics/events
GET    /api/v1/analytics/dashboard
GET    /api/v1/analytics/search-logs
```

#### Contribution Endpoints
```
POST   /api/v1/contributions/routes
POST   /api/v1/contributions/stops
POST   /api/v1/contributions/verify-route
POST   /api/v1/contributions/bus-location
POST   /api/v1/contributions/analyze-image
GET    /api/v1/contributions/history
```

#### Review Endpoints
```
GET    /api/v1/reviews/bus/{busId}
POST   /api/v1/reviews
PUT    /api/v1/reviews/{id}
DELETE /api/v1/reviews/{id}
```

#### CSRF Protection
```
GET    /api/v1/csrf/token
```

## Migration to v2 (Future)

### When to Create v2
Create a new version when:
- Multiple breaking changes accumulate
- Major feature additions require restructuring
- Significant architectural improvements
- User feedback demands incompatible changes

### Planned v2 Improvements (Tentative)
1. **Enhanced Search**
   - Unified search endpoint with filters
   - Support for complex queries
   - Real-time suggestions

2. **GraphQL Support**
   - Optional GraphQL endpoint
   - Flexible field selection
   - Reduced over-fetching

3. **Pagination Standards**
   - Consistent cursor-based pagination
   - Standardized page/limit parameters
   - HATEOAS links for navigation

4. **Error Response Format**
   - RFC 7807 Problem Details
   - Structured error codes
   - Localized error messages

5. **Rate Limiting Headers**
   - X-RateLimit-* headers
   - Quota information
   - Retry-After guidance

### Migration Path

#### Phase 1: Preparation (1 month)
- Finalize v2 specification
- Update documentation
- Create migration guide
- Set up v2 routing

#### Phase 2: Beta Release (2 months)
- Deploy v2 alongside v1
- Invite beta testers
- Gather feedback
- Fix issues

#### Phase 3: Stable Release (1 month)
- Mark v2 as stable
- Update client SDKs
- Announce v1 deprecation
- Provide migration tools

#### Phase 4: v1 Deprecation (6 months)
- Add deprecation headers to v1
- Monitor v1 usage
- Send sunset notices
- Assist migrations

#### Phase 5: v1 Sunset (after 6 months)
- Remove v1 endpoints
- Keep historical docs
- Redirect to v2
- Final migration support

## Implementation Guidelines

### Backend (Spring Boot)

#### Controller Organization
```java
// v1 controllers
@RestController
@RequestMapping("/api/v1/bus-schedules")
public class BusScheduleControllerV1 {
    // v1 implementation
}

// v2 controllers (future)
@RestController
@RequestMapping("/api/v2/bus-schedules")
public class BusScheduleControllerV2 {
    // v2 implementation
}
```

#### Shared Service Layer
```java
// Version-agnostic business logic
@Service
public class BusScheduleService {
    public BusSchedule findBusSchedule(Long id) {
        // Core logic remains version-independent
    }
}

// Version-specific DTOs and mappers
@Component
public class BusScheduleDTOMapperV1 {
    public BusScheduleDTOV1 toDTO(BusSchedule entity) {
        // v1 mapping
    }
}

@Component
public class BusScheduleDTOMapperV2 {
    public BusScheduleDTOV2 toDTO(BusSchedule entity) {
        // v2 mapping with additional fields
    }
}
```

#### Deprecation Headers
```java
@GetMapping("/api/v1/deprecated-endpoint")
public ResponseEntity<?> deprecatedMethod() {
    return ResponseEntity.ok()
        .header("X-API-Deprecated", "true")
        .header("X-API-Sunset-Date", "2027-06-01")
        .header("X-API-Alternate", "/api/v2/new-endpoint")
        .body(response);
}
```

### Frontend (React/TypeScript)

#### API Service Versioning
```typescript
// services/api-versions.ts
export const API_VERSION = {
  V1: '/api/v1',
  V2: '/api/v2',  // Future
} as const;

// services/busScheduleService.ts
import { API_VERSION } from './api-versions';

export const busScheduleService = {
  async search(params: SearchParams) {
    return api.get(`${API_VERSION.V1}/bus-schedules/search`, { params });
  },
};
```

#### Feature Flags for Version Migration
```typescript
// config/features.ts
export const FEATURE_FLAGS = {
  USE_API_V2: false,  // Toggle for gradual migration
};

// services/busScheduleService.ts
const apiVersion = FEATURE_FLAGS.USE_API_V2 
  ? API_VERSION.V2 
  : API_VERSION.V1;
```

## Documentation Strategy

### OpenAPI/Swagger
- Separate spec files per version
- `swagger-v1.yaml` and `swagger-v2.yaml`
- Version-specific documentation URLs

### README and Guides
- Version compatibility matrix
- Migration guides per version
- Deprecation timeline
- Breaking changes log

### Communication Channels
- Email notifications for changes
- In-app deprecation warnings
- API blog for major updates
- GitHub releases for versions

## Monitoring and Analytics

### Metrics to Track
- Request volume per version
- Error rates per version
- Adoption rate of new versions
- Deprecation warning acknowledgments

### Dashboards
- Version distribution over time
- Breaking change impact analysis
- Migration progress tracking
- Sunset readiness score

## Security Considerations

### Version-Specific Security
- Security patches for all supported versions
- Immediate backports for critical issues
- Sunset unsupported versions promptly
- Clear security support policy

### CSRF Protection
- Consistent across versions
- Version-independent token endpoint
- Migration path preserves security

## Testing Strategy

### Version Testing
- Separate test suites per version
- Contract testing between versions
- Backward compatibility tests
- Migration path validation

### CI/CD Pipeline
- Parallel builds for each version
- Version-specific deployment
- Canary releases for new versions
- Automated compatibility checks

## Best Practices

### DO ✅
- Version early in production
- Document all changes
- Communicate deprecations clearly
- Support migration actively
- Keep versions simple
- Plan sunset from day one

### DON'T ❌
- Change v1 breaking changes
- Remove versions without notice
- Over-version (too many versions)
- Skip deprecation period
- Make versioning complex
- Forget backward compatibility

## Example: Adding a New Feature

### Scenario: Add Bus Real-Time Location Streaming

#### Option 1: Add to v1 (Non-Breaking)
```java
// New endpoint in v1
@GetMapping("/api/v1/buses/{id}/location/stream")
public Flux<BusLocationDTO> streamLocation(@PathVariable Long id) {
    return busLocationService.streamLocationUpdates(id);
}
```
**When to use**: Feature is additive and doesn't affect existing endpoints.

#### Option 2: Create v2 (Breaking Change)
```java
// Restructure in v2
@GetMapping("/api/v2/buses/{id}/live")
public BusLiveDataDTOV2 getLiveData(@PathVariable Long id) {
    // New structure with location, capacity, delay
}
```
**When to use**: Feature requires restructuring or deprecating old endpoints.

## Version Decision Matrix

| Change Type | v1 Compatible | Action |
|-------------|---------------|--------|
| Add optional field to request | ✅ Yes | Add to v1 |
| Add field to response | ✅ Yes | Add to v1 |
| New endpoint | ✅ Yes | Add to v1 |
| Remove field from response | ❌ No | Create v2 |
| Change field type | ❌ No | Create v2 |
| Rename endpoint | ❌ No | Create v2 |
| Add required field | ❌ No | Create v2 |

## Conclusion

This versioning strategy provides:
- **Clarity**: Explicit version in URL
- **Stability**: Clear compatibility rules
- **Flexibility**: Room for evolution
- **Safety**: Controlled deprecation
- **Simplicity**: Easy to understand and implement

The strategy balances innovation with stability, ensuring users can rely on the API while allowing the platform to evolve.

---

**Document Version**: 1.0  
**Last Updated**: January 20, 2026  
**Next Review**: July 20, 2026  
**Owner**: Backend Team
