from fastapi import FastAPI, HTTPException
import requests
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/")
async def root():
    return {"message": "Welcome to Plyce API!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

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
    
    # Ensure each place has a place_id field
    if 'places' in data:
        for index, place in enumerate(data["places"]):
            # Make sure each place has a place_id that equals the id field
            if "id" in place:
                place["place_id"] = place["id"]  # This is critical! 
                print(f"Restaurant {index}: {place.get('displayName', {}).get('text', 'Unknown')}, ID: {place['place_id']}")
            else:
                print(f"Warning: Restaurant {index} has no ID!")
    else:
        print("No places found in response!")
    
    return data

# Endpoints to fetch the details 
@app.get("/restaurants/{place_id}")
async def get_restaurant_details(place_id: str):
    if place_id.startswith("fallback-"):
        return {
            "place_id": place_id,
            "displayName": {"text": place_id.replace("fallback-", "").split("-")[0].capitalize()},
            "message": "Details not available for fallback IDs"
        }

    # Fix here 👇
    if not place_id.startswith("places/"):
        place_id = f"places/{place_id}"
    
    url = f"https://places.googleapis.com/v1/{place_id}"
    
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
