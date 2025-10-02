import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';

// Only import the component if we're on a native platform
const isWeb = Platform.OS === 'web';
let GooglePlacesAutocomplete: any = null;
if (!isWeb) {
  try {
    const GooglePlacesModule = require('react-native-google-places-autocomplete');
    GooglePlacesAutocomplete = GooglePlacesModule.GooglePlacesAutocomplete;
  } catch (error) {
    console.error("Error importing GooglePlacesAutocomplete:", error);
  }
}

// Safe import of API key
let GOOGLE_API_KEY = '';
try {
  const env = require('../../constants/env');
  GOOGLE_API_KEY = env.GOOGLE_API_KEY || '';
} catch (error) {
  console.warn("Could not import API key from env:", error);
}

interface LocationSearchProps {
  onLocationSelected: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  placeholder?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ 
  onLocationSelected, 
  placeholder = 'Search for a location'
}) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = () => {
    if (searchText.trim()) {
      // Simulate a location selection
      onLocationSelected({
        latitude: 43.6532, // Default to Toronto
        longitude: -79.3832,
        address: searchText
      });
    }
  };
  
  // Always use the simple version for now to fix the error
  // When you're ready to debug the GooglePlaces component, you can restore the conditional
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
        />
        {searchText.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchText('')}
          >
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default LocationSearch;