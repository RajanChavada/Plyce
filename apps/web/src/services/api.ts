import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('🌐 Web API URL:', API_URL);

// Types
export interface Restaurant {
  place_id?: string;
  id?: string;
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
  userRatingsTotal?: number;
  photos?: Array<{
    name?: string;
    googleMapsUri?: string;
  }>;
  outdoorSeating?: boolean;
  allowsDogs?: boolean;
  delivery?: boolean;
  dineIn?: boolean;
  reservable?: boolean;
  servesVegetarianFood?: boolean;
}

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
}

export interface TikTokVideo {
  id: string;
  thumbnail: string;
  url: string;
  description: string;
}

export interface MenuPhoto {
  name: string;
  url: string;
  width: number;
  height: number;
}

// API Client
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function
function mapPriceLevel(priceLevel: string | number | undefined): number {
  if (typeof priceLevel === 'number') return priceLevel;
  if (!priceLevel) return 0;

  const priceLevelMap: Record<string, number> = {
    'PRICE_LEVEL_FREE': 0,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4,
  };

  return priceLevelMap[priceLevel] || 0;
}

// API Service
export const ApiService = {
  // Get nearby restaurants
  async getNearbyRestaurants(
    lat: number,
    lng: number,
    radius: number = 2000,
    keyword?: string
  ): Promise<Restaurant[]> {
    try {
      const params: Record<string, any> = { lat, lng, radius };
      if (keyword) params.keyword = keyword;

      const response = await apiClient.get('/restaurants', { params });

      let restaurants: Restaurant[] = [];

      // Handle both array response (direct) and object response ({ places: [...] })
      const placesData = Array.isArray(response.data)
        ? response.data
        : (response.data.places || []);

      if (Array.isArray(placesData)) {
        restaurants = placesData.map((item: any, index: number) => ({
          id: item.id || item.place_id || `place-${Date.now()}-${index}`,
          place_id: item.id || item.place_id || `place-${Date.now()}-${index}`,
          name: item.displayName?.text || item.name || "Unknown Restaurant",
          displayName: item.displayName,
          formattedAddress: item.formattedAddress || "",
          rating: item.rating || 0,
          userRatingsTotal: item.userRatingCount || 0,
          types: item.types || [],
          priceLevel: mapPriceLevel(item.priceLevel),
          location: {
            latitude: item.location?.latitude || 0,
            longitude: item.location?.longitude || 0,
          },
          photos: item.photos || [],
        }));
      }

      console.log(`✅ Loaded ${restaurants.length} restaurants`);
      return restaurants;
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  },

  // Get restaurant details
  async getRestaurantDetails(placeId: string): Promise<Restaurant> {
    try {
      const response = await apiClient.get(`/restaurants/${placeId}`);
      return { ...response.data, place_id: placeId };
    } catch (error) {
      console.error(`Error fetching details for ${placeId}:`, error);
      throw error;
    }
  },

  // Get restaurant reviews
  async getRestaurantReviews(placeId: string): Promise<Review[]> {
    try {
      const response = await apiClient.get(`/restaurants/${placeId}/reviews`);
      return response.data.reviews || [];
    } catch (error) {
      console.error(`Error fetching reviews for ${placeId}:`, error);
      return [];
    }
  },

  // Get TikTok videos
  async getTikTokVideos(placeId: string): Promise<{ videos: TikTokVideo[], search_url?: string }> {
    try {
      // Increase timeout specifically for scraping endpoints
      const response = await apiClient.get(`/restaurants/${placeId}/tiktok-videos`, {
        timeout: 90000 // 90 seconds
      });
      return {
        videos: response.data.videos || [],
        search_url: response.data.search_url,
      };
    } catch (error) {
      console.error(`Error fetching TikTok videos for ${placeId}:`, error);
      return { videos: [] };
    }
  },

  // Get menu photos
  async getMenuPhotos(placeId: string): Promise<{ photos: MenuPhoto[], google_maps_url?: string }> {
    try {
      const response = await apiClient.get(`/restaurants/${placeId}/menu-photos`);
      return {
        photos: response.data.menu_photos || [],
        google_maps_url: response.data.google_maps_url,
      };
    } catch (error) {
      console.error(`Error fetching menu photos for ${placeId}:`, error);
      return { photos: [] };
    }
  },

  // Get photo URL
  getPhotoUrl(restaurant: Restaurant, index: number = 0): string {
    const fallbackUrl = `https://placehold.co/400x300/f0f0f0/666666/png?text=${encodeURIComponent(
      restaurant?.displayName?.text || restaurant?.name || 'Restaurant'
    )}`;

    if (!restaurant?.photos || restaurant.photos.length === 0 || index >= restaurant.photos.length) {
      return fallbackUrl;
    }

    const photo = restaurant.photos[index];

    if (photo.googleMapsUri) {
      return photo.googleMapsUri;
    }

    if (photo.name) {
      return `${API_URL}/restaurants/photo/${encodeURIComponent(photo.name)}`;
    }

    return fallbackUrl;
  },

  // Search with filters
  async searchWithFilters(
    lat: number,
    lng: number,
    radius: number = 2000,
    filters?: {
      cuisine?: string;
      price_level?: number;
      outdoor_seating?: boolean;
      delivery_available?: boolean;
    }
  ): Promise<Restaurant[]> {
    try {
      const params: Record<string, any> = { lat, lng, radius, ...filters };
      const response = await apiClient.get('/restaurants/search', { params });

      return (response.data || []).map((item: any, index: number) => ({
        id: item.id || item.place_id || `place-${Date.now()}-${index}`,
        place_id: item.id || item.place_id || `place-${Date.now()}-${index}`,
        name: item.displayName?.text || item.name || "Unknown Restaurant",
        displayName: item.displayName,
        formattedAddress: item.formattedAddress || "",
        rating: item.rating || 0,
        userRatingsTotal: item.userRatingCount || 0,
        types: item.types || [],
        priceLevel: mapPriceLevel(item.priceLevel),
        location: {
          latitude: item.location?.latitude || 0,
          longitude: item.location?.longitude || 0,
        },
        photos: item.photos || [],
      }));
    } catch (error) {
      console.error('Error searching with filters:', error);
      throw error;
    }
  },
};

export default ApiService;
