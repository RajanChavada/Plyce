/**
 * SUMMARY OF CHANGES:
 * - REMOVED: Hardcoded Toronto coordinates (latitude: 43.6532, longitude: -79.3832)
 * - REMOVED: react-native-google-places-autocomplete library (had unfixable bugs)
 * - REMOVED: Direct Google API calls (CORS issue)
 * - ADDED: Custom Google Places Autocomplete implementation using backend proxy
 * - ADDED: Backend proxy endpoints for /places/autocomplete and /places/details
 * - ADDED: Proper handling of user-selected locations with actual lat/lng from Google Places API
 * - ADDED: Current location button using expo-location
 * - ADDED: Error handling for API failures and location permissions
 * 
 * NEW DEPENDENCIES USED:
 * - axios (for HTTP requests to backend proxy)
 * - expo-location (for current location feature)
 * - Backend proxy endpoints to avoid CORS issues
 * 
 * BREAKING CHANGES: None - component contract remains the same
 */

import React, { useState, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  ActivityIndicator, 
  FlatList,
  Keyboard,
  Platform,
  Text as RNText
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import { API_URL } from '../../services/ApiService';
import styles from './styles';

interface LocationSearchProps {
  onLocationSelected: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  placeholder?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const LocationSearch: React.FC<LocationSearchProps> = ({ 
  onLocationSelected, 
  placeholder = 'Search for a location'
}) => {
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const searchTimeout = useRef<any>(null);

  /**
   * Search for place predictions using Google Places API (New) via backend proxy
   */
  const searchPlaces = async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.post(
        `${API_URL}/places/autocomplete`,
        {
          input,
          language: 'en',
        }
      );

      if (response.data.status === 'OK') {
        setPredictions(response.data.predictions || []);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error('Error fetching place predictions:', error);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handle text input change with debouncing
   */
  const handleTextChange = (text: string) => {
    setSearchText(text);

    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for search (debouncing)
    searchTimeout.current = setTimeout(() => {
      searchPlaces(text);
    }, 400);
  };

  /**
   * Get place details and extract coordinates (via backend proxy using New Places API)
   */
  const selectPlace = async (placeId: string, description: string) => {
    try {
      setIsSearching(true);
      setShowPredictions(false);
      
      const response = await axios.post(
        `${API_URL}/places/details`,
        {
          place_id: placeId,
        }
      );

      if (response.data.status === 'OK' && response.data.result) {
        const { geometry, formatted_address } = response.data.result;
        
        if (geometry && geometry.location) {
          const latitude = geometry.location.lat;
          const longitude = geometry.location.lng;
          const address = formatted_address || description;

          console.log('📍 Location selected:', { latitude, longitude, address });

          // Update search text with selected address
          setSearchText(address);
          setPredictions([]);
          Keyboard.dismiss();

          // Pass the real location data to parent component
          onLocationSelected({
            latitude,
            longitude,
            address,
          });
        } else {
          Alert.alert('Error', 'Unable to get location coordinates.');
        }
      } else {
        Alert.alert('Error', 'Unable to get location details. Please try another search.');
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      Alert.alert('Error', 'Unable to fetch location details. Please check your connection.');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Get user's current location using device GPS
   * NEW FEATURE: Allows users to quickly use their current location
   */
  const handleUseCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to use your current location. Please enable it in settings.'
        );
        setIsLoadingLocation(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get human-readable address
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      let address = 'Current Location';
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        address = [
          addr.streetNumber,
          addr.street,
          addr.city,
          addr.region,
          addr.postalCode,
          addr.country
        ].filter(Boolean).join(', ');
      }

      console.log('📍 Current location:', { latitude, longitude, address });

      // Update the search input to show the current location
      setSearchText(address);
      setPredictions([]);
      Keyboard.dismiss();

      // Pass the real location data to parent component
      onLocationSelected({
        latitude,
        longitude,
        address
      });

      setIsLoadingLocation(false);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try searching for an address instead.'
      );
      setIsLoadingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchIcon}>
          <Ionicons name="search" size={20} color="#6B7280" />
        </View>
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={searchText}
          onChangeText={handleTextChange}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowPredictions(true);
            }
          }}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSearchText('');
              setPredictions([]);
              setShowPredictions(false);
            }}
          >
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <Ionicons name="locate" size={20} color="#4CAF50" />
          )}
        </TouchableOpacity>
      </View>

      {/* Autocomplete Predictions */}
      {showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predictionItem}
                onPress={() => selectPlace(item.place_id, item.description)}
              >
                <Ionicons name="location-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <RNText style={styles.predictionMainText}>
                    {item.structured_formatting.main_text}
                  </RNText>
                  <RNText style={styles.predictionSecondaryText}>
                    {item.structured_formatting.secondary_text}
                  </RNText>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.predictionSeparator} />}
          />
        </View>
      )}
    </View>
  );
};

export default LocationSearch;