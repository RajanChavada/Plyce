# Quick Setup Guide - Menu Preview Feature

## 🚀 Getting Started

### Step 1: Get SerpApi Key (Required)
1. Go to https://serpapi.com/
2. Sign up for a free account
3. Navigate to https://serpapi.com/manage-api-key
4. Copy your API key

### Step 2: Configure Backend
Add your SerpApi key to the backend environment file:

```bash
# Backend/.env
SERPAPI_KEY=your_serpapi_key_here
```

### Step 3: Install Dependencies
The Python package is already installed, but if you need to reinstall:

```bash
cd Backend
pip install -r requirements.txt
```

### Step 4: Restart Backend Server
```bash
cd Backend
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
✅ SERPAPI_KEY loaded (length: XX)
```

If you see:
```
⚠️ SERPAPI_KEY not found - menu highlights feature will be limited
```
Then the feature will still work but show a fallback UI.

### Step 5: Test the Frontend
The mobile frontend should automatically pick up the changes:

```bash
cd Mobile-Frontend/Mobile-Frontend
npx expo start
```

### Step 6: Verify It Works
1. Open the Plyce app
2. Navigate to any restaurant details screen
3. Look for the **"Menu Preview"** section between the restaurant card and reviews
4. You should see:
   - Loading spinner → Menu items with images/prices
   - OR "No menu preview available" (if SerpApi has no data for that restaurant)

---

## 🧪 Testing

### Quick Test Command
Test the backend endpoint directly:

```bash
curl http://localhost:8000/restaurants/YOUR_PLACE_ID/menu-highlights
```

Expected response:
```json
{
  "place_id": "ChIJ...",
  "menu_highlights": [
    {
      "title": "Tiramisu",
      "thumbnails": ["https://..."],
      "reviews": 38,
      "photos": 52,
      "price_range": [15, 15],
      "link": "https://..."
    }
  ],
  "status": "success"
}
```

---

## 🎯 What's Included

### Backend Changes
- ✅ New endpoint: `GET /restaurants/{place_id}/menu-highlights`
- ✅ SerpApi integration for menu scraping
- ✅ Comprehensive error handling
- ✅ Graceful fallback when API key missing

### Frontend Changes
- ✅ New `MenuPreview` component
- ✅ Updated `ApiService` with menu methods
- ✅ Integrated into `RestaurantDetailsScreen`
- ✅ Loading, error, and no-data states
- ✅ Caching support

---

## 📊 SerpApi Free Tier Limits
- **100 searches/month** FREE
- Each menu fetch = 1 search
- Perfect for development and testing
- Upgrade at https://serpapi.com/pricing if needed

---

## 🔧 Troubleshooting

### Menu Not Showing?
1. Check backend logs for errors
2. Verify `SERPAPI_KEY` in `.env`
3. Restart backend server
4. Check SerpApi quota: https://serpapi.com/dashboard

### Still Not Working?
The feature degrades gracefully:
- Shows "No menu preview available" button
- User can click "View on Google Maps" as fallback
- Rest of the app works normally

---

## 📖 Full Documentation
See `MENU_PREVIEW_IMPLEMENTATION.md` for complete technical details.

---

## ✨ Features

Users can now:
- 📸 See menu item photos in restaurant overview
- 💰 View prices without opening external links
- ⭐ See review/photo counts for each dish
- 🔗 Click items to view on Google Maps
- 📱 Access full menu with one tap

---

## 🎉 You're Done!
The menu preview feature is now fully integrated into Plyce!
