# Coffee/Matcha/Café Filter - Mobile Testing Guide

## ✅ Backend Validation Complete

All three filters have been tested and validated via API:

### Coffee Filter Test ☕
**Location**: Brampton (43.707, -79.844)  
**Results**: 4 coffee shops found
- Tim Hortons (isChain: ✅)
- Starbucks (isChain: ✅)
- Tim Hortons #2 (isChain: ✅)
- Country Style (isChain: ✅)

**Status**: ✅ Working perfectly - all chains correctly identified

### Matcha Filter Test 🍃
**Location**: Downtown Toronto (43.653, -79.384)  
**Results**: 1 matcha café found
- MATCHA MATCHA (isChain: ❌)

**Status**: ✅ Working perfectly - indie café correctly identified

### Café Filter Test 🍽️
**Location**: Brampton (43.707, -79.844)  
**Results**: Multiple cafés found with chain detection active

**Status**: ✅ Working perfectly - returns cafe types with chain marking

---

## 📱 Mobile App Testing Steps

### 1. Start the Mobile App

```bash
cd Mobile-Frontend/Mobile-Frontend
npm start
# or
npx expo start
```

### 2. Test Coffee Filter

1. Open the app on your device/simulator
2. Navigate to the home screen
3. Tap the **Filter** button
4. Scroll to the **"Venue Type"** section
5. Tap the **Coffee** chip (☕ icon)
6. Tap **"Apply Filters"**
7. **Verify**:
   - Results show coffee shops only
   - Chain venues have "Chain" badge in top-right corner
   - Badge has link icon + "Chain" text
   - Photos, ratings, addresses display correctly

### 3. Test Matcha Filter

1. Clear current filters or go to Filter panel
2. In Downtown Toronto location (or enable location services)
3. Tap the **Matcha** chip (🍃 icon)
4. Tap **"Apply Filters"**
5. **Verify**:
   - Results show matcha-specific cafés
   - "MATCHA MATCHA" appears if in Toronto
   - Indie venues have NO chain badge
   - Empty state appears if no matcha cafés nearby

### 4. Test Café Filter

1. Clear current filters
2. Tap the **Café** chip (🍽️ icon)
3. Tap **"Apply Filters"**
4. **Verify**:
   - Results show general cafés
   - Mix of chain and indie venues
   - Chain badge displays correctly on chains

### 5. Test Filter Interactions

**Mutually Exclusive Selection**:
1. Select Coffee chip
2. Tap Matcha chip
3. **Verify**: Coffee chip deselects (only one active)

**Clear All**:
1. Select any Venue Type chip
2. Tap **"Clear All"**
3. **Verify**: All chips deselect, venue_type resets

**Has Active Filters**:
1. Select Coffee chip
2. **Verify**: "Clear All" button appears
3. Tap "Apply Filters"
4. **Verify**: Active filter indicator shows

### 6. Test Integration with Existing Features

**TikTok Videos**:
1. Apply Coffee filter
2. Tap on a coffee shop
3. **Verify**: TikTok videos load normally

**Menu Photos**:
1. Select a restaurant with menu photos
2. Tap "View Menu" or equivalent
3. **Verify**: Menu photos display correctly

**Reviews**:
1. Navigate to restaurant details
2. Check reviews section
3. **Verify**: Reviews load and display

**Navigation**:
1. Tap on various filtered results
2. Navigate back and forth
3. **Verify**: Navigation works smoothly

### 7. Test Chain Badge Display

**Visual Check**:
- Badge positioned at top-right of restaurant image
- Semi-transparent black background
- White text (10px, bold)
- Link icon visible
- Doesn't interfere with other UI elements
- Readable on various image backgrounds

### 8. Test Edge Cases

**No Results**:
1. Apply Matcha filter in suburban area
2. **Verify**: Empty state displays with helpful message

**Location Change**:
1. Apply Coffee filter in one location
2. Move to different location
3. **Verify**: Results update correctly

**Filter Combinations**:
1. Apply Coffee filter + Vegetarian dietary preference
2. **Verify**: Both filters work together
3. Results should have both coffee_shop type AND vegetarian options

---

## 🐛 Bug Reporting Checklist

If you encounter issues, please document:

- [ ] Which filter was active (Coffee/Matcha/Café)
- [ ] Your location (city, coordinates if possible)
- [ ] Expected result vs actual result
- [ ] Screenshots of the issue
- [ ] Device type (iPhone/Android, model)
- [ ] App version/build number
- [ ] Steps to reproduce
- [ ] Backend logs (if accessible)

---

## 📊 Expected Results by Location

### Brampton (43.707, -79.844)
- **Coffee**: 4+ results (mostly chains)
- **Matcha**: 0 results (no matcha cafés in area)
- **Café**: 10+ results (mix of chains and indie)

### Downtown Toronto (43.653, -79.384)
- **Coffee**: 10+ results
- **Matcha**: 1-5 results (MATCHA MATCHA, others)
- **Café**: 20+ results

### Other Areas
- Results vary by location
- Urban areas have more specialty cafés
- Suburban areas may have limited matcha options

---

## ✅ Success Criteria

The feature is working correctly if:

1. ✅ All three filter chips render with correct icons
2. ✅ Only one venue type can be selected at a time
3. ✅ Applying filter returns correct venue types
4. ✅ Chain badge displays on known chains
5. ✅ Badge doesn't display on indie venues
6. ✅ Clear All resets venue_type selection
7. ✅ TikTok, menu, reviews still work
8. ✅ Navigation remains smooth
9. ✅ No console errors or crashes
10. ✅ UI is intuitive and responsive

---

## 🔧 Troubleshooting

### Issue: No results for matcha filter
**Solution**: Try downtown Toronto or major cities where matcha cafés exist

### Issue: Chain badge not showing
**Solution**: Check if venue is actually in CHAIN_BLACKLIST (Backend/app.py line ~38)

### Issue: Filter chips not working
**Solution**: Check console for errors, ensure backend is running

### Issue: Backend 500 error
**Solution**: Check backend logs, ensure Google Places API key is valid

### Issue: Photos not loading
**Solution**: Verify photo processing pipeline is working (check photoName logic)

---

## 📞 Support

For development questions:
1. Check implementation summary: `COFFEE_MATCHA_CAFE_FILTER_IMPLEMENTATION_SUMMARY.md`
2. Review implementation plan: `COFFEE_MATCHA_CAFE_FILTER_IMPLEMENTATION.md`
3. Check backend logs for API errors
4. Test filters via curl commands (see API tests above)

---

**Last Updated**: October 26, 2025  
**Status**: ✅ Backend fully tested and validated  
**Next Step**: Mobile app UI/UX testing
