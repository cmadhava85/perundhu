# Tests Needed for Coverage - Priority List

This document outlines specific tests needed to improve code coverage, prioritized by impact and effort.

---

## 🔴 CRITICAL PRIORITY - Contribution Components (0-2% Coverage)

### 1. ImageContribution.tsx (0.85% coverage - 1101 uncovered lines)
**Current**: No tests  
**Needed**:
```typescript
describe('ImageContribution', () => {
  it('should render image upload form');
  it('should validate image file types (jpg, png, heic)');
  it('should validate image file size limits');
  it('should preview uploaded image');
  it('should handle multiple image uploads');
  it('should extract EXIF data from images');
  it('should show upload progress');
  it('should handle upload errors');
  it('should submit images with route data');
  it('should clear form after successful submission');
});
```

### 2. AddStopsToRoute.tsx (0.29% coverage - 1284 uncovered lines)
**Current**: No tests  
**Needed**:
```typescript
describe('AddStopsToRoute', () => {
  it('should render empty stops list initially');
  it('should add new stop to list');
  it('should remove stop from list');
  it('should reorder stops via drag and drop');
  it('should validate stop name is not empty');
  it('should validate stop coordinates');
  it('should search for stops using autocomplete');
  it('should detect duplicate stops');
  it('should calculate distance between stops');
  it('should submit stops data to API');
  it('should handle API errors');
  it('should show confirmation on success');
});
```

### 3. ReportIssue.tsx (0.85% coverage - 612 uncovered lines)
**Current**: No tests  
**Needed**:
```typescript
describe('ReportIssue', () => {
  it('should render issue report form');
  it('should validate issue title is required');
  it('should validate issue description is required');
  it('should validate issue category selection');
  it('should upload attachments (images/files)');
  it('should preview attachments before upload');
  it('should validate attachment file types');
  it('should validate attachment file sizes');
  it('should submit issue report');
  it('should handle submission errors');
  it('should show success message after submission');
  it('should clear form after successful submission');
});
```

### 4. RouteVerification.tsx (0.71% coverage - 542 uncovered lines)
**Current**: No tests  
**Needed**:
```typescript
describe('RouteVerification', () => {
  it('should render route verification form');
  it('should load existing route data');
  it('should display route stops in order');
  it('should allow editing stop names');
  it('should allow editing stop times');
  it('should mark stops as verified');
  it('should detect inconsistencies in route data');
  it('should suggest corrections');
  it('should submit verified route data');
  it('should handle API errors');
  it('should show verification progress');
});
```

### 5. VoiceRecorder.tsx (0.61% coverage - 672 uncovered lines)
**Current**: No tests  
**Needed**:
```typescript
describe('VoiceRecorder', () => {
  it('should request microphone permissions');
  it('should start recording on button click');
  it('should stop recording on button click');
  it('should show recording duration');
  it('should display audio waveform during recording');
  it('should play recorded audio');
  it('should pause audio playback');
  it('should delete recording');
  it('should transcribe audio to text (if enabled)');
  it('should validate audio duration limits');
  it('should handle permission denied errors');
  it('should handle recording errors');
  it('should submit audio recording');
});
```

### 6. PasteContribution.tsx (0.62% coverage - 625 uncovered lines)
**Current**: No tests  
**Needed**:
```typescript
describe('PasteContribution', () => {
  it('should render paste input area');
  it('should accept pasted text');
  it('should parse route data from pasted text');
  it('should detect route format (CSV, JSON, plain text)');
  it('should validate parsed route data');
  it('should show preview of parsed data');
  it('should allow editing parsed data');
  it('should detect missing required fields');
  it('should handle malformed data');
  it('should submit parsed route data');
  it('should show parsing errors');
  it('should handle API errors');
});
```

---

## 🟡 HIGH PRIORITY - Services (4-15% Coverage)

### 7. geocodingService.ts (12.77% coverage - 754 uncovered lines)
**Current**: Basic tests  
**Needed**:
```typescript
describe('geocodingService', () => {
  it('should geocode address to coordinates');
  it('should reverse geocode coordinates to address');
  it('should handle geocoding errors');
  it('should cache geocoding results');
  it('should invalidate stale cache entries');
  it('should batch multiple geocoding requests');
  it('should handle rate limiting');
  it('should retry failed requests');
  it('should validate coordinate ranges');
  it('should validate address format');
  it('should handle network errors');
});
```

### 8. locationAutocompleteService.ts (4.64% coverage - 692 uncovered lines)
**Current**: Very limited tests (excluded due to mock pollution)  
**Needed**: Fix mock pollution first, then add:
```typescript
describe('locationAutocompleteService', () => {
  it('should fetch autocomplete suggestions');
  it('should debounce autocomplete requests');
  it('should filter suggestions by query');
  it('should rank suggestions by relevance');
  it('should cache recent suggestions');
  it('should handle empty queries');
  it('should handle API errors');
  it('should handle network timeouts');
  it('should validate minimum query length');
  it('should limit number of suggestions');
});
```

### 9. mapService.ts (15.01% coverage - 523 uncovered lines)
**Current**: Basic tests  
**Needed**:
```typescript
describe('mapService', () => {
  it('should initialize map with center and zoom');
  it('should add markers to map');
  it('should remove markers from map');
  it('should draw routes on map');
  it('should calculate route bounds');
  it('should fit map to route bounds');
  it('should handle map click events');
  it('should handle marker click events');
  it('should cluster nearby markers');
  it('should update marker positions');
  it('should handle map zoom changes');
  it('should handle map pan events');
});
```

### 10. recaptchaService.ts (10.73% coverage)
**Current**: Limited tests  
**Needed**:
```typescript
describe('recaptchaService', () => {
  it('should load reCAPTCHA script');
  it('should execute reCAPTCHA challenge');
  it('should verify reCAPTCHA token');
  it('should handle reCAPTCHA errors');
  it('should retry failed verifications');
  it('should cache verification results');
  it('should handle expired tokens');
  it('should reset reCAPTCHA on error');
});
```

---

## 🟡 HIGH PRIORITY - Hooks (3-31% Coverage)

### 11. useAuth.tsx (9.84% coverage)
**Current**: No tests  
**Needed**:
```typescript
describe('useAuth', () => {
  it('should return null user when not authenticated');
  it('should return user data when authenticated');
  it('should login user with valid credentials');
  it('should logout user');
  it('should refresh auth token');
  it('should handle login errors');
  it('should handle token expiration');
  it('should persist auth state to localStorage');
  it('should restore auth state from localStorage');
  it('should clear auth state on logout');
});
```

### 12. useLocationData.ts (3.75% coverage)
**Current**: No tests  
**Needed**:
```typescript
describe('useLocationData', () => {
  it('should fetch location data on mount');
  it('should return loading state initially');
  it('should return data after successful fetch');
  it('should return error on fetch failure');
  it('should refetch on query change');
  it('should debounce rapid query changes');
  it('should cache location data');
  it('should invalidate cache on manual refresh');
});
```

### 13. useSessionSecurity.ts (3.52% coverage)
**Current**: No tests  
**Needed**:
```typescript
describe('useSessionSecurity', () => {
  it('should generate session token on mount');
  it('should validate session token');
  it('should detect session hijacking attempts');
  it('should refresh session token periodically');
  it('should clear session on suspicious activity');
  it('should log security events');
  it('should handle token validation errors');
});
```

### 14. useNetworkStatus.ts (31.57% coverage)
**Current**: Basic tests  
**Needed**:
```typescript
describe('useNetworkStatus', () => {
  it('should return online status');
  it('should detect offline state');
  it('should update on network change');
  it('should throttle rapid network changes');
  it('should persist offline state');
  it('should queue requests while offline');
  it('should retry queued requests when online');
});
```

### 15. useRecaptcha.ts (30.2% coverage)
**Current**: Basic tests  
**Needed**:
```typescript
describe('useRecaptcha', () => {
  it('should load reCAPTCHA on mount');
  it('should execute reCAPTCHA challenge');
  it('should return token on success');
  it('should return error on failure');
  it('should reset reCAPTCHA state');
  it('should handle script load errors');
  it('should handle challenge expiration');
});
```

---

## 🟢 MEDIUM PRIORITY - Admin Components (4-11% Coverage)

### 16. AdminLogin.tsx (4.51% coverage - 160 uncovered lines)
**Current**: No tests  
**Needed**:
```typescript
describe('AdminLogin', () => {
  it('should render login form');
  it('should validate email format');
  it('should validate password is required');
  it('should submit login credentials');
  it('should redirect on successful login');
  it('should show error on invalid credentials');
  it('should show loading state during login');
  it('should handle network errors');
  it('should remember user (checkbox)');
  it('should reset form on error');
});
```

### 17. ProtectedAdminRoute.tsx (11.9% coverage - 56 uncovered lines)
**Current**: No tests  
**Needed**:
```typescript
describe('ProtectedAdminRoute', () => {
  it('should render children when authenticated as admin');
  it('should redirect to login when not authenticated');
  it('should redirect to home when not admin');
  it('should show loading state while checking auth');
  it('should persist redirect path');
  it('should handle token expiration');
});
```

---

## 🟢 MEDIUM PRIORITY - UI Components (2-47% Coverage)

### 18. AutocompleteInput.tsx (2.35% coverage - 267 uncovered lines)
**Current**: No tests  
**Needed**:
```typescript
describe('AutocompleteInput', () => {
  it('should render input field');
  it('should show suggestions on input');
  it('should filter suggestions by query');
  it('should highlight matching text in suggestions');
  it('should select suggestion on click');
  it('should navigate suggestions with keyboard');
  it('should select suggestion with Enter key');
  it('should close suggestions on Escape key');
  it('should debounce input changes');
  it('should show loading state while fetching');
  it('should show "no results" message');
  it('should handle API errors');
});
```

### 19. MapComponent.tsx (58.04% coverage - partial)
**Current**: Partial tests  
**Needed**:
```typescript
describe('MapComponent - Missing Coverage', () => {
  it('should handle map initialization errors');
  it('should update markers when data changes');
  it('should handle marker clustering');
  it('should draw polylines for routes');
  it('should handle map bounds changes');
  it('should handle marker popup interactions');
  it('should handle map layer toggles');
  it('should handle custom map controls');
});
```

---

## 🔵 LOWER PRIORITY - Form Components

### 20. AddRouteForm.tsx (0.31% coverage - 850 uncovered lines)
**Current**: No tests  
**Needed**:
```typescript
describe('AddRouteForm', () => {
  it('should render form fields');
  it('should validate required fields');
  it('should validate route number format');
  it('should validate time formats');
  it('should add stops dynamically');
  it('should remove stops');
  it('should reorder stops');
  it('should validate stop sequence');
  it('should submit route data');
  it('should handle submission errors');
  it('should show success message');
  it('should reset form after submission');
});
```

---

## 🎯 Coverage Improvement Strategy

### Phase 1 (Week 1) - Critical Coverage
**Goal**: 60% overall coverage  
**Focus**: Contribution components (ImageContribution, AddStopsToRoute, ReportIssue)  
**Estimated Effort**: 40 hours  
**Tests to Add**: ~30 tests

### Phase 2 (Week 2) - Service Coverage  
**Goal**: 70% overall coverage  
**Focus**: Services (geocoding, locationAutocomplete, map, recaptcha)  
**Estimated Effort**: 30 hours  
**Tests to Add**: ~40 tests

### Phase 3 (Week 3) - Hook Coverage
**Goal**: 75% overall coverage  
**Focus**: Hooks (useAuth, useLocationData, useSessionSecurity)  
**Estimated Effort**: 20 hours  
**Tests to Add**: ~30 tests

### Phase 4 (Week 4) - Admin & UI Coverage
**Goal**: 80% overall coverage  
**Focus**: Admin components, AutocompleteInput, remaining UI  
**Estimated Effort**: 15 hours  
**Tests to Add**: ~20 tests

---

## 📊 Expected Outcomes

| Phase | Coverage Target | Tests Added | Effort (hours) |
|-------|----------------|-------------|----------------|
| Current | 46.85% | 363 | - |
| Phase 1 | 60% | ~30 | 40 |
| Phase 2 | 70% | ~40 | 30 |
| Phase 3 | 75% | ~30 | 20 |
| Phase 4 | 80% | ~20 | 15 |
| **Total** | **80%** | **~120** | **105** |

---

## 🛠️ Testing Tools & Patterns

### Mock Patterns to Use

```typescript
// File uploads
const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

// Audio recording
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  state: 'inactive',
};
global.MediaRecorder = vi.fn(() => mockMediaRecorder);

// Geolocation
global.navigator.geolocation = {
  getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 12.5, longitude: 78.5 } })),
};

// Maps
vi.mock('react-leaflet', () => ({
  MapContainer: vi.fn(({ children }) => <div>{children}</div>),
  TileLayer: vi.fn(() => null),
  Marker: vi.fn(() => null),
}));
```

---

## 📝 Notes

1. **Mock State Pollution**: Fix adminService, locationAutocompleteService, api tests before adding more tests
2. **Component Refactors**: SearchResults, TransitBusCard need component fixes before tests can pass
3. **MSW Recommended**: Consider using Mock Service Worker for API mocking instead of vi.mock()
4. **Test-Driven Development**: Write tests for new features before implementation
5. **Coverage Thresholds**: Consider adding minimum coverage thresholds to vitest.config.ts

---

**Last Updated**: January 13, 2025  
**Next Review**: After Phase 1 completion
