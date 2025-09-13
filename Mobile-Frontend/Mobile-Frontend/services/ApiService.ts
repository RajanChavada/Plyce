import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationData } from './LocationService';

// Storage key for the restaurant cache
const RESTAURANT_CACHE_KEY = 'plyce_restaurant_cache';
const CACHE_TIMESTAMP_KEY = 'plyce_cache_timestamp';

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Determine the correct API URL based on environment
function getApiUrl() {
  if (Platform.OS === 'ios') {
    return 'http://localhost:8000';
  } else if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  } else {
    return 'http://192.168.2.87:8000';
  }
}

const API_URL = getApiUrl();

console.log('Using API URL:', API_URL);

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
  // Load the cache when the app starts
  static async initCache() {
    try {
      console.log('Initializing cache...');
      const hasCachedData = await this.hasCachedData();
      console.log(`Cache initialization complete. Has cached data: ${hasCachedData}`);
    } catch (error) {
      console.error('Error initializing cache:', error);
    }
  }
  
  // Get restaurants - either from cache or API
  static async getNearbyRestaurants(
    location: LocationData, 
    radius: number = 5000,
    useCache: boolean = __DEV__
  ): Promise<Restaurant[]> {
    // Try to get from cache first if useCache is true
    if (useCache) {
      try {
        const cachedData = await this.getCachedRestaurants();
        if (cachedData && cachedData.length > 0) {
          console.log(`🗄️ USING CACHED DATA - ${cachedData.length} restaurants loaded from storage`);
          return cachedData;
        }
      } catch (error) {
        console.error('Error reading from cache:', error);
        // Continue to API call if cache read fails
      }
    }

    // If no cache or cache not requested, fetch from API
    try {
      console.log("🌐 FETCHING FROM API...");
      const response = await axios.get(`${API_URL}/restaurants`, {
        params: {
          lat: location.latitude,
          lng: location.longitude,
          radius
        }
      });
      
      const restaurants = response.data.places || [];
      console.log(`✅ Received ${restaurants.length} restaurants from API`);
      
      // Cache the new data
      await this.cacheRestaurants(restaurants);
      
      return restaurants;
    } catch (error) {
      console.error('Error fetching restaurants from API:', error);
      throw error;
    }
  }

  // Save restaurants to AsyncStorage
  static async cacheRestaurants(restaurants: Restaurant[]): Promise<void> {
    try {
      if (!restaurants || restaurants.length === 0) {
        console.log('No restaurants to cache');
        return;
      }
      
      console.log(`📝 Caching ${restaurants.length} restaurants to storage`);
      await AsyncStorage.setItem(RESTAURANT_CACHE_KEY, JSON.stringify(restaurants));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('✅ Restaurants successfully cached');
    } catch (error) {
      console.error('Error caching restaurants:', error);
    }
  }

  // Get restaurants from AsyncStorage
  static async getCachedRestaurants(): Promise<Restaurant[] | null> {
    try {
      // Get the cache timestamp
      const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!timestampStr) {
        console.log('No cache timestamp found');
        return null;
      }
      
      const timestamp = parseInt(timestampStr);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - timestamp > CACHE_EXPIRATION) {
        console.log('Cache expired, needs refresh');
        return null;
      }
      
      // Get the cached data
      const cachedData = await AsyncStorage.getItem(RESTAURANT_CACHE_KEY);
      if (!cachedData) {
        console.log('No cached data found');
        return null;
      }
      
      const restaurants = JSON.parse(cachedData) as Restaurant[];
      console.log(`📂 Found ${restaurants.length} restaurants in cache`);
      return restaurants;
    } catch (error) {
      console.error('Error retrieving cached restaurants:', error);
      return null;
    }
  }

  // Check if cache exists and is valid
  static async hasCachedData(): Promise<boolean> {
    try {
      const restaurants = await this.getCachedRestaurants();
      const hasData = restaurants !== null && restaurants.length > 0;
      console.log(`Cache status: ${hasData ? 'VALID' : 'EMPTY OR EXPIRED'}`);
      return hasData;
    } catch (error) {
      console.error('Error checking cache:', error);
      return false;
    }
  }

  // Clear the cache
  static async clearCache(): Promise<void> {
    try {
      console.log('🗑️ Clearing restaurant cache');
      await AsyncStorage.removeItem(RESTAURANT_CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.log('✅ Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export default ApiService;