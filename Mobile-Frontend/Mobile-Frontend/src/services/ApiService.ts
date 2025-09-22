import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationData } from "./LocationService";

// Storage key for the restaurant cache
const RESTAURANT_CACHE_KEY = "plyce_restaurant_cache";
const CACHE_TIMESTAMP_KEY = "plyce_cache_timestamp";

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Determine the correct API URL based on environment
function getApiUrl() {
  if (Platform.OS === "ios") {
    return "http://192.168.2.87:8000";
  } else if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  } else {
    return "http://192.168.2.87:8000";
  }
}

export const API_URL = getApiUrl();

console.log("Using API URL:", API_URL);

export interface Restaurant {
  place_id?: string; // Make sure this exists
  id?: string; // Also add this as Google sometimes uses 'id' instead of 'place_id'
  name?: string;
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

// Create interface to house the review
export interface Review {
  displayName?: {
    text: string;
    languageCode: string;
  };
  text?: {
    text: string;
    languageCode: string;
  };
  rating?: number;
  publishTime?: string;
  photos?: Array<{
    name?: string;
    googleMapsUri?: string;
  }>;
}

// For each restuarant we need to store the Review -> Extend restaurant because we need to apply the sapce values (rating, distance etc.)
export interface RestaurantDetails extends Restaurant {
  name?: string;
  userRatingCount?: number;
  regularOpeningHours?: {
    periods: Array<{
      open: { day: number; hour: number; minute: number };
      close: { day: number; hour: number; minute: number };
    }>;
    weekdayDescriptions: string[];
  };
  editorial?: {
    summary?: {
      text: string;
      languageCode: string;
    };
  };
  reviews?: Review[];
  tiktok?: {
    hashtags?: string[];
    tag_urls?: string[];
    search_urls?: string[];
  };
  tiktok_links?: TikTokLink[];
  search_url?: string;
  tiktokVideos?: TikTokVideo[]; // Add tiktokVideos field
}

export interface TikTokLink {
  url: string;
  title: string;
}

// Add this interface if not already present
export interface TikTokVideo {
  id: string;
  thumbnail: string;
  url: string;
  description: string;
  loadFailed?: boolean;
  author?: string;        // Add author if available
  likes?: number;         // Add like count if available
  views?: number;         // Add view count if available
}

class ApiService {
  // Load the cache when the app starts
  static async initCache() {
    try {
      console.log("Initializing cache...");
      const hasCachedData = await this.hasCachedData();
      console.log(
        `Cache initialization complete. Has cached data: ${hasCachedData}`
      );
    } catch (error) {
      console.error("Error initializing cache:", error);
    }
  }

  // get the reviews and details of the restaurant by calling the API for the restaurant details with the PlaceID 
  static async getRestaurantDetails(
    placeId: string,
    useCache: boolean = __DEV__
  ): Promise<RestaurantDetails> {
    // Handle fallback IDs early
    if (placeId.startsWith('fallback-')) {
      console.log(`⚠️ Using placeholder data for fallback ID ${placeId}`);
      // Extract name from fallback ID
      const name = placeId.replace('fallback-', '').split('-')[0]
        .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
        .replace(/[^a-zA-Z0-9 ]/g, ' ') // Replace special chars with spaces
        .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
      return {
        place_id: placeId,
        displayName: { 
          text: name,
          languageCode: 'en'
        },
        rating: 0,
        // Add other required fields with default values
      };
    }

    // Try to get from cache first if useCache is true
    if (useCache) {
      try {
        const cachedDetails = await AsyncStorage.getItem(`restaurant_details_${placeId}`);
        if (cachedDetails) {
          console.log(`🗄️ Using cached details for restaurant ${placeId}`);
          return JSON.parse(cachedDetails);
        }
      } catch (error) {
        console.error('Error reading restaurant details from cache:', error);
      }
    }

    // If no cache or cache not requested, fetch from API
    console.log(`🌐 Fetching details for restaurant ${placeId}`);
    try {
      const response = await axios.get(`${API_URL}/restaurants/${placeId}`);
      const details = response.data;
      
      // Make sure place_id is included in the details
      details.place_id = placeId;
      
      // Cache the results
      try {
        await AsyncStorage.setItem(`restaurant_details_${placeId}`, JSON.stringify(details));
      } catch (error) {
        console.error('Error caching restaurant details:', error);
      }
      
      return details;
    } catch (error) {
      console.error(`Error fetching details for ${placeId}:`, error);
      throw error;
    }
  }

  // async function to call the API for the reviews and grab all the reviews
  static async getRestaurantReviews(
    placeId: string,
    useCache: boolean = __DEV__
  ): Promise<Review[]> {
    // Handle fallback IDs early
    if (placeId.startsWith('fallback-')) {
      console.log(`⚠️ Skipping review fetch for fallback ID ${placeId}`);
      return [];
    }

    // Try to get from cache first if useCache is true
    if (useCache) {
      try {
        const cachedReviews = await AsyncStorage.getItem(`restaurant_reviews_${placeId}`);
        if (cachedReviews) {
          console.log(`🗄️ Using cached reviews for restaurant ${placeId}`);
          return JSON.parse(cachedReviews);
        }
      } catch (error) {
        console.error('Error reading restaurant reviews from cache:', error);
      }
    }

    // If no cache or cache not requested, fetch from API
    console.log(`🌐 Fetching reviews for restaurant ${placeId}`);
    try {
      const response = await axios.get(`${API_URL}/restaurants/${placeId}/reviews`);
      const reviews = response.data.reviews || [];
      
      // Cache the results
      try {
        await AsyncStorage.setItem(`restaurant_reviews_${placeId}`, JSON.stringify(reviews));
      } catch (error) {
        console.error('Error caching restaurant reviews:', error);
      }
      
      return reviews;
    } catch (error) {
      console.error(`Error fetching reviews for ${placeId}:`, error);
      return [];
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
          console.log(
            `🗄️ USING CACHED DATA - ${cachedData.length} restaurants loaded from storage`
          );
          return cachedData;
        }
      } catch (error) {
        console.error("Error reading from cache:", error);
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
          radius,
        },
      });
      
      // Process the restaurants to ensure place_id is set
      if (!response.data || !response.data.places || !Array.isArray(response.data.places)) {
        console.error("Invalid API response format:", response.data);
        return [];
      }
      
      const restaurants: Restaurant[] = response.data.places.map((place: any) => {
        // Ensure place_id is set
        if (!place.place_id && place.id) {
          place.place_id = place.id;
        }
        
        // If both are missing, create a fallback ID
        if (!place.place_id) {
          const name = place.displayName?.text || 'unknown-restaurant';
          place.place_id = `fallback-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
          console.log(`Created fallback ID for restaurant: ${name} -> ${place.place_id}`);
        }
        
        // Return the processed restaurant
        return {
          place_id: place.place_id,
          id: place.id,
          name: place.name,
          displayName: place.displayName,
          formattedAddress: place.formattedAddress,
          location: place.location,
          types: place.types,
          rating: place.rating,
          priceLevel: place.priceLevel,
          photos: place.photos
        };
      });
      
      console.log(`✅ Received ${restaurants.length} restaurants from API`);
      if (restaurants.length > 0) {
        console.log('First restaurant:', {
          name: restaurants[0]?.displayName?.text,
          place_id: restaurants[0]?.place_id,
          id: restaurants[0]?.id
        });
      }

      // Cache the new data
      await this.cacheRestaurants(restaurants);

      return restaurants;
    } catch (error) {
      console.error("Error fetching restaurants from API:", error);
      throw error;
    }
  }

  // Save restaurants to AsyncStorage
  static async cacheRestaurants(restaurants: Restaurant[]): Promise<void> {
    try {
      if (!restaurants || restaurants.length === 0) {
        console.log("No restaurants to cache");
        return;
      }

      console.log(`📝 Caching ${restaurants.length} restaurants to storage`);
      
      // Clear the old cache first to free up space
      await AsyncStorage.removeItem(RESTAURANT_CACHE_KEY);
      
      // Add a small delay to ensure storage is freed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Store the new data
      await AsyncStorage.setItem(
        RESTAURANT_CACHE_KEY,
        JSON.stringify(restaurants)
      );
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log("✅ Restaurants successfully cached");
    } catch (error) {
      console.error("Error caching restaurants:", error);
      
      // If storage is full, try to store a reduced dataset
      if (error instanceof Error && error.message.includes('QuotaExceededError')) {
        try {
          console.log("Storage quota exceeded, trying with reduced data");
          // Store just essential restaurant data
          const essentialData = restaurants.map(r => ({
            place_id: r.place_id || r.id,
            id: r.id,
            displayName: r.displayName,
            formattedAddress: r.formattedAddress,
            location: r.location,
            rating: r.rating,
            priceLevel: r.priceLevel
            // Exclude photos to save space
          }));
          
          await AsyncStorage.setItem(
            RESTAURANT_CACHE_KEY,
            JSON.stringify(essentialData)
          );
          await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          console.log("✅ Essential restaurant data cached successfully");
        } catch (retryError) {
          console.error("Failed to cache even reduced data:", retryError);
        }
      }
    }
  }

  // Get restaurants from AsyncStorage
  static async getCachedRestaurants(): Promise<Restaurant[] | null> {
    try {
      // Get the cache timestamp
      const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!timestampStr) {
        console.log("No cache timestamp found");
        return null;
      }

      const timestamp = parseInt(timestampStr);
      const now = Date.now();

      // Check if cache is expired
      if (now - timestamp > CACHE_EXPIRATION) {
        console.log("Cache expired, needs refresh");
        return null;
      }

      // Get the cached data
      const cachedData = await AsyncStorage.getItem(RESTAURANT_CACHE_KEY);
      if (!cachedData) {
        console.log("No cached data found");
        return null;
      }

      const restaurants = JSON.parse(cachedData) as Restaurant[];
      
      // Ensure each restaurant has a place_id
      const processedRestaurants = restaurants.map(restaurant => {
        // If place_id is missing but id exists, use id as place_id
        if (!restaurant.place_id && restaurant.id) {
          restaurant.place_id = restaurant.id;
        }
        
        // If both place_id and id are missing, create a fallback ID from the name
        if (!restaurant.place_id) {
          const name = restaurant.displayName?.text || 'unknown-restaurant';
          restaurant.place_id = `fallback-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
          console.log(`Created fallback ID for restaurant: ${name} -> ${restaurant.place_id}`);
        }
        
        return restaurant;
      });
      
      console.log(`📂 Found ${processedRestaurants.length} restaurants in cache`);
      return processedRestaurants;
    } catch (error) {
      console.error("Error retrieving cached restaurants:", error);
      return null;
    }
  }

  // Check if cache exists and is valid
  static async hasCachedData(): Promise<boolean> {
    try {
      const restaurants = await this.getCachedRestaurants();
      const hasData = restaurants !== null && restaurants.length > 0;
      console.log(`Cache status: ${hasData ? "VALID" : "EMPTY OR EXPIRED"}`);
      return hasData;
    } catch (error) {
      console.error("Error checking cache:", error);
      return false;
    }
  }

  // Clear the cache
  static async clearCache(): Promise<void> {
    try {
      console.log("🗑️ Clearing restaurant cache");
      await AsyncStorage.removeItem(RESTAURANT_CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.log("✅ Cache cleared successfully");
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  // Get TikTok links for a restaurant
  static async getRestaurantTikTokLinks(
    placeId: string,
    useCache: boolean = __DEV__
  ): Promise<{hashtags: string[], tag_urls: string[], search_urls: string[]}> {
    // Handle fallback IDs early
    if (placeId.startsWith('fallback-')) {
      console.log(`⚠️ Using placeholder data for fallback TikTok links ${placeId}`);
      return {
        hashtags: ['Foodie', 'Restaurant'],
        tag_urls: ['https://www.tiktok.com/tag/Foodie', 'https://www.tiktok.com/tag/Restaurant'],
        search_urls: ['https://www.tiktok.com/search?q=Foodie', 'https://www.tiktok.com/search?q=Restaurant']
      };
    }

    // Try to get from cache first if useCache is true
    if (useCache) {
      try {
        const cachedLinks = await AsyncStorage.getItem(`restaurant_tiktok_${placeId}`);
        if (cachedLinks) {
          console.log(`🗄️ Using cached TikTok links for restaurant ${placeId}`);
          return JSON.parse(cachedLinks);
        }
      } catch (error) {
        console.error('Error reading TikTok links from cache:', error);
      }
    }

    // If no cache or cache not requested, fetch from API
    console.log(`🌐 Fetching TikTok links for restaurant ${placeId}`);
    try {
      const response = await axios.get(`${API_URL}/restaurants/${placeId}/tiktok-links`);
      const linkData = {
        hashtags: response.data.hashtags || [],
        tag_urls: response.data.tag_urls || [],
        search_urls: response.data.search_urls || []
      };
      
      // Cache the results
      try {
        await AsyncStorage.setItem(`restaurant_tiktok_${placeId}`, JSON.stringify(linkData));
      } catch (error) {
        console.error('Error caching TikTok links:', error);
      }
      
      return linkData;
    } catch (error) {
      console.error(`Error fetching TikTok links for ${placeId}:`, error);
      return { hashtags: [], tag_urls: [], search_urls: [] };
    }
  }

  // Add this method to fetch TikTok links through Google search
  static async getRestaurantTikTokGoogle(
    placeId: string,
    useCache: boolean = __DEV__
  ): Promise<{tiktok_links: TikTokLink[], search_url?: string}> {
    // Handle fallback IDs early
    if (placeId.startsWith('fallback-')) {
      console.log(`⚠️ Using placeholder data for fallback TikTok links ${placeId}`);
      return {
        tiktok_links: [{
          url: 'https://www.tiktok.com/search?q=restaurant',
          title: 'Search TikTok for restaurants'
        }],
        search_url: 'https://www.google.com/search?q=restaurant+tiktok'
      };
    }

    // Try to get from cache first if useCache is true
    if (useCache) {
      try {
        const cachedLinks = await AsyncStorage.getItem(`restaurant_tiktok_google_${placeId}`);
        if (cachedLinks) {
          console.log(`🗄️ Using cached TikTok Google links for restaurant ${placeId}`);
          return JSON.parse(cachedLinks);
        }
      } catch (error) {
        console.error('Error reading TikTok Google links from cache:', error);
      }
    }

    // If no cache or cache not requested, fetch from API
    console.log(`🌐 Fetching TikTok Google links for restaurant ${placeId}`);
    try {
      const response = await axios.get(`${API_URL}/restaurants/${placeId}/tiktok-google`);
      const linkData = {
        tiktok_links: response.data.tiktok_links || [],
        search_url: response.data.search_url
      };
      
      // Cache the results
      try {
        await AsyncStorage.setItem(`restaurant_tiktok_google_${placeId}`, JSON.stringify(linkData));
      } catch (error) {
        console.error('Error caching TikTok Google links:', error);
      }
      
      return linkData;
    } catch (error) {
      console.error(`Error fetching TikTok Google links for ${placeId}:`, error);
      return { tiktok_links: [], search_url: undefined };
    }
  }

  // Add this method to your ApiService class
  static async getRestaurantTikTokVideos(
    placeId: string,
    useCache: boolean = __DEV__
  ): Promise<{videos: TikTokVideo[], search_url?: string}> {
    // Handle fallback IDs early
    if (placeId.startsWith('fallback-')) {
      console.log(`⚠️ Using placeholder data for fallback TikTok videos ${placeId}`);
      return {
        videos: [
          {
            id: 'fallback-1',
            thumbnail: 'https://placehold.co/300x400/png?text=TikTok+Food',
            url: 'https://www.tiktok.com/search?q=restaurant',
            description: 'Explore restaurant videos on TikTok'
          }
        ],
        search_url: 'https://www.tiktok.com/search?q=restaurant'
      };
    }

    // Try to get from cache first if useCache is true
    if (useCache) {
      try {
        const cachedVideos = await AsyncStorage.getItem(`restaurant_tiktok_videos_${placeId}`);
        if (cachedVideos) {
          console.log(`🗄️ Using cached TikTok videos for restaurant ${placeId}`);
          return JSON.parse(cachedVideos);
        }
      } catch (error) {
        console.error('Error reading TikTok videos from cache:', error);
      }
    }

    // If no cache or cache not requested, fetch from API
    console.log(`🌐 Fetching TikTok videos for restaurant ${placeId}`);
    try {
      const response = await axios.get(`${API_URL}/restaurants/${placeId}/tiktok-videos`);
      const videoData = {
        videos: response.data.videos || [],
        search_url: response.data.search_url
      };
      
      // Cache the results
      try {
        await AsyncStorage.setItem(`restaurant_tiktok_videos_${placeId}`, JSON.stringify(videoData));
      } catch (error) {
        console.error('Error caching TikTok videos:', error);
      }
      
      return videoData;
    } catch (error) {
      console.error(`Error fetching TikTok videos for ${placeId}:`, error);
      return { videos: [], search_url: undefined };
    }
  }

  // Add this method to your ApiService class
  static getRestaurantPhotoUrl(restaurant: Restaurant, index: number = 0): string {
    // Default placeholder if no photo is available
    const fallbackUrl = `https://via.placeholder.com/400x300/f0f0f0/666666?text=${encodeURIComponent(
      restaurant?.displayName?.text || 'Restaurant'
    )}`;
    
    // Check if restaurant has photos
    if (!restaurant?.photos || restaurant.photos.length === 0 || index >= restaurant.photos.length) {
      return fallbackUrl;
    }
    
    const photo = restaurant.photos[index];
    
    // Check for googleMapsUri - this is the preferred source
    if (photo.googleMapsUri) {
      return photo.googleMapsUri;
    }
    
    // Check for name - this might be a direct Places API v1 reference
    if (photo.name) {
      // You may need to adjust this URL format based on your backend implementation
      return `${API_URL}/restaurants/photo?reference=${encodeURIComponent(photo.name)}&maxwidth=400`;
    }
    
    return fallbackUrl;
  }

  // Add to ApiService class
  static async getFallbackRestaurantImage(placeId: string): Promise<string> {
    try {
      const response = await axios.get(`${API_URL}/restaurants/${placeId}/fallback-image`);
      return response.data.image_url;
    } catch (error) {
      console.error('Error fetching fallback image:', error);
      return `https://via.placeholder.com/400x200/f0f0f0/666666?text=Restaurant`;
    }
  }
}

export default ApiService;
