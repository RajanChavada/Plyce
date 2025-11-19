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
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

  // UI state
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
    if (types.includes('coffee') || types.includes('cafe')) return '#8B4513';
    if (types.includes('restaurant')) return '#FF6B6B';
    return '#FF6B6B'; // Default red
  };

  return (
    <View style={styles.container}>
      {/* Map - Full screen */}
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

      {/* Top Controls Card - Contains Search and Radius */}
      <View style={styles.topControlsCard}>
        {/* Location Search */}
        <LocationSearch
          onLocationSelected={handleLocationSelected}
          placeholder="Search location..."
        />

        {/* Radius Slider */}
        <View style={styles.radiusWrapper}>
          <RadiusSlider
            value={searchRadius}
            onValueChange={handleRadiusChange}
          />
        </View>

        {/* Filter and Result Count Row */}
        <View style={styles.bottomRow}>
          <View style={styles.resultCount}>
            <Text style={styles.resultCountText}>
              {loading ? 'Loading...' : `${restaurants.length} results`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterPanelVisible(true)}
          >
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>
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

      {/* Filter Panel */}
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
  topControlsCard: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  radiusWrapper: {
    marginTop: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  resultCount: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  resultCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  detailsButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
