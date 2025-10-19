# Advanced Restaurant Filtering Feature - Implementation Guide

## Overview
This document describes the comprehensive filtering system implemented for the Plyce restaurant locator application, enabling users to filter restaurants by cuisine, dietary preferences, price range, and service attributes (outdoor seating, pet friendly, wheelchair accessible, delivery available).

## Architecture

### Two-Step Filtering Process
The implementation uses a two-step filtering approach to handle different types of filters:

1. **Step 1: Initial Search**
   - Uses Google Places API (Nearby Search or Text Search)
   - Filters by: location, radius, cuisine, dietary preferences, and price level
   - Returns initial candidate restaurants

2. **Step 2: Service Attribute Filtering**
   - Fetches detailed Place Details for each candidate
   - Filters by: outdoor seating, pet friendly, wheelchair accessible, delivery available
   - Returns only restaurants matching all specified criteria

### Why Two-Step?
Google Places Nearby Search API doesn't natively support all service attributes. Some attributes (like outdoor seating, pet friendly) are only available through the Place Details API. To avoid unnecessary API calls:
- If no service attribute filters are selected, we skip Step 2
- If service filters are selected, we fetch details only for initial candidates

## Backend Implementation

### New Endpoints

#### 1. `/restaurants/search` (GET)
Enhanced search endpoint with comprehensive filtering support.

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional): Search radius in meters (2000-25000, default: 5000)
- `cuisine` (optional): Cuisine type (e.g., "Indian", "Italian", "Mexican")
- `dietary` (optional): Dietary preference (e.g., "Vegan", "Gluten-Free", "Halal")
- `price_level` (optional): Price level 1-4 ($ to $$$$)
- `outdoor_seating` (optional): Boolean for outdoor seating availability
- `pet_friendly` (optional): Boolean for pet-friendly establishments
- `wheelchair_accessible` (optional): Boolean for wheelchair accessibility
- `delivery_available` (optional): Boolean for delivery service

**Example Request:**
```bash
GET /restaurants/search?lat=43.6532&lng=-79.3832&radius=25000&cuisine=indian&wheelchair_accessible=true&outdoor_seating=true
```

**Response:**
```json
[
  {
    "id": "ChIJ...",
    "place_id": "ChIJ...",
    "displayName": {
      "text": "Indian Accent",
      "languageCode": "en"
    },
    "formattedAddress": "123 Main St, Toronto, ON",
    "location": {
      "latitude": 43.6532,
      "longitude": -79.3832
    },
    "rating": 4.5,
    "userRatingCount": 250,
    "priceLevel": "PRICE_LEVEL_MODERATE",
    "outdoorSeating": true,
    "accessibilityOptions": {
      "wheelchairAccessibleEntrance": true
    },
    "photos": [...]
  }
]
```

#### 2. `/restaurants/details` (POST)
Batch endpoint for fetching Place Details for multiple place IDs.

**Request Body:**
```json
{
  "place_ids": ["ChIJ...", "ChIJ...", "ChIJ..."]
}
```

**Response:**
```json
{
  "places": [
    {
      "id": "ChIJ...",
      "place_id": "ChIJ...",
      "displayName": {...},
      "outdoorSeating": true,
      "allowsDogs": false,
      "accessibilityOptions": {
        "wheelchairAccessibleEntrance": true
      },
      "delivery": true,
      ...
    }
  ]
}
```

### Backend Code Structure

#### Models (Pydantic)
```python
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
```

#### Helper Function
```python
async def fetch_place_details_batch(place_ids: List[str]) -> List[Dict[str, Any]]
```
Efficiently fetches Place Details for multiple place IDs in sequence.

## Frontend Implementation

### New Components

#### FilterPanel Component
Location: `/src/components/FilterPanel/index.tsx`

A comprehensive modal component with:
- **Cuisine Selection**: 12 cuisine options (Italian, Indian, Chinese, Japanese, Mexican, Thai, French, Mediterranean, American, Korean, Vietnamese, Greek)
- **Dietary Preferences**: 6 options (Vegetarian, Vegan, Gluten-Free, Halal, Kosher, Dairy-Free)
- **Price Range**: 4 levels ($ to $$$$)
- **Service Attributes**: 4 toggles (Outdoor Seating, Pet Friendly, Wheelchair Accessible, Delivery Available)

**Props:**
```typescript
interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}
```

**Features:**
- Single-select for cuisine and dietary (mutually exclusive within category)
- Single-select for price level
- Multi-select for service attributes (toggles)
- "Clear All" button to reset all filters
- "Apply Filters" button with visual indicator when filters are active
- Responsive design with smooth animations

### Updated Types

#### FilterOptions Interface
```typescript
export interface FilterOptions {
  cuisine?: string;
  dietary?: string;
  price_level?: number;
  outdoor_seating?: boolean;
  pet_friendly?: boolean;
  wheelchair_accessible?: boolean;
  delivery_available?: boolean;
}
```

#### Restaurant Interface (Extended)
```typescript
export interface Restaurant {
  // ... existing fields
  outdoorSeating?: boolean;
  allowsDogs?: boolean;
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean;
  };
  delivery?: boolean;
  dineIn?: boolean;
  reservable?: boolean;
  servesBeer?: boolean;
  servesWine?: boolean;
  servesVegetarianFood?: boolean;
}
```

### ApiService Updates

#### New Methods

**searchRestaurantsWithFilters**
```typescript
static async searchRestaurantsWithFilters(
  location: {
    latitude: number;
    longitude: number;
    radius?: number;
  },
  filters?: FilterOptions
): Promise<Restaurant[]>
```
Calls `/restaurants/search` endpoint with filter parameters.

**getPlaceDetailsBatch**
```typescript
static async getPlaceDetailsBatch(
  placeIds: string[]
): Promise<Restaurant[]>
```
Calls `/restaurants/details` endpoint for batch details fetching.

### HomeScreen Integration

**State Management:**
```typescript
const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
const [filterPanelVisible, setFilterPanelVisible] = useState(false);
```

**Filter Application:**
```typescript
const handleApplyFilters = (filters: FilterOptions) => {
  setActiveFilters(filters);
  fetchRestaurants(true, filters);
};
```

**UI Updates:**
- Filter button shows count of active filters
- Active filters displayed as pills below filter button
- Filter button highlighted when filters are active

## Usage Examples

### Example 1: Indian restaurants with wheelchair access and outdoor seating

**User Action:**
1. User opens filter panel
2. Selects "Indian" under Cuisine
3. Toggles ON "Wheelchair Accessible"
4. Toggles ON "Outdoor Seating"
5. Taps "Apply Filters"

**Backend Flow:**
1. Text Search with keyword "indian restaurant"
2. Gets 20 initial results
3. Fetches Place Details for all 20 places
4. Filters for `wheelchairAccessibleEntrance: true` AND `outdoorSeating: true`
5. Returns filtered list (e.g., 5 restaurants)

**API Call:**
```
GET /restaurants/search?lat=43.6532&lng=-79.3832&radius=5000&cuisine=indian&wheelchair_accessible=true&outdoor_seating=true
```

### Example 2: Vegan restaurants, price level $$, pet friendly

**User Action:**
1. Selects "Vegan" under Dietary
2. Selects "$$" under Price Range
3. Toggles ON "Pet Friendly"
4. Applies filters

**Backend Flow:**
1. Text Search with keyword "vegan restaurant" and price_level=2
2. Gets initial results filtered by price
3. Fetches Place Details for each
4. Filters for `allowsDogs: true`
5. Returns final filtered list

**API Call:**
```
GET /restaurants/search?lat=43.6532&lng=-79.3832&radius=5000&dietary=vegan&price_level=2&pet_friendly=true
```

### Example 3: Combined filters - Mexican, Gluten-Free, with delivery

**User Action:**
1. Selects "Mexican" (cuisine)
2. Selects "Gluten-Free" (dietary)
3. Toggles "Delivery Available"
4. Applies

**Backend Flow:**
1. Text Search with "mexican gluten-free restaurant"
2. Fetches Place Details
3. Filters for `delivery: true`
4. Returns results

**API Call:**
```
GET /restaurants/search?lat=43.6532&lng=-79.3832&radius=5000&cuisine=mexican&dietary=gluten-free&delivery_available=true
```

## Error Handling

### Backend
- Gracefully handles missing attributes in Place Details (defaults to false/undefined)
- Logs all API errors with context
- Returns empty array on failure instead of error (with logging)
- Validates input parameters

### Frontend
- Shows error alert if filtering fails
- Maintains previous results on error
- Disables filter button during loading
- Clear visual feedback for active filters

## Performance Considerations

1. **Caching Strategy**: 
   - Cache is bypassed when any filters are active
   - Fresh data fetched for filtered results
   - Regular results still cached when no filters

2. **API Call Optimization**:
   - Batch Place Details fetching
   - Only fetch details when service filters are active
   - Limit initial search to 20 results

3. **UI Performance**:
   - Smooth animations for modal
   - Efficient re-renders using React hooks
   - Client-side search filtering (doesn't trigger API)

## Testing Checklist

- [ ] Single cuisine filter works
- [ ] Single dietary filter works
- [ ] Single price level filter works
- [ ] Single service attribute filter works
- [ ] Multiple filters combined work
- [ ] Clear all filters resets to unfiltered view
- [ ] Filter count badge updates correctly
- [ ] Active filter pills display correctly
- [ ] Refresh clears filters
- [ ] No results message shows when appropriate
- [ ] Loading states work correctly
- [ ] Error handling works
- [ ] Cache bypass works for filtered results

## Future Enhancements

1. **Additional Filters**:
   - Opening hours (open now, open late)
   - Reservations available
   - Takeout available
   - Good for groups/children

2. **UI Improvements**:
   - Save favorite filter combinations
   - Quick filter presets
   - Filter history

3. **Performance**:
   - Implement intelligent caching for common filter combinations
   - Progressive loading for large result sets
   - Predictive prefetching of Place Details

4. **Analytics**:
   - Track most popular filter combinations
   - Monitor API usage and costs
   - A/B test different filter UI layouts

## Deployment Notes

### Environment Variables
Ensure `GOOGLE_API_KEY` is set in backend `.env` file with appropriate API permissions:
- Places API (New)
- Place Details API (New)
- Places API - Text Search enabled
- Places API - Nearby Search enabled

### API Costs
Be aware of Google Places API pricing:
- Text Search: $32 per 1000 requests
- Nearby Search: $32 per 1000 requests  
- Place Details: $17 per 1000 requests (Basic)

With service attribute filtering, expect:
- 1 Text/Nearby Search call per filter request
- Up to 20 Place Details calls per filter request (if service filters active)

### Monitoring
Monitor these metrics:
- Average filter requests per user
- Most common filter combinations
- API error rates
- Response times for filtered requests
- Place Details API usage

## Conclusion

This implementation provides a robust, user-friendly filtering system that leverages the Google Places API efficiently while maintaining good performance. The two-step approach balances API costs with functionality, fetching detailed information only when necessary.
