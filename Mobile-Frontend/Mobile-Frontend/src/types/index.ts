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
  photoUrl?: string; // Add this line
  displayName?: {
    text: string;
    languageCode?: string;
  };
  distance?: number;
  formattedDistance?: string;
}