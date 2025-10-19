# Quick Start Guide - Testing the Advanced Filtering Feature

## 🚀 Get Started in 5 Minutes

### Prerequisites Check
```bash
# Check Python version (need 3.11+)
python --version

# Check Node.js version (need 18+)
node --version

# Check if you have the Google API key
echo $GOOGLE_API_KEY
```

### Step 1: Start the Backend (Terminal 1)

```bash
# Navigate to backend
cd Backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Set your Google API key
export GOOGLE_API_KEY="your_api_key_here"

# Start the server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Step 2: Verify Backend (Terminal 2)

```bash
# Test health check
curl http://localhost:8000/health

# Expected: {"status":"healthy"}

# Test basic search
curl "http://localhost:8000/restaurants/search?lat=43.6532&lng=-79.3832&radius=5000" | jq '.[0].displayName'

# Expected: Restaurant name displayed
```

### Step 3: Start the Frontend (Terminal 3)

```bash
# Navigate to frontend
cd Mobile-Frontend/Mobile-Frontend

# Install dependencies (first time only)
npm install

# Start Expo
npx expo start
```

**Expected Output:**
```
Metro waiting on exp://192.168.x.x:8081
› Press a │ open Android
› Press i │ open iOS simulator
```

### Step 4: Test the Filter Feature

#### On Your Device/Simulator:

1. **Open the App**
   - Scan QR code (physical device) or press `i`/`a` (simulator)
   - Allow location permissions

2. **See Restaurants Load**
   - Wait for nearby restaurants to appear
   - Should see list of restaurants with ratings

3. **Open Filter Panel**
   - Tap the "Filters" button at top
   - Filter panel should slide up from bottom

4. **Apply a Simple Filter**
   - Select "Italian" under Cuisine
   - Tap "Apply Filters"
   - Should see only Italian restaurants

5. **Try Combined Filters**
   - Open filter panel again
   - Select "Vegan" under Dietary
   - Select "$$" under Price Range
   - Toggle "Outdoor Seating" ON
   - Tap "Apply Filters"
   - Should see filtered results (may be fewer)

6. **Check Filter Indicators**
   - Filter button should show "3 Filters"
   - Should see active filter pills below button
   - Pills should show: "Vegan", "$$"

7. **Clear Filters**
   - Open filter panel
   - Tap "Clear All"
   - Tap "Apply Filters"
   - Should see all restaurants again

## 🧪 Quick Tests

### Test 1: Cuisine Filter
```bash
curl "http://localhost:8000/restaurants/search?lat=43.6532&lng=-79.3832&cuisine=indian" | jq 'length'
# Should return number of Indian restaurants found
```

### Test 2: Combined Filters
```bash
curl "http://localhost:8000/restaurants/search?lat=43.6532&lng=-79.3832&cuisine=vegan&wheelchair_accessible=true&outdoor_seating=true" | jq 'length'
# Should return number matching all criteria
```

### Test 3: Run Full Test Suite
```bash
# From project root
./test_filtering.sh
```

## 🐛 Troubleshooting

### Backend Won't Start
**Problem**: `ModuleNotFoundError: No module named 'fastapi'`  
**Solution**: 
```bash
pip install -r requirements.txt
```

**Problem**: `GOOGLE_API_KEY not found`  
**Solution**: 
```bash
export GOOGLE_API_KEY="your_key_here"
# Or add to .env file in Backend/
```

### Frontend Won't Connect
**Problem**: "Network request failed"  
**Solution**: Update API URL in `src/services/ApiService.ts`:
```typescript
// For iOS simulator
return "http://localhost:8000";

// For Android emulator  
return "http://10.0.2.2:8000";

// For physical device
return "http://192.168.x.x:8000";  // Your computer's IP
```

### No Restaurants Showing
**Problem**: Empty list after filtering  
**Possible Causes**:
1. Filter combination too restrictive
2. No restaurants match criteria in area
3. Google API quota exceeded

**Solution**:
1. Try broader filters
2. Try different location
3. Check Google Cloud Console for quota

### Filter Panel Not Opening
**Problem**: Nothing happens when tapping filter button  
**Solution**:
1. Check console for errors
2. Verify FilterPanel component imported
3. Clear app cache and restart

## 📊 What to Look For

### Success Indicators ✅
- Backend starts without errors
- Health check returns "healthy"
- Restaurants load on home screen
- Filter button visible and clickable
- Filter panel opens smoothly
- Filters apply and update results
- Active filter pills display
- Clear all works
- No console errors

### Red Flags ❌
- Server crashes on startup
- API returns 500 errors
- App crashes when opening filters
- Filters don't change results
- Console shows network errors
- Excessive API calls (check logs)

## 🎯 Feature Showcase

### Demo Scenario 1: Health-Conscious User
```
Goal: Find vegan restaurants with outdoor seating

Steps:
1. Open app → See all restaurants
2. Tap "Filters"
3. Select "Vegan" under Dietary
4. Toggle "Outdoor Seating" ON
5. Tap "Apply Filters"
6. See filtered vegan restaurants with outdoor seating
```

### Demo Scenario 2: Accessibility Focus
```
Goal: Find wheelchair-accessible restaurants

Steps:
1. Open filters
2. Toggle "Wheelchair Accessible" ON
3. Apply
4. See only accessible restaurants
```

### Demo Scenario 3: Budget & Cuisine
```
Goal: Find affordable Italian food

Steps:
1. Open filters
2. Select "Italian" under Cuisine
3. Select "$" or "$$" under Price
4. Apply
5. See budget-friendly Italian options
```

## 📝 Quick Reference

### Filter Options Available

**Cuisine (12)**
Italian, Indian, Chinese, Japanese, Mexican, Thai, French, Mediterranean, American, Korean, Vietnamese, Greek

**Dietary (6)**
Vegetarian, Vegan, Gluten-Free, Halal, Kosher, Dairy-Free

**Price (4)**
$ (Inexpensive), $$ (Moderate), $$$ (Expensive), $$$$ (Very Expensive)

**Service Attributes (4)**
🌳 Outdoor Seating, 🐕 Pet Friendly, ♿ Wheelchair Accessible, 🚚 Delivery Available

### API Endpoints

```bash
# Search with filters
GET /restaurants/search?lat=X&lng=Y&radius=Z&cuisine=...&dietary=...

# Batch details
POST /restaurants/details
Body: {"place_ids": ["id1", "id2"]}

# Health check
GET /health
```

## 🎓 Next Steps

After successfully testing:

1. **Review Documentation**
   - Read `FILTERING_FEATURE_GUIDE.md` for details
   - Check `DEPLOYMENT_CHECKLIST.md` for deployment

2. **Customize**
   - Add more cuisine options
   - Customize filter UI colors
   - Add analytics tracking

3. **Deploy**
   - Follow deployment checklist
   - Set up monitoring
   - Gather user feedback

## 💬 Need Help?

- Check `FILTERING_FEATURE_GUIDE.md` for detailed docs
- Check `DEPLOYMENT_CHECKLIST.md` for deployment help
- Review console logs for errors
- Check Google API Console for quota issues

## ✅ Success!

If you can:
- ✅ Open the app
- ✅ See restaurants load
- ✅ Open filter panel
- ✅ Apply a filter
- ✅ See filtered results

**Congratulations! The feature is working! 🎉**

---

**Having issues?** Check the troubleshooting section or review the full documentation.
