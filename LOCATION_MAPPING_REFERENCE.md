# Correct Location Mapping: MTC vs TNSTC

## The Key Difference

| Data Type | Coverage | Location Type | Example |
|-----------|----------|---------------|---------|
| **MTC** | **Chennai ONLY** (Local buses) | Specific local neighborhoods & terminals | BROADWAY (62548), M.G.R.KOYAMBEDU (62547), TAMBARAM (62427) |
| **TNSTC** | **Inter-state** (Long-distance) | Main bus terminals for each city | Chennai Mofussil Bus Terminus (691), Madurai - Mattuthavani (671) |

## Chennai Bus Terminals

### Local Buses (MTC Only)
These are used for routes WITHIN Chennai:
- **62548 | BROADWAY** - Local bus terminus
- **62547 | M.G.R.KOYAMBEDU** - Local bus terminus
- **62427 | Chennai - Tambaram** - Local bus route
- **62429 | Chennai - Madhavaram (MMBS)** - Local area

### Inter-state Buses (TNSTC Only)
These are used for routes TO other cities:
- **691 | Chennai Mofussil Bus Terminus** ← Main TNSTC terminal for all inter-state buses
- **550 | Koyambedu Mofussil Bus Terminal** - Also used for long-distance

## Correct Mapping for Route 18A

### Example: Route 18A (TNSTC - Chennai to Madurai via Kilambakkam)

**TNSTC Data:**
```json
{
  "route_number": "18A",
  "busName": "TNSTC",
  "origin": "CHENNAI",
  "destination": "MADURAI",
  "stops": [
    { "city": "CHENNAI", "landmark": "Mofussil", "time": "06:00" },
    { "city": "CHENNAI-KILAMBAKKAM-KCBT", "landmark": "KCBT", "time": "06:45" },
    { "city": "MADURAI", "landmark": "Mattuthavani", "time": "14:40" }
  ]
}
```

**Correct Mapping:**

| Stop | City | → | Mapped Location | → | DB ID | Reason |
|------|------|---|-----------------|----|----|-------|
| 1 | CHENNAI | → | Chennai Mofussil Bus Terminus | → | **691** | Main TNSTC terminal (NOT BROADWAY) |
| 2 | CHENNAI-KILAMBAKKAM-KCBT | → | KCBT KILAMBAKKAM | → | **62571** | Specific inter-state terminal |
| 3 | MADURAI | → | Madurai - Mattuthavani | → | **671** | Main TNSTC terminal in Madurai |

**Why NOT BROADWAY?**
- BROADWAY (62548) is a **LOCAL MTC terminus** for Chennai buses only
- Route 18A is a **TNSTC inter-state route** 
- TNSTC uses the main **Chennai Mofussil Bus Terminus** (691) for all inter-state routes
- These are completely different operational systems

## Database Records Created

After importing:
```sql
-- Leg 1: Chennai (main terminal) → Kilambakkam
INSERT INTO buses VALUES (
  bus_number='18A', from_location_id=691, to_location_id=62571, ...
);

-- Leg 2: Kilambakkam → Madurai
INSERT INTO buses VALUES (
  bus_number='18A', from_location_id=62571, to_location_id=671, ...
);
```

## API Response Flow

When user searches: **Chennai → Madurai**

If user selects "Chennai Mofussil Bus Terminus" (691):
1. ✅ Find direct buses from 691 to Madurai (671)
2. ✅ Find buses from 691 to intermediate stops (62571 - Kilambakkam)
3. ✅ Find buses from 62571 to 671
4. ✅ **Return multi-leg journey**: 691 → 62571 → 671

## Chennai Terminal IDs Reference

```
ID    | Name                                    | Type
------|----------------------------------------|----------
1     | Chennai                                | Generic
36    | Chennai Central                        | Station
691   | Chennai Mofussil Bus Terminus          | ✅ TNSTC Main
550   | Koyambedu Mofussil Bus Terminal        | TNSTC
62324 | Chennai                                | Generic
62428 | Chennai - CMBT (Koyambedu)             | CMBT
62429 | Chennai - Madhavaram (MMBS)            | Madhavaram
62427 | Chennai - Tambaram                     | Local
62430 | Chennai - Broadway                     | Local
62548 | BROADWAY                               | ⚠️ MTC Local Only
62547 | M.G.R.KOYAMBEDU                        | ⚠️ MTC Local Only
62638 | CHENNAI AIRPORT                        | Airport
62458 | CHENNAI KALAIGNAR CBT                  | Inter-state (alternative)
62459 | CHENNAI KALAIGNAR CBT                  | Inter-state (alternative)
```

## Summary

**TNSTC routes starting from Chennai must use:**
- ✅ **691 - Chennai Mofussil Bus Terminus** (Inter-state main terminal)

**NOT:**
- ❌ **62548 - BROADWAY** (MTC local terminal)
- ❌ **62547 - M.G.R.KOYAMBEDU** (MTC local terminal)

**This ensures:**
- MTC local buses use local terminals (BROADWAY, KOYAMBEDU, etc.)
- TNSTC inter-state buses use inter-state terminals (Mofussil, CMBT, etc.)
- Database correctly reflects actual bus operations
- API returns accurate results for multi-leg journeys
