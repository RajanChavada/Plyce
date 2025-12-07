// Restaurant Types
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

export interface Filters {
  cuisine: string;
  priceLevel: number[];
  rating: number;
  openNow: boolean;
}

export type ViewMode = 'map' | 'list' | 'grid';
