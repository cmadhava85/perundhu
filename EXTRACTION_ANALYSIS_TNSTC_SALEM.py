#!/usr/bin/env python3
"""
Analysis: How the TNSTC Salem-Bengaluru image would be extracted
================================================================

This image shows:
- Service: "1 to 5 Flyover Service" (SALEM ↔ BENGALURU)
- Stops: 1.Salem 2.Dharmaapuri 3.Krishnagiri 4.Hosur 5.Bengaluru
- FROM SALEM section: 24 different departure times
- FROM BENGALURU section: 23 different departure times (bidirectional)
- Journey Time: 04:45 Hours
"""

# Text extracted from image
OCR_TEXT = """
TNSTC SALEM
1 to 5 Flyover Service
Journey Time : 04:45 Hrs
Stops : 1.Salem 2.Dharmaapuri
3.Krishnagiri 4.Hosur 5.Bengaluru
From SALEM
00:15, 01:45, 02:30, 03:15, 04:20, 05:00, 05:45, 06:11
06:45, 09:10, 09:35, 12:07, 13:05, 14:15, 15:40, 16:32
17:10, 18:25, 19:30, 21:00, 22:00, 22:30, 22:55, 23:30

From BENGALURU
00:15, 01:15, 03:15, 04:00, 04:25, 04:40, 05:15, 06:00
07:10, 08:15, 09:15, 10:00, 10:45, 11:10, 12:00, 12:30
14:40, 15:15, 18:00, 18:50, 20:00, 21:30, 22:20, 23:00
"""

# Expected extraction
EXTRACTION_ANALYSIS = {
    "origin_cities": ["SALEM", "BENGALURU"],
    "destination_cities": ["BENGALURU", "SALEM"],
    "stops": ["SALEM", "DHARMAAPURI", "KRISHNAGIRI", "HOSUR", "BENGALURU"],
    
    "from_salem_times": [
        "00:15", "01:45", "02:30", "03:15", "04:20", "05:00", "05:45", "06:11",
        "06:45", "09:10", "09:35", "12:07", "13:05", "14:15", "15:40", "16:32",
        "17:10", "18:25", "19:30", "21:00", "22:00", "22:30", "22:55", "23:30"
    ],
    
    "from_bengaluru_times": [
        "00:15", "01:15", "03:15", "04:00", "04:25", "04:40", "05:15", "06:00",
        "07:10", "08:15", "09:15", "10:00", "10:45", "11:10", "12:00", "12:30",
        "14:40", "15:15", "18:00", "18:50", "20:00", "21:30", "22:20", "23:00"
    ],
    
    "journey_time": "04:45",
}

# How many routes would be extracted
EXTRACTION_BREAKDOWN = """
EXTRACTION BREAKDOWN
====================

Current extraction logic would create:
- SALEM → BENGALURU: 24 separate bus RUNS (one for each departure time)
- BENGALURU → SALEM: 23 separate bus RUNS (one for each departure time)

Total: 47 individual bus service entries

Each entry would have:
- service_code: IMGSALBNG00XX (for each time)
- origin: SALEM or BENGALURU
- destination: BENGALURU or SALEM
- departure_time: Each of the 24 or 23 times
- arrival_time: 04:45 hours later (calculated)
- stops: DHARMAAPURI, KRISHNAGIRI, HOSUR (intermediate stops)
- bidirectional: true (service runs both ways)
"""

# JSON output format
SAMPLE_JSON_OUTPUT = [
    {
        "service_code": "IMGSALBNG0015_RUN1",
        "origin": "SALEM",
        "destination": "BENGALURU",
        "departure_time": "00:15",
        "arrival_time": "05:00",
        "duration": "04:45",
        "stops": [
            {"city": "DHARMAAPURI", "time": "01:20"},
            {"city": "KRISHNAGIRI", "time": "02:30"},
            {"city": "HOSUR", "time": "04:00"}
        ],
        "route_info": "1 to 5 Flyover Service",
        "journey_time": "04:45 Hours",
        "bidirectional": True,
    },
    {
        "service_code": "IMGSALBNG0145_RUN2",
        "origin": "SALEM",
        "destination": "BENGALURU",
        "departure_time": "01:45",
        "arrival_time": "06:30",
        "duration": "04:45",
        "stops": [
            {"city": "DHARMAAPURI", "time": "02:50"},
            {"city": "KRISHNAGIRI", "time": "04:00"},
            {"city": "HOSUR", "time": "05:30"}
        ],
        "route_info": "1 to 5 Flyover Service",
        "journey_time": "04:45 Hours",
        "bidirectional": True,
    },
    # ... 45 more entries for all times
    {
        "service_code": "IMGBNG SAL0015_RUN1",
        "origin": "BENGALURU",
        "destination": "SALEM",
        "departure_time": "00:15",
        "arrival_time": "05:00",
        "duration": "04:45",
        "stops": [
            {"city": "HOSUR", "time": "01:30"},
            {"city": "KRISHNAGIRI", "time": "02:45"},
            {"city": "DHARMAAPURI", "time": "03:50"}
        ],
        "route_info": "1 to 5 Flyover Service",
        "journey_time": "04:45 Hours",
        "bidirectional": True,
    }
]

# Potential issues and how they'd be handled
EXTRACTION_ISSUES = """
CHALLENGES & HANDLING
====================

1. **Many times in one section**
   Challenge: 24 times listed in a comma-separated list
   How handled: DataExtractor.extract_times() finds all times via regex
   Output: Multiple separate runs (one per time)
   
2. **Two-directional service**
   Challenge: "From SALEM" and "From BENGALURU" sections
   How handled: 
   - If bidirectional detected → bidirectional: true
   - Creates routes for both directions
   
3. **Intermediate stops**
   Challenge: Need to determine arrival times at intermediate stops
   How handled: 
   - Extracts stop names (DHARMAAPURI, KRISHNAGIRI, HOSUR)
   - Proportionally distributes journey time across stops
   - Or marks as "UNKNOWN" if timing not provided
   
4. **Formatted time lists**
   Challenge: Times listed as "00:15, 01:45, 02:30..." in one line
   How handled: Regex pattern catches all HH:MM format times
   Pattern: \\b([0-1]?[0-9]|2[0-3]):([0-5][0-9])\\b
   Result: 47 separate times extracted
   
5. **Service name/type**
   Challenge: "1 to 5 Flyover Service" indicates service type
   How handled: Stored in route_info field
   
6. **Journey duration**
   Challenge: "Journey Time : 04:45 Hrs" 
   How handled: Extracted and used to calculate arrival times
   Format: Detected via regex: \\d+:\\d+ Hours
"""

# Code to show actual extraction
print(__doc__)
print("\n" + "="*70)
print("EXTRACTION ANALYSIS: TNSTC SALEM-BENGALURU FLYOVER SERVICE")
print("="*70)

print("\n📊 ANALYSIS:")
print(f"   Origin Cities Found: {EXTRACTION_ANALYSIS['origin_cities']}")
print(f"   Destination Cities: {EXTRACTION_ANALYSIS['destination_cities']}")
print(f"   Stops: {' → '.join(EXTRACTION_ANALYSIS['stops'])}")
print(f"   Journey Time: {EXTRACTION_ANALYSIS['journey_time']}")

print(f"\n📅 DEPARTURE TIMES FROM SALEM: {len(EXTRACTION_ANALYSIS['from_salem_times'])} runs")
print(f"   {', '.join(EXTRACTION_ANALYSIS['from_salem_times'][:8])}... (+16 more)")

print(f"\n📅 DEPARTURE TIMES FROM BENGALURU: {len(EXTRACTION_ANALYSIS['from_bengaluru_times'])} runs")
print(f"   {', '.join(EXTRACTION_ANALYSIS['from_bengaluru_times'][:8])}... (+15 more)")

total_runs = len(EXTRACTION_ANALYSIS['from_salem_times']) + len(EXTRACTION_ANALYSIS['from_bengaluru_times'])
print(f"\n✅ TOTAL EXTRACTED RUNS: {total_runs}")

print("\n" + "-"*70)
print("EXTRACTION STRUCTURE")
print("-"*70)

print(f"""
Route 1: SALEM → BENGALURU (24 runs)
  Times: 00:15, 01:45, 02:30, 03:15, 04:20, 05:00, 05:45, 06:11,
         06:45, 09:10, 09:35, 12:07, 13:05, 14:15, 15:40, 16:32,
         17:10, 18:25, 19:30, 21:00, 22:00, 22:30, 22:55, 23:30
  Stops: DHARMAAPURI → KRISHNAGIRI → HOSUR → BENGALURU
  Journey: 04:45 Hours
  Bidirectional: Yes

Route 2: BENGALURU → SALEM (23 runs)
  Times: 00:15, 01:15, 03:15, 04:00, 04:25, 04:40, 05:15, 06:00,
         07:10, 08:15, 09:15, 10:00, 10:45, 11:10, 12:00, 12:30,
         14:40, 15:15, 18:00, 18:50, 20:00, 21:30, 22:20, 23:00
  Stops: HOSUR → KRISHNAGIRI → DHARMAAPURI → SALEM
  Journey: 04:45 Hours
  Bidirectional: Yes
""")

print("\n" + "="*70)
print(EXTRACTION_ISSUES)
print("="*70)
