# Before vs After: Restaurant Photo Data

## BEFORE (Not Working) ❌

### Backend Response from `/restaurants` endpoint:
```json
{
  "id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "displayName": {
    "text": "Gusto 101"
  },
  "photos": [
    {
      "name": "places/ChIJN1t_tDeuEmsRUsoyG83frY4/photos/AUc7tXX...",
      "widthPx": 4800,
      "heightPx": 3200
    }
  ],
  "rating": 4.5
}
```

### Problem:
- Photo only has `name` field
- Frontend can't display this - needs actual URL
- RestaurantCard shows placeholder/loading spinner forever

---

## AFTER (Working) ✅

### Backend Response from `/restaurants` endpoint:
```json
{
  "id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "displayName": {
    "text": "Gusto 101"
  },
  "photos": [
    {
      "name": "places/ChIJN1t_tDeuEmsRUsoyG83frY4/photos/AUc7tXX...",
      "googleMapsUri": "https://places.googleapis.com/v1/places/ChIJN1t_tDeuEmsRUsoyG83frY4/photos/AUc7tXX.../media?maxHeightPx=400&key=YOUR_API_KEY",
      "widthPx": 4800,
      "heightPx": 3200
    }
  ],
  "rating": 4.5
}
```

### Success:
- Photo has both `name` AND `googleMapsUri` fields
- Frontend's `ApiService.getRestaurantPhotoUrl()` uses `googleMapsUri`
- React Native `<Image>` component loads the URL
- Restaurant images display immediately on home screen!

---

## Technical Flow

### Before Fix:
```
Google Places API
  ↓ (returns photo.name only)
Backend /restaurants endpoint
  ↓ (passes through raw data)
Frontend ApiService
  ↓ (tries to use photo.name as URL - fails!)
RestaurantCard <Image>
  ↓ ❌ Shows placeholder forever
```

### After Fix:
```
Google Places API
  ↓ (returns photo.name only)
Backend /restaurants endpoint
  ↓ (calls process_place_photos helper)
  ↓ (generates googleMapsUri using get_photo_url)
Frontend ApiService
  ↓ (uses photo.googleMapsUri)
RestaurantCard <Image>
  ↓ ✅ Loads and displays image!
```

---

## Why It Worked on Detail Pages But Not Home Screen

### Detail Page (`/restaurants/{place_id}` endpoint):
- Already had photo processing logic built-in
- Generated `googleMapsUri` for each photo
- Images displayed correctly ✅

### Home Screen (`/restaurants` endpoint):
- Missing photo processing logic
- Only returned raw `name` field from Google API
- Images never loaded ❌

### The Fix:
Extracted photo processing into reusable `process_place_photos()` function and applied it to ALL endpoints that return restaurant lists!
