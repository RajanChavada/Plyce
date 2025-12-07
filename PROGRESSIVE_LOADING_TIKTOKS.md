# Progressive Data Loading - TikTok Videos

## Overview
Implemented progressive/lazy loading for TikTok videos in the restaurant modal to improve UX, matching the mobile app experience.

## Problem
Previously, the web app waited for ALL data to load before showing the modal:
- ❌ Reviews (fast ~500ms)
- ❌ Photos (fast ~500ms)
- ❌ **TikTok videos (slow ~5-10 seconds)** ← Blocking everything!

This created a poor user experience where users had to wait 5-10 seconds before seeing any information.

## Solution
Split the data loading into two phases:

### Phase 1: Immediate Load (Fast)
Load right away when modal opens:
- ✅ Reviews
- ✅ Menu Photos
- ✅ Overview info (already in restaurant object)

### Phase 2: Background Load (Slow)
Load asynchronously while user views other content:
- ⏳ TikTok videos (fetched in background)

## Changes Made

### `/apps/web/src/components/RestaurantModal.tsx`

#### 1. Split useEffect Hooks
**Before:**
```typescript
useEffect(() => {
  const [reviewsData, tiktokData, menuData] = await Promise.all([
    ApiService.getRestaurantReviews(placeId),
    ApiService.getTikTokVideos(placeId),    // ← Blocks everything!
    ApiService.getMenuPhotos(placeId),
  ]);
}, [placeId]);
```

**After:**
```typescript
// Load reviews & photos immediately
useEffect(() => {
  const [reviewsData, menuData] = await Promise.all([
    ApiService.getRestaurantReviews(placeId),
    ApiService.getMenuPhotos(placeId),
  ]);
  setIsLoading(false); // Modal shows quickly!
}, [placeId]);

// Load TikToks separately
useEffect(() => {
  const tiktokData = await ApiService.getTikTokVideos(placeId);
  setTiktokVideos(tiktokData.videos);
  setIsTiktokLoading(false);
}, [placeId]);
```

#### 2. Added Loading State
```typescript
const [isTiktokLoading, setIsTiktokLoading] = useState(true);
```

#### 3. Updated TikTok Tab
Shows loading indicator while fetching:
```tsx
{activeTab === 'tiktok' && (
  <div>
    {isTiktokLoading ? (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <p className="text-gray-700 font-medium">Fetching TikTok videos...</p>
        <p className="text-sm text-gray-500">This may take a few seconds</p>
      </div>
    ) : (
      // Show videos grid
    )}
  </div>
)}
```

#### 4. Updated Tab Label
Shows loading state in tab:
```typescript
{ 
  id: 'tiktok', 
  label: isTiktokLoading ? 'TikTok (...)' : `TikTok (${tiktokVideos.length})` 
}
```

## User Experience Flow

### Before (Poor UX)
1. User clicks restaurant
2. **Wait 5-10 seconds** (loading all data including TikToks)
3. Modal finally opens with all content

### After (Great UX) ✨
1. User clicks restaurant
2. Modal opens **immediately** (~500ms)
3. User sees:
   - ✅ Overview tab (instant)
   - ✅ Reviews tab (instant)
   - ✅ Photos tab (instant)
   - ⏳ TikTok tab shows "Fetching TikTok videos..."
4. After 5-10 seconds, TikTok videos appear
5. Tab updates: "TikTok (...)" → "TikTok (4)"

## Benefits

### 1. **Perceived Performance** 📈
- Modal feels instant instead of slow
- Users can start browsing reviews/photos immediately
- No frustrating wait times

### 2. **User Engagement** 🎯
- Users more likely to explore restaurant details
- Can read reviews while TikToks load
- Better retention

### 3. **Matches Mobile Experience** 📱
- Consistent behavior across platforms
- Same progressive loading pattern
- Users expect this behavior

### 4. **Better Error Handling** 🛡️
- If TikTok fetch fails, other data still works
- No single point of failure
- Graceful degradation

## Technical Details

### Loading States
| State | Reviews | Photos | TikToks |
|-------|---------|--------|---------|
| Initial | Loading | Loading | Loading |
| After 500ms | ✅ Ready | ✅ Ready | ⏳ Loading |
| After 5-10s | ✅ Ready | ✅ Ready | ✅ Ready |

### API Endpoints Used
```typescript
// Fast endpoints (~500ms)
GET /restaurants/{placeId}/reviews
GET /restaurants/{placeId}/menu-photos

// Slow endpoint (~5-10s)
GET /restaurants/{placeId}/tiktok-videos  // Uses Playwright web scraping
```

### Why TikToks Are Slow
The backend uses Playwright to scrape TikTok search results:
1. Launch headless browser
2. Navigate to TikTok
3. Search for restaurant
4. Wait for results to load
5. Extract video data
6. Take 10 minutes to cache results

This is inherently slow, which is why we load it separately.

## Testing Checklist

- [x] Modal opens quickly (~500ms) without waiting for TikToks
- [x] Reviews tab shows immediately
- [x] Photos tab shows immediately
- [x] TikTok tab shows loading spinner initially
- [x] TikTok tab label shows "TikTok (...)" while loading
- [x] After loading, TikTok videos appear
- [x] Tab updates to show count: "TikTok (4)"
- [x] Loading message is clear and friendly
- [x] Spinner animation is smooth
- [x] No console errors

## Code Changes Summary

**Files Modified:**
- `/apps/web/src/components/RestaurantModal.tsx`

**Lines Changed:**
- Split single `useEffect` into two separate hooks (lines 25-70)
- Added `isTiktokLoading` state (line 18)
- Updated tab label logic (line 76)
- Added loading UI for TikTok tab (lines 217-230)

**No Backend Changes Required** ✅
- Backend already has separate TikTok endpoint
- No API modifications needed

## Performance Metrics

### Before
- Time to Modal Open: **5-10 seconds**
- User Wait Time: **5-10 seconds**
- Perceived Speed: ❌ Slow

### After
- Time to Modal Open: **~500ms** 📈
- User Wait Time: **~500ms** 📈
- TikToks Load: **5-10 seconds** (in background)
- Perceived Speed: ✅ **Fast**

## Future Enhancements

1. **Add Skeleton Loaders**
   - Show placeholder cards while TikToks load
   - More polished loading state

2. **Prefetch on Hover**
   - Start loading TikToks when user hovers over restaurant card
   - Even faster perceived performance

3. **Cache TikTok Results**
   - Backend already has 10-minute cache
   - Could add client-side cache for instant repeat views

4. **Show Partial Results**
   - Display TikToks as they load (streaming)
   - Don't wait for all videos

---

**Status:** ✅ Complete! The web app now has the same progressive loading UX as the mobile app.
