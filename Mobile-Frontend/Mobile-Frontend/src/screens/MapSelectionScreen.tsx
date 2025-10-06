import React, { useState, useRef, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { LocationContext } from '../contexts/LocationContext';
import LocationSearch from '../components/LocationSearch/index';
import RadiusSlider from '../components/RadiusSlider';
import styles from '../styles/screens/MapSelectionScreen';
import ApiService from '../services/ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MapSelectionScreen = () => {
  const { location, setCustomLocation } = useContext(LocationContext);
  const [radius, setRadius] = useState(location?.radius || 5000); // Keep 5km as default
  const [mapRegion, setMapRegion] = useState({
    latitude: location?.latitude || 43.6532,
    longitude: location?.longitude || -79.3832,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [address, setAddress] = useState<string | undefined>(location?.address);
  const [loading, setLoading] = useState(false);
  
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Animate the control panel in when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Initialize map with current location
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setRadius(location.radius || 5000);
      setAddress(location.address);
    }
  }, []);

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
    // Reset address since we don't know it for the tapped location
    setAddress(undefined);
  };

  const handleMarkerDrag = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
    // Reset address since we don't know it for the dragged location
    setAddress(undefined);
  };

  const handleLocationSelected = (selectedLocation) => {
    const { latitude, longitude, address } = selectedLocation;
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
    setAddress(address);
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 500);
  };

  const handleRadiusChange = (value) => {
    setRadius(value);
    
    // Optionally adjust map zoom based on radius
    const latDelta = value / 111000; // approximate degrees per meter at the equator
    mapRef.current?.animateToRegion({
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
      latitudeDelta: Math.max(latDelta * 2, 0.01), // minimum zoom level
      longitudeDelta: Math.max(latDelta * 2, 0.01), // minimum zoom level
    }, 300);
  };

  const handleSearch = () => {
    setLoading(true);
    
    // Update location context with custom location
    setCustomLocation({
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
      radius,
      address,
    });
    
    // Set a flag in AsyncStorage to indicate that cache should be bypassed
    AsyncStorage.setItem('bypassRestaurantCache', 'true')
      .then(() => {
        console.log('Set flag to bypass restaurant cache');
        
        // Navigate back
        setTimeout(() => {
          setLoading(false);
          router.push('/');
        }, 200);
      })
      .catch(error => {
        console.error('Error setting cache bypass flag:', error);
        setLoading(false);
        router.push('/');
      });
  };
  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }
      
      const position = await Location.getCurrentPositionAsync({});
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      
      setMapRegion({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setAddress(undefined);
      
      mapRef.current?.animateToRegion({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    } catch (error) {
      console.error("Error getting current location:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        <Circle
          center={{
            latitude: mapRegion.latitude,
            longitude: mapRegion.longitude,
          }}
          radius={radius}
          fillColor="rgba(0, 0, 0, 0.1)"
          strokeColor="rgba(0, 0, 0, 0.3)"
          strokeWidth={1}
        />
        <Marker
          coordinate={{
            latitude: mapRegion.latitude,
            longitude: mapRegion.longitude,
          }}
          draggable
          onDragEnd={handleMarkerDrag}
        />
      </MapView>

      <View style={styles.searchBarContainer}>
        <LocationSearch onLocationSelected={handleLocationSelected} />
      </View>

      <Animated.View
        style={[
          styles.controlPanel,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {address && (
          <Text style={styles.addressText} numberOfLines={2}>
            {address}
          </Text>
        )}
        
        <RadiusSlider value={radius} onValueChange={handleRadiusChange} />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.currentLocationButton}
            onPress={handleUseCurrentLocation}
            disabled={loading}
          >
            <Ionicons name="locate" size={18} color="#000" />
            <Text style={styles.currentLocationText}>Current Location</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search Results</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

export default MapSelectionScreen;