import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  Animated,
  Keyboard,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LocationContext } from '../src/contexts/LocationContext';
import ApiService, { Restaurant } from '../src/services/ApiService';
import { Colors, Typography, Spacing } from '../src/styles';
import LocationSearch from '../src/components/LocationSearch';
import RadiusSlider from '../src/components/RadiusSlider';
import { FilterPanel } from '../src/components/FilterPanel';
import { FilterOptions } from '../src/types';

const { width, height } = Dimensions.get('window');

/**
 * UNIFIED MAP SEARCH SCREEN
 * 
 * This screen provides a complete, integrated location discovery experience:
 * 
 * FEATURES:
 * - Location search with Google Places Autocomplete
 * - "Use My Location" button for quick GPS positioning
 * - Visual radius control with slider and map circle overlay (2km-15km)
 * - Comprehensive filter panel: cuisine, dietary, venue type (coffee/matcha/café), price, attributes
 * - Real-time pin updates as user changes location, radius, or filters
 * - Color-coded pins based on venue type or chain status
 * - Interactive pins showing restaurant details in bottom sheet
 * - Debounced API calls (300ms) for optimal performance
 * - Result count display showing number of matching restaurants
 * 
 * USER FLOW:
 * 1. User searches for location or uses current location
 * 2. Adjusts search radius with slider (updates circle and pins in real-time)
 * 3. Applies filters (category, cuisine, dietary, attributes)
 * 4. Sees all matching restaurants as color-coded pins on map
 * 5. Taps pin to view restaurant details in bottom sheet
 * 6. Can navigate to full restaurant details page
 */
const MapViewScreen = () => {
  const router = useRouter();
  const { location: contextLocation, setCustomLocation } = useContext(LocationContext);

  // Map state - use local state for real-time updates
  const [currentLocation, setCurrentLocation] = useState({
    latitude: contextLocation?.latitude || 43.6532,
    longitude: contextLocation?.longitude || -79.3832,
    address: contextLocation?.address || 'Current Location',
  });
  const [searchRadius, setSearchRadius] = useState(contextLocation?.radius || 2000);

  // Restaurant and filter state
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // UI state
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const mapRef = useRef<MapView>(null);
  const searchTimeout = useRef<any>(null);

  // Debounced fetch function (300ms delay)
  const debouncedFetch = useCallback((
    lat: number,
    lng: number,
    radius: number,
    filters: FilterOptions
  ) => {
    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout
    searchTimeout.current = setTimeout(() => {
      fetchRestaurants(lat, lng, radius, filters);
    }, 300);
  }, []);

  // Fetch restaurants with given parameters
  const fetchRestaurants = async (
    lat: number,
    lng: number,
    radius: number,
    filters: FilterOptions
  ) => {
    setLoading(true);
    try {
      console.log(`🗺️ Fetching restaurants:`, { lat, lng, radius, filters });

      let results: Restaurant[];

      if (Object.keys(filters).length > 0) {
        results = await ApiService.searchRestaurantsWithFilters(
          { latitude: lat, longitude: lng, radius },
          filters
        );
      } else {
        results = await ApiService.getNearbyRestaurants(
          { latitude: lat, longitude: lng, radius },
          false // Don't use cache
        );
      }

      setRestaurants(results);
      console.log(`✅ Loaded ${results.length} restaurants on map`);

      // Auto-fit map to show all markers
      if (results.length > 0) {
        setTimeout(() => fitMarkersToView(results), 500);
      }
    } catch (error) {
      console.error('Error fetching restaurants for map:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRestaurants(
      currentLocation.latitude,
      currentLocation.longitude,
      searchRadius,
      activeFilters
    );
  }, []); // Only run on mount

  // Handle location change from LocationSearch
  const handleLocationSelected = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    console.log('📍 New location selected:', location);
    setCurrentLocation(location);

    // Update context for app-wide location
    setCustomLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      radius: searchRadius,
    });

    // Center map on new location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }

    // Trigger debounced search
    debouncedFetch(location.latitude, location.longitude, searchRadius, activeFilters);
  };

  // Handle radius change from RadiusSlider
  const handleRadiusChange = (newRadius: number) => {
    console.log('📏 Radius changed:', newRadius);
    setSearchRadius(newRadius);

    // Update context
    setCustomLocation({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      address: currentLocation.address,
      radius: newRadius,
    });

    // Trigger debounced search
    debouncedFetch(currentLocation.latitude, currentLocation.longitude, newRadius, activeFilters);
  };

  // Handle filter changes from FilterPanel
  const handleApplyFilters = (filters: FilterOptions) => {
    console.log('🔍 Filters applied:', filters);
    setActiveFilters(filters);

    // Immediate search for filters (no debounce)
    fetchRestaurants(currentLocation.latitude, currentLocation.longitude, searchRadius, filters);
  };

  // Fit map to show all markers
  const fitMarkersToView = (markers: Restaurant[]) => {
    if (markers.length === 0 || !mapRef.current) return;

    const coordinates = markers
      .filter(m => m.location?.latitude && m.location?.longitude)
      .map(m => ({
        latitude: m.location!.latitude,
        longitude: m.location!.longitude,
      }));

    if (coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 250, right: 50, bottom: 450, left: 50 },
        animated: true,
      });
    }
  };

  // Handle marker press
  const handleMarkerPress = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    Keyboard.dismiss();
  };

  // Navigate to restaurant details
  const handleViewDetails = () => {
    if (selectedRestaurant && selectedRestaurant.place_id) {
      router.push(`/restaurant/${selectedRestaurant.place_id}` as any);
    }
  };

  // Get marker color based on filters and chain status
  const getMarkerColor = (restaurant: Restaurant) => {
    // Highlight selected marker with distinct color
    if (selectedRestaurant && restaurant.place_id === selectedRestaurant.place_id) {
      return '#EC4899'; // Bright pink for selected marker
    }

    if ((restaurant as any).isChain) {
      return '#6B7280'; // Gray for chains
    }
    if (activeFilters.venue_type === 'matcha') {
      return '#10B981'; // Green for matcha
    }
    if (activeFilters.venue_type === 'coffee') {
      return '#8B4513'; // Brown for coffee
    }
    if (activeFilters.venue_type === 'cafe') {
      return '#F59E0B'; // Amber for café
    }
    return Colors.primary; // Default blue
  };

  // Count active filters
  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Map Search</Text>
          <Text style={styles.headerSubtitle}>
            {restaurants.length} location{restaurants.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterPanelVisible(true)}
        >
          <Ionicons name="filter" size={22} color={Colors.text} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Location Search Bar - Hide when marker is selected */}
      {!selectedRestaurant && (
        <View style={styles.searchContainer}>
          <LocationSearch
            onLocationSelected={handleLocationSelected}
            placeholder="Search location..."
          />
        </View>
      )}

      {/* Radius Slider - Hide when marker is selected */}
      {!selectedRestaurant && (
        <View style={styles.radiusContainer}>
          <RadiusSlider
            value={searchRadius}
            onValueChange={handleRadiusChange}
            min={1000}
            max={10000}
            step={1000}
          />
        </View>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersLabel}>Active Filters:</Text>
          {activeFilters.cuisine && (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>{activeFilters.cuisine}</Text>
            </View>
          )}
          {activeFilters.dietary && (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>{activeFilters.dietary}</Text>
            </View>
          )}
          {activeFilters.venue_type && (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>
                {activeFilters.venue_type.charAt(0).toUpperCase() + activeFilters.venue_type.slice(1)}
              </Text>
            </View>
          )}
          {activeFilters.price_level && (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>
                {'$'.repeat(activeFilters.price_level)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Radius Circle */}
        <Circle
          center={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          radius={searchRadius}
          fillColor="rgba(52, 168, 224, 0.1)"
          strokeColor="rgba(52, 168, 224, 0.3)"
          strokeWidth={2}
        />

        {/* Restaurant Markers */}
        {restaurants.map((restaurant, index) => {
          if (!restaurant.location?.latitude || !restaurant.location?.longitude) {
            return null;
          }

          return (
            <Marker
              key={restaurant.place_id || `marker-${index}`}
              coordinate={{
                latitude: restaurant.location.latitude,
                longitude: restaurant.location.longitude,
              }}
              title={restaurant.displayName?.text || restaurant.name}
              description={restaurant.formattedAddress}
              onPress={() => handleMarkerPress(restaurant)}
              pinColor={getMarkerColor(restaurant)}
            >
              {/* Custom marker bubble */}
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.markerBubble,
                    { backgroundColor: getMarkerColor(restaurant) }
                  ]}
                >
                  <Ionicons
                    name={
                      activeFilters.venue_type === 'matcha' ? 'leaf' :
                        activeFilters.venue_type === 'coffee' ? 'cafe' :
                          activeFilters.venue_type === 'cafe' ? 'restaurant' :
                            'location'
                    }
                    size={16}
                    color="#fff"
                  />
                </View>
                <View style={styles.markerArrow} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Updating results...</Text>
        </View>
      )}

      {/* Center on User Location Button */}
      <TouchableOpacity
        style={[
          styles.centerButton,
          selectedRestaurant && styles.centerButtonWithCard
        ]}
        onPress={() => {
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }}
      >
        <Ionicons name="locate" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {/* Selected Restaurant Detail Card */}
      {selectedRestaurant && (
        <View style={styles.detailCard}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedRestaurant(null)}
          >
            <Ionicons name="close-circle" size={28} color="#999" />
          </TouchableOpacity>

          {/* Restaurant Image */}
          {selectedRestaurant.photos && selectedRestaurant.photos.length > 0 && (
            <Image
              source={{
                uri: ApiService.getRestaurantPhotoUrl(selectedRestaurant, 0)
              }}
              style={styles.detailImage}
              resizeMode="cover"
            />
          )}

          {/* Restaurant Info */}
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle} numberOfLines={2}>
              {selectedRestaurant.displayName?.text || selectedRestaurant.name}
            </Text>

            {/* Rating and Price */}
            <View style={styles.detailMeta}>
              {selectedRestaurant.rating ? (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {selectedRestaurant.rating.toFixed(1)}
                  </Text>
                </View>
              ) : null}

              {selectedRestaurant.priceLevel ? (
                <Text style={styles.priceText}>
                  {'$'.repeat(selectedRestaurant.priceLevel)}
                </Text>
              ) : null}

              {(selectedRestaurant as any).isChain && (
                <View style={styles.chainBadge}>
                  <Ionicons name="link-outline" size={12} color="#fff" />
                  <Text style={styles.chainBadgeText}>Chain</Text>
                </View>
              )}
            </View>

            {/* Address */}
            <Text style={styles.detailAddress} numberOfLines={2}>
              {selectedRestaurant.formattedAddress}
            </Text>

            {/* View Details Button */}
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={handleViewDetails}
            >
              <Text style={styles.viewDetailsButtonText}>View Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter Panel Modal */}
      <FilterPanel
        visible={filterPanelVisible}
        onClose={() => setFilterPanelVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: '#fff',
    zIndex: 9,
  },
  radiusContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 8,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
    zIndex: 7,
  },
  activeFiltersLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  centerButton: {
    position: 'absolute',
    bottom: 340, // Default position when no card is shown
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centerButtonWithCard: {
    bottom: 280, // Adjusted position when detail card is visible (reduced height card)
  },
  detailCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: height * 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 10,
  },
  detailImage: {
    width: '100%',
    height: 120, // Reduced from 180px for better map visibility
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  detailContent: {
    padding: Spacing.lg,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    paddingRight: 40,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  chainBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  detailAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  viewDetailsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default MapViewScreen;
