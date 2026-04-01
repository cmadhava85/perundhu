#!/bin/bash
# Test connecting routes functionality

BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"

echo "Testing Connecting Routes Feature"
echo "=================================="
echo ""

# First, get some location IDs to test with
echo "1. Getting sample locations..."
curl -s "${BACKEND_URL}/api/v1/locations/autocomplete?query=Chennai&limit=1" | jq -r '.[0] | "Chennai: ID=\(.id)"'
curl -s "${BACKEND_URL}/api/v1/locations/autocomplete?query=Madurai&limit=1" | jq -r '.[0] | "Madurai: ID=\(.id)"'
curl -s "${BACKEND_URL}/api/v1/locations/autocomplete?query=Aruppukottai&limit=1" | jq -r '.[0] | "Aruppukottai: ID=\(.id)"'

echo ""
echo "2. Test Case: Chennai to Madurai (should have direct buses)"
CHENNAI_ID=$(curl -s "${BACKEND_URL}/api/v1/locations/autocomplete?query=Chennai&limit=1" | jq -r '.[0].id')
MADURAI_ID=$(curl -s "${BACKEND_URL}/api/v1/locations/autocomplete?query=Madurai&limit=1" | jq -r '.[0].id')

if [ "$CHENNAI_ID" != "null" ] && [ "$MADURAI_ID" != "null" ]; then
  echo "Testing Chennai (ID: $CHENNAI_ID) to Madurai (ID: $MADURAI_ID)"
  curl -s "${BACKEND_URL}/api/v1/bus-schedules/connecting-routes?fromLocationId=${CHENNAI_ID}&toLocationId=${MADURAI_ID}&maxTransfers=2" | jq '.'
else
  echo "Could not find Chennai or Madurai locations"
fi

echo ""
echo "3. Test Case: Chennai to Aruppukottai (might need connecting route)"
ARUPPUKOTTAI_ID=$(curl -s "${BACKEND_URL}/api/v1/locations/autocomplete?query=Aruppukottai&limit=1" | jq -r '.[0].id')

if [ "$CHENNAI_ID" != "null" ] && [ "$ARUPPUKOTTAI_ID" != "null" ]; then
  echo "Testing Chennai (ID: $CHENNAI_ID) to Aruppukottai (ID: $ARUPPUKOTTAI_ID)"
  curl -s "${BACKEND_URL}/api/v1/bus-schedules/connecting-routes?fromLocationId=${CHENNAI_ID}&toLocationId=${ARUPPUKOTTAI_ID}&maxTransfers=2" | jq '.'
else
  echo "Could not find Chennai or Aruppukottai locations"
fi

echo ""
echo "Test completed!"
