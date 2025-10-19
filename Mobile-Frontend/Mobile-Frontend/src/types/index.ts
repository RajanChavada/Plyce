export interface Restaurant {
  id: string;
  place_id: string;
  name: string;
  formattedAddress: string;
  rating: number;
  userRatingsTotal: number;
  types: string[];
  priceLevel: number;
  location: {
    latitude: number;
    longitude: number;
  };
  photos: any[];
  photoUrl?: string;
  displayName?: {
    text: string;
    languageCode?: string;
  };
  distance?: number;
  formattedDistance?: string;
  // Service attributes
  outdoorSeating?: boolean;
  allowsDogs?: boolean;
  accessibilityOptions?: {
    wheelchairAccessibleEntrance?: boolean;
  };
  delivery?: boolean;
  dineIn?: boolean;
  reservable?: boolean;
  servesBeer?: boolean;
  servesWine?: boolean;
  servesVegetarianFood?: boolean;
}

// Filter options interface
export interface FilterOptions {
  cuisine?: string;
  dietary?: string;
  price_level?: number;
  outdoor_seating?: boolean;
  pet_friendly?: boolean;
  wheelchair_accessible?: boolean;
  delivery_available?: boolean;
}

// Service attributes available for filtering
export interface ServiceAttributes {
  outdoorSeating: boolean;
  petFriendly: boolean;
  wheelchairAccessible: boolean;
  deliveryAvailable: boolean;
}