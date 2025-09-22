import * as React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import ApiService, {
  RestaurantDetails,
  Review,
  TikTokVideo,
  API_URL,
} from "../services/ApiService"; 
import { Linking } from "react-native";
import * as Progress from "react-native-progress";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { restaurantDetailsStyles as styles } from "../styles/screens/RestaurantDetailsScreen";

const TIKTOK_LOGO_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFyGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjMtMDktMTRUMTI6NTQ6MDctMDQ6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjMtMDktMTRUMTI6NTQ6MDctMDQ6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIzLTA5LTE0VDEyOjU0OjA3LTA0OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjdiNDgxYjdmLTc3ZDEtNDYxYy04MDdhLWNiYmU0ODRiODM1YSIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjZiNzNhOWY3LTRkOGEtZDQ0Yy05MmM2LWQ4MzRiZGQzMmQ4YiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjliZGVkNGFkLTMzNzYtNDZjNS04NGM4LTlmMzE5NDdkYzc3YSIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6N2I0ODFiN2YtNzdkMS00NjFjLTgwN2EtY2JiZTQ4NGI4MzVhIiBzdEV2dDp3aGVuPSIyMDIzLTA5LTE0VDEyOjU0OjA3LTA0OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6Iyx9rAAAJRUlEQVR4nO2afWxVVx3HP/fe+9S+llJeBFrA0fEymAyoAwlbxpbBgBnqZCYzW1xcphEWH6Lxjwkxbom4P9CQLC4uMZk6jP9YyIIrG6ObMreNsUcHCGNgigzzgaHQlvb1Pt17/PO+v9vTPl56Hwj0l9zcnnPP+Z3f+X3P73fOPee0Uk0MwMI/X2B6IEnVrGaqa1uo0frx3KvEHv8Vc390nJsymTsjx3hj5UPcbdm2nTnGuCU1Zxe9Mk7/sxgEArQmA2z1DXGjvZTdF0Z48OO/U2XbGGnYijK2NGTJHXYV+ceIDvBJ4HngdnmZM+KOJZi/8ynmAam/v4i56IfEjYX2jgDvAk8CI+4NhQN+BTzyoWr5/1XtAvw20+QrQRPwgptJOkADnxdpPgdxV0udoymPT/B3CX7iNogDGgU8owN20TSwOeOvmev+PFJXfIgukCiTX4F/rFSbKlEBzMFLC/QbpwDNQY929yJ+RmPbwxSXcJ0mCyAChHSglZlkKx1rbO7e7uFQ4CZaaxsz9x1pbCXm8aYq+iI1DLQsYPEcH8Ga6ayZG+ZiXwfx4SFWLr7NnQeMW9/LcDrBzpfbee3dKzSsXE0olcYOrKJG+/nbsWE+d1sVge++QGdXgoS9hAWfVAxfTtLQGmaL7+2M7qThzxlbFNui7R9qpbPa12ETdcDbB14nWTUNn5Xipd2vEA36eWrLU/iIsfenP2ff2T6WhcP8+d47aXrsfk62HSO27xBd0RCeaIiHnnmV//T08MFTW1jRWE10705esePU7XmBCBDdP0CyeSZ+vzMJKq0ZqcLRwXhRGIaYt8ZnHR9LpUN26+H3i+upiwQ5duzfsH0RgZ4Yp08NAg0sfOwJehcGmTO9kZ6vPU58MMXloesoK8HAgKatYQW+6nrSPTHUjr0kwkEcZoOuDjVh27mErUJZYPNLzTRH62gJtLK4eQnHR9o4HwsRnl/P0aNtqLrZxJKKbf+5iGpZipVMMTjYjw9Iaxt76a3Y4RDpZAL1lz3YkXqG43HO/ONfbGh/lvMXu+k7/S++vvkZZlbXMMtjSSdpazMUqEIDzgmZzFJ5Z+DISjv5LM0n8NnFTlpaW5m9YDbXAsP0xBK8sm8f12fWE/N6aPjDGUIffZz2sj6c2aT9g1/BefGWdIDnWvy5jCTje0NVmGvDXdQFIjSaLzpuTEhSarS76gAXBS5TdZFfri7/BKhoVBj9c1FgjFybRGeCDkhUadO9QNFJ0IsCczWpFOPpTHTUuSjwJnD1VnRmirHCRYG0aF8p5oCGfQdoFHDw7MopxrLimaB1IAEwVlxVpnimIMWiQAcwKIXje6YgRaMzBV6T3MhLU5BiURgW2SXScfJWdGaK0S2ynVOJLnJbJpMUm4Ncyqpzrne5oQFPPvlkOr/l7jW5EbpK0SlwBgdOs3H2bGmrc9s+VXBOhV3iAA/wIfmrPzXI+aHLngP8wGzpzGb3vimAHwgBLeTswQjOi0II5+GIEb9BnKc8syR3IR2bLiajoypYB2dEUE2M6fk/lDkI4EySDXnPKgHqpG42MJPcmZ+nRAeM7FMhrJV6o5TPb5sRRHLPhETZquIwHcwaMTuE8UxQC7lIqCQKPEDUSxZViCbZt4MKdZH3gJPihiE+iY/IAeKIQHAc7SoGDzhBpPVDnPieR24+SJNbEUuDI8Aw8CGceeAs8A7OCG+v0FP1gI+iJ8QawSr5FILsjP1ZyvnAPk1ugixmNCh1LxPjgOQ4eUWjEbX8QJTJRcKgjFyXlBvJXYl6cW5MjDQpnEmrU8qFcVZ2DeN0TIszCsWdR4XigHlSnw+0AreRW80m4FBsKxSKA84AbVJvxHlEaOgrFhe5OyAA3CX1c1L65z6ZVCgU6gBlpLPiqD0FC3lIys+KDNwJpNx+FAo5YEDKRcCH5cd+RYWhoC5XoVAEJKRskXJM5HlJqaBQyAERYI6U/y7lHdSgEEWDQiEHrJTyJM7bXxvOKXTFoZAD5kp5Qcq5FK4SmuR2IJZpKXQUcubTeVLOIrcQKhqFxnADYJ2Up4ARCu+ptAOQWw09SplnkXGNjO1YyAGjoq+kM0MUPyQ1VSOb3FGoi5j86CqdyDbVWBRL0Ju/pWwyDlDkPkotuhzmKDEcvuqKlJXE3nHbFXJAJndnBlAOPDhT3KJ8Z4yVLkbZ7ZTr8HJijPI7IIRzb+/BuZ6OkhutcjIpFnOtMm1Ldn1OW6npMG99xvZoofI7wIvzzt+QK2eOnMpxgHsFnGo3Vr7DKtcBuQFuOrIvgtEsZU0+LeVQoFwHZB5kZJnfyLbj3TcWm7+lQdnX1ETugLJRrjMnFc5+SoIzSZaSDmUi4C9yExTPAs8sZQ+OAyoJZTsgM0qWa5BqWSRNhpsRAdwrfU1xDed2uBzUAOuFziLmA88JhQRxoMfla4V8QSvnO3K/vDVN7jw/G17y55iJwDxgEbmTpYV4/m3EgS1A2V+blPMdcAznnj2Es9dCZB+QZFF2J3JIkTsw8cq9hrFD45bfySLO9kqZJvsRlxdn+zcCd1Bm5OfDoQo7YPbLiyPuVu7w+nCGMtMBLo6+g7QbGl+SaaR7TKDyHGAr7MHrJP+9yJbpbGWG/lZlOUCDbdnsvjSY10kPgWxHuy1vvhtiyR/I96asb4TKcIAdS3Dr37IXUPkB8kujnWZg7WhVLi+thN2U4YB4PIFtj/22PB8LKIV/f6rv3lfNyabpPwEil7fOONP51TQP/fol9tEBRfnaVX4ZD6mYGm//m/Bb7pPvGN9q/lvCb/mwlJPYtv23hN9SJyvDOmUbrwVaWxpvZ8h1U/fyucY/A2mNzFX/K7YdO1JLP4Sl8S/uhOGbotnCofClE5z4xDKa3LY3JdOYpzEdTS8cHEmxLT5MOlXNWvNDmqs4t6lRiJihptEXfqs31vWmhV2THX8TgVpZvmz/Nkq3/ncKYlzzXWVd0+ws33pKXsQoetPLjt0ZOsfbR4dpvb2G5kajQfspNXrbPAmmOkzArJ0QGMZqXVvr8VjYVqDT2Omzr3XddUf4k8uY61+S67YPeYo+owAAAABJRU5ErkJggg==";

interface TikTokLink {
  url: string;
  title: string;
}

export default function RestaurantDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [featuredReview, setFeaturedReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tiktokLinks, setTiktokLinks] = useState<{
    tiktok_links: TikTokLink[];
    search_url?: string;
  }>({
    tiktok_links: [],
  });
  const [tiktokLoading, setTiktokLoading] = useState(true); // Set to true by default
  const [tiktokLoadingProgress, setTiktokLoadingProgress] = useState(0);
  const [tiktokVideos, setTiktokVideos] = useState<TikTokVideo[]>([]);
  const [tiktokError, setTiktokError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id || typeof id !== "string") {
        throw new Error("Invalid restaurant ID");
      }

      const data = await ApiService.getRestaurantDetails(id);
      setRestaurant(data);

      // Fetch featured review
      const reviews = await ApiService.getRestaurantReviews(id);
      if (reviews && reviews.length > 0) {
        setFeaturedReview(reviews[0]);
      }
    } catch (err) {
      console.error("Error fetching restaurant details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load restaurant details"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTikTokVideos = useCallback(async () => {
    if (!restaurant?.place_id) return; // Use place_id instead of displayName
    
    setTiktokLoading(true);
    setTiktokLoadingProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setTiktokLoadingProgress(prev => Math.min(prev + 0.1, 0.9));
      }, 200);

      // Use place_id instead of restaurant name
      const response = await fetch(`${API_URL}/restaurants/${restaurant.place_id}/tiktok-videos?limit=4`);
      
      clearInterval(progressInterval);
      setTiktokLoadingProgress(1);
      
      if (response.ok) {
        const data = await response.json();
        setTiktokVideos(data.videos || []);
      } else {
        console.error('Failed to fetch TikTok videos');
        setTiktokVideos([]);
      }
    } catch (error) {
      console.error('Error fetching TikTok videos:', error);
      setTiktokVideos([]);
    } finally {
      setTimeout(() => {
        setTiktokLoading(false);
        setTiktokLoadingProgress(0);
      }, 500);
    }
  }, [restaurant?.place_id, API_URL]);

  useEffect(() => {
    fetchRestaurantDetails();
  }, [id]);

  useEffect(() => {
    if (restaurant) {
      fetchTikTokVideos();
    }
  }, [restaurant]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRestaurantDetails();
    setRefreshing(false);
  };

  const handleTikTokPress = (url: string) => {
    Linking.openURL(url);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={16} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color="#FFD700" />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={16}
          color="#FFD700"
        />
      );
    }

    return stars;
  };

  const renderTikTokLoading = () => (
    <View style={styles.tiktokLoadingContainer}>
      <View style={styles.tiktokLogoContainer}>
        <Image
          source={{ uri: TIKTOK_LOGO_BASE64 }}
          style={{ width: 32, height: 32 }}
        />
        <View style={{ flexDirection: "row", marginLeft: 8 }}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.loadingDot,
                {
                  animationDelay: `${i * 200}ms`,
                  opacity: (tiktokLoadingProgress * 10) % 3 === i - 1 ? 1 : 0.3,
                },
              ]}
            />
          ))}
        </View>
      </View>
      <Text style={styles.loadingSubtext}>Searching TikTok videos...</Text>
      <Progress.Bar
        progress={tiktokLoadingProgress}
        width={200}
        color="#EE1D52"
        unfilledColor="#f0f0f0"
        borderWidth={0}
        height={4}
      />
    </View>
  );

  const renderTikTokSection = () => {
    if (tiktokLoading) {
      return renderTikTokLoading();
    }

    if (tiktokError) {
      return (
        <View style={styles.tiktokLoadingContainer}>
          <MaterialIcons name="error-outline" size={32} color="#666" />
          <Text style={styles.loadingSubtext}>
            Error loading TikTok videos
          </Text>
        </View>
      );
    }

    if (tiktokVideos.length === 0) {
      return (
        <TouchableOpacity
          style={styles.noResultsButton}
          onPress={() => {
            const searchQuery = encodeURIComponent(
              `${restaurant?.displayName?.text || "restaurant"} food review`
            );
            Linking.openURL(`https://www.tiktok.com/search?q=${searchQuery}`);
          }}
        >
          <MaterialIcons name="search" size={20} color="#555" />
          <Text style={styles.noResultsText}>
            No TikTok videos found. Search manually?
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <FlatList
        data={tiktokVideos}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.url}-${index}`}
        contentContainerStyle={styles.tiktokScroll}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tiktokVideoCard}
            onPress={() => handleTikTokPress(item.url)}
          >
            <View style={styles.tiktokThumbnail}>
              {item.thumbnail ? (
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.tiktokThumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.tiktokThumbnail, { backgroundColor: "#f0f0f0" }]} />
              )}
              <View style={styles.tiktokVideoOverlay}>
                <Ionicons name="play" size={20} color="#fff" />
              </View>
            </View>
            <View style={styles.tiktokVideoInfo}>
              <Text style={styles.tiktokVideoDesc} numberOfLines={2}>
                {item.description || "TikTok Video"}
              </Text>
              <View style={styles.tiktokButtonContainer}>
                <Text style={styles.tiktokButtonText}>Watch</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#666" />
          <Text style={styles.loadingText}>Loading restaurant details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={fetchRestaurantDetails}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Restaurant not found</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.addReviewButton}
          onPress={() => {
            // Navigate to Add Review screen or show review modal
            Alert.alert("Add Review", "This feature will be implemented soon!");
          }}
        >
          <Text style={styles.addReviewText}>Add Review</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Restaurant Card */}
        <View style={styles.restaurantCard}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: ApiService.getRestaurantPhotoUrl({
                  photos: restaurant.photos,
                  displayName: restaurant.displayName,
                } as any),
              }}
              style={styles.restaurantImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>
              {restaurant.displayName?.text || "Restaurant"}
            </Text>
            <Text style={styles.cuisineType}>
              {restaurant.types?.[0] || "Restaurant"}
            </Text>
            <View style={styles.ratingContainer}>
              {restaurant.rating && renderStars(restaurant.rating)}
            </View>
          </View>
        </View>

        {/* Featured Review Section */}
        {featuredReview && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Review</Text>
              <TouchableOpacity
                onPress={() =>
                  router.push(`/restaurant/${id}/reviews` as any)
                }
              >
                <Text style={styles.seeMoreText}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewerName}>
                {featuredReview.displayName?.text || "Anonymous"}
              </Text>
              <View style={styles.reviewRating}>
                {renderStars(featuredReview.rating || 0)}
              </View>
              <Text style={styles.reviewText}>
                {featuredReview.text?.text || "No review text available"}
              </Text>
            </View>
          </View>
        )}

        {/* TikTok Videos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TikTok Videos</Text>
          {renderTikTokSection()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}