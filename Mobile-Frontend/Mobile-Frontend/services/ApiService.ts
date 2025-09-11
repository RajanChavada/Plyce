import axios from 'axios';
import { Platform } from 'react-native';
import { LocationData } from './LocationService';

// Determine the correct API URL based on environment
function getApiUrl() {
  if (Platform.OS === 'ios') {
    // iOS simulator uses localhost
    return 'http://localhost:8000';
  } else if (Platform.OS === 'android') {
    // Android emulator needs special IP
    return 'http://10.0.2.2:8000';
  } else {
    // Physical device needs your computer's actual IP address on your network
    // For example: '192.168.1.5:8000'
    return 'http://192.168.2.87:8000'; // Replace with your actual IP address
  }
}

const API_URL = getApiUrl();

console.log('Using API URL:', API_URL); // Debug output

export interface Restaurant {
  displayName?: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  types?: string[];
  rating?: number;
  priceLevel?: string;
  photos?: Array<{
    name?: string;
    googleMapsUri?: string;
  }>;
}

class ApiService {
  static async getNearbyRestaurants(
    location: LocationData, 
    radius: number = 5000
  ): Promise<Restaurant[]> {
    try {
      const response = await axios.get(`${API_URL}/restaurants`, {
        params: {
          lat: location.latitude,
          lng: location.longitude,
          radius
        }
      });
      
      return response.data.places || [];
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  }
}

export default ApiService;