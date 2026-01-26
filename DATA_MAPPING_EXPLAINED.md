# MTC vs TNSTC Data Mapping Issue - Explained

## The Problem

There's a **structural mismatch** between how MTC and TNSTC store location data:

### MTC Data Structure
```json
{
  "origin_name": "KCBT KILAMBAKKAM",      // Specific terminal name
  "destination_name": "BROADWAY",          // Specific terminal name
  "route_number": "18A"
}
```
**Uses specific bus terminal names**

### TNSTC Data Structure
```json
{
  "origin": "KILAMBAKKAM",                // City name (simple)
  "destination": "MADURAI",               // City name (simple)
  "route_number": "508J",
  "stops": [                              // Includes intermediate stops
    { "city": "CHENNAI-KILAMBAKKAM-KCBT", "landmark": "KCBT" },
    { "city": "MADURAI", "landmark": "Mattuthavani" }
  ]
}
```
**Uses city names + detailed stops with landmarks**

## Why This Causes Issues

### Issue 1: City vs Terminal Naming
- **TNSTC origin**: `KILAMBAKKAM` (city name)
- **Database entry**: `KCBT KILAMBAKKAM` (specific terminal)
- **Result**: Direct string matching fails ❌

### Issue 2: Multiple Terminals Per City
For Madurai in the database:
```
ID    | Name
------|------------------------
3     | Madurai
62326 | Madurai
62435 | Madurai - Arapalayam
1058  | Madurai - Arappalayam
671   | Madurai - Mattuthavani          ← TNSTC main terminal
62434 | Madurai - Mattuthavani
672   | Madurai - Periyar
```

**Question**: Which one is the TNSTC bus actually stopping at?
- Answer: Look at the `stops` field! TNSTC shows "Mattuthavani" in details

### Issue 3: Stop Information Lost
TNSTC provides detailed stop information:
```json
"stops": [
  { "city": "ARIYALUR", "landmark": "ARIYALUR", "time": "08:30" },
  { "city": "CHENNAI-KILAMBAKKAM-KCBT", "landmark": "CHENNAI KALAIGNAR CBT", "time": "14:40" }
]
```

This maps to intermediate stops but we're only storing origin/destination!

## The Solution

### Approach 1: Use Stop Information (Recommended)
Extract stops and match them to database locations:

```python
for stop in bus['stops']:
    # stop['city'] = "CHENNAI-KILAMBAKKAM-KCBT"
    # Extract meaningful parts
    if 'KILAMBAKKAM' in stop['city']:
        location = "KCBT KILAMBAKKAM"
    if 'MADURAI' in stop['city'] or 'Mattuthavani' in stop['landmark']:
        location = "Madurai - Mattuthavani"
```

### Approach 2: Build Location Mapping from Database
Query the database and build intelligent mapping:

```python
LOCATION_MAPPING = {
    "KILAMBAKKAM": "KCBT KILAMBAKKAM",         # Query finds this
    "MADURAI": "Madurai - Mattuthavani",       # Main TNSTC terminal
    "CHENNAI": "BROADWAY",                      # Main TNSTC terminal
}
```

**Better yet**: For each city, find the terminal with `landmark` field that matches

### Approach 3: Store Location Mapping in Database
Create a `location_alias` or `location_mapping` table:

```sql
CREATE TABLE location_mapping (
    tnstc_name VARCHAR(255),
    database_location_id INT,
    is_primary BOOLEAN,
    PRIMARY KEY (tnstc_name, database_location_id)
);

INSERT INTO location_mapping VALUES
('KILAMBAKKAM', 62571, TRUE),
('MADURAI', 671, TRUE),          -- Mattuthavani terminal
('MADURAI', 1058, FALSE),        -- Alternative: Arappalayam
('CHENNAI', 62548, TRUE),        -- Broadway
```

## Correct TNSTC to Database Mapping

Based on analysis of TNSTC `stops` field:

| TNSTC City | Database Terminal | DB ID | Reason |
|------------|-------------------|-------|--------|
| KILAMBAKKAM | KCBT KILAMBAKKAM | 62571 | Exact match in stops |
| MADURAI | Madurai - Mattuthavani | 671 | TNSTC landmark shows "Mattuthavani" |
| CHENNAI | BROADWAY | 62548 | Primary TNSTC terminus |
| COIMBATORE | COIMBATORE | ? | Need to verify in database |
| SALEM | SALEM | ? | Need to verify in database |

## Why Broadway for CHENNAI?

**Explanation**: 
- TNSTC data shows routes from/to "CHENNAI"
- In TNSTC `stops`, the actual stop is "CHENNAI-KILAMBAKKAM-KCBT"
- But the origin/destination field is just "CHENNAI"
- The primary TNSTC bus terminal in Chennai is BROADWAY (Koyambedu area)
- So TNSTC's "CHENNAI" maps to BROADWAY terminal

However, this is still somewhat ambiguous. **Better approach**: Use the stops information to determine exact terminals.

## Recommended Fix

```python
def resolve_location_from_stops(bus, is_last_stop=True):
    """Extract location from TNSTC stops field instead of origin/destination"""
    if not bus.get('stops'):
        return None
    
    stop = bus['stops'][-1] if is_last_stop else bus['stops'][0]
    city_str = stop.get('city', '')
    landmark = stop.get('landmark', '')
    
    # Parse complex city names like "CHENNAI-KILAMBAKKAM-KCBT"
    if 'KILAMBAKKAM' in city_str:
        return "KCBT KILAMBAKKAM", 62571
    elif 'MADURAI' in city_str or 'Mattuthavani' in landmark:
        return "Madurai - Mattuthavani", 671
    elif 'ARIYALUR' in city_str:
        return "ARIYALUR", get_location_id("ARIYALUR")
    # ... more cases
```

## Summary

**The root cause**: MTC and TNSTC use different location naming conventions
- **MTC**: Specific terminal names (e.g., "KCBT KILAMBAKKAM")
- **TNSTC**: City names + detailed stops (e.g., "KILAMBAKKAM" + stops: "KCBT")

**The fix**: Use TNSTC's `stops` field to get detailed location information and match it against database terminals, not just the origin/destination city names.
