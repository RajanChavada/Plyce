from fastapi import FastAPI, HTTPException
import requests
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from typing import List
import re
import urllib.parse
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

load_dotenv() # load the env

app = FastAPI(title="Plyce API", 
              description="Backend API for Plyce application",
              version="0.1.0")

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") # Get the key 

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    
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

# Update the restaurants endpoint to include proper photo URLs
@app.get("/restaurants")
async def get_restaurants(lat: float, lng: float, radius: int = 5000):
    # Use the new Places API
    url = "https://places.googleapis.com/v1/places:searchNearby"
    
    # Headers for the request
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.priceLevel,places.photos"
    }
    
    # Body for the request
    body = {
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius
            }
        },
        "includedTypes": ["restaurant"],
        "maxResultCount": 20
    }
    
    # Make the request
    response = requests.post(url, headers=headers, json=body)
    
    # Debug the raw response
    print(f"API Response Status: {response.status_code}")
    
    # Process the response
    data = response.json()
    
    # Ensure each place has a place_id field and proper photo URLs
    if 'places' in data:
        for index, place in enumerate(data["places"]):
            # Make sure each place has a place_id that equals the id field
            if "id" in place:
                place["place_id"] = place["id"]
                
                # Process photos to generate proper URLs
                if "photos" in place and place["photos"]:
                    processed_photos = []
                    for photo in place["photos"]:
                        # For the new Places API, photos have a 'name' field
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
                
                print(f"Restaurant {index}: {place.get('displayName', {}).get('text', 'Unknown')}, ID: {place['place_id']}, Photos: {len(place.get('photos', []))}")
            else:
                print(f"Warning: Restaurant {index} has no ID!")
    else:
        print("No places found in response!")
    
    return data

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

@app.get("/restaurants/{place_id}/tiktok-videos")
async def get_restaurant_tiktok_videos(place_id: str, limit: int = 4):
    """
    Scrape actual TikTok videos for a restaurant using a headless browser
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
            
        # For debugging
        print(f"Searching TikTok videos for restaurant: {restaurant_name}")
            
        # Setup Chrome options for headless browsing
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        # Create a new Chrome webdriver
        driver = webdriver.Chrome(options=chrome_options)
        
        try:
            # Create TikTok search URL
            tiktok_search_url = f"https://www.tiktok.com/search?q={restaurant_name.replace(' ', '+')}+restaurant"
            print(f"Navigating to: {tiktok_search_url}")
            
            # Navigate to TikTok search page
            driver.get(tiktok_search_url)
            
            # Wait for content to load (adjust timeout as needed)
            time.sleep(5)  # Simple wait for page to load
            
            videos = []
            
            try:
                # Wait for video elements to be present
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-e2e='search_video-item']"))
                )
                
                # Extract video elements
                video_elements = driver.find_elements(By.CSS_SELECTOR, "div[data-e2e='search_video-item']")
                print(f"Found {len(video_elements)} video elements")
                
                # Process each video (up to the limit)
                for i, video_elem in enumerate(video_elements[:limit]):
                    try:
                        # Extract video link
                        link_elem = video_elem.find_element(By.CSS_SELECTOR, "a")
                        video_url = link_elem.get_attribute("href")
                        
                        # Extract thumbnail
                        img_elem = video_elem.find_element(By.CSS_SELECTOR, "img")
                        thumbnail = img_elem.get_attribute("src")
                        
                        # Extract description
                        desc_elem = video_elem.find_element(By.CSS_SELECTOR, "div[data-e2e='search_video-desc']")
                        description = desc_elem.text
                        
                        videos.append({
                            'id': f"video-{i+1}",
                            'thumbnail': thumbnail,
                            'url': video_url,
                            'description': description[:100] or f"{restaurant_name} on TikTok"
                        })
                        
                        print(f"Extracted video {i+1}: {video_url}")
                    except Exception as e:
                        print(f"Error extracting video {i+1}: {str(e)}")
                        continue
            
            except Exception as e:
                print(f"Error waiting for video elements: {str(e)}")
                
                # If we couldn't find videos with the data-e2e attribute, try a more generic approach
                try:
                    # Look for any video links
                    link_elements = driver.find_elements(By.TAG_NAME, "a")
                    
                    # Filter for video links
                    video_links = [link for link in link_elements 
                                 if "/video/" in link.get_attribute("href")]
                    
                    for i, link in enumerate(video_links[:limit]):
                        if len(videos) >= limit:
                            break
                            
                        try:
                            video_url = link.get_attribute("href")
                            
                            # Try to find an image near this link
                            try:
                                img = link.find_element(By.TAG_NAME, "img")
                                thumbnail = img.get_attribute("src")
                            except:
                                thumbnail = f"https://via.placeholder.com/300x400/EE1D52/FFFFFF?text={restaurant_name.replace(' ', '+')}"
                            
                            # Try to get description text
                            try:
                                description = link.get_attribute("title") or link.text
                            except:
                                description = f"{restaurant_name} on TikTok - Video {i+1}"
                            
                            videos.append({
                                'id': f"video-{i+1}",
                                'thumbnail': thumbnail,
                                'url': video_url,
                                'description': description[:100]
                            })
                        except Exception as e:
                            print(f"Error processing link {i+1}: {str(e)}")
                            continue
                except Exception as e:
                    print(f"Fallback scraping failed: {str(e)}")
            
            # If no videos found through scraping, add placeholders with direct search link
            if len(videos) == 0:
                videos = generate_placeholder_videos(restaurant_name, limit, tiktok_search_url)
        
        finally:
            # Always close the driver
            driver.quit()
        
        return {
            "place_id": place_id,
            "restaurant_name": restaurant_name,
            "videos": videos,
            "search_url": tiktok_search_url
        }
                
    except Exception as e:
        print(f"Error searching for TikTok videos: {str(e)}")
        return {
            "place_id": place_id,
            "videos": [],
            "error": str(e)
        }

# Helper function to generate placeholder videos
def generate_placeholder_videos(restaurant_name, limit, search_url):
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
