import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import ApiService, { RestaurantDetails, Review } from '../services/ApiService';
import { Linking } from 'react-native';

export default function RestaurantDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [featuredReview, setFeaturedReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadRestaurantDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id) {
          setError('No restaurant ID provided');
          setLoading(false);
          return;
        }
        
        console.log('Loading details for restaurant ID:', id);
        
        // Try to fetch details and reviews
        try {
          // For fallback IDs, we'll get a placeholder response from the API
          const details = await ApiService.getRestaurantDetails(id as string);
          setRestaurant(details);
          
          // Only try to get reviews for non-fallback IDs
          if (!id.toString().startsWith('fallback-')) {
            try {
              const reviews = await ApiService.getRestaurantReviews(id as string);
              if (reviews && reviews.length > 0) {
                setFeaturedReview(reviews[0]);
              }
            } catch (reviewError) {
              console.error('Error fetching reviews:', reviewError);
              // Continue without reviews
            }
          }
        } catch (detailsError) {
          console.error('Error fetching restaurant details:', detailsError);
          setError('Failed to load restaurant details');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadRestaurantDetails();
  }, [id]);
  
  const handleBackPress = () => {
    router.back();
  };
  
  const handleAddReview = () => {
    // Open Google Maps to add a review
    if (restaurant && id) {
      const url = `https://www.google.com/maps/search/?api=1&query=${restaurant.displayName?.text}&query_place_id=${id}`;
      Linking.openURL(url);
    }
  };
  
  const handleSeeMoreReviews = () => {
    if (id) {
      router.push(`/restaurant/${id}/reviews`);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading restaurant details...</Text>
      </SafeAreaView>
    );
  }
  
  if (error || !restaurant) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Restaurant not found'}</Text>
        <TouchableOpacity style={styles.button} onPress={handleBackPress}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView>
        {/* Header with back button and add review button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.addReviewButton}
            onPress={handleAddReview}
          >
            <Text style={styles.addReviewText}>Add Review</Text>
          </TouchableOpacity>
        </View>
        
        {/* Restaurant Information */}
        <View style={styles.restaurantCard}>
          {restaurant.photos && restaurant.photos.length > 0 ? (
            <Image 
              source={{ uri: restaurant.photos[0].googleMapsUri }} 
              style={styles.restaurantImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text>No image available</Text>
            </View>
          )}
          
          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>
              {restaurant.displayName?.text || 'Restaurant'}
            </Text>
            
            <Text style={styles.cuisineType}>
              {restaurant.types && restaurant.types.length > 0 
                ? restaurant.types[0].replace(/_/g, ' ').charAt(0).toUpperCase() + 
                  restaurant.types[0].replace(/_/g, ' ').slice(1) 
                : 'Restaurant'}
            </Text>
            
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={
                    i < Math.floor(restaurant.rating || 0)
                      ? "star"
                      : i < Math.ceil(restaurant.rating || 0)
                      ? "star-half"
                      : "star-outline"
                  }
                  size={18}
                  color="black"
                />
              ))}
            </View>
          </View>
        </View>
        
        {/* Google Reviews Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Google Reviews</Text>
          
          {featuredReview ? (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewerName}>
                {featuredReview.displayName?.text || 'Anonymous'}
              </Text>
              
              <Text style={styles.reviewText}>
                {featuredReview.text?.text || 'No review text available.'}
              </Text>
              
              <View style={styles.reviewRating}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={
                      i < Math.floor(featuredReview.rating || 0)
                        ? "star"
                        : i < Math.ceil(featuredReview.rating || 0)
                        ? "star-half"
                        : "star-outline"
                    }
                    size={16}
                    color="black"
                  />
                ))}
              </View>
              
              {/* Review photos */}
              {featuredReview.photos && featuredReview.photos.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoScroll}
                >
                  {featuredReview.photos.slice(0, 3).map((photo, index) => (
                    <View key={index} style={styles.photoContainer}>
                      <Image 
                        source={{ uri: photo.googleMapsUri }} 
                        style={styles.reviewPhoto}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <Text style={styles.noReviewsText}>No reviews available</Text>
          )}
          
          <TouchableOpacity 
            style={styles.seeMoreButton}
            onPress={handleSeeMoreReviews}
          >
            <Text style={styles.seeMoreText}>See More &gt;</Text>
          </TouchableOpacity>
        </View>
        
        {/* TikTok Reviews Section (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TikTok Reviews</Text>
          <Text style={styles.placeholderText}>TikTok reviews coming soon...</Text>
        </View>
        
        {/* Menu Preview Section (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu Preview</Text>
          <Text style={styles.placeholderText}>Menu preview coming soon...</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#c53030',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addReviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  addReviewText: {
    fontWeight: '500',
  },
  restaurantCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  restaurantImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantDetails: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cuisineType: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  section: {
    padding: 16,
    borderTopWidth: 8,
    borderTopColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 8,
  },
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  photoScroll: {
    flexDirection: 'row',
    marginTop: 8,
  },
  photoContainer: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  reviewPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  seeMoreButton: {
    alignSelf: 'flex-end',
  },
  seeMoreText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  noReviewsText: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
    fontStyle: 'italic',
  },
  placeholderText: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
    fontStyle: 'italic',
  }
});