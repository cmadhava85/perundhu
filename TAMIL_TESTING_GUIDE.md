# Tamil Language Support - Testing Guide

## Quick Test Scenarios

### 1. Test Tamil Location Autocomplete

**Endpoint**: `GET /api/v1/bus-schedules/locations/autocomplete`

**Test Case 1**: Tamil Query
```bash
curl "http://localhost:8080/api/v1/bus-schedules/locations/autocomplete?query=விரு&language=ta&limit=5"
```

**Expected Response**:
```json
[
  {
    "id": 123,
    "name": "Virudhunagar",
    "translatedName": "விருதுநகர்",
    "nearbyCity": "Virudhunagar District"
  }
]
```

**Test Case 2**: English Query
```bash
curl "http://localhost:8080/api/v1/bus-schedules/locations/autocomplete?query=Viru&language=en&limit=5"
```

**Expected Response**:
```json
[
  {
    "id": 123,
    "name": "Virudhunagar",
    "nearbyCity": "Virudhunagar District"
  }
]
```

---

### 2. Test Bus Search with Tamil

**Endpoint**: `GET /api/v1/bus-schedules/search`

**Test Case 1**: Search with Tamil Language Parameter
```bash
curl "http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=1&toLocationId=2&lang=ta"
```

**Expected Response**:
```json
{
  "content": [
    {
      "id": 456,
      "number": "TN21-0123",
      "name": "Express Bus",
      "fromLocationId": 1,
      "fromLocationName": "Virudhunagar",
      "fromLocationNameTranslated": "விருதுநகர்",
      "toLocationId": 2,
      "toLocationName": "Madurai",
      "toLocationNameTranslated": "மதுரை",
      "departureTime": "08:30:00",
      "arrivalTime": "10:15:00",
      "rating": 4.0,
      "features": {}
    }
  ],
  "totalElements": 15,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

**Test Case 2**: Search with English (Default)
```bash
curl "http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=1&toLocationId=2"
```

**Expected Response**:
```json
{
  "content": [
    {
      "id": 456,
      "number": "TN21-0123",
      "name": "Express Bus",
      "fromLocationId": 1,
      "fromLocationName": "Virudhunagar",
      "fromLocationNameTranslated": null,
      "toLocationId": 2,
      "toLocationName": "Madurai",
      "toLocationNameTranslated": null,
      "departureTime": "08:30:00",
      "arrivalTime": "10:15:00"
    }
  ]
}
```

---

### 3. Test Route Contribution with Tamil

**Endpoint**: `POST /api/v1/contributions/routes`

**Test Case**: Submit Route in Tamil
```bash
curl -X POST http://localhost:8080/api/v1/contributions/routes \
  -H "Content-Type: application/json" \
  -d '{
    "fromLocation": "விருதுநகர்",
    "toLocation": "மதுரை",
    "viaLocations": ["சாத்தூர்", "உசிலம்பட்டி"],
    "busNumber": "TN21-9999",
    "departureTime": "08:00",
    "arrivalTime": "10:00",
    "operatorName": "Tamil Nadu State Transport",
    "contributorName": "Test User",
    "contributorEmail": "test@example.com"
  }'
```

**Expected Behavior**:
1. Location "விருதுநகர்" is detected as Tamil
2. Translated to "Virudhunagar" and stored in `locations` table
3. Tamil name stored in `translations` table
4. Same process for all locations
5. Route created with English location IDs
6. Success response returned

**Verify in Database**:
```sql
-- Check locations table (should have English names)
SELECT * FROM locations WHERE name IN ('Virudhunagar', 'Madurai', 'Sattur', 'Usilampatti');

-- Check translations table (should have Tamil translations)
SELECT * FROM translations 
WHERE entity_type = 'location' 
  AND language_code = 'ta' 
  AND translated_value IN ('விருதுநகர்', 'மதுரை', 'சாத்தூர்', 'உசிலம்பட்டி');
```

---

### 4. Test Static Translation Mappings

**Test**: Verify LocationTranslationService recognizes common Tamil locations

**Available Test Locations**:
- விருதுநகர் → Virudhunagar
- மதுரை → Madurai
- சிவகாசி → Sivakasi
- ஸ்ரீவில்லிபுத்தூர் → Srivilliputhur
- ராஜபாளையம் → Rajapalayam
- சாத்தூர் → Sattur
- திருநெல்வேலி → Tirunelveli
- தென்காசி → Tenkasi
- கோவில்பட்டி → Kovilpatti
- சங்கரன்கோவில் → Sankarankovil

**Test Code** (Java):
```java
LocationTranslationService service = new LocationTranslationService(translationRepository);

// Test Tamil to English
String english = service.translateToEnglish("விருதுநகர்");
assertEquals("Virudhunagar", english);

// Test English to Tamil
String tamil = service.translateToTamil("Virudhunagar");
assertEquals("விருதுநகர்", tamil);

// Test language detection
String lang = service.detectLanguage("விருதுநகர்");
assertEquals("ta", lang);
```

---

### 5. Integration Test Flow

**Complete End-to-End Test**:

1. **Contribute Route in Tamil**:
```bash
curl -X POST http://localhost:8080/api/v1/contributions/routes \
  -H "Content-Type: application/json" \
  -d '{
    "fromLocation": "விருதுநகர்",
    "toLocation": "மதுரை",
    "busNumber": "TEST-001",
    "departureTime": "09:00",
    "arrivalTime": "11:00"
  }'
```

2. **Search for Location in Tamil**:
```bash
curl "http://localhost:8080/api/v1/bus-schedules/locations/autocomplete?query=விரு&language=ta"
```

3. **Get Location ID** from autocomplete response (e.g., `id: 123`)

4. **Search for Buses with Tamil**:
```bash
curl "http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=123&toLocationId=124&lang=ta"
```

5. **Verify Response** contains Tamil location names

---

## Database Verification Queries

### Check Location Translations
```sql
-- View all Tamil location translations
SELECT 
  l.id,
  l.name AS english_name,
  t.translated_value AS tamil_name
FROM locations l
JOIN translations t ON t.entity_id = l.id AND t.entity_type = 'location'
WHERE t.language_code = 'ta'
ORDER BY l.name;
```

### Check Contribution Processing
```sql
-- Check if Tamil-contributed locations have translations
SELECT 
  cr.id AS contribution_id,
  cr.from_location,
  l_from.name AS stored_english_from,
  t_from.translated_value AS tamil_from,
  cr.to_location,
  l_to.name AS stored_english_to,
  t_to.translated_value AS tamil_to
FROM contribution_routes cr
LEFT JOIN locations l_from ON l_from.name = cr.from_location
LEFT JOIN translations t_from ON t_from.entity_id = l_from.id 
  AND t_from.entity_type = 'location' 
  AND t_from.language_code = 'ta'
LEFT JOIN locations l_to ON l_to.name = cr.to_location
LEFT JOIN translations t_to ON t_to.entity_id = l_to.id 
  AND t_to.entity_type = 'location' 
  AND t_to.language_code = 'ta'
ORDER BY cr.created_at DESC
LIMIT 20;
```

### Count Translations
```sql
-- Count Tamil translations by entity type
SELECT 
  entity_type,
  COUNT(*) as translation_count
FROM translations
WHERE language_code = 'ta'
GROUP BY entity_type;
```

---

## Frontend Testing

### React Component Test

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { LocationAutocomplete } from './LocationAutocomplete';

test('shows Tamil location suggestions', async () => {
  const { getByRole, getByText } = render(
    <LocationAutocomplete language="ta" />
  );
  
  const input = getByRole('textbox');
  fireEvent.change(input, { target: { value: 'விரு' } });
  
  await waitFor(() => {
    expect(getByText('விருதுநகர்')).toBeInTheDocument();
  });
});
```

### API Integration Test

```typescript
test('bus search returns Tamil location names', async () => {
  const response = await fetch(
    '/api/v1/bus-schedules/search?fromLocationId=1&toLocationId=2&lang=ta'
  );
  const data = await response.json();
  
  expect(data.content[0].fromLocationNameTranslated).toBe('விருதுநகர்');
  expect(data.content[0].toLocationNameTranslated).toBe('மதுரை');
});
```

---

## Common Issues & Troubleshooting

### Issue 1: Tamil characters not displaying
**Solution**: Ensure database charset is UTF-8:
```sql
ALTER DATABASE perundhu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE translations CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Issue 2: Location not found in static mappings
**Solution**: Check database for user-contributed translations:
```sql
SELECT * FROM translations 
WHERE translated_value LIKE '%விரு%' 
  AND language_code = 'ta';
```

### Issue 3: Search returns English names when Tamil requested
**Solution**: Verify translation exists and `lang` parameter is passed:
```bash
curl -v "http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=1&toLocationId=2&lang=ta"
```

### Issue 4: Duplicate locations created
**Solution**: Verify `findLocationByAnyLanguage()` is working:
```java
// Check if location exists before creating
Optional<Location> existing = locationTranslationService.findLocationByAnyLanguage(locationName);
```

---

## Performance Testing

### Load Test: Tamil Autocomplete
```bash
# Using Apache Bench
ab -n 1000 -c 10 "http://localhost:8080/api/v1/bus-schedules/locations/autocomplete?query=விரு&language=ta"
```

**Expected**:
- Response time < 200ms
- No errors
- Consistent results

### Load Test: Bus Search with Tamil
```bash
ab -n 1000 -c 10 "http://localhost:8080/api/v1/bus-schedules/search?fromLocationId=1&toLocationId=2&lang=ta"
```

**Expected**:
- Response time < 500ms (with cache)
- Cache hit rate > 80%
- No memory leaks

---

## Success Criteria

✅ All Tamil locations are correctly translated  
✅ Autocomplete returns Tamil suggestions for Tamil queries  
✅ Bus search results include Tamil location names when `lang=ta`  
✅ No duplicate locations created for Tamil contributions  
✅ Database stores English names in locations, Tamil in translations  
✅ Performance acceptable under load  
✅ Frontend displays Tamil correctly (no encoding issues)  
✅ End-to-end flow works: Contribution → Approval → Search → Display  

---

## Test Data

### Sample Tamil Locations for Testing
```
விருதுநகர் - Virudhunagar
மதுரை - Madurai
சிவகாசி - Sivakasi
ராஜபாளையம் - Rajapalayam
சாத்தூர் - Sattur
உசிலம்பட்டி - Usilampatti
திருநெல்வேலி - Tirunelveli
தென்காசி - Tenkasi
கோவில்பட்டி - Kovilpatti
சங்கரன்கோவில் - Sankarankovil
```

### Sample Bus Routes in Tamil
```json
{
  "routes": [
    {
      "from": "விருதுநகர்",
      "to": "மதுரை",
      "via": ["சாத்தூர்", "உசிலம்பட்டி"]
    },
    {
      "from": "சிவகாசி",
      "to": "திருநெல்வேலி",
      "via": ["சங்கரன்கோவில்", "கோவில்பட்டி"]
    },
    {
      "from": "ராஜபாளையம்",
      "to": "மதுரை",
      "via": ["ஸ்ரீவில்லிபுத்தூர்", "வத்திராயிருப்பு"]
    }
  ]
}
```

---

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Fix any bugs found during testing
3. ✅ Performance optimization if needed
4. ✅ Update frontend to use new API features
5. ✅ User acceptance testing with Tamil speakers
6. ✅ Deploy to production
7. ✅ Monitor for issues in production
8. ✅ Gather user feedback
9. ✅ Plan for additional language support

---

**Happy Testing! 🎉**
