# Architecture Diagram - Advanced Filtering Feature

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLYCE APPLICATION                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   Mobile Frontend    │         │   FastAPI Backend    │
│  (React Native)      │◄───────►│    (Python)          │
└──────────────────────┘         └──────────────────────┘
                                           │
                                           ▼
                                 ┌──────────────────────┐
                                 │  Google Places API   │
                                 │  - Text Search       │
                                 │  - Nearby Search     │
                                 │  - Place Details     │
                                 └──────────────────────┘
```

## Filtering Flow Diagram

```
User Opens App
    │
    ▼
┌───────────────────────┐
│   HomeScreen Loads    │
│   - Get Location      │
│   - Fetch Restaurants │
└───────────────────────┘
    │
    ▼
┌───────────────────────┐
│  Display Restaurant   │
│  List (Unfiltered)    │
└───────────────────────┘
    │
    ▼
User Taps "Filters" Button
    │
    ▼
┌───────────────────────────────────┐
│       FilterPanel Modal           │
│  ┌─────────────────────────────┐  │
│  │  Cuisine Selection          │  │
│  │  ☐ Italian ☐ Indian ...    │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │  Dietary Preferences        │  │
│  │  ☐ Vegan ☐ Gluten-Free     │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │  Price Range                │  │
│  │  ☐ $ ☐ $$ ☐ $$$ ☐ $$$$   │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │  Service Attributes         │  │
│  │  ⚪ Outdoor Seating         │  │
│  │  ⚪ Pet Friendly            │  │
│  │  ⚪ Wheelchair Accessible   │  │
│  │  ⚪ Delivery Available      │  │
│  └─────────────────────────────┘  │
│                                   │
│  [Clear All]  [Apply Filters]    │
└───────────────────────────────────┘
    │
    ▼
User Selects Filters & Taps "Apply"
    │
    ▼
┌─────────────────────────────────────┐
│  Frontend (ApiService)              │
│  - Build filter parameters          │
│  - Call searchRestaurantsWithFilters│
└─────────────────────────────────────┘
    │
    ▼
API Request: GET /restaurants/search?filters...
    │
    ▼
┌─────────────────────────────────────────────────┐
│          Backend Processing                     │
│                                                 │
│  Step 1: Check Filter Types                    │
│  ├─ Has cuisine/dietary?                       │
│  ├─ Has price level?                           │
│  └─ Has service attributes?                    │
│                                                 │
│  Step 2: Initial Search                        │
│  ├─ If cuisine/dietary → Text Search API      │
│  │   Query: "{cuisine} {dietary} restaurant"  │
│  │                                             │
│  └─ Else → Nearby Search API                  │
│      LocationRestriction + includedTypes      │
│                                                 │
│  Returns: 20 candidate restaurants             │
│                                                 │
│  Step 3: Service Attribute Filtering          │
│  (Only if service filters selected)            │
│  ├─ For each restaurant:                      │
│  │   ├─ Fetch Place Details                   │
│  │   ├─ Check: outdoor_seating?              │
│  │   ├─ Check: pet_friendly (allowsDogs)?    │
│  │   ├─ Check: wheelchair_accessible?        │
│  │   └─ Check: delivery_available?           │
│  │                                             │
│  └─ Filter: Keep only matching restaurants    │
│                                                 │
│  Returns: 5 filtered restaurants               │
└─────────────────────────────────────────────────┘
    │
    ▼
Response: Array of filtered restaurants
    │
    ▼
┌─────────────────────────────────────┐
│  Frontend Updates                   │
│  - setRestaurants(results)          │
│  - setActiveFilters(filters)        │
│  - Update filter count badge        │
│  - Show active filter pills         │
└─────────────────────────────────────┘
    │
    ▼
┌───────────────────────────────────────┐
│  Display Filtered Restaurant List    │
│  ┌─────────────────────────────────┐ │
│  │ [🔍 2 Filters] [Vegan] [$$]    │ │
│  └─────────────────────────────────┘ │
│                                       │
│  Restaurant 1 ⭐ 4.5                 │
│  - Vegan options                     │
│  - Outdoor seating ✓                 │
│  - $$ Moderate                       │
│                                       │
│  Restaurant 2 ⭐ 4.8                 │
│  - 100% Vegan                        │
│  - Delivery ✓                        │
│  - $$ Moderate                       │
└───────────────────────────────────────┘
```

## Data Flow - Detailed

```
┌─────────────────────────────────────────────────────────────┐
│                     Request Flow                            │
└─────────────────────────────────────────────────────────────┘

Frontend                Backend                Google API
   │                       │                        │
   │ 1. User applies      │                        │
   │    filters            │                        │
   │                       │                        │
   │ 2. API Call          │                        │
   ├──────────────────────►│                        │
   │ GET /restaurants/    │                        │
   │     search?filters   │                        │
   │                       │                        │
   │                       │ 3. Text/Nearby Search │
   │                       ├───────────────────────►│
   │                       │ "vegan restaurant"    │
   │                       │ lat/lng/radius        │
   │                       │                        │
   │                       │ 4. Results            │
   │                       │◄───────────────────────┤
   │                       │ [20 restaurants]      │
   │                       │                        │
   │                       │ 5. Place Details      │
   │                       ├───────────────────────►│
   │                       │ (for each ID)         │
   │                       │                        │
   │                       │ 6. Detailed Info      │
   │                       │◄───────────────────────┤
   │                       │ {attributes...}       │
   │                       │                        │
   │                       │ 7. Filter Results     │
   │                       │ (client-side)         │
   │                       │                        │
   │ 8. Filtered Results  │                        │
   │◄──────────────────────┤                        │
   │ [5 restaurants]       │                        │
   │                       │                        │
   │ 9. Display to User   │                        │
   ▼                       ▼                        ▼
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                      │
└─────────────────────────────────────────────────────────────┘

HomeScreen.tsx
├── State Management
│   ├── activeFilters: FilterOptions
│   ├── restaurants: Restaurant[]
│   ├── filteredRestaurants: Restaurant[]
│   └── filterPanelVisible: boolean
│
├── Functions
│   ├── fetchRestaurants(filters?)
│   ├── handleApplyFilters(filters)
│   ├── handleOpenFilterPanel()
│   └── getActiveFiltersSummary()
│
└── UI Components
    ├── LocationSearch
    ├── SearchBar
    ├── Filter Button (with count badge)
    ├── Active Filter Pills
    ├── RestaurantCard List
    └── FilterPanel Modal
        ├── Cuisine Selection
        ├── Dietary Selection
        ├── Price Selection
        ├── Service Toggles
        └── Action Buttons

ApiService.ts
├── searchRestaurantsWithFilters()
│   └── GET /restaurants/search
│
├── getPlaceDetailsBatch()
│   └── POST /restaurants/details
│
└── getNearbyRestaurants() [legacy]
    └── GET /restaurants

FilterPanel Component
├── Props
│   ├── visible
│   ├── onClose
│   ├── onApply
│   └── initialFilters
│
├── State
│   ├── selectedCuisine
│   ├── selectedDietary
│   ├── selectedPrice
│   ├── outdoorSeating
│   ├── petFriendly
│   ├── wheelchairAccessible
│   └── deliveryAvailable
│
└── UI Sections
    ├── Header (title + close)
    ├── Cuisine Chips
    ├── Dietary Chips
    ├── Price Buttons
    ├── Service Toggles
    └── Footer (clear + apply)
```

## Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend Structure                        │
└─────────────────────────────────────────────────────────────┘

app.py
│
├── Models (Pydantic)
│   ├── FilterOptions
│   │   ├── cuisine?: str
│   │   ├── dietary?: str
│   │   ├── price_level?: int
│   │   ├── outdoor_seating?: bool
│   │   ├── pet_friendly?: bool
│   │   ├── wheelchair_accessible?: bool
│   │   └── delivery_available?: bool
│   │
│   └── PlaceDetailsRequest
│       └── place_ids: List[str]
│
├── Endpoints
│   ├── GET /restaurants/search
│   │   ├── Accepts: lat, lng, radius, filter params
│   │   ├── Returns: List[Dict] (restaurants)
│   │   └── Logic:
│   │       ├── Build search query
│   │       ├── Call Google API
│   │       ├── Filter by attributes if needed
│   │       └── Return results
│   │
│   └── POST /restaurants/details
│       ├── Accepts: place_ids[]
│       ├── Returns: {places: List[Dict]}
│       └── Logic:
│           ├── For each place_id
│           ├── Fetch Place Details
│           └── Return all details
│
└── Helper Functions
    ├── fetch_place_details_batch()
    │   └── Batch fetch Place Details
    │
    └── get_photo_url()
        └── Generate photo URLs
```

## API Request Examples

```
┌─────────────────────────────────────────────────────────────┐
│                  Example API Calls                          │
└─────────────────────────────────────────────────────────────┘

1. Simple Cuisine Filter
   ┌──────────────────────────────────────────┐
   │ GET /restaurants/search                  │
   │   ?lat=43.6532                          │
   │   &lng=-79.3832                         │
   │   &radius=5000                          │
   │   &cuisine=indian                       │
   └──────────────────────────────────────────┘
   
   Response: [Indian restaurants]

2. Multiple Filters
   ┌──────────────────────────────────────────┐
   │ GET /restaurants/search                  │
   │   ?lat=43.6532                          │
   │   &lng=-79.3832                         │
   │   &radius=10000                         │
   │   &cuisine=vegan                        │
   │   &price_level=2                        │
   │   &outdoor_seating=true                 │
   └──────────────────────────────────────────┘
   
   Response: [Vegan, $$, outdoor restaurants]

3. Service Attributes Only
   ┌──────────────────────────────────────────┐
   │ GET /restaurants/search                  │
   │   ?lat=43.6532                          │
   │   &lng=-79.3832                         │
   │   &wheelchair_accessible=true           │
   │   &delivery_available=true              │
   └──────────────────────────────────────────┘
   
   Response: [Accessible + Delivery restaurants]

4. Batch Details
   ┌──────────────────────────────────────────┐
   │ POST /restaurants/details                │
   │ Content-Type: application/json           │
   │                                          │
   │ {                                        │
   │   "place_ids": [                        │
   │     "ChIJ...",                           │
   │     "ChIJ...",                           │
   │     "ChIJ..."                            │
   │   ]                                      │
   │ }                                        │
   └──────────────────────────────────────────┘
   
   Response: {places: [details...]}
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│               State Transitions                             │
└─────────────────────────────────────────────────────────────┘

Initial State
├── restaurants: []
├── activeFilters: {}
├── filterPanelVisible: false
└── loading: false

User Opens Filter Panel
├── filterPanelVisible: true
└── (no other changes)

User Selects Filters
├── (internal FilterPanel state changes)
└── (HomeScreen state unchanged until apply)

User Applies Filters
├── activeFilters: {cuisine: "Indian", ...}
├── filterPanelVisible: false
├── loading: true
└── Trigger: fetchRestaurants(filters)

Fetching Data
├── loading: true
└── API call in progress

Data Received
├── loading: false
├── restaurants: [filtered results]
└── filteredRestaurants: [filtered results]

UI Updates
├── Filter button shows count
├── Active filter pills render
└── Restaurant list updates
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Error Scenarios                            │
└─────────────────────────────────────────────────────────────┘

Backend Error (500)
    │
    ▼
Backend logs error
    │
    ▼
Returns empty array
    │
    ▼
Frontend shows "No restaurants found"
    │
    └─► User can retry with different filters


Network Error
    │
    ▼
Frontend catches error
    │
    ▼
Alert: "Failed to load restaurants"
    │
    ▼
Maintains previous results
    │
    └─► User can retry


API Quota Exceeded
    │
    ▼
Google API returns 429
    │
    ▼
Backend logs warning
    │
    ▼
Returns cached results or error
    │
    └─► Monitor and alert developer


No Results Found
    │
    ▼
Backend returns empty array
    │
    ▼
Frontend displays empty state
    │
    ▼
"No restaurants match your filters"
    │
    └─► User can clear filters or adjust
```

---

**Visual representations to help understand the filtering architecture and data flow**
