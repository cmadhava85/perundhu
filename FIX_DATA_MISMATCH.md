# How to Fix MTC vs TNSTC Data Mismatch

## Quick Answer: Why "Chennai" → "Broadway"?

**TNSTC** uses city-level data:
- origin = "CHENNAI" (the city)
- destination = "MADURAI" (the city)

**Database** has specific terminals:
- BROADWAY (62548) = Main TNSTC terminal in Chennai
- KCBT KILAMBAKKAM (62571) = Terminal in Kilambakkam area
- Madurai - Mattuthavani (671) = Main TNSTC terminal in Madurai

**Mapping Logic**: When TNSTC says a bus goes to "CHENNAI", it means the main TNSTC terminal in Chennai, which is **BROADWAY**.

## The Better Solution: Use TNSTC Stops

Instead of mapping city names, use the **stops field** which TNSTC provides with detailed terminal information:

```json
{
  "origin": "ARIYALUR",           // City name (generic)
  "destination": "CHENNAI",       // City name (generic)
  "stops": [
    {
      "city": "ARIYALUR",
      "landmark": "ARIYALUR",
      "time": "08:30"
    },
    {
      "city": "CHENNAI-KILAMBAKKAM-KCBT",    // Detailed!
      "landmark": "KCBT",                     // Terminal name!
      "time": "14:40"
    }
  ]
}
```

The stops field tells us:
- First stop: ARIYALUR
- Last stop: **CHENNAI-KILAMBAKKAM-KCBT** → Maps to "KCBT KILAMBAKKAM" in DB

## Files Updated

### 1. `import_tnstc_to_database.py`
- New function: `resolve_location_from_stop()` - extracts terminal info from stops
- Uses first and last stop instead of origin/destination fields
- Provides detailed error reporting for unmapped locations

### 2. `DATA_MAPPING_EXPLAINED.md`
- Documents the root cause of the mismatch
- Explains why simple city-name mapping is problematic
- Provides recommended solutions

## How to Run

```bash
cd /Users/mchand69/Documents/perundhu
python3 import_tnstc_to_database.py
```

## What This Does

1. **Loads** TNSTC consolidated JSON data
2. **Extracts** first and last stops from each bus
3. **Maps** stop locations to database terminals using `resolve_location_from_stop()`
4. **Queries** database to find matching location IDs
5. **Inserts** TNSTC buses into the `buses` table with correct location mappings
6. **Reports** any location mapping failures

## Expected Result

After running this script, you should see:
- Kilambakkam → Madurai routes populated in the database
- Broadway → Kilambakkam → Madurai multi-leg routes available
- API returns results for Broadway → Madurai searches

## Example: Route 18A (Broadway → Madurai through Kilambakkam)

### TNSTC Data
```json
{
  "route_number": "18A",
  "origin": "CHENNAI",
  "destination": "MADURAI",
  "stops": [
    { "city": "BROADWAY", "time": "06:00" },
    { "city": "CHENNAI-KILAMBAKKAM-KCBT", "time": "06:45" },
    { "city": "MADURAI", "time": "14:40" }
  ]
}
```

### How It Gets Mapped

| Stop | TNSTC City | → | Mapped Terminal | → | Database ID |
|------|------------|---|-----------------|----|----|
| 1 | BROADWAY | → | BROADWAY | → | 62548 |
| 2 | CHENNAI-KILAMBAKKAM-KCBT | → | KCBT KILAMBAKKAM | → | 62571 |
| 3 | MADURAI | → | Madurai - Mattuthavani | → | 671 |

### Database Records Created

1. Bus 1: 62548 → 62571 (Broadway to Kilambakkam)
2. Bus 2: 62571 → 671 (Kilambakkam to Madurai)

### API Response
When user searches: Broadway (62548) → Madurai (671)
- ✅ Finds Bus 1 direct connection to Kilambakkam
- ✅ Finds Bus 2 from Kilambakkam to Madurai
- ✅ Returns multi-leg journey results

## Testing the Import

```bash
# Run full import
python3 import_tnstc_to_database.py

# Then verify in database
mysql -u root -proot perundhu -e "SELECT COUNT(*) FROM buses WHERE source='TNSTC';"

# Check specific route
mysql -u root -proot perundhu -e "SELECT bus_number, from_location_id, to_location_id FROM buses WHERE bus_number='18A' AND source='TNSTC' LIMIT 5;"
```

## Troubleshooting

If you see "Location Mapping Failures", it means:
1. A stop city couldn't be matched to any database location
2. Need to add more entries to the `resolve_location_from_stop()` function
3. Or add missing locations to the database's `locations` table
