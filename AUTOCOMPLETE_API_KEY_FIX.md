# Autocomplete API Key Issue - Diagnosis & Fix

## Problem
Getting `REQUEST_DENIED` errors from Google Places API when using the autocomplete feature:

```
WARNING:app:⚠️ Autocomplete status: REQUEST_DENIED
```

## Root Cause
The Google API key in your `.env` file is getting `REQUEST_DENIED` from Google's servers. This typically happens when:

1. **Places API not enabled** - The Google Places API (or Places API - New) needs to be enabled in Google Cloud Console
2. **API restrictions** - The API key might have restrictions (HTTP referrers, IP addresses, etc.) that block your backend server
3. **Billing not set up** - Google requires a billing account to be set up for Places API
4. **Invalid API key** - The API key might be incorrect or deleted

## Changes Made

### 1. Added API Key Validation (`Backend/app.py`)
```python
# Verify API key is loaded
if not GOOGLE_API_KEY:
    logger.error("❌ GOOGLE_API_KEY not found in environment variables!")
else:
    logger.info(f"✅ GOOGLE_API_KEY loaded (length: {len(GOOGLE_API_KEY)})")
```

### 2. Enhanced Error Logging in Autocomplete Endpoint
- Added detailed logging of Google API responses
- Log the first 10 characters of API key for verification
- Return error messages to frontend for debugging
- Added debug logging for request parameters

## How to Fix

### Step 1: Verify API Key in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Credentials**
4. Find your API key: `AIzaSyDSFS8xgALlGObBu7SdGci2anZGFNoI5j8`

### Step 2: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Places API (New)** ← This is the one you need!
   - OR **Places API** (legacy)
3. Click **Enable** if not already enabled

### Step 3: Check API Key Restrictions

1. In **APIs & Services** → **Credentials**, click on your API key
2. Under **Application restrictions**:
   - Option 1 (Recommended for production): Set to **IP addresses** and add your server IPs
   - Option 2 (For testing): Set to **None** to allow from anywhere
3. Under **API restrictions**:
   - Select **Restrict key**
   - Add: `Places API (New)` or `Places API`
   - Add: `Geocoding API` (for reverse geocoding)

### Step 4: Verify Billing is Enabled

1. Go to **Billing** in Google Cloud Console
2. Ensure billing is set up for your project
3. Places API requires billing to be enabled

### Step 5: Test with a New API Key (if needed)

If the above doesn't work, create a new API key:

1. In **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the new key
4. Update `Backend/.env` with the new key:
   ```
   GOOGLE_API_KEY="YOUR_NEW_API_KEY_HERE"
   ```
5. Restart the backend server

## Testing the Fix

1. **Restart the backend server**:
   ```bash
   cd /Users/jimmychavada/Documents/Plyce/Backend
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

2. **Check the logs** - You should see:
   ```
   ✅ GOOGLE_API_KEY loaded (length: 39)
   ```

3. **Test autocomplete** - Type in the location search box. Look for:
   - SUCCESS: `✅ Found X predictions`
   - FAILURE: `❌ REQUEST_DENIED from Google API: [error message]`

4. **Check detailed error** - The error message will now show more details about why the request was denied

## Quick Test Command

You can test the API key directly with curl:

```bash
curl "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=New%20York&key=AIzaSyDSFS8xgALlGObBu7SdGci2anZGFNoI5j8&types=geocode&language=en"
```

**Expected response if working:**
```json
{
  "predictions": [...],
  "status": "OK"
}
```

**Expected response if key is invalid:**
```json
{
  "error_message": "...",
  "predictions": [],
  "status": "REQUEST_DENIED"
}
```

## Summary

The issue is that your Google API key is being rejected by Google's servers. This is almost certainly because:
- **Places API is not enabled** in Google Cloud Console (most common)
- **Billing is not set up** for your project
- **API key has restrictions** that block backend requests

Follow the steps above to enable the Places API and configure your API key correctly. Once done, restart the backend server and the autocomplete should work!

## Current Status

✅ Frontend updated to use backend proxy endpoints  
✅ Backend proxy endpoints created  
✅ Enhanced error logging added  
❌ Google API key needs configuration in Google Cloud Console  

Once you fix the API key configuration in Google Cloud Console, everything should work perfectly!
