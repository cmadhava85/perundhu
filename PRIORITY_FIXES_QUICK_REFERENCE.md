# Priority Fixes Quick Reference Guide

**Quick access to all new features implemented from the code review**

---

## 🎯 What Was Fixed

| Priority | Feature | Files | Usage |
|----------|---------|-------|-------|
| **P1** | Error Responses | `ErrorResponse.java`<br>`GlobalExceptionHandler.java` | Automatic - all endpoints now return standardized errors |
| **P1** | Offline Persistence | `offlinePersistenceService.ts`<br>`useOfflinePersistence.ts` | Use in contribution forms |
| **P2** | Pagination | `PaginatedResponse.java`<br>`PaginationExampleController.java` | Use for all list endpoints |
| **P2** | Cache Warm-up | `CacheWarmupService.java` | Automatic - runs on startup |

---

## 📚 Quick Usage Examples

### 1. Using the Error Response (Backend)

**Automatic** - No changes needed in controllers:

```java
@PostMapping
public ResponseEntity<BusDTO> createBus(@Valid @RequestBody BusCreateRequest request) {
    // Validation errors automatically caught by GlobalExceptionHandler
    Bus bus = busService.create(request);
    return ResponseEntity.ok(BusDTO.from(bus));
}
```

**Error Response Format:**
```json
{
  "timestamp": "2026-01-20T10:30:45",
  "status": 400,
  "error": "Validation Error",
  "message": "Input validation failed",
  "traceId": "abc123-trace-id",
  "path": "/api/v1/buses",
  "validationErrors": {
    "busNumber": "Bus number is required"
  }
}
```

---

### 2. Using Offline Persistence (Frontend)

**In your component:**

```typescript
import { useOfflinePersistence } from '@/hooks/useOfflinePersistence';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const ContributionForm: React.FC = () => {
  const { 
    saveDraft, 
    loadLatestDraft, 
    queueForRetry,
    stats 
  } = useOfflinePersistence();
  
  const isOnline = useNetworkStatus();
  const [formData, setFormData] = useState<ContributionData>({});
  
  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft(formData);
    }, 30000);
    return () => clearInterval(interval);
  }, [formData]);
  
  // Load saved draft on mount
  useEffect(() => {
    loadLatestDraft().then(draft => {
      if (draft) {
        setFormData(draft);
        toast.info('Restored unsaved draft');
      }
    });
  }, []);
  
  // Submit with offline support
  const handleSubmit = async (data: ContributionData) => {
    if (!isOnline) {
      await queueForRetry(data);
      toast.info('Saved for later submission');
      return;
    }
    
    try {
      await api.post('/api/v1/contributions', data);
    } catch (error) {
      await queueForRetry(data);
      toast.error('Queued for retry');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields */}
      {stats && stats.retryQueueCount > 0 && (
        <div>📤 {stats.retryQueueCount} items queued for retry</div>
      )}
    </form>
  );
};
```

---

### 3. Using Pagination (Backend)

**Simple usage with Spring Data:**

```java
@GetMapping("/locations")
public ResponseEntity<PaginatedResponse<LocationDTO>> getLocations(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
) {
    Pageable pageable = PageRequest.of(page, size);
    Page<LocationDTO> locationPage = locationService.findAll(pageable);
    
    // Convert to PaginatedResponse
    return ResponseEntity.ok(PaginatedResponse.from(locationPage));
}
```

**Manual pagination:**

```java
@GetMapping("/buses")
public ResponseEntity<PaginatedResponse<BusDTO>> getBuses(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
) {
    List<BusDTO> allBuses = busService.getAllBuses();
    
    int totalElements = allBuses.size();
    int start = page * size;
    int end = Math.min(start + size, totalElements);
    
    List<BusDTO> pageContent = allBuses.subList(start, end);
    
    PaginatedResponse<BusDTO> response = PaginatedResponse.<BusDTO>builder()
        .content(pageContent)
        .page(page)
        .size(size)
        .totalElements(totalElements)
        .totalPages((int) Math.ceil((double) totalElements / size))
        .first(page == 0)
        .last(end >= totalElements)
        .build();
    
    return ResponseEntity.ok(response);
}
```

**Response Format:**
```json
{
  "content": [
    {"id": 1, "name": "Chennai"},
    {"id": 2, "name": "Madurai"}
  ],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8,
  "first": true,
  "last": false,
  "empty": false
}
```

---

### 4. Cache Warm-up (Backend)

**Automatic** - No changes needed. Runs on startup:

```
2026-01-20 10:30:45 INFO  🔥 Starting cache warm-up...
2026-01-20 10:30:45 INFO    ✓ Warmed up 1,234 locations for 'en'
2026-01-20 10:30:45 INFO    ✓ Warmed up 1,234 locations for 'ta'
2026-01-20 10:30:45 INFO  ✅ Cache warm-up completed in 87 ms
```

**Manual cache operations:**

```java
@Autowired
private CacheWarmupService cacheWarmupService;

// Clear all caches (for maintenance)
cacheWarmupService.clearAllCaches();

// Log cache statistics
cacheWarmupService.logCacheStats();
```

---

## 🧪 Testing Commands

### Backend
```bash
cd backend
./gradlew compileJava  # Compile
./gradlew test         # Run tests
./gradlew bootRun      # Start server
```

### Frontend
```bash
cd frontend
npm run type-check     # Type check
npm test              # Run tests
npm run dev           # Start dev server
```

---

## 📂 File Locations

### Backend Files
```
backend/app/src/main/java/com/perundhu/
├── application/dto/
│   ├── ErrorResponse.java              ✅ NEW
│   └── PaginatedResponse.java          ✅ NEW
├── infrastructure/
│   ├── config/
│   │   └── CacheWarmupService.java     ✅ NEW
│   └── exception/
│       └── GlobalExceptionHandler.java ✅ NEW
└── adapter/in/rest/
    └── PaginationExampleController.java ✅ NEW
```

### Frontend Files
```
frontend/src/
├── services/
│   └── offlinePersistenceService.ts    ✅ NEW
└── hooks/
    └── useOfflinePersistence.ts        ✅ NEW
```

---

## 🔍 Troubleshooting

### Backend Issues

**Problem:** Compilation error in GlobalExceptionHandler  
**Solution:** Make sure you have `jakarta.servlet.http.HttpServletRequest` imported

**Problem:** Cache warm-up not running  
**Solution:** Check logs for `ApplicationReadyEvent` - might be startup issue

### Frontend Issues

**Problem:** IndexedDB not working  
**Solution:** Check if browser supports IndexedDB: `typeof indexedDB !== 'undefined'`

**Problem:** TypeScript errors  
**Solution:** Run `npm run type-check` to see all errors

---

## 📊 Monitoring

### Backend Metrics

```bash
# Check error response format
curl -i http://localhost:8080/api/v1/invalid-endpoint

# Check pagination
curl "http://localhost:8080/api/v1/example-pagination/locations?page=0&size=10"

# Check cache hit rates
curl http://localhost:8080/actuator/metrics/cache.gets?tag=name:locationsCache
```

### Frontend Monitoring

```javascript
// Check IndexedDB in browser console
const db = await indexedDB.databases();
console.log('Databases:', db);

// Check offline persistence stats
import { offlinePersistence } from '@/services/offlinePersistenceService';
const stats = await offlinePersistence.getStats();
console.log('Stats:', stats);
```

---

## 🎯 Success Criteria

✅ **Backend:**
- Error responses have consistent format with trace IDs
- Pagination works on list endpoints
- First requests are <100ms (after cache warm-up)
- No compilation errors

✅ **Frontend:**
- Drafts save automatically every 30 seconds
- Failed submissions queue for retry
- Retry queue processes when back online
- No TypeScript errors

---

## 📞 Support

For questions or issues:
1. Check this quick reference
2. See detailed guide: [PRIORITY_FIXES_IMPLEMENTATION_JAN_2026.md](./PRIORITY_FIXES_IMPLEMENTATION_JAN_2026.md)
3. Review code review: [CODE_REVIEW_COMPREHENSIVE_JAN_2026.md](./CODE_REVIEW_COMPREHENSIVE_JAN_2026.md)

---

**Last Updated:** January 20, 2026  
**Status:** ✅ All features implemented and tested  
**Version:** 1.0.0
