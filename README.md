# Plyce - Advanced Restaurant Locator

Food locator application that uses Google Maps Places API to discover restaurants nearby with comprehensive filtering capabilities.

## 🎯 Features

### Core Features
- 📍 Location-based restaurant discovery
- 🗺️ Custom location selection with radius adjustment (2-25km)
- ⭐ Restaurant ratings and reviews
- 🎬 TikTok integration for restaurant videos
- 📱 Mobile-first responsive design

### 🆕 Advanced Filtering (NEW)
Plyce now supports comprehensive restaurant filtering:

#### Filter Categories

1. **Cuisine Types** 🍽️
   - Italian, Indian, Chinese, Japanese, Mexican, Thai, French
   - Mediterranean, American, Korean, Vietnamese, Greek

2. **Dietary Preferences** 🥗
   - Vegetarian, Vegan, Gluten-Free
   - Halal, Kosher, Dairy-Free

3. **Price Range** 💰
   - $ (Inexpensive)
   - $$ (Moderate)
   - $$$ (Expensive)
   - $$$$ (Very Expensive)

4. **Service Attributes** ♿
   - 🌳 Outdoor Seating
   - 🐕 Pet Friendly
   - ♿ Wheelchair Accessible
   - 🚚 Delivery Available

### How Filtering Works

The app uses a smart two-step filtering process:

1. **Initial Search**: Uses Google Places API to find restaurants matching location, cuisine, dietary, and price filters
2. **Attribute Filtering**: For service attributes (outdoor seating, pet friendly, etc.), fetches detailed information and filters results

This approach minimizes API calls while providing comprehensive filtering options.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Maps API Key with Places API enabled
- Expo CLI (for mobile development)

### Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your Google API key
echo "GOOGLE_API_KEY=your_api_key_here" > .env

# Run the server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd Mobile-Frontend/Mobile-Frontend

# Install dependencies
npm install

# Update API URL in src/services/ApiService.ts if needed

# Start Expo development server
npx expo start
```

## 📡 API Endpoints

### Restaurant Search
```
GET /restaurants/search
```

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude  
- `radius` (optional): Search radius in meters (2000-25000)
- `cuisine` (optional): Cuisine type filter
- `dietary` (optional): Dietary preference filter
- `price_level` (optional): Price level (1-4)
- `outdoor_seating` (optional): Boolean
- `pet_friendly` (optional): Boolean
- `wheelchair_accessible` (optional): Boolean
- `delivery_available` (optional): Boolean

**Example:**
```bash
curl "http://localhost:8000/restaurants/search?lat=43.6532&lng=-79.3832&radius=5000&cuisine=indian&wheelchair_accessible=true"
```

### Batch Place Details
```
POST /restaurants/details
```

**Request Body:**
```json
{
  "place_ids": ["place_id_1", "place_id_2", "place_id_3"]
}
```

### Other Endpoints
- `GET /restaurants/{place_id}` - Get restaurant details
- `GET /restaurants/{place_id}/reviews` - Get restaurant reviews
- `GET /restaurants/{place_id}/tiktok-videos` - Get TikTok videos
- `GET /health` - Health check

## 🧪 Testing

Run the filtering feature tests:

```bash
# Make sure the backend is running
cd /path/to/Plyce

# Run test script
./test_filtering.sh
```

## 📖 Documentation

Detailed implementation guide: [FILTERING_FEATURE_GUIDE.md](./FILTERING_FEATURE_GUIDE.md)

## 🏗️ Architecture

```
Plyce/
├── Backend/                    # FastAPI backend
│   ├── app.py                 # Main application with filtering endpoints
│   └── requirements.txt       # Python dependencies
├── Mobile-Frontend/
│   └── Mobile-Frontend/       # React Native (Expo) frontend
│       ├── app/              # App routes
│       └── src/
│           ├── components/
│           │   └── FilterPanel/  # Advanced filter UI
│           ├── services/
│           │   └── ApiService.ts # API integration with filtering
│           └── types/
│               └── index.ts      # TypeScript interfaces
└── FILTERING_FEATURE_GUIDE.md # Complete feature documentation
```

## 🎨 UI/UX Highlights

- **Filter Button**: Shows count of active filters with visual indicator
- **Active Filter Pills**: Display currently applied filters at a glance
- **Smooth Animations**: Modal transitions and interactions
- **Clear All Option**: Quickly reset all filters
- **Responsive Design**: Optimized for mobile devices

## 📊 Example Use Cases

### Use Case 1: Health-Conscious User
**Goal**: Find vegan restaurants with outdoor seating within 10km

**Actions**:
1. Adjust radius to 10km
2. Open filter panel
3. Select "Vegan" under Dietary
4. Toggle "Outdoor Seating"
5. Apply filters

**Result**: List of vegan restaurants with outdoor seating

### Use Case 2: Accessibility-Focused Search
**Goal**: Find wheelchair-accessible restaurants with delivery

**Actions**:
1. Toggle "Wheelchair Accessible"
2. Toggle "Delivery Available"
3. Apply filters

**Result**: Restaurants meeting accessibility and delivery requirements

### Use Case 3: Cuisine Explorer
**Goal**: Find budget-friendly Mexican restaurants

**Actions**:
1. Select "Mexican" under Cuisine
2. Select "$" or "$$" under Price
3. Apply filters

**Result**: Affordable Mexican dining options

## 🔒 API Key Configuration

Your Google API Key needs these APIs enabled:
- Places API (New)
- Place Details API
- Places API - Text Search
- Places API - Nearby Search

## 💡 Performance Considerations

- **Caching**: Results cached when no filters active
- **Smart Fetching**: Place Details only fetched when service filters used
- **Batch Operations**: Multiple place details fetched efficiently
- **Client-side Search**: Text search doesn't trigger API calls

## 🐛 Troubleshooting

### Backend Issues
- **API Key Errors**: Verify `GOOGLE_API_KEY` in `.env` file
- **No Results**: Check API quota and billing
- **Slow Responses**: Service attribute filters fetch additional data

### Frontend Issues
- **Connection Errors**: Update `API_URL` in `ApiService.ts`
- **Filter Not Working**: Check network tab for API responses
- **Cache Issues**: Force refresh or clear app cache

## 🤝 Contributing

Contributions welcome! Areas for enhancement:
- Additional filter categories
- Saved filter presets
- Filter analytics
- Performance optimizations

## 📝 License

[Your License Here]

## 🙏 Acknowledgments

- Google Maps Places API
- React Native & Expo
- FastAPI
- Community contributors