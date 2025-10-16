import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import styles from '../../styles/components/RestaurantCard';
import ApiService from '../../services/ApiService';

interface RestaurantCardProps {
  restaurant: any;
}

const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    if (!restaurant.place_id && !restaurant.id) {
      console.error("Cannot navigate: Restaurant has no valid ID", restaurant);
      Alert.alert("Error", "Unable to view restaurant details");
      return;
    }
    
    const restaurantId = restaurant.place_id || restaurant.id;
    console.log(`🔍 Navigating to restaurant details: ${restaurantId}`);
    
    router.push({
      pathname: "/restaurant/[id]",
      params: { id: restaurantId }
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`star-${i}`} name="star" size={16} color="#000000" />);
    }

    if (hasHalfStar) {
      stars.push(<Ionicons key="half-star" name="star-half" size={16} color="#000000" />);
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-star-${i}`} name="star-outline" size={16} color="#000000" />);
    }

    return stars;
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;
  };

  // Format type names properly (convert snake_case to Title Case)
  const formatType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get primary type for display
  const getPrimaryType = () => {
    if (!restaurant.types || restaurant.types.length === 0) return 'Restaurant';
    
    const preferredTypes = ['restaurant', 'cafe', 'bakery', 'bar', 'food'];
    for (const type of preferredTypes) {
      if (restaurant.types.includes(type)) {
        return formatType(type);
      }
    }
    return formatType(restaurant.types[0]);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator size="small" color="#999" />
          </View>
        )}
        
        <Image
          source={{
            uri: ApiService.getRestaurantPhotoUrl(restaurant),
          }}
          style={styles.image}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />
      </View>

      <View style={styles.contentContainer}>
        <View>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.displayName?.text || 'Restaurant'}
          </Text>

          <Text style={styles.cuisineType}>
            {getPrimaryType()}
          </Text>

          <View style={styles.tagsContainer}>
            {restaurant.types?.slice(0, 3)
              .filter(type => !['point_of_interest', 'establishment'].includes(type))
              .map((type: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{formatType(type)}</Text>
                </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.starsContainer}>
            {renderStars(restaurant.rating || 0)}
          </View>
          <Text style={styles.distance}>
            {formatDistance(restaurant.distance || restaurant.formattedDistance?.match(/[\d.]+/)?.[0] * 1000 || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </View>
    </TouchableOpacity>
  );
}

export default RestaurantCard;