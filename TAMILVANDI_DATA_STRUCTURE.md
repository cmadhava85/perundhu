# Tamil Vandi Website Data Structure Analysis

## URL Pattern

```
https://www.tamilvandi.com/timings?from={FROM_CITY}&to={TO_CITY}
```

Example:
```
https://www.tamilvandi.com/timings?from=Sivakasi&to=Madurai
```

## Page Structure

### Header Section
```
Sivakasi → Madurai
```
- Shows route direction
- City names in local language support

### Bus Listing (Repeating Pattern)

Each bus entry contains:

```
┌─────────────────────────────────────┐
│ 503                                 │  ← Bus Number/Operator Name
│ 🚌 Moffusil Bus                     │  ← Bus Type
│ SIVAKASI       →       MADURAI      │  ← Origin → Destination
│ 🕒 01:10                            │  ← Departure Time
└─────────────────────────────────────┘
```

### Data Elements Found

1. **Bus Number/Operator Name** (Top line, bold)
   - Government bus numbers: "503", "511", "704"
   - Private operators: "STAR", "RSR", "KNRK", "VENKATESHWARA", "SNR", "SRINIVASA"

2. **Bus Type** (With emoji 🚌)
   - "Moffusil Bus" (Government buses)
   - "Private Bus" (Private operators)

3. **Origin City**
   - Usually in UPPERCASE
   - Examples: "SIVAKASI", "MADURAI", "CHENNAI"

4. **Destination City**
   - Usually in UPPERCASE
   - Shown after arrow (→)

5. **Departure Time** (With clock emoji 🕒)
   - 24-hour format
   - Examples: "01:10", "04:15", "05:00"

### Pagination

At bottom of results:
```
Prev  Next
```
- "Prev" button: Go to previous page
- "Next" button: Go to next page
- Buttons are disabled when at first/last page

## Data NOT Available in Listings

The Tamil Vandi website listings do NOT show:
- ❌ Arrival time (only departure)
- ❌ Intermediate stops with timings
- ❌ Fare information
- ❌ Bus route number (separate from operator name)
- ❌ Available seats
- ❌ Bus amenities
- ❌ Journey duration
- ❌ Via route information

## Sample HTML Structure (Conceptual)

```html
<!-- Bus Entry Example -->
<div class="bus-entry">
  <h2>503</h2>                      <!-- Operator/Bus Number -->
  <p>🚌 Moffusil Bus</p>            <!-- Bus Type -->
  <p>SIVAKASI → MADURAI</p>         <!-- Route -->
  <p>🕒 01:10</p>                   <!-- Time -->
</div>
```

Note: Actual HTML structure may vary. Scraper uses flexible parsing.

## Typical Search Results

For popular routes like Sivakasi → Madurai:
- **Number of buses:** 10-20+ per page
- **Pages:** Usually 1-3 pages
- **Data freshness:** Updated periodically by website
- **Coverage:** Both government (TNSTC) and private operators

## Comparison with Other Sources

| Data Point | Tamil Vandi | MTC Official | TNSTC Official |
|------------|-------------|--------------|----------------|
| Bus Number | ✅ | ✅ | ✅ |
| Bus Type | ✅ | ✅ | ✅ |
| Origin | ✅ | ✅ | ✅ |
| Destination | ✅ | ✅ | ✅ |
| Departure Time | ✅ | ✅ | ✅ |
| Arrival Time | ❌ | ❌ | ✅ |
| Stops Detail | ❌ | ❌ | ✅ |
| Fare | ❌ | ❌ | ✅ |
| Real-time | ❌ | ❌ | ❌ |

## Example: Sivakasi to Madurai Results

Based on actual website content:

```
503          - Moffusil Bus - 01:10
STAR         - Private Bus  - 04:15
RSR          - Private Bus  - 05:00
VENKATESHWARA - Private Bus  - 01:20
511          - Moffusil Bus - 04:35
KNRK         - Private Bus  - 05:02
SRINIVASA    - Private Bus  - 02:50
SNR          - Private Bus  - 04:50
704          - Moffusil Bus - 05:10
```

## Data Quality Observations

### Strengths
✅ Simple, clean data  
✅ Wide coverage (all Tamil Nadu)  
✅ Both government and private buses  
✅ Regularly updated  
✅ Easy to parse  

### Limitations
⚠️ Limited details (only basic info)  
⚠️ No real-time updates  
⚠️ No fare information  
⚠️ No stop-wise timings  
⚠️ No seat availability  

## Scraper Adaptation Notes

The scraper handles:

1. **Variable page structure**: Uses multiple parsing strategies
2. **Missing data**: Gracefully handles absent fields
3. **Pagination**: Automatically follows "Next" links
4. **Text variations**: Handles different formats and encodings
5. **Emoji handling**: Properly processes Unicode emoji characters

## Best Practices for City Names

When using the scraper:
- Use city names as they appear on the website
- Usually UPPERCASE (but scraper handles case-insensitive)
- Common cities:
  - CHENNAI
  - MADURAI
  - COIMBATORE
  - TRICHY (or TIRUCHIRAPPALLI)
  - SALEM
  - ERODE
  - TIRUPPUR
  - SIVAKASI
  - KARUR
  - THANJAVUR

## URL Parameters

The website accepts:
- `from`: Origin city name
- `to`: Destination city name

No other parameters observed:
- ❌ No date parameter (shows all scheduled services)
- ❌ No bus type filter
- ❌ No operator filter
- ❌ No time range filter

Pagination is handled via clicking "Next" button, not URL parameters.

## Website Behavior

- **Loading time**: 2-3 seconds per page
- **Response time**: Generally fast
- **Error handling**: Shows "No results" for invalid routes
- **Popups**: May show promotional popups (scraper handles these)
- **Mobile friendly**: Website is responsive
- **JavaScript**: Required for interactive elements

## Scraper Implementation Strategy

The Tamil Vandi scraper uses:

1. **Primary parsing**: Look for structured elements with bus data
2. **Fallback parsing**: Parse from plain text if structured fails
3. **Pattern matching**: Use regex for time extraction
4. **Progressive enhancement**: Collect as much data as available
5. **Defensive coding**: Handle missing/malformed data gracefully

---

This analysis is based on the website structure as of January 2026.
Website may change over time; scraper may need updates accordingly.
