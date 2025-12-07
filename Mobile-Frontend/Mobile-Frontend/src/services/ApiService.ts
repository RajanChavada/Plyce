import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationData } from "./LocationService";

// Storage key for the restaurant cache
const RESTAURANT_CACHE_KEY = "plyce_restaurant_cache";
const CACHE_TIMESTAMP_KEY = "plyce_cache_timestamp";
const PROD_URL = "http://plyce-production.up.railway.app/";


// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Determine the correct API URL based on environment
function getApiUrl() {
  // For testing the new filters, use local development server
  let DEV_URL: string;

  if (Platform.OS === "ios") {
    DEV_URL = "http://192.168.2.87:8000"; // iOS Simulator - use Mac's local IP
  } else if (Platform.OS === "android") {
    DEV_URL = "http://10.0.2.2:8000"; // Android Emulator special IP
  } else {
    DEV_URL = "http://192.168.2.87:8000";
  }

  // CHANGE THIS TO SWITCH BETWEEN DEV AND PROD
  const USE_PRODUCTION = false; // Set to true to use production, false for local dev

  const selectedUrl = USE_PRODUCTION ? PROD_URL : DEV_URL;
  console.log("🌐 Using API URL:", selectedUrl);
  return selectedUrl;
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
  priceLevel?: number;
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

export interface MenuItem {
  title: string;
  thumbnails: string[];
  reviews: number;
  photos: number;
  price_range: number[];
  link: string;
}

export interface MenuHighlightsResponse {
  place_id: string;
  menu_highlights: MenuItem[];
  status: 'success' | 'no_data' | 'error' | 'unavailable' | 'api_key_missing';
  message?: string;
  error?: string;
}

export interface MenuPhoto {
  name: string;
  url: string;
  width: number;
  height: number;
  attributions: any[];
}

export interface MenuPhotosResponse {
  place_id: string;
  restaurant_name: string;
  menu_photos: MenuPhoto[];
  total_photos: number;
  status: 'success' | 'no_photos' | 'error' | 'unavailable';
  google_maps_url: string;
  error?: string;
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
    location: {
      latitude: number;
      longitude: number;
      radius?: number;
    },
    useCache: boolean = __DEV__,
    keyword?: string
  ): Promise<Restaurant[]> {
    // NEVER use cache when filtering
    const shouldUseCache = useCache && !keyword;

    if (shouldUseCache) {
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
      }
    } else {
      if (keyword) {
        console.log(`🔍 BYPASSING CACHE - Filtering by keyword: ${keyword}`);
      } else {
        console.log("🌐 BYPASSING CACHE - Fetching fresh data from API");
      }
    }

    try {
      console.log("🌐 FETCHING FROM API...");
      const radius = location.radius || 2000; // Default 2km

      const params: any = {
        lat: location.latitude,
        lng: location.longitude,
        radius,
      };

      if (keyword) {
        params.keyword = keyword;
        console.log(`🔍 Filtering by keyword: ${keyword}`);
      }

      const response = await axios.get(`${API_URL}/restaurants`, {
        params
      });

      if (!response.data) {
        console.error("API returned empty data");
        throw new Error("No data returned from API");
      }

      console.log("API Response structure:", JSON.stringify(response.data).substring(0, 100) + "...");

      let restaurants: Restaurant[] = [];

      if (response.data.places && Array.isArray(response.data.places)) {
        console.log("Processing 'places' array format");
        restaurants = response.data.places.map((item: any, index: number) => {
          // Generate a unique ID that's guaranteed to exist
          const uniqueId = item.id || item.place_id || `place-${Date.now()}-${index}`;

          return {
            id: uniqueId,
            place_id: uniqueId, // Use same unique ID for place_id
            name: item.displayName?.text || item.name || "Unknown Restaurant",
            formattedAddress: item.formattedAddress || item.vicinity || "",
            rating: item.rating || 0,
            userRatingsTotal: item.userRatingCount || item.user_ratings_total || 0,
            types: item.types || [],
            priceLevel: this.mapPriceLevel(item.priceLevel || item.price_level),
            location: {
              latitude: item.location?.latitude ||
                item.geometry?.location?.lat ||
                item.latitude || 0,
              longitude: item.location?.longitude ||
                item.geometry?.location?.lng ||
                item.longitude || 0,
            },
            photos: item.photos || [],
            displayName: item.displayName
          };
        });
      } else if (Array.isArray(response.data)) {
        restaurants = response.data.map((item: any, index: number) => {
          const uniqueId = item.id || item.place_id || `place-${Date.now()}-${index}`;

          return {
            id: uniqueId,
            place_id: uniqueId,
            name: item.displayName?.text || item.name || "Unknown Restaurant",
            formattedAddress: item.formattedAddress || item.vicinity || "",
            rating: item.rating || 0,
            userRatingsTotal: item.userRatingCount || item.user_ratings_total || 0,
            types: item.types || [],
            priceLevel: this.mapPriceLevel(item.priceLevel || item.price_level),
            location: {
              latitude: item.location?.latitude ||
                item.geometry?.location?.lat ||
                item.latitude || 0,
              longitude: item.location?.longitude ||
                item.geometry?.location?.lng ||
                item.longitude || 0,
            },
            photos: item.photos || [],
            displayName: item.displayName
          };
        });
      } else if (response.data.results && Array.isArray(response.data.results)) {
        restaurants = response.data.results.map((item: any, index: number) => {
          const uniqueId = item.id || item.place_id || `place-${Date.now()}-${index}`;

          return {
            id: uniqueId,
            place_id: uniqueId,
            name: item.displayName?.text || item.name || "Unknown Restaurant",
            formattedAddress: item.formattedAddress || item.vicinity || "",
            rating: item.rating || 0,
            userRatingsTotal: item.userRatingCount || item.user_ratings_total || 0,
            types: item.types || [],
            priceLevel: this.mapPriceLevel(item.priceLevel || item.price_level),
            location: {
              latitude: item.location?.latitude ||
                item.geometry?.location?.lat ||
                item.latitude || 0,
              longitude: item.location?.longitude ||
                item.geometry?.location?.lng ||
                item.longitude || 0,
            },
            photos: item.photos || [],
            displayName: item.displayName
          };
        });
      } else {
        console.error("Unexpected API response format:", response.data);
        throw new Error("Unexpected API response format");
      }

      console.log(`✅ Processed ${restaurants.length} restaurants from API`);

      // Verify all restaurants have valid IDs
      const invalidRestaurants = restaurants.filter(r => !r.id || !r.place_id);
      if (invalidRestaurants.length > 0) {
        console.warn(`⚠️ Found ${invalidRestaurants.length} restaurants with missing IDs`);
      }

      // Only cache if not filtering
      if (!keyword) {
        await this.cacheRestaurants(restaurants);
      } else {
        console.log(`⚠️ Not caching filtered results (keyword: ${keyword})`);
      }

      return restaurants;
    } catch (error) {
      console.error("Error fetching restaurants:", error);
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
  ): Promise<{ hashtags: string[], tag_urls: string[], search_urls: string[] }> {
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
  ): Promise<{ tiktok_links: TikTokLink[], search_url?: string }> {
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
  ): Promise<{ videos: TikTokVideo[], search_url?: string }> {
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

  /**
   * Get menu highlights for a restaurant
   * Uses SerpApi to scrape Google Maps menu data
   * @param placeId - The place ID of the restaurant
   * @param useCache - Whether to use cached data
   * @returns Menu highlights data
   */
  static async getMenuHighlights(
    placeId: string,
    useCache: boolean = __DEV__
  ): Promise<MenuHighlightsResponse> {
    // Handle fallback IDs early
    if (placeId.startsWith('fallback-')) {
      console.log(`⚠️ Using placeholder data for fallback menu ${placeId}`);
      return {
        place_id: placeId,
        menu_highlights: [],
        status: 'unavailable'
      };
    }

    // Try to get from cache first if useCache is true
    if (useCache) {
      try {
        const cachedMenu = await AsyncStorage.getItem(`restaurant_menu_${placeId}`);
        if (cachedMenu) {
          console.log(`🗄️ Using cached menu for restaurant ${placeId}`);
          return JSON.parse(cachedMenu);
        }
      } catch (error) {
        console.error('Error reading menu from cache:', error);
      }
    }

    // If no cache or cache not requested, fetch from API
    console.log(`🌐 Fetching menu highlights for restaurant ${placeId}`);
    try {
      const response = await axios.get(`${API_URL}/restaurants/${placeId}/menu-highlights`);
      const menuData: MenuHighlightsResponse = response.data;

      // Cache the results if successful
      if (menuData.status === 'success' && menuData.menu_highlights.length > 0) {
        try {
          await AsyncStorage.setItem(`restaurant_menu_${placeId}`, JSON.stringify(menuData));
        } catch (error) {
          console.error('Error caching menu highlights:', error);
        }
      }

      return menuData;
    } catch (error) {
      console.error(`Error fetching menu highlights for ${placeId}:`, error);
      return {
        place_id: placeId,
        menu_highlights: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all restaurant photos which typically include menu photos
   * This serves as a fallback when structured menu data is unavailable
   * @param placeId - The place ID of the restaurant
   * @param useCache - Whether to use cached data
   * @returns Menu photos data
   */
  static async getRestaurantMenuPhotos(
    placeId: string,
    useCache: boolean = __DEV__
  ): Promise<MenuPhotosResponse> {
    // Handle fallback IDs early
    if (placeId.startsWith('fallback-')) {
      console.log(`⚠️ Using placeholder data for fallback menu photos ${placeId}`);
      return {
        place_id: placeId,
        restaurant_name: 'Restaurant',
        menu_photos: [],
        total_photos: 0,
        status: 'unavailable',
        google_maps_url: 'https://www.google.com/maps'
      };
    }

    // Try to get from cache first if useCache is true
    if (useCache) {
      try {
        const cachedPhotos = await AsyncStorage.getItem(`restaurant_menu_photos_${placeId}`);
        if (cachedPhotos) {
          console.log(`🗄️ Using cached menu photos for restaurant ${placeId}`);
          return JSON.parse(cachedPhotos);
        }
      } catch (error) {
        console.error('Error reading menu photos from cache:', error);
      }
    }

    // If no cache or cache not requested, fetch from API
    console.log(`🌐 Fetching menu photos for restaurant ${placeId}`);
    try {
      const response = await axios.get(`${API_URL}/restaurants/${placeId}/menu-photos`);
      const photoData: MenuPhotosResponse = response.data;

      // Cache the results if successful
      if (photoData.status === 'success' && photoData.menu_photos.length > 0) {
        try {
          await AsyncStorage.setItem(`restaurant_menu_photos_${placeId}`, JSON.stringify(photoData));
        } catch (error) {
          console.error('Error caching menu photos:', error);
        }
      }

      return photoData;
    } catch (error) {
      console.error(`Error fetching menu photos for ${placeId}:`, error);
      return {
        place_id: placeId,
        restaurant_name: 'Restaurant',
        menu_photos: [],
        total_photos: 0,
        status: 'error',
        google_maps_url: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Add this method to your ApiService class
  static getRestaurantPhotoUrl(restaurant: Restaurant, index: number = 0): string {
    // Default placeholder if no photo is available
    const fallbackUrl = `https://via.placeholder.com/400x300/f0f0f0/666666?text=${encodeURIComponent(
      restaurant?.displayName?.text || restaurant?.name || 'Restaurant'
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

    // Check for name - use the backend photo proxy endpoint
    if (photo.name) {
      // Use the correct backend endpoint format that matches your backend
      return `${API_URL}/restaurants/photo/${encodeURIComponent(photo.name)}`;
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

  // Helper to map price level string to number
  private static mapPriceLevel(priceLevel: string | number | undefined): number {
    if (typeof priceLevel === 'number') return priceLevel;
    if (!priceLevel) return 0;

    const priceLevelMap: { [key: string]: number } = {
      'PRICE_LEVEL_FREE': 0,
      'PRICE_LEVEL_INEXPENSIVE': 1,
      'PRICE_LEVEL_MODERATE': 2,
      'PRICE_LEVEL_EXPENSIVE': 3,
      'PRICE_LEVEL_VERY_EXPENSIVE': 4,
    };

    return priceLevelMap[priceLevel] || 0;
  }

  /**
   * Search restaurants with advanced filters
   * @param location - Location coordinates and radius
   * @param filters - Filter options including cuisine, dietary, price, and service attributes
   * @returns Array of filtered restaurants
   */
  static async searchRestaurantsWithFilters(
    location: {
      latitude: number;
      longitude: number;
      radius?: number;
    },
    filters?: {
      cuisine?: string;
      dietary?: string;
      price_level?: number;
      outdoor_seating?: boolean;
      pet_friendly?: boolean;
      wheelchair_accessible?: boolean;
      delivery_available?: boolean;
      venue_type?: string;
    }
  ): Promise<Restaurant[]> {
    try {
      const radius = location.radius || 2000; // Default 2km

      const params: any = {
        lat: location.latitude,
        lng: location.longitude,
        radius,
      };

      // Add filter parameters if provided
      if (filters) {
        if (filters.cuisine) params.cuisine = filters.cuisine;
        if (filters.dietary) params.dietary = filters.dietary;
        if (filters.price_level) params.price_level = filters.price_level;
        if (filters.outdoor_seating !== undefined) params.outdoor_seating = filters.outdoor_seating;
        if (filters.pet_friendly !== undefined) params.pet_friendly = filters.pet_friendly;
        if (filters.wheelchair_accessible !== undefined) params.wheelchair_accessible = filters.wheelchair_accessible;
        if (filters.delivery_available !== undefined) params.delivery_available = filters.delivery_available;
        if (filters.venue_type) params.venue_type = filters.venue_type;
      }

      console.log("🔍 Searching with filters:", params);

      const response = await axios.get(`${API_URL}/restaurants/search`, { params });

      if (!response.data) {
        console.error("API returned empty data");
        return [];
      }

      // Map the response to Restaurant interface
      const restaurants: Restaurant[] = (Array.isArray(response.data) ? response.data : []).map((item: any, index: number) => {
        const uniqueId = item.id || item.place_id || `place-${Date.now()}-${index}`;

        return {
          id: uniqueId,
          place_id: uniqueId,
          name: item.displayName?.text || item.name || "Unknown Restaurant",
          formattedAddress: item.formattedAddress || item.vicinity || "",
          rating: item.rating || 0,
          userRatingsTotal: item.userRatingCount || item.user_ratings_total || 0,
          types: item.types || [],
          priceLevel: this.mapPriceLevel(item.priceLevel || item.price_level),
          location: {
            latitude: item.location?.latitude || 0,
            longitude: item.location?.longitude || 0,
          },
          photos: item.photos || [],
          displayName: item.displayName,
          // Service attributes
          outdoorSeating: item.outdoorSeating,
          allowsDogs: item.allowsDogs,
          accessibilityOptions: item.accessibilityOptions,
          delivery: item.delivery,
          dineIn: item.dineIn,
          reservable: item.reservable,
          servesBeer: item.servesBeer,
          servesWine: item.servesWine,
          servesVegetarianFood: item.servesVegetarianFood,
          // Chain detection
          isChain: item.isChain || false,
        };
      });

      console.log(`✅ Found ${restaurants.length} restaurants matching filters`);
      return restaurants;

    } catch (error) {
      console.error("Error searching restaurants with filters:", error);
      throw error;
    }
  }

  /**
   * Fetch place details for multiple place IDs
   * @param placeIds - Array of place IDs
   * @returns Array of detailed place information
   */
  static async getPlaceDetailsBatch(placeIds: string[]): Promise<Restaurant[]> {
    try {
      console.log(`📋 Fetching details for ${placeIds.length} places`);

      const response = await axios.post(`${API_URL}/restaurants/details`, {
        place_ids: placeIds,
      });

      if (!response.data || !response.data.places) {
        console.error("API returned empty data");
        return [];
      }

      // Map the response to Restaurant interface
      const restaurants: Restaurant[] = response.data.places.map((item: any, index: number) => {
        const uniqueId = item.id || item.place_id || `place-${Date.now()}-${index}`;

        return {
          id: uniqueId,
          place_id: uniqueId,
          name: item.displayName?.text || item.name || "Unknown Restaurant",
          formattedAddress: item.formattedAddress || item.vicinity || "",
          rating: item.rating || 0,
          userRatingsTotal: item.userRatingCount || item.user_ratings_total || 0,
          types: item.types || [],
          priceLevel: this.mapPriceLevel(item.priceLevel || item.price_level),
          location: {
            latitude: item.location?.latitude || 0,
            longitude: item.location?.longitude || 0,
          },
          photos: item.photos || [],
          displayName: item.displayName,
          // Service attributes
          outdoorSeating: item.outdoorSeating,
          allowsDogs: item.allowsDogs,
          accessibilityOptions: item.accessibilityOptions,
          delivery: item.delivery,
          dineIn: item.dineIn,
          reservable: item.reservable,
          servesBeer: item.servesBeer,
          servesWine: item.servesWine,
          servesVegetarianFood: item.servesVegetarianFood,
        };
      });

      console.log(`✅ Successfully fetched ${restaurants.length} place details`);
      return restaurants;

    } catch (error) {
      console.error("Error fetching place details batch:", error);
      throw error;
    }
  }
}

export default ApiService;
