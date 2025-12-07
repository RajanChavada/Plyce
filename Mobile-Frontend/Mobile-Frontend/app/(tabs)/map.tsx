import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Keyboard,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationContext } from '../../src/contexts/LocationContext';
import ApiService, { Restaurant } from '../../src/services/ApiService';
import LocationSearch from '../../src/components/LocationSearch';
import RadiusSlider from '../../src/components/RadiusSlider';
import { FilterPanel } from '../../src/components/FilterPanel';
import { FilterOptions } from '../../src/types';

/**
 * MAP TAB - Unified map search interface
 * Complete location discovery with search, filters, and interactive pins
 */
export default function MapTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Get safe area insets for iPhone notch/home indicator
  const { location: contextLocation, setCustomLocation } = useContext(LocationContext);

  // Map state
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

  // UI state - NEW: Radius dropdown state
  const [isRadiusDropdownOpen, setIsRadiusDropdownOpen] = useState(false);
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);

  const mapRef = useRef<MapView>(null);
  const searchTimeout = useRef<any>(null);

  // Debounced fetch function (300ms delay)
  const debouncedFetch = useCallback((
    lat: number,
    lng: number,
    radius: number,
    filters: FilterOptions
  ) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      fetchRestaurants(lat, lng, radius, filters);
    }, 300);
  }, []);

  // Fetch restaurants
  const fetchRestaurants = async (
    lat: number,
    lng: number,
    radius: number,
    filters: FilterOptions
  ) => {
    setLoading(true);
    try {
      const data = await ApiService.searchRestaurantsWithFilters(
        { latitude: lat, longitude: lng, radius },
        {
          cuisine: filters.cuisine,
          dietary: filters.dietary,
          price_level: filters.price_level,
          outdoor_seating: filters.outdoor_seating,
          pet_friendly: filters.pet_friendly,
          wheelchair_accessible: filters.wheelchair_accessible,
          delivery_available: filters.delivery_available,
          venue_type: filters.venue_type,
        }
      );
      setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    debouncedFetch(
      currentLocation.latitude,
      currentLocation.longitude,
      searchRadius,
      activeFilters
    );
  }, [currentLocation, searchRadius, activeFilters]);

  // Handle location selection
  const handleLocationSelected = (location: { latitude: number; longitude: number; address: string }) => {
    const newLocation = { latitude: location.latitude, longitude: location.longitude, address: location.address };
    setCurrentLocation(newLocation);
    setCustomLocation({ ...newLocation, radius: searchRadius });

    // Close radius dropdown when location is selected
    setIsRadiusDropdownOpen(false);

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
    Keyboard.dismiss();
  };

  // Handle radius change
  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
    setCustomLocation({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      address: currentLocation.address,
      radius: newRadius,
    });
  };

  // Pin color logic (based on types or categories)
  const getPinColor = (restaurant: Restaurant) => {
    // Use types array to determine venue type
    const types = restaurant.types || [];
    if (types.includes('coffee') || types.includes('cafe')) return '#8B7355'; // Warm taupe
    if (types.includes('restaurant')) return '#64748B'; // Slate gray-blue
    return '#64748B'; // Default neutral slate
  };

  return (
    <View style={styles.container}>
      {/* Map - Full screen background */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => {
          // Close radius dropdown when tapping map
          setIsRadiusDropdownOpen(false);
          Keyboard.dismiss();
        }}
      >
        {/* Radius circle */}
        <Circle
          center={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          radius={searchRadius}
          strokeColor="rgba(255, 107, 107, 0.5)"
          fillColor="rgba(255, 107, 107, 0.1)"
        />

        {/* Restaurant markers */}
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            coordinate={{
              latitude: restaurant.location.latitude,
              longitude: restaurant.location.longitude,
            }}
            pinColor={getPinColor(restaurant)}
            onPress={() => setSelectedRestaurant(restaurant)}
          />
        ))}
      </MapView>

      {/* STATE 1: Search Bar (Collapsed) - Line 2 */}
      <View style={[styles.searchBarContainer, { top: insets.top + 8 }]}>
        <TouchableOpacity
          style={[
            styles.searchBar,
            isRadiusDropdownOpen && styles.searchBarActive
          ]}
          onPress={() => setIsRadiusDropdownOpen(!isRadiusDropdownOpen)}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>
            {currentLocation.address.length > 30 
              ? currentLocation.address.substring(0, 30) + '...' 
              : currentLocation.address}
          </Text>
          {isRadiusDropdownOpen ? (
            <Ionicons name="close" size={20} color="#666666" style={styles.searchRightIcon} />
          ) : (
            <Ionicons name="location" size={20} color="#64748B" style={styles.searchRightIcon} />
          )}
        </TouchableOpacity>
      </View>

      {/* STATE 2: Radius Dropdown (When Open) - Line 3 */}
      {isRadiusDropdownOpen && (
        <View style={[
          styles.radiusDropdown, 
          { 
            top: insets.top + 8 + 48 + 8, // Safe area top + 8px padding + 48px search + 8px gap
            opacity: isRadiusDropdownOpen ? 1 : 0 
          }
        ]}>
          <LocationSearch
            onLocationSelected={handleLocationSelected}
            placeholder="Search location or restaurant"
          />
          
          <View style={styles.radiusSliderSection}>
            <RadiusSlider
              value={searchRadius}
              onValueChange={handleRadiusChange}
            />
          </View>
        </View>
      )}

      {/* Action Bar - Line 4 (repositions when dropdown opens) */}
      <View style={[
        styles.actionBar,
        { 
          top: isRadiusDropdownOpen 
            ? insets.top + 8 + 48 + 8 + 200 + 12  // With dropdown open
            : insets.top + 8 + 48 + 12             // Collapsed
        }
      ]}>
        <View style={styles.resultCountBox}>
          <Text style={styles.resultCountText}>
            {loading ? 'Loading...' : `${restaurants.length} results`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterPanelVisible(true)}
        >
          <Ionicons name="options-outline" size={18} color="#FFFFFF" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Restaurant Bottom Sheet */}
      {selectedRestaurant && (
        <View style={styles.bottomSheet}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedRestaurant(null)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.restaurantName}>{selectedRestaurant.name}</Text>
          <Text style={styles.restaurantAddress}>{selectedRestaurant.formattedAddress}</Text>

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              setSelectedRestaurant(null);
              router.push(`/restaurant/${selectedRestaurant.id}` as any);
            }}
          >
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Panel Modal */}
      <FilterPanel
        visible={filterPanelVisible}
        onClose={() => setFilterPanelVisible(false)}
        onApply={(filters) => {
          setActiveFilters(filters);
          setFilterPanelVisible(false);
        }}
        initialFilters={activeFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  
  // STATE 1: Search Bar Container (Line 2)
  // Note: top is now dynamic based on safe area insets
  searchBarContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  searchBar: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBarActive: {
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    fontWeight: '400',
  },
  searchRightIcon: {
    marginLeft: 8,
  },
  
  // STATE 2: Radius Dropdown (Line 3 - appears below search)
  // Note: top is now dynamic based on safe area insets
  radiusDropdown: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 200, // Increased to accommodate LocationSearch + Slider
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 999,
  },
  radiusSliderSection: {
    marginTop: 12,
  },
  
  // Action Bar (Line 4 - repositions when dropdown opens)
  // Note: top is now dynamic based on safe area insets and dropdown state
  actionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  resultCountBox: {
    flex: 0.6,
  },
  resultCountText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E', // Darker, more readable
  },
  filterButton: {
    backgroundColor: '#0EA5E9', // Cyan blue for consistency
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Bottom Sheet for selected restaurant
  // Note: bottom now accounts for safe area (tab bar + home indicator)
  bottomSheet: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 75 : 60, // iOS needs more space for home indicator
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 13,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailsButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
