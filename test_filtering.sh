#!/bin/bash

# Test script for Plyce Advanced Filtering Feature
# This script tests the new filtering endpoints

API_URL="http://localhost:8000"
LAT="43.6532"
LNG="-79.3832"
RADIUS="5000"

echo "======================================"
echo "Testing Plyce Advanced Filtering API"
echo "======================================"
echo ""

# Test 1: Basic search without filters
echo "Test 1: Basic search (no filters)"
echo "GET $API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS"
curl -s "$API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS" | jq -r 'length as $len | "✓ Found \($len) restaurants"'
echo ""

# Test 2: Cuisine filter
echo "Test 2: Filter by cuisine (Indian)"
echo "GET $API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS&cuisine=indian"
curl -s "$API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS&cuisine=indian" | jq -r 'length as $len | "✓ Found \($len) Indian restaurants"'
echo ""

# Test 3: Dietary filter
echo "Test 3: Filter by dietary (Vegan)"
echo "GET $API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS&dietary=vegan"
curl -s "$API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS&dietary=vegan" | jq -r 'length as $len | "✓ Found \($len) Vegan restaurants"'
echo ""

# Test 4: Price level filter
echo "Test 4: Filter by price level (2)"
echo "GET $API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS&price_level=2"
curl -s "$API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS&price_level=2" | jq -r 'length as $len | "✓ Found \($len) moderate-priced restaurants"'
echo ""

# Test 5: Outdoor seating filter
echo "Test 5: Filter by outdoor seating"
echo "GET $API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS&outdoor_seating=true"
curl -s "$API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS&outdoor_seating=true" | jq -r 'length as $len | "✓ Found \($len) restaurants with outdoor seating"'
echo ""

# Test 6: Wheelchair accessible filter
echo "Test 6: Filter by wheelchair accessibility"
echo "GET $API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS&wheelchair_accessible=true"
curl -s "$API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS&wheelchair_accessible=true" | jq -r 'length as $len | "✓ Found \($len) wheelchair accessible restaurants"'
echo ""

# Test 7: Combined filters
echo "Test 7: Combined filters (Indian + Wheelchair Accessible + Outdoor Seating)"
echo "GET $API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=10000&cuisine=indian&wheelchair_accessible=true&outdoor_seating=true"
curl -s "$API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=10000&cuisine=indian&wheelchair_accessible=true&outdoor_seating=true" | jq -r 'length as $len | "✓ Found \($len) restaurants matching all criteria"'
echo ""

# Test 8: Batch details endpoint
echo "Test 8: Batch Place Details endpoint"
echo "POST $API_URL/restaurants/details"
# First get a few place IDs
PLACE_IDS=$(curl -s "$API_URL/restaurants/search?lat=$LAT&lng=$LNG&radius=$RADIUS" | jq -r '[.[0:3][].id] | @json')
echo "Testing with place IDs: $PLACE_IDS"
curl -s -X POST "$API_URL/restaurants/details" \
  -H "Content-Type: application/json" \
  -d "{\"place_ids\": $PLACE_IDS}" | jq -r '.places | length as $len | "✓ Fetched details for \($len) places"'
echo ""

# Test 9: Health check
echo "Test 9: Health check"
curl -s "$API_URL/health" | jq -r '.status as $status | "✓ API Status: \($status)"'
echo ""

echo "======================================"
echo "All tests completed!"
echo "======================================"
