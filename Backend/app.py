from fastapi import FastAPI
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
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
async def root():
    return {"message": "Welcome to Plyce API!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/restaurants")
async def get_restaurants(lat:float, lng:float, radius: int = 5000):
    # Use the new Places API
    url = "https://places.googleapis.com/v1/places:searchNearby"
    
    # Headers for the request
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.priceLevel,places.photos"
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
    return response.json()


# Add your API endpoints here

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
