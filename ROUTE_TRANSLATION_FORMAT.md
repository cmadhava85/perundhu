# Route Translation Data Format

## Overview
The Route Management admin panel now supports displaying translated location names alongside the primary English names. This document shows the expected data format for route contributions with translation support.

## Expected JSON Response Format

### RouteContribution with Translation Support

```json
{
  "id": 67334,
  "busNumber": "TN67-3433",
  "fromLocationName": "Aruppukottai",
  "fromLocationTranslatedName": "Aruppukottai",
  "fromLocationTaName": "அருப்புக்கோட்டை",
  "fromLatitude": 9.5098,
  "fromLongitude": 78.0977,
  "toLocationName": "Sivakasi",
  "toLocationTranslatedName": "Sivakasi", 
  "toLocationTaName": "சிவகாசி",
  "toLatitude": 9.4505,
  "toLongitude": 77.8108,
  "departureTime": "06:00",
  "arrivalTime": "08:30",
  "submittedBy": "anonymous-user",
  "submissionDate": "2025-09-05",
  "status": "FAILED",
  "stops": [
    {
      "stopOrder": 1,
      "name": "Aruppukottai Bus Stand",
      "translatedName": "Aruppukottai Bus Terminal",
      "taName": "அருப்புக்கோட்டை பேருந்து நிலையம்",
      "latitude": 9.5098,
      "longitude": 78.0977,
      "arrivalTime": "06:00",
      "departureTime": "06:00"
    },
    {
      "stopOrder": 2,
      "name": "Kovilpatti Junction",
      "translatedName": "Kovilpatti Cross",
      "taName": "கோவில்பட்டி சந்திப்பு",
      "latitude": 9.1717,
      "longitude": 77.8683,
      "arrivalTime": "07:00",
      "departureTime": "07:05"
    },
    {
      "stopOrder": 3,
      "name": "Sivakasi Central",
      "translatedName": "Sivakasi Bus Stand",
      "taName": "சிவகாசி மத்திய பேருந்து நிலையம்",
      "latitude": 9.4505,
      "longitude": 77.8108,
      "arrivalTime": "08:30",
      "departureTime": "08:30"
    }
  ]
}
```

## Display in Admin Panel

### List View
The admin panel list view now displays:

1. **Primary Location Name** (bold, dark text)
2. **Translated Name** (italic, medium gray) - if different from primary
3. **Tamil Name** (Tamil font, light gray) - if different from both above

### Grid View  
The grid cards show the same multi-line location display with proper spacing and typography.

### Search Functionality
The enhanced search now looks for matches in:
- Bus numbers
- Primary location names (English)
- Translated location names
- Tamil location names (taName)
- Stop names (all variations)
- Submitter names

## Backend Implementation Notes

### Database Schema Updates
Consider adding these columns to your route contributions table:

```sql
ALTER TABLE route_contributions 
ADD COLUMN from_location_translated_name VARCHAR(255),
ADD COLUMN from_location_ta_name VARCHAR(255),
ADD COLUMN to_location_translated_name VARCHAR(255), 
ADD COLUMN to_location_ta_name VARCHAR(255);

-- For stops table
ALTER TABLE route_stops 
ADD COLUMN translated_name VARCHAR(255),
ADD COLUMN ta_name VARCHAR(255);
```

### API Response Mapping
Ensure your API returns these fields when fetching route contributions:

```java
// Java example
public class RouteContributionDTO {
    private Long id;
    private String busNumber;
    private String fromLocationName;
    private String fromLocationTranslatedName; // NEW
    private String fromLocationTaName;         // NEW
    private String toLocationName;
    private String toLocationTranslatedName;   // NEW
    private String toLocationTaName;           // NEW
    // ... other fields
}
```

## CSS Classes Added

The following CSS classes have been added for styling translated names:

- `.location-names` - Container for multiple location names
- `.location-name.primary` - Primary English name
- `.location-name.translated` - Translated name
- `.location-name.tamil` - Tamil name with Tamil font
- `.location-names-list` - Table cell container
- `.primary-name`, `.translated-name`, `.tamil-name` - Table-specific styles

## Future Enhancements

1. **Language Selection**: Add a language picker to show different translation sets
2. **Translation Status**: Show indicators for which locations have complete translations
3. **Bulk Translation**: Tools for admins to add missing translations
4. **Translation Validation**: Ensure translation consistency across the platform

## Testing

To test the translation display:

1. Update your API to return the translation fields
2. Ensure some routes have different values for translated and Tamil names
3. Test search functionality with Tamil text
4. Verify both grid and list views display translations properly