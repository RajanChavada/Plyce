import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ApiService, { Restaurant } from '../services/ApiService';

interface RestaurantCardProps {
  restaurant: Restaurant;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

const RestaurantCard = ({ restaurant, userLocation }: RestaurantCardProps) => {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Extract the correct ID
  const getRestaurantId = () => {
    // Use the restaurant's ID if available
    if (restaurant.place_id) {
      return restaurant.place_id;
    } 
    
    // Parse the name field if it contains an ID
    if (restaurant.name && typeof restaurant.name === 'string' && restaurant.name.includes('places/')) {
      const match = restaurant.name.match(/places\/([^\/]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Use the first part of the restaurant name as a fallback
    const safeName = restaurant.displayName?.text?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'unknown';
    return `fallback-${safeName}-${Math.random().toString(36).substring(2, 10)}`;
  };

  // Handle navigation to restaurant details
  const handlePress = () => {
    const restaurantId = getRestaurantId();
    console.log('Navigating to restaurant details:', restaurantId);
    
    router.push(`/restaurant/${restaurantId}`);
  };

  // Calculate distance if both locations are available
  const getDistance = () => {
    if (!userLocation || !restaurant.location) return null;
    
    // Calculate distance in km using Haversine formula
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(restaurant.location.latitude - userLocation.latitude);
    const dLon = deg2rad(restaurant.location.longitude - userLocation.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(userLocation.latitude)) * Math.cos(deg2rad(restaurant.location.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    
    return distance < 1 ? 
      `${(distance * 1000).toFixed(0)}m` : 
      `${distance.toFixed(1)}km`;
  };
  
  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };
  
  // Get restaurant image URL or use a placeholder
  const getRestaurantImage = () => {
    if (imageError || !restaurant.photos || restaurant.photos.length === 0) {
      // Return a placeholder image URL based on restaurant name
      const restaurantName = encodeURIComponent(restaurant.displayName?.text || 'Restaurant');
      return `https://via.placeholder.com/400x200/f0f0f0/666666?text=${restaurantName}`;
    }
    
    return restaurant.photos[0].googleMapsUri;
  };

  // Get the photo URL using our new helper
  const imageUrl = ApiService.getRestaurantPhotoUrl(restaurant);

  // Extract restaurant types for displaying as tags
  const getRestaurantTags = () => {
    if (!restaurant.types) return [];
    
    // Filter out common types that aren't useful as tags
    const excludeTypes = ['restaurant', 'food', 'point_of_interest', 'establishment'];
    
    // Create tags array including types and known dietary options
    const tags = restaurant.types
      .filter(type => !excludeTypes.includes(type.toLowerCase()))
      .map(type => type.replace(/_/g, ' '));
      
    // Add dietary preferences if available in the restaurant data
    const isDietaryTag = restaurant.types.some(
      t => t.toLowerCase().includes('vegetarian') || 
           t.toLowerCase().includes('vegan') || 
           t.toLowerCase().includes('halal')
    );
    
    if (!isDietaryTag) {
      // Add known dietary tags from the restaurant description
      if (restaurant.formattedAddress?.toLowerCase().includes('vegetarian') || 
          restaurant.displayName?.text.toLowerCase().includes('vegetarian')) {
        tags.push('Vegetarian');
      }
      if (restaurant.formattedAddress?.toLowerCase().includes('vegan') || 
          restaurant.displayName?.text.toLowerCase().includes('vegan')) {
        tags.push('Vegan');
      }
      if (restaurant.formattedAddress?.toLowerCase().includes('halal') || 
          restaurant.displayName?.text.toLowerCase().includes('halal')) {
        tags.push('Halal');
      }
    }
    
    return tags.slice(0, 3); // Limit to 3 tags
  };
  
  // Render star ratings
  const renderRating = () => {
    if (!restaurant.rating) return null;
    
    const fullStars = Math.floor(restaurant.rating);
    const halfStar = restaurant.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <View style={styles.ratingContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <Ionicons key={`full-${i}`} name="star" size={16} color="#000" />
        ))}
        {halfStar && <Ionicons key="half" name="star-half" size={16} color="#000" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#000" />
        ))}
      </View>
    );
  };

  // Get main cuisine type
  const getCuisineType = () => {
    if (!restaurant.types) return 'Restaurant';
    
    const cuisineMapping: Record<string, string> = {
      'italian_restaurant': 'Italian',
      'japanese_restaurant': 'Japanese',
      'chinese_restaurant': 'Chinese',
      'mexican_restaurant': 'Mexican',
      'indian_restaurant': 'Indian',
      'thai_restaurant': 'Thai',
      'french_restaurant': 'French',
      'cafe': 'Café',
      'bakery': 'Bakery',
      'bar': 'Bar',
      'pizza_restaurant': 'Pizza',
      'fast_food_restaurant': 'Fast Food'
    };
    
    for (const type of restaurant.types) {
      if (cuisineMapping[type]) {
        return cuisineMapping[type];
      }
    }
    
    return 'Restaurant';
  };
  
  const distance = getDistance();
  const tags = getRestaurantTags();

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageError ? 
            `https://via.placeholder.com/400x200/f0f0f0/666666?text=${encodeURIComponent(restaurant?.displayName?.text || 'Restaurant')}` : 
            imageUrl 
          }}
          style={styles.restaurantImage}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            console.log(`Failed to load image for ${restaurant?.displayName?.text || 'unknown restaurant'}`);
            setImageError(true);
            setImageLoading(false);
          }}
          resizeMode="cover"
        />
        
        {imageLoading && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator size="small" color="#666" />
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.restaurantName}>
          {restaurant?.displayName?.text || 'Restaurant'}
        </Text>
        <Text style={styles.cuisine}>{getCuisineType()}</Text>
        
        <View style={styles.detailsContainer}>
          {renderRating()}
          {distance && <Text style={styles.distance}>{distance}</Text>}
        </View>
        
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  cuisine: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  distance: {
    fontSize: 12,
    color: '#555',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#555',
  }
});

export default RestaurantCard;