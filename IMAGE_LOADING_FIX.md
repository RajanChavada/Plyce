# Restaurant Image Loading Fix

## Problem
Restaurant images were not displaying on the home screen (landing page), but they would appear when clicking into individual restaurant cards.

## Root Cause
The backend endpoints `/restaurants` and `/restaurants/search` were returning raw Google Places API photo data that only contained the `name` field (e.g., `"places/ChIJxxx/photos/xxx"`), but NOT the actual photo URLs needed to display images.

The `/restaurants/{place_id}` endpoint (used for detail pages) WAS processing photos correctly by calling `get_photo_url()` to generate the full Google Places Photo API URLs.

## Solution
Added photo URL processing to both list endpoints:

### 1. Created Helper Function (`process_place_photos`)
```python
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
```

### 2. Updated `/restaurants` Endpoint
Added photo processing before returning results:
```python
# Process photos to generate proper URLs
places = process_place_photos(places)

return places
```

### 3. Updated `/restaurants/search` Endpoint
Added photo processing in two places:
- When returning filtered places (with service attributes)
- When returning regular places (with price filter or no filters)

```python
# Process photos to generate proper URLs
places = process_place_photos(places)

return places
```

## What This Does
For each restaurant photo, the backend now:
1. Takes the photo `name` field (e.g., `"places/ChIJxxx/photos/xxx"`)
2. Calls `get_photo_url()` to generate the full URL:
   ```
   https://places.googleapis.com/v1/places/ChIJxxx/photos/xxx/media?maxHeightPx=400&key=YOUR_API_KEY
   ```
3. Returns the processed photo with `googleMapsUri` field

## Frontend Integration
The frontend `ApiService.getRestaurantPhotoUrl()` method already handles this properly:
```typescript
// Check for googleMapsUri - this is the preferred source
if (photo.googleMapsUri) {
  return photo.googleMapsUri;
}
```

So once the backend returns photos with `googleMapsUri`, the frontend automatically displays them!

## Testing
1. Restart the backend server: `cd Backend && python app.py`
2. Refresh the mobile app
3. Restaurant images should now load on the home screen

## Files Modified
- **Backend/app.py**: Added `process_place_photos()` helper function and updated two endpoints

## Expected Result
✅ Restaurant images display immediately on the home screen landing page
✅ Images continue to work correctly on detail pages
✅ Placeholder images only show if restaurant has no photos available
