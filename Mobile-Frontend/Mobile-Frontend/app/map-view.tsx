import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LocationContext } from '../src/contexts/LocationContext';
import ApiService, { Restaurant } from '../src/services/ApiService';
import { Colors, Typography, Spacing } from '../src/styles';

const { width, height } = Dimensions.get('window');

const MapViewScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { location } = useContext(LocationContext);
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVenueType, setSelectedVenueType] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const mapRef = useRef<MapView>(null);

  // Venue type options with icons
  const venueTypes = [
    { key: 'matcha', label: 'Matcha', icon: 'leaf-outline' },
    { key: 'coffee', label: 'Coffee', icon: 'cafe-outline' },
    { key: 'cafe', label: 'Café', icon: 'restaurant-outline' },
  ];

  // Fetch restaurants based on filters
  useEffect(() => {
    if (location) {
      fetchRestaurants();
    }
  }, [location, selectedVenueType]);

  const fetchRestaurants = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const filters: any = {};
      if (selectedVenueType) {
        filters.venue_type = selectedVenueType;
      }

      console.log(`🗺️ Fetching restaurants for map view with filters:`, filters);

      let results: Restaurant[];
      
      if (Object.keys(filters).length > 0) {
        results = await ApiService.searchRestaurantsWithFilters(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: location.radius || 2000,
          },
          filters
        );
      } else {
        results = await ApiService.getNearbyRestaurants(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: location.radius || 2000,
          },
          false // Don't use cache for map view
        );
      }

      setRestaurants(results);

      // Fit map to show all markers after a short delay
      if (results.length > 0) {
        setTimeout(() => fitMarkersToView(results), 500);
      }
    } catch (error) {
      console.error('Error fetching restaurants for map:', error);
    } finally {
      setLoading(false);
    }
  };

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
        edgePadding: { top: 150, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

  const handleMarkerPress = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleViewDetails = () => {
    if (selectedRestaurant && selectedRestaurant.place_id) {
      router.push(`/restaurant/${selectedRestaurant.place_id}` as any);
    }
  };

  const getMarkerColor = (restaurant: Restaurant) => {
    // Color code markers based on venue type or chain status
    if ((restaurant as any).isChain) {
      return '#6B7280'; // Gray for chains
    }
    if (selectedVenueType === 'matcha') {
      return '#10B981'; // Green for matcha
    }
    if (selectedVenueType === 'coffee') {
      return '#8B4513'; // Brown for coffee
    }
    if (selectedVenueType === 'cafe') {
      return '#F59E0B'; // Amber for café
    }
    return Colors.primary; // Default blue
  };

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
          <Text style={styles.headerTitle}>Map View</Text>
          <Text style={styles.headerSubtitle}>
            {restaurants.length} location{restaurants.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => fetchRestaurants()}
        >
          <Ionicons name="refresh" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {/* All/Clear Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedVenueType === null && styles.filterChipActive,
          ]}
          onPress={() => setSelectedVenueType(null)}
        >
          <Ionicons 
            name="grid-outline" 
            size={16} 
            color={selectedVenueType === null ? '#fff' : '#666'} 
          />
          <Text
            style={[
              styles.filterChipText,
              selectedVenueType === null && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* Venue Type Filters */}
        {venueTypes.map(type => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.filterChip,
              selectedVenueType === type.key && styles.filterChipActive,
            ]}
            onPress={() => setSelectedVenueType(type.key)}
          >
            <Ionicons 
              name={type.icon as any} 
              size={16} 
              color={selectedVenueType === type.key ? '#fff' : '#666'} 
            />
            <Text
              style={[
                styles.filterChipText,
                selectedVenueType === type.key && styles.filterChipTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: location?.latitude || 43.6532,
          longitude: location?.longitude || -79.3832,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Radius Circle */}
        {location && (
          <Circle
            center={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            radius={location.radius || 2000}
            fillColor="rgba(52, 168, 224, 0.1)"
            strokeColor="rgba(52, 168, 224, 0.3)"
            strokeWidth={2}
          />
        )}

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
              {/* Custom marker with name label */}
              <View style={styles.markerContainer}>
                <View 
                  style={[
                    styles.markerBubble,
                    { backgroundColor: getMarkerColor(restaurant) }
                  ]}
                >
                  <Ionicons 
                    name={
                      selectedVenueType === 'matcha' ? 'leaf' :
                      selectedVenueType === 'coffee' ? 'cafe' :
                      selectedVenueType === 'cafe' ? 'restaurant' :
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
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      )}

      {/* Center on User Location Button */}
      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => {
          if (location && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.latitude,
              longitude: location.longitude,
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    maxHeight: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterBarContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    bottom: 320,
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
    height: 180,
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
    paddingRight: 40, // Space for close button
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
