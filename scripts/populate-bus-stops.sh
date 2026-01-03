#!/bin/bash

# Populate bus stops from OSM/Nominatim for all major Tamil Nadu cities

echo "🚀 Fetching and populating bus stops for Tamil Nadu cities..."
echo ""

# Function to fetch and insert bus stops for a city
fetch_and_insert_bus_stops() {
  local city=$1
  echo "🔍 $city..."
  
  # Search Nominatim for bus stations and bus stops
  local response=$(curl -s "https://nominatim.openstreetmap.org/search?q=bus+station+$city,+Tamil+Nadu,+India&format=json&limit=8&namedetails=1" \
    -H "User-Agent: Perundhu Bus App" \
    -H "Accept-Language: en,ta")
  
  # If no bus stations found, try bus stops
  if [ "$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)" -eq 0 ]; then
    response=$(curl -s "https://nominatim.openstreetmap.org/search?q=bus+stop+$city,+Tamil+Nadu,+India&format=json&limit=8&namedetails=1" \
      -H "User-Agent: Perundhu Bus App" \
      -H "Accept-Language: en,ta")
  fi
  
  # Extract and insert bus stops
  echo "$response" | python3 << 'PYTHON'
import sys
import json

try:
  data = json.load(sys.stdin)
  if data:
    for item in data[:5]:  # Limit to 5 per city
      name = item.get('namedetails', {}).get('name:en') or item.get('name', '')
      if name:
        lat = item['lat']
        lon = item['lon']
        print(f"('{name}', {lat}, {lon}, '$CITY', '$CITY'),")
except:
  pass
PYTHON
  
  sleep 1.5  # Rate limiting
}

# Major Tamil Nadu cities
CITIES=(
  "Madurai"
  "Chennai"
  "Coimbatore"
  "Salem"
  "Tiruppur"
  "Trichy"
  "Erode"
  "Vellore"
  "Ranipet"
  "Kanchipuram"
  "Chengalpattu"
  "Villupuram"
  "Tiruvannamalai"
  "Cuddalore"
  "Chidambaram"
  "Thanjavur"
  "Kumbakonam"
  "Perambalur"
  "Pudukkottai"
  "Ariyalur"
  "Namakkal"
  "Dindigul"
  "Theni"
  "Tirunelveli"
  "Thoothukudi"
  "Nagercoil"
  "Kanyakumari"
  "Virudunagar"
  "Sivakasi"
  "Aruppukottai"
  "Pollachi"
  "Udumalaipet"
  "Hosur"
)

echo "Collecting bus stops..."
echo ""

# Collect all inserts in a variable
SQL_INSERTS="INSERT INTO locations (name, latitude, longitude, district, nearby_city) VALUES "
FIRST=true

for city in "${CITIES[@]}"; do
  response=$(curl -s "https://nominatim.openstreetmap.org/search?q=bus+station+$city,+Tamil+Nadu,+India&format=json&limit=5&namedetails=1" \
    -H "User-Agent: Perundhu Bus App" \
    -H "Accept-Language: en,ta")
  
  # If no results, try bus stops
  count=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
  if [ "$count" -eq 0 ]; then
    response=$(curl -s "https://nominatim.openstreetmap.org/search?q=bus+stop+$city,+Tamil+Nadu,+India&format=json&limit=5&namedetails=1" \
      -H "User-Agent: Perundhu Bus App" \
      -H "Accept-Language: en,ta")
  fi
  
  # Process results
  echo "$response" | python3 << PYTHON
import sys, json
city = "$city"
try:
  data = json.load(sys.stdin)
  for item in data[:3]:  # Limit to 3 per city
    name = item.get('namedetails', {}).get('name:en') or item.get('namedetails', {}).get('name') or item.get('name', '')
    if name and len(name) > 3:
      print(f"  ✓ {name}")
except:
  pass
PYTHON
  
  sleep 1.2  # Rate limiting
done

echo ""
echo "✅ Bus stop collection completed!"
echo ""
echo "Note: Run the following command to insert the bus stops into the database:"
echo "cd /Users/mchand69/Documents/perundhu && node scripts/insert-bus-stops.js"
