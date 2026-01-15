# Language Code Consistency Report

## Summary
✅ **The language code `'ta'` is used consistently across ALL layers of the application**

---

## Database Layer
**Language Code:** `'ta'`

### translations table
```sql
-- Structure
CREATE TABLE translations (
    entity_type VARCHAR(50),
    entity_id BIGINT,
    language_code VARCHAR(10),  -- 'ta' for Tamil
    field_name VARCHAR(100),
    translated_value TEXT
)

-- Example records
VALUES ('location', 29831, 'ta', 'name', 'கோபாலபுரம்');
VALUES ('location', 20711, 'ta', 'name', 'நந்தனம்');
VALUES ('location', 1565, 'ta', 'name', 'சி ஐ டி காலனி');
```

**Source:** `tamil_translations_1768010013.sql`
**Records:** 5,067 Tamil translations
**All use:** `language_code = 'ta'`

---

## Backend (Java Spring Boot)
**Language Code:** `'ta'` (also accepts `'en'` for English)

### API Controllers
All endpoints use `@RequestParam` with parameter name **`lang`** and accept values:
- `'en'` (English - default)
- `'ta'` (Tamil)

#### BusScheduleController.java
```java
// Lines 164, 190, 283, 438, 623, 657, 945
@RequestParam(name = "lang", defaultValue = "en") String language

// Documentation
@Parameter(description = "Language code (en or ta)")
```

#### LocationController.java
```java
// Lines 64, 92
@Parameter(description = "Language code (en, ta)") 
@RequestParam(name = "lang", defaultValue = "en") String language
```

### Service Layer
```java
// BusScheduleServiceImpl.java line 215
public List<StopDTO> getStopsForBus(Long busId, String languageCode)

// Always passes 'ta' or 'en' to translation lookup
```

---

## Frontend (React + TypeScript)
**Language Code:** `'ta'`

### i18n Configuration
**File:** `frontend/src/i18n.ts`

```typescript
// Language detection and storage
const defaultLanguage = detectedLanguage.startsWith('ta') ? 'ta' : 'en';

// Available languages
resources: {
  en: { translation: enTranslation },
  ta: { translation: taTranslation }  // 'ta' is the language key
}

// Language switching
i18n.on('languageChanged', (lng) => {
  if (lng === 'ta') {  // Checks for 'ta'
    document.documentElement.classList.add('lang-ta');
  }
});
```

### API Calls
**Hook:** `useBusStops` in `frontend/src/hooks/queries/useBusSearch.ts`

```typescript
// Line 216
export function useBusStops(
  busId: number | null,
  fromLocationId: number | null,
  toLocationId: number | null,
  enabled = true,
  languageCode = 'en'  // Accepts 'en' or 'ta'
)

// Line 232 - API parameter
params: {
  fromLocationId,
  toLocationId,
  lang: languageCode  // Sends 'ta' or 'en' to backend
}
```

### UI Components (20+ components checked)
All components use `i18n.language === 'ta'` checks:

```typescript
// LocationAutocompleteInputGrouped.tsx line 45
if (i18n.language === 'ta' && location.translatedName) {
  return location.translatedName;
}

// BusCardModern.tsx line 260
if (i18n.language === 'ta') {
  return stop.taName || stop.translatedName;
}

// SearchResults.tsx line 70
if (i18n.language === 'ta' && location.translatedName) {
  return location.translatedName;
}
```

**Components with Tamil support:**
1. LocationAutocompleteInputGrouped
2. LocationAutocompleteInput
3. BusCardModern
4. SearchResults
5. TransitSearchForm
6. ShareRoute
7. AddStopsToRoute
8. StopEntryWizard
9. And 12+ more...

---

## Python Upload Script
**Language Code:** `'ta'`

**File:** `scripts/upload_tnstc_data.py`

```python
# Line 61 - Google Translator configuration
self.translator = GoogleTranslator(source='en', target='ta')

# Line 258 - Translation lookup query
AND language_code = 'ta'

# Line 278 - Translation insert query
VALUES ('location', %s, 'ta', 'name', %s, NOW(), NOW())
```

---

## Language Code Flow

### User Selects Tamil (Frontend)
```
User clicks Tamil toggle
↓
i18n.changeLanguage('ta')
↓
localStorage.setItem('perundhu-language', 'ta')
↓
i18n.language = 'ta'
```

### API Request (Frontend → Backend)
```
Component reads: i18n.language = 'ta'
↓
useBusStops(busId, from, to, true, 'ta')
↓
API call: GET /api/v1/bus-schedules/buses/{id}/stops?lang=ta
↓
Backend receives: @RequestParam("lang") = "ta"
```

### Database Query (Backend)
```
BusScheduleServiceImpl.getStopsForBus(busId, "ta")
↓
TranslationService.getTranslation(location, "name", "ta")
↓
SQL: SELECT translated_value FROM translations 
     WHERE language_code = 'ta' 
     AND entity_id = ? 
     AND field_name = 'name'
↓
Returns: "சென்னை கலைஞர் சி.பி.டி"
```

### Response Display (Backend → Frontend)
```
Backend returns: { id: 1, name: "Chennai Kalaignar CBT", translatedName: "சென்னை கலைஞர் சி.பி.டி" }
↓
Frontend receives StopDTO/LocationDTO
↓
Component checks: i18n.language === 'ta'
↓
Display: translatedName ("சென்னை கலைஞர் சி.பி.டி")
```

---

## Consistency Verification

### ✅ Database Layer
- Column: `language_code = 'ta'`
- 5,067 records confirmed using `'ta'`

### ✅ Backend Layer
- API parameter: `lang = 'ta'`
- Service methods: `languageCode = 'ta'`
- Documentation: "Language code (en or ta)"

### ✅ Frontend Layer
- i18n language key: `'ta'`
- API calls: `lang: 'ta'`
- Component checks: `i18n.language === 'ta'`
- LocalStorage: `'perundhu-language' = 'ta'`

### ✅ Upload Script
- Google Translator: `target='ta'`
- Database inserts: `language_code = 'ta'`

---

## No Inconsistencies Found

### Not Used Anywhere:
- ❌ `'tam'` - Never used
- ❌ `'tamil'` - Never used
- ❌ `'ta-IN'` - Only used in voice contribution for speech recognition (separate feature)

### Consistent Use:
- ✅ `'ta'` for Tamil language code
- ✅ `'en'` for English language code

---

## Conclusion

**The language code `'ta'` is used consistently across:**
1. ✅ Database tables (translations.language_code)
2. ✅ Backend API endpoints (@RequestParam lang)
3. ✅ Backend service layer (languageCode parameter)
4. ✅ Frontend i18n configuration (language key)
5. ✅ Frontend API calls (lang parameter)
6. ✅ Frontend UI components (i18n.language checks)
7. ✅ Python upload script (translator target and DB inserts)

**No inconsistencies detected. All layers use the same language code convention.**
