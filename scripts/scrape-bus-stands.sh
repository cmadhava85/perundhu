#!/bin/bash

# Scrape bus stands from Nominatim and insert into MySQL database

echo "🚀 Starting bus stand scraper for Tamil Nadu..."
echo ""

CITIES=(
  "Aruppukottai"
  "Sivakasi"
  "Madurai"
  "Virudunagar"
  "Tirunelveli"
  "Thoothukudi"
  "Dindigul"
  "Theni"
  "Nagercoil"
  "Kanyakumari"
  "Tiruppattur"
  "Chengalpattu"
  "Kanchipuram"
  "Vellore"
  "Ranipet"
  "Krishnagiri"
  "Hosur"
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
  "Salem"
  "Erode"
  "Tiruppur"
  "Coimbatore"
  "Pollachi"
  "Trichy"
)

# Function to search and insert bus stands for a city
search_and_insert() {
  local city="$1"
  
  echo "🔍 Searching for bus stands in $city..."
  
  # Search using curl and Nominatim API
  local query="bus%20station%20$city%2C%20Tamil%20Nadu%2C%20India"
  local response=$(curl -s "https://nominatim.openstreetmap.org/search?q=${query}&format=json&countrycodes=in&limit=5&addressdetails=1&namedetails=1" \
    -H "User-Agent: Perundhu Bus App (https://perundhu.com)" \
    -H "Accept-Language: en,ta")
  
  # Parse JSON response and extract bus stands
  echo "$response" | jq -r '.[] | select((.type == "bus_station" or .type == "bus_stop" or (.class == "amenity" and (.type == "bus_station" or .type == "bus_stop"))) | {name: (.namedetails.["name:en"] // .namedetails.name // .name // (.display_name | split(",")[0])), lat: .lat, lon: .lon}) | select(.name) | "\(.name)|\(.lat)|\(.lon)"' | while IFS='|' read -r name lat lon; do
    
    if [ ! -z "$name" ] && [ ${#name} -gt 5 ]; then
      # Check if already exists
      local count=$(mysql -h localhost -u root -proot -D perundhu -e "SELECT COUNT(*) as cnt FROM locations WHERE LOWER(name) = LOWER('$name')" 2>/dev/null | tail -1)
      
      if [ "$count" = "0" ]; then
        # Insert into database
        mysql -h localhost -u root -proot -D perundhu -e "INSERT INTO locations (name, latitude, longitude, district, nearby_city, created_at, updated_at) VALUES ('$name', $lat, $lon, '$city', '$city', NOW(), NOW())" 2>/dev/null
        echo "  ✅ $name"
      else
        echo "  ⏭️  Duplicate: $name"
      fi
    fi
  done
  
  # Add delay for Nominatim rate limit
  sleep 2
}

# Loop through all cities
for city in "${CITIES[@]}"; do
  search_and_insert "$city"
done

echo ""
echo "✅ Bus stand scraping completed!"
