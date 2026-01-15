# Bus Timetable Extraction Correction Report

## Problem Image
**URL:** https://farm1.staticflickr.com/334/18871722824_a8c7f95410_k.jpg

## Current (WRONG) Extraction
```json
{
  "service_code": "IMGTIRMAD0610",
  "origin": "TIRUPPUR",
  "destination": "MADURAI",
  "departure_time": "06:10",
  "arrival_time": "11:00",
  "stops": [...garbled...]
}
```

## Issue Analysis
1. **Wrong Origin**: Says "TIRUPPUR" but should be "RAMESHWARAM" (from "Perundhu Nilayam" at top)
2. **Wrong Format Handling**: Doesn't parse "Via" stops properly
3. **OCR Quality**: Text is very garbled due to image compression/format

## What You See vs What OCR Extracted

### What the Image ACTUALLY Shows (according to you):
- **Origin**: Rameshwaram (labeled as "Perundhu Nilayam")
- **Format**: Has "Via" intermediate stops
- **Destination**: [You need to tell us]

### What OCR Extracted (GARBLED):
```
HP0 5E1G 5TH CUV5AGH01THH5 8N51D
5) 5Y 1 3) WA11 1 ITS GA 0Y YA1 J0ATT 1 {7 T15 I WIT (5:
50 INDE NATPNCATUERE, WWW. TNSTEB10G I IN
...
COIMBATORE MADURAI DHARAPURAM 06:10 11:00 13:40
TIRUPPUR MADURAI DHARAPURAM 08:50 12:05
ORDINARY 3X2 SEATER GANE 06:30 09:45 21:15
...
```

## What We Need From You

Please look at the image and provide:

1. **Origin City**: ___Rameshwaram____________
2. **Destination City**: __Chennai____________
3. **Departure Time**: ____16:00___________
4. **Intermediate Stops (Via)**: 
   - Stop 1: __Trichy___________ @ Time: _____
   - Stop 2: _____________ @ Time: _____
   - Stop 3: _____________ @ Time: _____
   - (add more as needed)
5. **Route Type**: (Normal / Via with stops / Other: ___)

## Improvements Made

✅ Added LOCATION_TO_CITY mapping (e.g., "Perundhu Nilayam" → "RAMESHWARAM")
✅ Added detect_via_format() method to handle "Via Stop1 Via Stop2" format
✅ Improved extract_stops() to parse Via format separately
✅ Added more cities to KNOWN_CITIES list

## Next Steps

Once you provide the correct data:
1. We'll create a corrected entry for this image
2. Test the improved parser against it
3. Refine the logic further if needed
4. Re-run full extraction with improved logic

---

**File Location**: `/Users/mchand69/Documents/perundhu/tnstc_timetable_results/all_results.json`

Look at the entry with `"image_source": "https://farm1.staticflickr.com/334/18871722824_a8c7f95410_k.jpg"`
