from fastapi import FastAPI, HTTPException, Query, Body
import requests
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import logging

from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import re
import urllib.parse
from bs4 import BeautifulSoup
import time
import json
from serpapi import GoogleSearch

# Playwright for fast TikTok scraping
import asyncio
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
from datetime import datetime, timedelta

load_dotenv() # load the env

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== CACHE LAYER FOR TIKTOK ====================
class SimpleCache:
    """Simple TTL-based in-memory cache for TikTok videos"""
    def __init__(self):
        self.cache: Dict[str, tuple] = {}
    
    def get(self, key: str) -> Optional[List[Dict]]:
        if key in self.cache:
            data, expiry = self.cache[key]
            if datetime.now() < expiry:
                logger.info(f"🎯 Cache HIT for {key}")
                return data
            else:
                del self.cache[key]  # Expired
                logger.info(f"⏰ Cache EXPIRED for {key}")
        return None
    
    def set(self, key: str, data: List[Dict], ttl: int = 600):
        """TTL in seconds (default 10 minutes)"""
        expiry = datetime.now() + timedelta(seconds=ttl)
        self.cache[key] = (data, expiry)
        logger.info(f"💾 Cache SET for {key} (expires in {ttl}s)")
    
    def clear(self):
        self.cache.clear()
        logger.info("🧹 Cache CLEARED")

# Global TikTok cache instance
tiktok_cache = SimpleCache()

# ==================== BROWSER POOL FOR PLAYWRIGHT ====================
class BrowserPool:
    """Reusable browser instances to avoid startup overhead"""
    def __init__(self, pool_size: int = 2):
        self.pool_size = pool_size
        self.browsers: asyncio.Queue = None
        self.playwright = None
    
    async def initialize(self):
        """Initialize the browser pool"""
        self.playwright = await async_playwright().start()
        self.browsers = asyncio.Queue(maxsize=self.pool_size)
        
        for _ in range(self.pool_size):
            browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                    "--no-first-run",
                    "--no-default-browser-check",
                ]
            )
            await self.browsers.put(browser)
        
        logger.info(f"🚀 Browser pool initialized with {self.pool_size} instances")
    
    async def acquire(self):
        """Get a browser from the pool"""
        browser = await self.browsers.get()
        logger.info(f"🎭 Browser acquired from pool")
        return browser
    
    async def release(self, browser):
        """Return a browser to the pool"""
        await self.browsers.put(browser)
        logger.info(f"🔄 Browser returned to pool")
    
    async def close(self):
        """Close all browsers"""
        while not self.browsers.empty():
            browser = await self.browsers.get()
            await browser.close()
        
        if self.playwright:
            await self.playwright.stop()
        
        logger.info("🛑 Browser pool closed")

# Global browser pool instance
browser_pool: Optional[BrowserPool] = None

# Pydantic models for request validation
class FilterOptions(BaseModel):
    cuisine: Optional[str] = None
    dietary: Optional[str] = None
    price_level: Optional[int] = None
    outdoor_seating: Optional[bool] = None
    pet_friendly: Optional[bool] = None
    wheelchair_accessible: Optional[bool] = None
    delivery_available: Optional[bool] = None

class PlaceDetailsRequest(BaseModel):
    place_ids: List[str]

# Chain exclusion list for coffee/matcha/cafe filters
# These chain names will be matched against venue names (case-insensitive, substring matching)
CHAIN_BLACKLIST = {
    "starbucks",
    "tim hortons",
    "tims",
    "mccafe",
    "mcdonalds",
    "dunkin",
    "dunkin donuts",
    "dunkin'",
    "costa coffee",
    "pret a manger",
    "second cup",
    "timothy's",
    "timothy's world coffee",
    "country style",
    "coffee time",
    "williams coffee pub",
    "tim horton's",
    "aroma espresso bar",
    "balzac's coffee",  # Note: Balzac's is actually indie, but has multiple locations
}

def is_chain_venue(name: str) -> bool:
    """
    Check if venue is a known chain based on name matching.
    
    Args:
        name: The venue name to check
        
    Returns:
        True if the venue name contains any chain name from blacklist, False otherwise
    """
    if not name:
        return False
    
    name_lower = name.lower().strip()
    
    # Check each chain name in the blacklist
    for chain in CHAIN_BLACKLIST:
        if chain in name_lower:
            logger.info(f"🔗 Detected chain venue: {name} (matched: {chain})")
            return True
    
    return False

app = FastAPI(title="Plyce API", 
              description="Backend API for Plyce application",
              version="0.1.0")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") # Get the key 
SERPAPI_KEY = os.getenv("SERPAPI_KEY") # Get SerpApi key for menu scraping

# Verify API key is loaded
if not GOOGLE_API_KEY:
    logger.error("❌ GOOGLE_API_KEY not found in environment variables!")
else:
    logger.info(f"✅ GOOGLE_API_KEY loaded (length: {len(GOOGLE_API_KEY)})")

if not SERPAPI_KEY:
    logger.warning("⚠️ SERPAPI_KEY not found - menu highlights feature will be limited")
else:
    logger.info(f"✅ SERPAPI_KEY loaded (length: {len(SERPAPI_KEY)})")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Local development
    allow_origin_regex="https://.*\.vercel\.app", # Allow all Vercel deployments
    allow_credentials=True,
    allow_methods=["*"],    
    allow_headers=["*"],
)


# Replace the existing generate_hashtags function with this improved version

def generate_hashtags(restaurant_name: str) -> List[str]:
    """Generate hashtags based only on the restaurant name."""
    # Early return if no name
    if not restaurant_name:
        return []
        
    # Clean the name (remove punctuation, extra spaces)
    clean = re.sub(r"[^\w\s]", "", restaurant_name).strip()
    
    # Create hashtag variations
    variations = []
    
    # Base hashtag - just the restaurant name with no spaces
    base = re.sub(r"\s+", "", clean)
    if base:
        variations.append(base)
    
    # Restaurant name with spaces replaced by underscores (common on TikTok)
    underscore_version = re.sub(r"\s+", "_", clean)
    if underscore_version and underscore_version != base:
        variations.append(underscore_version)
    
    # Restaurant-specific hashtags
    if base:
        variations.append(f"{base}Restaurant")
        variations.append(f"{base}Food")
    
    # Remove any duplicates by converting to a set and back to a list
    return list(set(variations))



@app.get("/")
async def root():
    return {"message": "Welcome to Plyce API!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Add this helper function to generate proper photo URLs
def get_photo_url(photo_reference: str, max_width: int = 400) -> str:
    """Generate a proper Google Places photo URL"""
    if not photo_reference:
        return None
    
    # For the Places API v1, use this format
    # photo_reference should be in the format "places/{place_id}/photos/{photo_id}"
    if photo_reference.startswith("places/"):
        return f"https://places.googleapis.com/v1/{photo_reference}/media?maxHeightPx={max_width}&key={GOOGLE_API_KEY}"
    else:
        # Legacy format for backward compatibility
        return f"https://maps.googleapis.com/maps/api/place/photo?maxwidth={max_width}&photo_reference={photo_reference}&key={GOOGLE_API_KEY}"

# Helper function to process photos in place data
def process_place_photos(places: list) -> list:
    """Process photos in a list of places to generate proper URLs"""
    for place in places:
        if "photos" in place and place["photos"]:
            processed_photos = []
            for photo in place["photos"]:
                if "name" in photo:
                    photo_url = get_photo_url(photo["name"])
                    if photo_url:
                        processed_photos.append({
                            "name": photo["name"],
                            "googleMapsUri": photo_url,
                            "widthPx": photo.get("widthPx", 400),
                            "heightPx": photo.get("heightPx", 300)
                        })
            place["photos"] = processed_photos
    return places

# Update the restaurants endpoint to include proper photo URLs
@app.get("/restaurants/search")
async def search_restaurants(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: int = Query(5000, description="Search radius in meters", ge=2000, le=25000),
    cuisine: Optional[str] = Query(None, description="Cuisine type filter"),
    dietary: Optional[str] = Query(None, description="Dietary preference filter"),
    price_level: Optional[int] = Query(None, description="Price level (1-4)", ge=1, le=4),
    outdoor_seating: Optional[bool] = Query(None, description="Outdoor seating availability"),
    pet_friendly: Optional[bool] = Query(None, description="Pet friendly"),
    wheelchair_accessible: Optional[bool] = Query(None, description="Wheelchair accessible"),
    delivery_available: Optional[bool] = Query(None, description="Delivery available"),
    venue_type: Optional[str] = Query(None, description="Venue type: coffee, matcha, or cafe")
):
    """
    Search for restaurants with advanced filtering.
    Supports venue type filtering for coffee shops, matcha cafes, and cafes.
    Two-step process:
    1. Use Nearby Search or Text Search for initial results
    2. Fetch Place Details for service attribute filtering
    """
    try:
        logger.info(f"🔍 Searching restaurants at ({lat}, {lng}) with radius {radius}m")
        
        # Determine search strategy based on venue_type
        # CRITICAL: Matcha requires Text Search because Nearby Search can't filter by keyword
        # Coffee and Cafe can use Nearby Search with includedTypes for efficiency
        use_text_search_for_matcha = venue_type and venue_type.lower() == "matcha"
        
        # Service attributes that require Place Details API
        service_filters = {
            "outdoor_seating": outdoor_seating,
            "pet_friendly": pet_friendly,
            "wheelchair_accessible": wheelchair_accessible,
            "delivery_available": delivery_available
        }
        needs_details_filtering = any(v is not None for v in service_filters.values())
        
        # Build keyword from cuisine and dietary filters
        keywords = []
        if cuisine:
            keywords.append(cuisine)
            logger.info(f"🍽️ Cuisine filter: {cuisine}")
        if dietary:
            keywords.append(dietary)
            logger.info(f"🥗 Dietary filter: {dietary}")
        
        keyword = " ".join(keywords).strip()
        
        # Step 1: Initial search using appropriate API endpoint
        
        # CASE 1: Matcha filter - MUST use Text Search with textQuery
        if use_text_search_for_matcha:
            logger.info(f"🍵 Using Text Search for matcha venues")
            # Text Search with "matcha cafe" query and locationBias (not locationRestriction)
            # locationBias prioritizes nearby results but allows relevant matches slightly outside radius
            body = {
                "textQuery": "matcha cafe",
                "locationBias": {
                    "circle": {
                        "center": {
                            "latitude": lat,
                            "longitude": lng
                        },
                        "radius": radius
                    }
                },
                "maxResultCount": 20
            }
            
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_API_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.photos"
            }
            
            logger.info(f"📤 Calling Text Search API with query: 'matcha cafe'")
            response = requests.post(
                "https://places.googleapis.com/v1/places:searchText",
                json=body,
                headers=headers
            )
        
        # CASE 2: Coffee or Cafe filter - use Nearby Search with includedTypes
        elif venue_type and venue_type.lower() in ["coffee", "cafe"]:
            included_types = ["coffee_shop"] if venue_type.lower() == "coffee" else ["cafe"]
            logger.info(f"☕ Using Nearby Search for {venue_type} venues")
            logger.info(f"📋 Using includedTypes: {included_types}")
            
            body = {
                "locationRestriction": {
                    "circle": {
                        "center": {
                            "latitude": lat,
                            "longitude": lng
                        },
                        "radius": radius
                    }
                },
                "includedTypes": included_types,
                "maxResultCount": 20
            }
            
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_API_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.photos"
            }
            
            response = requests.post(
                "https://places.googleapis.com/v1/places:searchNearby",
                json=body,
                headers=headers
            )
        
        # CASE 3: Keyword filter (cuisine/dietary) without venue_type - use Text Search
        elif keyword:
            logger.info(f"🔍 Using Text Search with query: '{keyword}'")
            body = {
                "textQuery": keyword,
                "locationBias": {
                    "circle": {
                        "center": {
                            "latitude": lat,
                            "longitude": lng
                        },
                        "radius": radius
                    }
                }
            }
            
            # Map price_level (1-4) to Google Places API enum values
            if price_level:
                price_level_map = {
                    1: "PRICE_LEVEL_INEXPENSIVE",
                    2: "PRICE_LEVEL_MODERATE",
                    3: "PRICE_LEVEL_EXPENSIVE",
                    4: "PRICE_LEVEL_VERY_EXPENSIVE"
                }
                body["priceLevels"] = [price_level_map.get(price_level, "PRICE_LEVEL_INEXPENSIVE")]
            
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_API_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.photos"
            }
            
            response = requests.post(
                "https://places.googleapis.com/v1/places:searchText",
                json=body,
                headers=headers
            )
        
        # CASE 4: Default - use Nearby Search for restaurants
        else:
            logger.info(f"📍 Using Nearby Search for restaurants")
            body = {
                "locationRestriction": {
                    "circle": {
                        "center": {
                            "latitude": lat,
                            "longitude": lng
                        },
                        "radius": radius
                    }
                },
                "includedTypes": ["restaurant"],
                "maxResultCount": 20
            }
            
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_API_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.photos"
            }
            
            response = requests.post(
                "https://places.googleapis.com/v1/places:searchNearby",
                json=body,
                headers=headers
            )
        
        response.raise_for_status()
        data = response.json()
        places = data.get("places", [])
        
        logger.info(f"✅ Initial search found {len(places)} places")
        
        # Step 1.5: Filter by name for matcha venues (post-processing)
        if venue_type and venue_type.lower() == "matcha":
            logger.info(f"🍵 Filtering results for matcha-related venues...")
            matcha_keywords = ["matcha", "green tea", "japanese tea", "tea house"]
            filtered_matcha = []
            
            for place in places:
                place_name = place.get("displayName", {}).get("text", "").lower()
                place_types = place.get("types", [])
                
                # Check if name contains matcha-related keywords
                has_matcha_keyword = any(keyword in place_name for keyword in matcha_keywords)
                
                # Check if it's a cafe or tea-related establishment
                is_cafe = "cafe" in place_types or "tea_house" in place_types
                
                if has_matcha_keyword and is_cafe:
                    filtered_matcha.append(place)
                    logger.info(f"✅ Matched matcha venue: {place_name}")
            
            places = filtered_matcha
            logger.info(f"🍵 Found {len(places)} matcha venues after filtering")
        
        # Step 2: Filter by service attributes if needed
        if needs_details_filtering and places:
            logger.info(f"🔍 Fetching Place Details for service attribute filtering...")
            place_ids = [place.get("id") for place in places if place.get("id")]
            
            # Fetch details for all places
            detailed_places = await fetch_place_details_batch(place_ids)
            
            # Filter based on service attributes
            filtered_places = []
            for place in detailed_places:
                include = True
                
                # Check outdoor seating
                if outdoor_seating is not None:
                    has_outdoor = place.get("outdoorSeating", False)
                    if outdoor_seating and not has_outdoor:
                        include = False
                
                # Check pet friendly (using good_for_children as proxy since pet_friendly not in API)
                if pet_friendly is not None:
                    is_pet_friendly = place.get("allowsDogs", False)
                    if pet_friendly and not is_pet_friendly:
                        include = False
                
                # Check wheelchair accessible
                if wheelchair_accessible is not None:
                    is_accessible = place.get("accessibilityOptions", {}).get("wheelchairAccessibleEntrance", False)
                    if wheelchair_accessible and not is_accessible:
                        include = False
                
                # Check delivery available
                if delivery_available is not None:
                    has_delivery = place.get("delivery", False)
                    if delivery_available and not has_delivery:
                        include = False
                
                if include:
                    filtered_places.append(place)
            
            logger.info(f"✅ Filtered to {len(filtered_places)} restaurants with service attributes")
            
            # Add chain detection to filtered places
            for place in filtered_places:
                place_name = place.get("displayName", {}).get("text", "") or place.get("name", "")
                place["isChain"] = is_chain_venue(place_name)
            
            # Process photos for filtered places
            filtered_places = process_place_photos(filtered_places)
            return filtered_places
        
        # Apply price filter if provided and no service filtering needed
        if price_level and not needs_details_filtering:
            price_level_map = {
                1: "PRICE_LEVEL_INEXPENSIVE",
                2: "PRICE_LEVEL_MODERATE",
                3: "PRICE_LEVEL_EXPENSIVE",
                4: "PRICE_LEVEL_VERY_EXPENSIVE"
            }
            target_price = price_level_map.get(price_level)
            places = [p for p in places if p.get("priceLevel") == target_price]
            logger.info(f"💰 Filtered by price level {price_level}: {len(places)} results")
        
        # Add chain detection to all places before returning
        for place in places:
            place_name = place.get("displayName", {}).get("text", "") or place.get("name", "")
            place["isChain"] = is_chain_venue(place_name)
        
        # Log chain detection results
        chain_count = sum(1 for p in places if p.get("isChain"))
        if chain_count > 0:
            logger.info(f"🔗 Detected {chain_count} chain venues out of {len(places)} results")
        
        # Process photos to generate proper URLs
        places = process_place_photos(places)
        
        return places
        
    except Exception as e:
        logger.error(f"❌ Error searching restaurants: {str(e)}")
        logger.error(f"Response content: {response.text if 'response' in locals() else 'No response'}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper function to fetch place details in batch
async def fetch_place_details_batch(place_ids: List[str]) -> List[Dict[str, Any]]:
    """Fetch place details for multiple place IDs"""
    detailed_places = []
    
    # Field mask for service attributes
    field_mask = (
        "id,displayName,formattedAddress,location,types,rating,userRatingCount,priceLevel,photos,"
        "outdoorSeating,allowsDogs,accessibilityOptions,delivery,dineIn,reservable,servesBeer,"
        "servesWine,servesVegetarianFood"
    )
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": field_mask
    }
    
    for place_id in place_ids:
        try:
            url = f"https://places.googleapis.com/v1/places/{place_id}"
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            place_data = response.json()
            # Map id → place_id for consistency
            if 'id' in place_data:
                place_data['place_id'] = place_data['id']
            
            detailed_places.append(place_data)
        except Exception as e:
            logger.error(f"Error fetching details for {place_id}: {str(e)}")
            continue
    
    return detailed_places


# Batch endpoint for fetching place details
@app.post("/restaurants/details")
async def get_place_details_batch(request: PlaceDetailsRequest):
    """
    Fetch Place Details for multiple place IDs
    Returns detailed information including service attributes
    """
    try:
        logger.info(f"📋 Fetching details for {len(request.place_ids)} places")
        detailed_places = await fetch_place_details_batch(request.place_ids)
        logger.info(f"✅ Successfully fetched {len(detailed_places)} place details")
        return {"places": detailed_places}
    except Exception as e:
        logger.error(f"❌ Error fetching place details batch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Keep the old endpoint for backward compatibility
@app.get("/restaurants")
async def get_restaurants(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: int = Query(5000, description="Search radius in meters", ge=2000, le=15000),
    keyword: Optional[str] = Query(None, description="Search keyword for cuisine/dietary filters")
):
    """Get nearby restaurants with optional keyword filtering"""
    try:
        logger.info(f"🔍 Fetching restaurants at ({lat}, {lng}) with radius {radius}m")
        
        if keyword:
            logger.info(f"🔍 FILTERING BY KEYWORD: '{keyword}'")
            # Use Text Search API when keyword is provided
            body = {
                "textQuery": f"{keyword} restaurant",
                "locationBias": {
                    "circle": {
                        "center": {
                            "latitude": lat,
                            "longitude": lng
                        },
                        "radius": radius
                    }
                }
            }
            
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_API_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.photos"
            }
            
            logger.info(f"📤 Calling Text Search API with query: '{keyword} restaurant'")
            
            response = requests.post(
                "https://places.googleapis.com/v1/places:searchText",
                json=body,
                headers=headers
            )
        else:
            logger.info(f"📍 No keyword filter - using nearby search")
            # Use Nearby Search when no keyword (original behavior)
            body = {
                "locationRestriction": {
                    "circle": {
                        "center": {
                            "latitude": lat,
                            "longitude": lng
                        },
                        "radius": radius
                    }
                },
                "includedTypes": ["restaurant"],
                "maxResultCount": 20
            }
            
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_API_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.photos"
            }
            
            response = requests.post(
                "https://places.googleapis.com/v1/places:searchNearby",
                json=body,
                headers=headers
            )
        
        response.raise_for_status()
        data = response.json()
        
        places = data.get("places", [])
        
        if keyword:
            logger.info(f"✅ Found {len(places)} restaurants matching '{keyword}'")
        else:
            logger.info(f"✅ Found {len(places)} restaurants nearby")
        
        # Log first 3 restaurant names for debugging
        if places:
            sample_names = [p.get('displayName', {}).get('text', 'Unknown') for p in places[:3]]
            logger.info(f"📋 Sample results: {sample_names}")
        else:
            logger.warning(f"⚠️ No places returned from API")
        
        # Process photos to generate proper URLs
        places = process_place_photos(places)
        
        return places
        
    except Exception as e:
        logger.error(f"❌ Error fetching restaurants: {str(e)}")
        logger.error(f"Response content: {response.text if 'response' in locals() else 'No response'}")
        raise HTTPException(status_code=500, detail=str(e))

# Update the restaurant details endpoint as well
@app.get("/restaurants/{place_id}")
async def get_restaurant_details(place_id: str):
    if place_id.startswith("fallback-"):
        return {
            "place_id": place_id,
            "displayName": {"text": place_id.replace("fallback-", "").split("-")[0].capitalize()},
            "message": "Details not available for fallback IDs"
        }
    
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location,types,rating,priceLevel,photos,reviews"
    }
    
    try:
        print(f"Fetching details for place_id: {place_id}")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        # Map id → place_id for frontend consistency
        if 'id' in data:
            data['place_id'] = data['id']
        
        # Process photos to generate proper URLs
        if "photos" in data and data["photos"]:
            processed_photos = []
            for photo in data["photos"]:
                if "name" in photo:
                    photo_url = get_photo_url(photo["name"])
                    if photo_url:
                        processed_photos.append({
                            "name": photo["name"],
                            "googleMapsUri": photo_url,
                            "widthPx": photo.get("widthPx", 400),
                            "heightPx": photo.get("heightPx", 300)
                        })
            data["photos"] = processed_photos
            
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching place details: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Restaurant details not found: {str(e)}")


# function to get the reviews of the specific place
@app.get("/restaurants/{place_id}/reviews")
async def get_restaurant_reviews(place_id: str):
    # Skip API call for fallback IDs
    if place_id.startswith("fallback-"):
        return {
            "place_id": place_id,
            "reviews": []
        }
    
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    
    headers = {
        # Add this missing Content-Type header
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "reviews,displayName"
    }
    
    try:
        print(f"Fetching reviews for place_id: {place_id}")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        return {
            "place_id": place_id,
            "displayName": data.get("displayName", {"text": "Restaurant"}),
            "reviews": data.get("reviews", [])
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching reviews: {str(e)}")
        # Return empty reviews instead of raising an error
        return {
            "place_id": place_id,
            "reviews": [],
            "error": str(e)
        }


@app.get("/restaurants/{place_id}/tiktok-links")
async def get_restaurant_tiktok_links(place_id: str, limit: int = 6):
    # Fallback IDs: just generate generic search
    if place_id.startswith("fallback-"):
        hashtags = ["Foodie", "BestFood"]
        return {
            "place_id": place_id,
            "hashtags": hashtags,
            "tag_urls": [f"https://www.tiktok.com/tag/{h}" for h in hashtags],
            "search_urls": [f"https://www.tiktok.com/search?q={h}" for h in hashtags],
        }

    # Fetch restaurant name
    details_url = f"https://places.googleapis.com/v1/places/{place_id}"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "id,displayName,formattedAddress",
    }
    try:
        resp = requests.get(details_url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        name = data.get("displayName", {}).get("text") or ""
    except Exception as e:
        print(f"Error getting restaurant details: {e}")
        name = ""

    # Generate hashtags based only on the restaurant name
    hashtags = generate_hashtags(name)
    
    # Limit the number of hashtags
    hashtags = hashtags[:min(limit, 6)]
    
    # Also create direct search URLs (better than just hashtags in many cases)
    search_urls = [
        f"https://www.tiktok.com/search?q={name.replace(' ', '+')}restaurant"
    ]
    
    # For longer restaurant names, also try just the first word or two
    words = name.split()
    if len(words) > 2:
        short_name = " ".join(words[:2])
        search_urls.append(f"https://www.tiktok.com/search?q={short_name.replace(' ', '+')}restaurant")

    return {
        "place_id": place_id,
        "restaurant_name": name,
        "hashtags": hashtags,
        "tag_urls": [f"https://www.tiktok.com/tag/{h}" for h in hashtags],
        "search_urls": search_urls
    }

@app.get("/restaurants/{place_id}/tiktok-google")
async def get_restaurant_tiktok_google(place_id: str, limit: int = 5):
    """
    Search Google for TikTok content about the restaurant and return direct links.
    This is more effective than just searching hashtags on TikTok.
    """
    # Skip API call for fallback IDs
    if place_id.startswith("fallback-"):
        return {
            "place_id": place_id,
            "tiktok_links": [],
            "search_url": "https://www.google.com/search?q=restaurant+food+tiktok"
        }
    
    try:
        # First, get the restaurant details to get the name
        restaurant_details_url = f"https://places.googleapis.com/v1/places/{place_id}"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "id,displayName,formattedAddress"
        }
        
        response = requests.get(restaurant_details_url, headers=headers)
        response.raise_for_status()
        restaurant_data = response.json()
        
        restaurant_name = restaurant_data.get("displayName", {}).get("text", "")
        if not restaurant_name:
            return {"place_id": place_id, "tiktok_links": [], "error": "Restaurant name not found"}
        
        # Create a Google search query for TikTok content about this restaurant
        search_query = f"{restaurant_name} tiktok"
        encoded_query = urllib.parse.quote(search_query)
        google_search_url = f"https://www.google.com/search?q={encoded_query}"
        
        # Request headers to mimic a browser
        browser_headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml",
            "Accept-Language": "en-US,en;q=0.9"
        }
        
        # Make request to Google
        google_response = requests.get(google_search_url, headers=browser_headers)
        google_response.raise_for_status()
        
        # Parse the HTML
        soup = BeautifulSoup(google_response.text, 'html.parser')
        
        # Extract TikTok links from Google results
        tiktok_links = []
        link_elements = soup.select('a')
        
        for link in link_elements:
            href = link.get('href', '')
            # Check if it's a TikTok URL
            if 'tiktok.com' in href and '/url?q=' in href:
                # Extract the actual URL from Google's redirect URL
                tiktok_url = href.split('/url?q=')[1].split('&')[0]
                tiktok_url = urllib.parse.unquote(tiktok_url)
                
                # Get link text for title
                link_text = link.get_text().strip()
                
                # Only include if it's a proper TikTok link
                if 'tiktok.com' in tiktok_url and tiktok_url not in [l['url'] for l in tiktok_links]:
                    tiktok_links.append({
                        'url': f"{tiktok_url}restaurant",
                        'title': link_text if link_text else f"TikTok: {restaurant_name}restaurant"
                    })
                
                # Limit the number of results
                if len(tiktok_links) >= limit:
                    break
        
        # Fallback - direct TikTok search URLs if Google didn't find anything
        if not tiktok_links:
            # Direct TikTok search URL
            tiktok_search_url = f"https://www.tiktok.com/search?q={restaurant_name.replace(' ', '+')}restaurant"
            tiktok_links.append({
                'url': tiktok_search_url,
                'title': f"Search TikTok for {restaurant_name}"
            })
        
        return {
            "place_id": place_id,
            "restaurant_name": restaurant_name,
            "tiktok_links": tiktok_links,
            "search_url": google_search_url  # Include the Google search URL as a fallback
        }
                
    except Exception as e:
        print(f"Error searching for TikTok videos: {str(e)}")
        # Return a direct TikTok search URL as a fallback
        tiktok_search_url = f"https://www.tiktok.com/search?q={restaurant_name.replace(' ', '+') if 'restaurant_name' in locals() else 'restaurants'}"
        return {
            "place_id": place_id,
            "tiktok_links": [
                {
                    'url': tiktok_search_url,
                    'title': f"Search TikTok"
                }
            ],
            "error": str(e)
        }

# ==================== PLAYWRIGHT SCRAPER FUNCTION ====================
async def scrape_tiktok_videos_playwright(
    restaurant_name: str,
    limit: int = 4,
    timeout: int = 8000
) -> List[Dict]:
    """
    Scrape TikTok videos using Playwright (async, fast, pooled)
    
    Args:
        restaurant_name: Name of restaurant to search
        limit: Number of videos to fetch
        timeout: Timeout in milliseconds
    
    Returns:
        List of video dictionaries with id, thumbnail, url, description
    """
    
    browser = None
    try:
        # Acquire browser from pool
        browser = await browser_pool.acquire()
        
        # Create new page/context (isolated) with stealth settings
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="en-US",
            timezone_id="America/New_York",
            ignore_https_errors=True,
            extra_http_headers={
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1"
            }
        )
        page = await context.new_page()
        
        # Add stealth scripts to avoid detection
        await page.add_init_script("""
            // Override navigator.webdriver
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
            
            // Override permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
            
            // Override plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
            
            // Override languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
        """)
        
        # Construct search URL
        search_query = f"{restaurant_name} restaurant"
        tiktok_search_url = f"https://www.tiktok.com/search?q={search_query.replace(' ', '+')}"
        
        logger.info(f"🔍 Scraping TikTok for: {search_query}")
        
        # Navigate to TikTok search with retry logic
        try:
            await page.goto(
                tiktok_search_url,
                wait_until="domcontentloaded",
                timeout=timeout
            )
            # Wait a bit for dynamic content
            await page.wait_for_timeout(3000)
        except PlaywrightTimeoutError:
            logger.warning(f"⏱️ Navigation timeout for {search_query}")
            return []
        
        # Try multiple selector strategies (TikTok frequently changes their DOM)
        video_elements_found = False
        selectors_to_try = [
            "div[data-e2e='search_video-item']",
            "div[data-e2e='search-card-item']", 
            "div[class*='DivItemContainerForSearch']",
            "div[class*='DivItemContainer']",
            "a[href*='/video/']"
        ]
        
        for selector in selectors_to_try:
            try:
                await page.wait_for_selector(selector, timeout=3000)
                logger.info(f"✅ Found videos with selector: {selector}")
                video_elements_found = True
                break
            except PlaywrightTimeoutError:
                continue
        
        if not video_elements_found:
            logger.warning(f"❌ No video elements found with any selector for {restaurant_name}")
            
            # Take screenshot for debugging
            try:
                screenshot_path = f"/tmp/tiktok_debug_{restaurant_name.replace(' ', '_')}.png"
                await page.screenshot(path=screenshot_path)
                logger.info(f"📸 Debug screenshot saved to: {screenshot_path}")
            except:
                pass
            
            return []
        
        # Extract video data using evaluate with multiple strategies
        videos = await page.evaluate("""
            (limit) => {
                const videos = [];
                
                // Strategy 1: Try data-e2e attributes
                let videoElements = document.querySelectorAll("div[data-e2e='search_video-item'], div[data-e2e='search-card-item']");
                
                // Strategy 2: If not found, try class-based selectors
                if (videoElements.length === 0) {
                    videoElements = document.querySelectorAll("div[class*='DivItemContainer']");
                }
                
                // Strategy 3: If still not found, find all links with /video/
                if (videoElements.length === 0) {
                    const allLinks = Array.from(document.querySelectorAll("a[href*='/video/']"));
                    videoElements = allLinks.map(link => link.closest('div')).filter(Boolean);
                }
                
                console.log(`Found ${videoElements.length} video elements`);
                
                for (let i = 0; i < Math.min(videoElements.length, limit); i++) {
                    try {
                        const elem = videoElements[i];
                        
                        // Get link (multiple strategies)
                        let linkElem = elem.querySelector("a[href*='/video/']");
                        if (!linkElem) linkElem = elem.querySelector("a");
                        const url = linkElem ? linkElem.href : "";
                        
                        // Get thumbnail (try multiple selectors)
                        let thumbnail = "";
                        const imgElem = elem.querySelector("img");
                        if (imgElem) {
                            thumbnail = imgElem.src || imgElem.getAttribute('data-src') || imgElem.getAttribute('srcset')?.split(' ')[0] || "";
                        }
                        
                        // Get description/title (multiple strategies)
                        let description = "TikTok Video";
                        const descSelectors = [
                            "div[data-e2e='search_video-desc']",
                            "div[data-e2e='search-card-desc']",
                            "h1", "h2", "h3",
                            "span[class*='desc']",
                            "div[class*='title']"
                        ];
                        
                        for (const selector of descSelectors) {
                            const descElem = elem.querySelector(selector);
                            if (descElem && descElem.textContent.trim()) {
                                description = descElem.textContent.trim();
                                break;
                            }
                        }
                        
                        // Validate we have minimum required data
                        if (url && url.includes('/video/')) {
                            videos.push({
                                id: `video-${i+1}`,
                                thumbnail: thumbnail || `https://via.placeholder.com/300x400/EE1D52/FFFFFF?text=TikTok+Video`,
                                url: url,
                                description: description.substring(0, 100) || "TikTok Video"
                            });
                            console.log(`Extracted video ${i+1}: ${url}`);
                        }
                    } catch (e) {
                        console.log(`Error processing video ${i}:`, e);
                    }
                }
                
                return videos;
            }
        """, limit)
        
        # If no videos found, try mobile TikTok as fallback
        if len(videos) == 0:
            logger.info(f"🔄 Trying mobile TikTok for {restaurant_name}")
            try:
                mobile_url = f"https://m.tiktok.com/search?q={search_query.replace(' ', '+')}"
                await page.goto(mobile_url, wait_until="domcontentloaded", timeout=5000)
                await page.wait_for_timeout(2000)
                
                # Mobile TikTok has different selectors
                videos = await page.evaluate("""
                    (limit) => {
                        const videos = [];
                        const links = document.querySelectorAll("a[href*='/video/']");
                        
                        for (let i = 0; i < Math.min(links.length, limit); i++) {
                            try {
                                const link = links[i];
                                const url = link.href;
                                const img = link.querySelector("img");
                                const thumbnail = img ? (img.src || img.getAttribute('data-src') || "") : "";
                                
                                if (url && url.includes('/video/')) {
                                    videos.push({
                                        id: `video-${i+1}`,
                                        thumbnail: thumbnail || `https://via.placeholder.com/300x400/EE1D52/FFFFFF?text=TikTok`,
                                        url: url,
                                        description: "TikTok Video"
                                    });
                                }
                            } catch (e) {
                                console.log(`Error: ${e}`);
                            }
                        }
                        return videos;
                    }
                """, limit)
                
                if len(videos) > 0:
                    logger.info(f"✅ Mobile TikTok found {len(videos)} videos")
            except Exception as e:
                logger.warning(f"Mobile fallback failed: {str(e)}")
        
        logger.info(f"✅ Successfully scraped {len(videos)} videos for {restaurant_name}")
        
        await context.close()
        return videos
    
    except Exception as e:
        logger.error(f"❌ Error scraping TikTok: {str(e)}")
        return []
    
    finally:
        # Always return browser to pool
        if browser:
            await browser_pool.release(browser)

# Helper function to generate placeholder videos
def generate_placeholder_videos(restaurant_name: str, limit: int, search_url: str) -> List[Dict]:
    """Generate placeholder videos when scraping fails"""
    placeholder_designs = [
        f"https://via.placeholder.com/300x400/EE1D52/FFFFFF?text={restaurant_name.replace(' ', '+')}",
        f"https://via.placeholder.com/300x400/000000/FFFFFF?text=TikTok+{restaurant_name.replace(' ', '+')}",
        f"https://via.placeholder.com/300x400/25F4EE/000000?text={restaurant_name.replace(' ', '+')}",
    ]
    
    videos = []
    for i in range(limit):
        videos.append({
            'id': f"video-{i+1}",
            'thumbnail': placeholder_designs[i % len(placeholder_designs)],
            'url': search_url,
            'description': f"Find {restaurant_name} videos on TikTok"
        })
    
    return videos

@app.get("/restaurants/{place_id}/tiktok-videos")
async def get_restaurant_tiktok_videos(place_id: str, limit: int = 4):
    """
    Scrape actual TikTok videos for a restaurant using Playwright (async, fast)
    """
    # Skip API call for fallback IDs
    if place_id.startswith("fallback-"):
        return {
            "place_id": place_id,
            "videos": []
        }
    
    try:
        # First, get the restaurant details to get the name
        restaurant_details_url = f"https://places.googleapis.com/v1/places/{place_id}"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "id,displayName,formattedAddress"
        }
        
        response = requests.get(restaurant_details_url, headers=headers)
        response.raise_for_status()
        restaurant_data = response.json()
        
        restaurant_name = restaurant_data.get("displayName", {}).get("text", "")
        if not restaurant_name:
            return {"place_id": place_id, "videos": [], "error": "Restaurant name not found"}
            
        # Create cache key
        cache_key = f"tiktok:{place_id}:{limit}"
        
        # Check cache first
        cached_videos = tiktok_cache.get(cache_key)
        if cached_videos is not None:
            logger.info(f"🎯 Cache HIT for {restaurant_name}")
            return {
                "place_id": place_id,
                "restaurant_name": restaurant_name,
                "videos": cached_videos,
                "cached": True
            }
        
        logger.info(f"🔍 Scraping TikTok for: {restaurant_name}")
        
        # Scrape using Playwright with browser pool
        videos = await scrape_tiktok_videos_playwright(restaurant_name, limit)
        
        # Create TikTok search URL for fallback
        tiktok_search_url = f"https://www.tiktok.com/search?q={restaurant_name.replace(' ', '+')}+restaurant"
        
        # If no videos found, use placeholder
        if len(videos) == 0:
            logger.warning(f"⚠️ No videos found for {restaurant_name}, using placeholders")
            videos = generate_placeholder_videos(restaurant_name, limit, tiktok_search_url)
        else:
            # Cache successful results
            tiktok_cache.set(cache_key, videos, ttl=600)  # 10 minute cache
        
        return {
            "place_id": place_id,
            "restaurant_name": restaurant_name,
            "videos": videos,
            "search_url": tiktok_search_url,
            "cached": False
        }
                
    except Exception as e:
        logger.error(f"❌ Error in TikTok endpoint: {str(e)}")
        return {
            "place_id": place_id,
            "videos": [],
            "error": str(e)
        }

@app.get("/restaurants/photo")
async def get_restaurant_photo(reference: str, maxwidth: int = 400):
    """Get a restaurant photo by reference"""
    try:
        photo_url = get_photo_url(reference, maxwidth)
        if not photo_url:
            raise HTTPException(status_code=404, detail="Photo reference not valid")
            
        # Redirect to the actual photo URL
        return RedirectResponse(url=photo_url)
    except Exception as e:
        print(f"Error getting photo: {str(e)}")
        raise HTTPException(status_code=404, detail=f"Photo not found: {str(e)}")


@app.get("/restaurants/{place_id}/fallback-image")
async def get_restaurant_fallback_image(place_id: str):
    """Get a restaurant image from web search as fallback"""
    try:
        # Get restaurant name
        restaurant_details_url = f"https://places.googleapis.com/v1/places/{place_id}"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "id,displayName,formattedAddress"
        }
        
        response = requests.get(restaurant_details_url, headers=headers)
        response.raise_for_status()
        restaurant_data = response.json()
        
        restaurant_name = restaurant_data.get("displayName", {}).get("text", "")
        restaurant_address = restaurant_data.get("formattedAddress", "")
        
        # Search for restaurant images on Google Images
        search_query = f"{restaurant_name} {restaurant_address} restaurant"
        encoded_query = urllib.parse.quote(search_query)
        google_image_url = f"https://www.google.com/search?q={encoded_query}&tbm=isch"
        
        browser_headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
        }
        
        # Make request to Google Images
        response = requests.get(google_image_url, headers=browser_headers, timeout=10)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find images
            images = soup.find_all('img')
            
            for img in images:
                src = img.get('src', '')
                # Skip small images and data URLs
                if src.startswith('http') and 'encrypted-tbn' not in src:
                    return {
                        "place_id": place_id,
                        "restaurant_name": restaurant_name,
                        "image_url": src
                    }
        
        # If no image found, return a placeholder
        return {
            "place_id": place_id,
            "restaurant_name": restaurant_name,
            "image_url": f"https://via.placeholder.com/400x200/f0f0f0/666666?text={restaurant_name.replace(' ', '+')}"
        }
        
    except Exception as e:
        print(f"Error getting fallback image: {str(e)}")
        return {
            "place_id": place_id,
            "image_url": "https://via.placeholder.com/400x200/f0f0f0/666666?text=Restaurant"
        }


@app.get("/restaurants/{place_id}/menu-photos")
async def get_restaurant_menu_photos(place_id: str):
    """
    Get all photos from a restaurant which typically include menu photos.
    This serves as a fallback when SerpApi structured menu data is unavailable.
    """
    # Skip API call for fallback IDs
    if place_id.startswith("fallback-"):
        return {
            "place_id": place_id,
            "menu_photos": [],
            "total_photos": 0,
            "status": "unavailable",
            "google_maps_url": f"https://www.google.com/maps/search/?api=1&query=restaurant"
        }
    
    try:
        logger.info(f"📸 Fetching all photos for place_id: {place_id}")
        
        # Fetch place details with photos
        url = f"https://places.googleapis.com/v1/places/{place_id}"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "id,displayName,photos"
        }
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        all_photos = data.get("photos", [])
        restaurant_name = data.get("displayName", {}).get("text", "Restaurant")
        
        if not all_photos:
            logger.warning(f"⚠️ No photos found for {place_id}")
            return {
                "place_id": place_id,
                "restaurant_name": restaurant_name,
                "menu_photos": [],
                "total_photos": 0,
                "status": "no_photos",
                "google_maps_url": f"https://www.google.com/maps/place/?q=place_id:{place_id}"
            }
        
        # Process all photos - menu photos are typically included
        # We return all photos and let frontend display them
        menu_photos = []
        for photo in all_photos:
            if "name" in photo:
                # Use higher resolution for menu photos (800px)
                photo_url = get_photo_url(photo["name"], max_width=800)
                if photo_url:
                    menu_photos.append({
                        "name": photo["name"],
                        "url": photo_url,
                        "width": photo.get("widthPx", 800),
                        "height": photo.get("heightPx", 600),
                        "attributions": photo.get("authorAttributions", [])
                    })
        
        logger.info(f"✅ Found {len(menu_photos)} photos for {place_id}")
        
        return {
            "place_id": place_id,
            "restaurant_name": restaurant_name,
            "menu_photos": menu_photos,
            "total_photos": len(menu_photos),
            "status": "success",
            "google_maps_url": f"https://www.google.com/maps/place/?q=place_id:{place_id}"
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching menu photos: {str(e)}")
        return {
            "place_id": place_id,
            "menu_photos": [],
            "total_photos": 0,
            "status": "error",
            "error": str(e),
            "google_maps_url": f"https://www.google.com/maps/place/?q=place_id:{place_id}"
        }


@app.get("/restaurants/{place_id}/menu-highlights")
async def get_menu_highlights(place_id: str):
    """
    Get menu highlights for a restaurant using SerpApi to scrape Google Maps menu data.
    This mirrors the menu tab visible on Google Maps but not available via official Places API.
    """
    # Skip API call for fallback IDs
    if place_id.startswith("fallback-"):
        return {
            "place_id": place_id,
            "menu_highlights": [],
            "status": "unavailable"
        }
    
    try:
        # First check if SerpApi key is available
        if not SERPAPI_KEY:
            logger.warning("⚠️ SERPAPI_KEY not configured - returning empty menu")
            return {
                "place_id": place_id,
                "menu_highlights": [],
                "status": "api_key_missing",
                "message": "Menu highlights require SerpApi configuration"
            }
        
        logger.info(f"🍽️ Fetching menu highlights for place_id: {place_id}")
        
        # Use SerpApi to get Google Maps menu highlights
        params = {
            "engine": "google_maps",
            "type": "place",
            "data_id": place_id,
            "api_key": SERPAPI_KEY
        }
        
        search = GoogleSearch(params)
        results = search.get_dict()
        
        # Extract menu highlights from SerpApi response
        menu_highlights = []
        
        # SerpApi returns menu items in the "menu" or "popular_dishes" field
        if "menu" in results:
            menu_data = results["menu"]
            
            # Handle different menu data structures from SerpApi
            if isinstance(menu_data, dict) and "items" in menu_data:
                items = menu_data["items"]
            elif isinstance(menu_data, list):
                items = menu_data
            else:
                items = []
            
            for item in items[:8]:  # Limit to 8 items for preview
                menu_item = {
                    "title": item.get("title", item.get("name", "Menu Item")),
                    "thumbnails": [item.get("thumbnail", item.get("image", ""))],
                    "reviews": item.get("reviews", 0),
                    "photos": item.get("photos", 0),
                    "price_range": item.get("price_range", item.get("price", [])),
                    "link": item.get("link", "")
                }
                
                # Only add if we have at least a title
                if menu_item["title"] and menu_item["title"] != "Menu Item":
                    menu_highlights.append(menu_item)
        
        # Also check for popular_dishes field
        if "popular_dishes" in results and not menu_highlights:
            dishes = results["popular_dishes"]
            for dish in dishes[:8]:
                menu_item = {
                    "title": dish.get("title", dish.get("name", "Menu Item")),
                    "thumbnails": [dish.get("thumbnail", dish.get("image", ""))],
                    "reviews": dish.get("reviews", 0),
                    "photos": dish.get("photos", 0),
                    "price_range": dish.get("price", []),
                    "link": dish.get("link", "")
                }
                
                if menu_item["title"] and menu_item["title"] != "Menu Item":
                    menu_highlights.append(menu_item)
        
        logger.info(f"✅ Found {len(menu_highlights)} menu items for {place_id}")
        
        return {
            "place_id": place_id,
            "menu_highlights": menu_highlights,
            "status": "success" if menu_highlights else "no_data"
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching menu highlights: {str(e)}")
        return {
            "place_id": place_id,
            "menu_highlights": [],
            "status": "error",
            "error": str(e)
        }


# Google Places API (New) Proxy Endpoints for Location Search
@app.post("/places/autocomplete")
async def places_autocomplete(request: dict = Body(...)):
    """
    Proxy endpoint for Google Places API (New) Autocomplete
    This prevents CORS issues when calling from the frontend
    Uses the new Places API endpoint with POST method
    """
    try:
        input_text = request.get("input")
        language = request.get("language", "en")
        
        if not input_text:
            logger.error("❌ input not provided in request")
            raise HTTPException(status_code=400, detail="input is required")
        
        logger.info(f"🔍 Places autocomplete search (New API): '{input_text}'")
        
        if not GOOGLE_API_KEY:
            logger.error("❌ GOOGLE_API_KEY is not set!")
            raise HTTPException(status_code=500, detail="Server configuration error: API key not found")
        
        # New Places API endpoint
        url = "https://places.googleapis.com/v1/places:autocomplete"
        
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat"
        }
        
        # Request body for new API
        payload = {
            "input": input_text,
            "languageCode": language,
            "includedPrimaryTypes": ["geocode"]  # Equivalent to types=geocode in legacy API
        }
        
        logger.info(f"📡 Calling Google Places API (New): {url}")
        logger.debug(f"📋 Payload: {payload}")
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        # Log the full response for debugging
        logger.debug(f"📦 Full Google API response: {data}")
        
        # Transform new API response to match legacy format for frontend compatibility
        suggestions = data.get("suggestions", [])
        
        if suggestions:
            # Convert new API format to legacy format
            predictions = []
            for suggestion in suggestions:
                place_prediction = suggestion.get("placePrediction", {})
                structured_format = place_prediction.get("structuredFormat", {})
                
                predictions.append({
                    "place_id": place_prediction.get("placeId", ""),
                    "description": place_prediction.get("text", {}).get("text", ""),
                    "structured_formatting": {
                        "main_text": structured_format.get("mainText", {}).get("text", ""),
                        "secondary_text": structured_format.get("secondaryText", {}).get("text", "")
                    }
                })
            
            logger.info(f"✅ Found {len(predictions)} predictions")
            return {
                "status": "OK",
                "predictions": predictions
            }
        else:
            logger.info("ℹ️ No predictions found")
            return {
                "status": "ZERO_RESULTS",
                "predictions": []
            }
        
    except requests.exceptions.HTTPError as e:
        error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
        logger.error(f"❌ HTTP Error from Google API: {error_detail}")
        logger.error(f"🔑 API Key (first 10 chars): {GOOGLE_API_KEY[:10]}...")
        raise HTTPException(status_code=500, detail=f"Google API error: {error_detail}")
    except Exception as e:
        logger.error(f"❌ Error in autocomplete: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/places/details")
async def places_details(request: dict = Body(...)):
    """
    Proxy endpoint for Google Places API (New) Details
    This prevents CORS issues when calling from the frontend
    Uses the new Places API endpoint with POST method
    """
    try:
        place_id = request.get("place_id")
        
        if not place_id:
            logger.error("❌ place_id not provided in request")
            raise HTTPException(status_code=400, detail="place_id is required")
        
        logger.info(f"📍 Fetching place details (New API) for: {place_id}")
        
        if not GOOGLE_API_KEY:
            logger.error("❌ GOOGLE_API_KEY is not set!")
            raise HTTPException(status_code=500, detail="Server configuration error: API key not found")
        
        # New Places API endpoint
        url = f"https://places.googleapis.com/v1/places/{place_id}"
        
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_API_KEY,
            "X-Goog-FieldMask": "location,formattedAddress,displayName"
        }
        
        logger.info(f"📡 Calling Google Places API (New): {url}")
        
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        # Log the full response for debugging
        logger.debug(f"📦 Full Google API response: {data}")
        
        # Transform new API response to match legacy format for frontend compatibility
        if data:
            legacy_format = {
                "status": "OK",
                "result": {
                    "geometry": {
                        "location": {
                            "lat": data.get("location", {}).get("latitude", 0),
                            "lng": data.get("location", {}).get("longitude", 0)
                        }
                    },
                    "formatted_address": data.get("formattedAddress", ""),
                    "name": data.get("displayName", {}).get("text", "")
                }
            }
            logger.info(f"✅ Got place details successfully")
            return legacy_format
        else:
            logger.warning("⚠️ No place details found")
            return {
                "status": "ZERO_RESULTS",
                "result": {}
            }
        
    except requests.exceptions.HTTPError as e:
        error_detail = e.response.text if hasattr(e.response, 'text') else str(e)
        logger.error(f"❌ HTTP Error from Google API: {error_detail}")
        logger.error(f"🔑 API Key (first 10 chars): {GOOGLE_API_KEY[:10]}...")
        raise HTTPException(status_code=500, detail=f"Google API error: {error_detail}")
    except Exception as e:
        logger.error(f"❌ Error fetching place details: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/places/reverse-geocode")
async def reverse_geocode(request: dict):
    """
    Reverse geocode coordinates to get address
    Uses Google Geocoding API
    """
    try:
        latitude = request.get("latitude")
        longitude = request.get("longitude")
        
        if latitude is None or longitude is None:
            raise HTTPException(status_code=400, detail="Missing latitude or longitude")
        
        logger.info(f"📍 Reverse geocoding coordinates: ({latitude}, {longitude})")
        
        # Use Google Geocoding API (legacy)
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "latlng": f"{latitude},{longitude}",
            "key": GOOGLE_API_KEY
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("status") == "OK" and data.get("results"):
            formatted_address = data["results"][0].get("formatted_address", "Unknown Location")
            logger.info(f"✅ Reverse geocoded to: {formatted_address}")
            return {
                "status": "OK",
                "formatted_address": formatted_address,
                "results": data["results"]
            }
        else:
            logger.warning(f"⚠️ Reverse geocoding failed: {data.get('status')}")
            return {
                "status": data.get("status", "ZERO_RESULTS"),
                "formatted_address": "Current Location",
                "results": []
            }
        
    except Exception as e:
        logger.error(f"❌ Error reverse geocoding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== LIFECYCLE EVENT HANDLERS ====================

@app.on_event("startup")
async def startup_event():
    """Initialize browser pool on server startup"""
    global browser_pool
    
    logger.info("🚀 Starting FastAPI server...")
    logger.info("🎭 Initializing Playwright browser pool...")
    
    browser_pool = BrowserPool(pool_size=2)
    await browser_pool.initialize()
    
    logger.info("✅ Browser pool ready")
    logger.info("💾 TikTok cache initialized (10-minute TTL)")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup browser pool and cache on server shutdown"""
    global browser_pool
    
    logger.info("🛑 Shutting down FastAPI server...")
    
    if browser_pool:
        logger.info("🧹 Closing browser pool...")
        await browser_pool.close()
    
    logger.info("🧹 Clearing TikTok cache...")
    tiktok_cache.clear()
    
    logger.info("✅ Cleanup complete")

