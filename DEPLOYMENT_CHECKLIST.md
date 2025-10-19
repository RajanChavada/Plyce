# Deployment Checklist - Advanced Filtering Feature

## Pre-Deployment Checklist

### Backend Verification
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] `GOOGLE_API_KEY` environment variable set in `.env`
- [ ] Google API Key has required permissions:
  - [ ] Places API (New) enabled
  - [ ] Place Details API enabled  
  - [ ] Places API - Text Search enabled
  - [ ] Places API - Nearby Search enabled
- [ ] Backend server starts without errors
- [ ] Health check endpoint responds: `curl http://localhost:8000/health`

### Frontend Verification
- [ ] Frontend dependencies installed (`npm install`)
- [ ] API_URL correctly configured in `src/services/ApiService.ts`
- [ ] No TypeScript compilation errors
- [ ] FilterPanel component renders correctly
- [ ] No console errors in development

### API Testing
Run the test script to verify all endpoints:
```bash
./test_filtering.sh
```

Expected results:
- [ ] Basic search returns results
- [ ] Cuisine filter works (returns filtered results)
- [ ] Dietary filter works
- [ ] Price level filter works
- [ ] Outdoor seating filter works
- [ ] Wheelchair accessible filter works
- [ ] Combined filters work
- [ ] Batch details endpoint works
- [ ] Health check returns "healthy"

### Manual UI Testing

#### Basic Functionality
- [ ] App loads without crashes
- [ ] Location permission works
- [ ] Restaurants load on home screen
- [ ] Filter button is visible

#### Filter Panel Tests
- [ ] Filter panel opens when clicking filter button
- [ ] All cuisine options display correctly
- [ ] All dietary options display correctly
- [ ] All price level options display correctly
- [ ] All service attribute toggles work
- [ ] "Clear All" button resets all filters
- [ ] "Apply Filters" button closes panel and applies filters

#### Filter Application Tests
- [ ] Single cuisine filter returns appropriate restaurants
- [ ] Single dietary filter works
- [ ] Single price filter works
- [ ] Single service attribute filter works
- [ ] Multiple filters combined work correctly
- [ ] Filter count badge shows correct number
- [ ] Active filter pills display correctly
- [ ] Filters persist during session
- [ ] Refresh clears active filters

#### Edge Cases
- [ ] No results message displays when no restaurants match
- [ ] Loading indicator shows during filter application
- [ ] Error handling works if API fails
- [ ] Long filter combinations don't break UI
- [ ] Network errors handled gracefully

### Performance Testing
- [ ] Initial load time is acceptable (< 3 seconds)
- [ ] Filter application is responsive (< 2 seconds)
- [ ] No memory leaks during repeated filtering
- [ ] Smooth animations without jank
- [ ] App doesn't crash with rapid filter changes

## Deployment Steps

### 1. Backend Deployment

```bash
# Navigate to backend directory
cd Backend

# Ensure environment variables are set
# For production, use a secure method (e.g., AWS Secrets Manager, environment config)
export GOOGLE_API_KEY="your_production_key"

# Install production dependencies
pip install -r requirements.txt

# Start with production server (example with gunicorn)
gunicorn app:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 2. Frontend Deployment

```bash
# Navigate to frontend directory
cd Mobile-Frontend/Mobile-Frontend

# Update API URL for production in src/services/ApiService.ts
# Example: change to https://api.plyce.com

# Build for production
npx expo build:ios  # For iOS
npx expo build:android  # For Android

# Or use EAS Build
eas build --platform all
```

### 3. Environment Configuration

**Backend (.env for production)**:
```
GOOGLE_API_KEY=your_production_api_key
ENVIRONMENT=production
LOG_LEVEL=INFO
```

**Frontend (ApiService.ts)**:
```typescript
function getApiUrl() {
  if (__DEV__) {
    return "http://localhost:8000";
  }
  return "https://api.plyce.com";  // Your production API URL
}
```

## Post-Deployment Verification

### Smoke Tests
- [ ] Production API health check responds
- [ ] Mobile app connects to production API
- [ ] Basic restaurant search works
- [ ] At least one filter combination works
- [ ] Error logging is operational

### Monitoring Setup
- [ ] Set up API monitoring (e.g., AWS CloudWatch, Datadog)
- [ ] Configure alerts for:
  - [ ] API error rate > 5%
  - [ ] Response time > 3 seconds
  - [ ] Google API quota warnings
- [ ] Set up user analytics for filter usage

### Documentation
- [ ] Update API documentation with new endpoints
- [ ] Document filter behavior for support team
- [ ] Create user guide for filtering feature
- [ ] Update changelog

## Rollback Plan

If issues occur after deployment:

### Backend Rollback
```bash
# Stop current server
# Deploy previous version
git checkout <previous-commit>
# Restart server
```

### Frontend Rollback
```bash
# Revert to previous app version
# Can be done through app store if already published
# Or push update with previous code
```

### Hotfix Process
1. Identify issue from logs
2. Create hotfix branch
3. Test fix thoroughly
4. Deploy to staging
5. Verify fix
6. Deploy to production
7. Monitor closely

## Known Issues / Limitations

### Current Limitations
1. Service attribute filters may reduce result count significantly (as not all places have this data)
2. Google Places API has rate limits - monitor usage
3. Place Details API costs more than basic search
4. Some attributes (pet_friendly) use proxy fields (allowsDogs) which may not be 100% accurate

### Future Improvements Planned
- [ ] Caching strategy for common filter combinations
- [ ] Saved filter presets for users
- [ ] Filter usage analytics
- [ ] More granular attribute filters
- [ ] Distance sorting with filters

## Support Contact

For deployment issues:
- **Backend Issues**: [Backend team contact]
- **Frontend Issues**: [Frontend team contact]
- **API/Google Issues**: [API team contact]

## Metrics to Monitor

### Key Performance Indicators
- Filter usage rate (% of users using filters)
- Most popular filter combinations
- Average results per filter combination
- Filter → restaurant detail conversion rate
- API response times
- Google API quota usage
- Error rates per endpoint

### Cost Monitoring
- Google Places API calls per day
- Place Details API calls per day
- Estimated monthly API costs
- Cost per active user

## Success Criteria

Feature is considered successfully deployed when:
- [ ] 0 critical bugs reported in first 24 hours
- [ ] < 1% error rate on filter endpoints
- [ ] Average response time < 2 seconds
- [ ] At least 10% of users use filtering feature
- [ ] Positive user feedback
- [ ] No unexpected API cost spikes

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Verification Completed By**: _________________

**Sign-off**: _________________
