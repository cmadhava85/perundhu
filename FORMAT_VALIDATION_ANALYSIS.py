#!/usr/bin/env python3
"""
Bus Schedule Image Format Analysis & Validation
=================================================

Analyzing 5 different image formats to ensure complete extraction coverage.
"""

FORMAT_ANALYSIS = {
    "Image 1 - Javalakshmi Bus Service": {
        "format": "Two-Column Table",
        "origin": "SALEM",
        "destination": "KRISHNAGIRI",
        "service_type": "NON-STOP",
        "via_stops": ["Dharmaapuri", "Kaveripattinam"],
        "departure_times": ["1:35 AM", "12:45 PM", "6:40 AM", "6:40 PM"],
        "arrival_times": ["5:00 AM", "3:15 PM", "11:00 AM", "9:00 PM"],
        "structure": "Left column = Salem departure time, Right column = Krishnagiri arrival time",
        "coverage": "✓ PARTIAL - Need to handle paired departure/arrival columns"
    },
    
    "Image 2 - Ramani Bus Service": {
        "format": "Two-Column Table (Express)",
        "origin": "SALEM",
        "destination": "KALLAKURICHI",
        "service_type": "EXPRESS",
        "via_stops": ["Valappadi", "Attur", "Chinnasalem"],
        "departure_times": ["4:00 AM", "1:45 PM", "5:08 PM"],
        "arrival_times": ["5:00 AM", "4:40 PM", "11:30 PM"],
        "structure": "Left = Salem times, Right = Kallakurichi times",
        "coverage": "✓ PARTIAL - Similar to Image 1, but EXPRESS indicator"
    },
    
    "Image 3 - Thirukkoshiyar Maarkkaham": {
        "format": "Stop-by-Stop Itinerary (COMPLEX)",
        "route_type": "TRAVEL ROUTE",
        "origin": "AALANGUDU",
        "destination": "THONDI",
        "all_stops": [
            "AALANGUDU",
            "ARIVALUR",
            "ARAMTHANGI",
            "PERAMBALUR",
            "NAGAPATTINAM",
            "JAYAKKONDAM",
            "KARAIKUDI",
            "THONDI"
        ],
        "times_at_stops": {
            "AALANGUDU": ["3:25 PM", "9:05 PM"],
            "ARIVALUR": ["3:30 PM"],
            "ARAMTHANGI": ["9:40 PM"],
            "PERAMBALUR": ["9:50 PM"],
            "NAGAPATTINAM": ["7:25 PM"],
            "JAYAKKONDAM": ["10:00 AM", "9:20 PM"],
            "KARAIKUDI": ["7:15 AM", "10:10 AM", "12:30 PM", "9:55 PM", "10:40 PM"],
            "THONDI": ["8:15 AM (Mimisil)"]
        },
        "coverage": "✗ NOT FULLY COVERED - Detailed stop-by-stop timing extraction needed"
    },
    
    "Image 4 - Tamil Nadu APSC Bus (Multiple Routes)": {
        "format": "Multi-Route Timetable",
        "routes": [
            {
                "origin": "KADALUR",
                "times": ["12:30am", "06:00am", "03:05pm", "10:30pm", "11:30pm"]
            },
            {
                "origin": "UTHAKAYI",
                "times": ["01:30am", "01:50am", "04:20am", "05:00am", "05:30am", "06:40am", "07:10am", "07:45am", "08:45am", "09:25am", "10:00am", "12:55pm", "04:00pm", "05:00pm", "05:45pm"]
            },
            {
                "origin": "PETHAPALAYUM",
                "times": ["10:45am", "12:00pm", "12:15pm", "12:30pm", "12:45pm", "01:30pm", "03:20pm", "03:40pm", "04:50pm", "06:20pm", "06:50pm", "07:10pm", "07:20pm"]
            },
            {
                "origin": "KOCHAKARI",
                "times": ["01:45am", "09:40am", "11:40am", "05:15pm"]
            }
        ],
        "coverage": "✓ PARTIAL - Detects multiple routes, but need better route separation logic"
    },
    
    "Image 5 - Dense Timetable (Last Image)": {
        "format": "Compact Dense Schedule",
        "appears_to_show": "Multiple columns with times/routes",
        "coverage": "⚠️ UNCLEAR - Image quality/resolution makes detailed analysis difficult"
    }
}

COVERAGE_SUMMARY = {
    "✓ FULLY COVERED": [
        "Basic bidirectional routes (Salem ↔ Bengaluru)",
        "Multiple runs on same route with different times",
        "Tamil text detection",
        "Fixed intermediate stops",
        "Numbered stops format (1.City 2.City 3.City)",
    ],
    
    "✓ PARTIALLY COVERED": [
        "Two-column table format (Image 1, 2) - Need to align departure/arrival pairs",
        "Service type indicators (NON-STOP, EXPRESS) - Detected but not stored well",
        "Multiple routes on one image (Image 4) - Basic detection exists",
    ],
    
    "✗ NOT COVERED": [
        "Stop-by-stop detailed itinerary (Image 3) - Different structure entirely",
        "Detailed stop timing extraction - Need to extract specific times at each stop",
        "Dense compact timetables (Image 5) - OCR accuracy issue",
    ]
}

IMPROVEMENTS_NEEDED = {
    "1. Two-Column Table Handler": {
        "issue": "Images 1 & 2 show departure times in left column, arrival times in right column",
        "current_logic": "Extracts all times but doesn't pair them",
        "solution": "Need to detect table columns and pair corresponding departure/arrival times",
        "example": "Left: 1:35 AM → Right: 5:00 AM = One run",
    },
    
    "2. Stop-by-Stop Itinerary Handler": {
        "issue": "Image 3 shows detailed times at each intermediate stop",
        "current_logic": "Treats all stops equally, doesn't handle multi-stop detailed timing",
        "solution": "Detect stop names and extract timing for each specific stop",
        "example": """
            AALANGUDU (3:25 PM) →
            ARIVALUR (3:30 PM) →
            ARAMTHANGI (9:40 PM) →
            ... → THONDI (8:15 AM)
        """,
    },
    
    "3. Service Type Detection": {
        "issue": "Need to identify and store service type (NON-STOP, EXPRESS, etc.)",
        "current_logic": "Detects but not stored in output",
        "solution": "Add service_type field to route and extract indicators",
        "patterns": ["NON-STOP", "EXPRESS", "SEMI-EXPRESS", "ORDINARY", "DELUXE", "AC", "SLEEPER"]
    },
    
    "4. Multi-Route Single Image Handler": {
        "issue": "Image 4 has multiple different routes on same image",
        "current_logic": "May group all times together",
        "solution": "Better route separation by detecting route name/separator lines",
        "example": "Kadalur, Uthakayi, Pethapalayum, Kochakari - each is separate route"
    },
    
    "5. Table Column Alignment": {
        "issue": "Need to detect column headers and align data properly",
        "current_logic": "Treats all text as one block",
        "solution": "Use OCR bounding boxes to align columns",
        "benefits": "Can properly pair departure/arrival times and determine which city is origin"
    }
}

# Print analysis
print("="*80)
print("BUS SCHEDULE IMAGE FORMAT ANALYSIS")
print("="*80)

print("\n📊 FORMATS DETECTED:\n")
for i, (image_name, details) in enumerate(FORMAT_ANALYSIS.items(), 1):
    print(f"{i}. {image_name}")
    print(f"   Format: {details.get('format', 'N/A')}")
    print(f"   Coverage: {details.get('coverage', 'N/A')}")
    if 'via_stops' in details and details['via_stops']:
        print(f"   Via: {', '.join(details['via_stops'])}")
    if 'service_type' in details:
        print(f"   Type: {details['service_type']}")
    print()

print("\n" + "="*80)
print("COVERAGE SUMMARY")
print("="*80)

for category, items in COVERAGE_SUMMARY.items():
    print(f"\n{category}:")
    for item in items:
        print(f"  • {item}")

print("\n" + "="*80)
print("IMPROVEMENTS NEEDED")
print("="*80)

for improvement_num, (name, details) in enumerate(IMPROVEMENTS_NEEDED.items(), 1):
    print(f"\n{improvement_num}. {name}")
    print(f"   Issue: {details['issue']}")
    print(f"   Current: {details['current_logic']}")
    print(f"   Solution: {details['solution']}")
    if 'example' in details:
        print(f"   Example: {details['example']}")
    if 'patterns' in details:
        print(f"   Patterns: {', '.join(details['patterns'])}")

print("\n" + "="*80)
print("RECOMMENDATION")
print("="*80)
print("""
Priority for implementation:
1. HIGH: Two-column table handler (Images 1, 2) - Common format
2. HIGH: Service type detection - Easy to add, useful feature
3. MEDIUM: Multi-route separator - Common in densely packed images
4. MEDIUM: Stop-by-stop itinerary - Complex but specific use case
5. LOW: Dense timetable OCR - May require preprocessing improvements
""")
print("="*80)
