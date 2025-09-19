import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useEffect, useState } from "react";
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

const TIKTOK_LOGO_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFyGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjMtMDktMTRUMTI6NTQ6MDctMDQ6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjMtMDktMTRUMTI6NTQ6MDctMDQ6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIzLTA5LTE0VDEyOjU0OjA3LTA0OjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjdiNDgxYjdmLTc3ZDEtNDYxYy04MDdhLWNiYmU0ODRiODM1YSIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjZiNzNhOWY3LTRkOGEtZDQ0Yy05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";

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
  const [tiktokVideos, setTiktokVideos] = useState<
    (TikTokVideo & { loadFailed?: boolean })[]
  >([]);
  const [tiktokRefreshing, setTiktokRefreshing] = useState(false);
  const [loadingDots, setLoadingDots] = useState("");
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Update your fetchRestaurantDetails function to also trigger TikTok videos loading
  const fetchRestaurantDetails = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const details = await ApiService.getRestaurantDetails(id as string);
      setRestaurant(details);

      // Extract featured review directly from restaurant details
      if (details.reviews && details.reviews.length > 0) {
        const reviewWithText = details.reviews.find((r) => r.text?.text);
        setFeaturedReview(reviewWithText || details.reviews[0]);
      } else {
        setFeaturedReview(null);
      }

      // After restaurant details are loaded, fetch TikTok videos
      fetchTikTokVideos(true);
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
    } finally {
      setLoading(false);
    }
  };

  // This useEffect will only trigger the initial restaurant details fetch
  useEffect(() => {
    if (id) {
      fetchRestaurantDetails();
    }
  }, [id]);

  const fetchTikTokLinks = async () => {
    if (!id) return;

    setTiktokLoading(true);
    try {
      const links = await ApiService.getRestaurantTikTokGoogle(id as string);
      setTiktokLinks(links);
    } catch (error) {
      console.error("Error fetching TikTok links:", error);
    } finally {
      setTiktokLoading(false);
    }
  };

  const fetchTikTokVideos = async (useCache = true) => {
    if (!id) return;

    setTiktokLoading(true);
    setTiktokLoadingProgress(0.1); // Start progress

    try {
      // First check if we have cached results
      if (useCache) {
        try {
          const cachedVideos = await AsyncStorage.getItem(
            `restaurant_tiktok_videos_${id}`
          );
          if (cachedVideos) {
            console.log(`🗄️ Using cached TikTok videos for restaurant ${id}`);
            const data = JSON.parse(cachedVideos);

            // Set cached results immediately while fetching fresh ones
            if (data.videos && data.videos.length > 0) {
              interface CachedTikTokVideo extends TikTokVideo {
                loadFailed: boolean;
                isCached: boolean;
              }

              const videosWithLoadFailed: CachedTikTokVideo[] = data.videos.map(
                (video: TikTokVideo): CachedTikTokVideo => ({
                  ...video,
                  loadFailed: false,
                  isCached: true,
                })
              );
              setTiktokVideos(videosWithLoadFailed);
              setTiktokLoading(false);

              // If we're showing cached results, fetch fresh ones in the background
              setTiktokRefreshing(true);
            }
          }
        } catch (error) {
          console.error("Error reading TikTok videos from cache:", error);
        }
      }

      // Fetch fresh results regardless
      setTiktokLoadingProgress(0.3);
      console.log(`🌐 Fetching TikTok videos for restaurant ${id}`);

      // Start with a timeout for error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        `${API_URL}/restaurants/${id}/tiktok-videos`,
        {
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch TikTok videos: ${response.status}`);
      }

      setTiktokLoadingProgress(0.7);

      const data = await response.json();
      console.log(`Got ${data.videos?.length || 0} TikTok videos`);

      if (data.videos && data.videos.length > 0) {
        interface TikTokVideoWithLoadState extends TikTokVideo {
          loadFailed: boolean;
        }

        const videosWithLoadFailed: TikTokVideoWithLoadState[] =
          data.videos.map(
            (video: TikTokVideo): TikTokVideoWithLoadState => ({
              ...video,
              loadFailed: false,
            })
          );
        setTiktokVideos(videosWithLoadFailed);
      } else {
        // Empty array if no videos
        setTiktokVideos([]);
      }

      setTiktokLoadingProgress(1);

      // Cache the results
      try {
        await AsyncStorage.setItem(
          `restaurant_tiktok_videos_${id}`,
          JSON.stringify(data)
        );
      } catch (cacheError) {
        console.error("Error caching TikTok videos:", cacheError);
      }
    } catch (error) {
      console.error("Error fetching TikTok videos:", error);
      setTiktokVideos([]);
    } finally {
      setTiktokLoading(false);
      setTiktokRefreshing(false);
    }
  };

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

  useEffect(() => {
    if (!tiktokLoading) return;

    const interval = setInterval(() => {
      setLoadingDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      // Simulate progress for better UX
      setTiktokLoadingProgress((prev) => {
        const increment = Math.random() * 0.1;
        return Math.min(prev + increment, 0.95);
      });
    }, 500);

    return () => clearInterval(interval);
  }, [tiktokLoading]);

  // Add this useEffect to load TikTok videos automatically
  useEffect(() => {
    if (id && !tiktokVideos.length && !tiktokLoading) {
      console.log("🔄 Auto-loading TikTok videos on screen open");
      fetchTikTokVideos(true);
    }
  }, [id, restaurant]); // Add dependencies that should trigger the fetch

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
        <Text style={styles.errorText}>{error || "Restaurant not found"}</Text>
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
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
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
          {/* Restaurant Image */}
          <View style={styles.imageContainer}>
            {restaurant && (
              <Image
                source={{
                  uri: imageError
                    ? `https://via.placeholder.com/800x400/f0f0f0/666666?text=${encodeURIComponent(
                        restaurant?.displayName?.text || "Restaurant"
                      )}`
                    : ApiService.getRestaurantPhotoUrl(restaurant),
                }}
                style={styles.restaurantImage}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={(e) => {
                  console.log(
                    "Failed to load restaurant image:",
                    e.nativeEvent.error
                  );
                  setImageError(true);
                  setImageLoading(false);
                }}
                resizeMode="cover"
              />
            )}

            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}

            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.restaurantDetails}>
            <Text style={styles.restaurantName}>
              {restaurant.displayName?.text || "Restaurant"}
            </Text>

            <Text style={styles.cuisineType}>
              {restaurant.types && restaurant.types.length > 0
                ? restaurant.types[0]
                    .replace(/_/g, " ")
                    .charAt(0)
                    .toUpperCase() +
                  restaurant.types[0].replace(/_/g, " ").slice(1)
                : "Restaurant"}
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
                {featuredReview.displayName?.text || "Anonymous"}
              </Text>

              <Text style={styles.reviewText}>
                {featuredReview.text?.text || "No review text available."}
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

        {/* TikTok Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TikTok Reviews</Text>
            <TouchableOpacity
              onPress={() => {
                setTiktokRefreshing(true);
                fetchTikTokVideos(false).finally(() =>
                  setTiktokRefreshing(false)
                );
              }}
              disabled={tiktokLoading}
            >
              <Ionicons
                name={tiktokRefreshing ? "sync-circle" : "refresh"}
                size={20}
                color={tiktokLoading ? "#ccc" : "#555"}
                style={tiktokRefreshing ? styles.spinningIcon : {}}
              />
            </TouchableOpacity>
          </View>

          {tiktokLoading ? (
            <View style={styles.tiktokLoadingContainer}>
              {/* Replace LottieView with custom TikTok-styled loading animation */}
              <View style={styles.tiktokLogoContainer}>
                <Ionicons name="logo-tiktok" size={40} color="#EE1D52" />
                <View style={[styles.loadingDot, { animationDelay: "0s" }]} />
                <View style={[styles.loadingDot, { animationDelay: "0.2s" }]} />
                <View style={[styles.loadingDot, { animationDelay: "0.4s" }]} />
              </View>
              <Text style={styles.loadingText}>
                Finding TikTok videos{loadingDots}
              </Text>
              <Text style={styles.loadingSubtext}>
                This may take a few moments...
              </Text>
              <Progress.Bar
                progress={tiktokLoadingProgress}
                width={200}
                color="#EE1D52"
              />
            </View>
          ) : tiktokVideos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tiktokScroll}
              refreshControl={
                <RefreshControl
                  refreshing={tiktokRefreshing}
                  onRefresh={() => {
                    setTiktokRefreshing(true);
                    fetchTikTokVideos(false).finally(() =>
                      setTiktokRefreshing(false)
                    );
                  }}
                  colors={["#EE1D52"]}
                />
              }
            >
              {tiktokVideos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.tiktokVideoCard}
                  onPress={() => Linking.openURL(video.url)}
                >
                  <Image
                    source={{
                      uri: video.loadFailed
                        ? TIKTOK_LOGO_BASE64
                        : video.thumbnail,
                    }}
                    style={styles.tiktokThumbnail}
                    onError={(e) => {
                      console.log("Failed to load image:", video.thumbnail);
                      if (video.id) {
                        setTiktokVideos((prevVideos) =>
                          prevVideos.map((v) =>
                            v.id === video.id ? { ...v, loadFailed: true } : v
                          )
                        );
                      }
                    }}
                    resizeMode="cover"
                  />
                  <View style={styles.tiktokVideoOverlay}>
                    <Ionicons name="logo-tiktok" size={24} color="#fff" />
                  </View>
                  <View style={styles.tiktokVideoInfo}>
                    <Text style={styles.tiktokVideoDesc} numberOfLines={2}>
                      {video.description}
                    </Text>
                    <View style={styles.tiktokButtonContainer}>
                      <Text style={styles.tiktokButtonText}>
                        Watch on TikTok
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={styles.noResultsButton}
              onPress={() =>
                Linking.openURL(
                  `https://www.tiktok.com/search?q=${encodeURIComponent(
                    restaurant?.displayName?.text || ""
                  )}+restaurant`
                )
              }
            >
              <Ionicons name="logo-tiktok" size={24} color="#555" />
              <Text style={styles.noResultsText}>Find videos on TikTok</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu Preview Section (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu Preview</Text>
          <Text style={styles.placeholderText}>
            Menu preview coming soon...
          </Text>
        </View>

        {/* TikTok Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TikTok Links</Text>

          {tiktokLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : tiktokLinks.tiktok_links?.length > 0 ? (
            <>
              <FlatList
                horizontal
                data={tiktokLinks.tiktok_links}
                keyExtractor={(item, index) => `tiktok-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.tiktokCard}
                    onPress={() => Linking.openURL(item.url)}
                  >
                    <View style={styles.tiktokIconContainer}>
                      <MaterialIcons
                        name="play-circle-filled"
                        size={28}
                        color="#EE1D52"
                      />
                    </View>
                    <Text style={styles.tiktokTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.tiktokButton}>
                      <Text style={styles.tiktokButtonText}>
                        Watch on TikTok
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tiktokList}
              />
              {tiktokLinks.search_url && (
                <TouchableOpacity
                  style={styles.seeMoreButton}
                  onPress={() => Linking.openURL(tiktokLinks.search_url!)}
                >
                  <Text style={styles.seeMoreText}>See more on Google</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={styles.noResultsButton}
              onPress={() =>
                Linking.openURL(
                  `https://www.tiktok.com/search?q=${encodeURIComponent(
                    restaurant?.displayName?.text || ""
                  )}`
                )
              }
            >
              <MaterialIcons name="search" size={24} color="#777" />
              <Text style={styles.noResultsText}>Search on TikTok</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#c53030",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  addReviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  addReviewText: {
    fontWeight: "500",
  },
  restaurantCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 250,
    backgroundColor: "#f0f0f0",
  },
  restaurantImage: {
    width: "100%",
    height: "100%",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantDetails: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cuisineType: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  section: {
    padding: 16,
    borderTopWidth: 8,
    borderTopColor: "#f5f5f5",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
    marginBottom: 8,
  },
  reviewRating: {
    flexDirection: "row",
    marginBottom: 8,
  },
  photoScroll: {
    flexDirection: "row",
    marginTop: 8,
  },
  photoContainer: {
    marginRight: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  reviewPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  seeMoreButton: {
    marginTop: 8,
    alignSelf: "center",
    padding: 8,
  },
  seeMoreText: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  noReviewsText: {
    textAlign: "center",
    padding: 20,
    color: "#999",
    fontStyle: "italic",
  },
  placeholderText: {
    textAlign: "center",
    padding: 20,
    color: "#999",
    fontStyle: "italic",
  },
  tiktokList: {
    paddingVertical: 12,
  },
  tiktokCard: {
    width: 200,
    height: 150,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    padding: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tiktokIconContainer: {
    alignItems: "flex-start",
  },
  tiktokTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginVertical: 8,
  },
  tiktokButton: {
    backgroundColor: "#EE1D52",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  tiktokButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  noResultsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    paddingVertical: 16,
  },
  noResultsText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#555",
  },
  tiktokScroll: {
    paddingVertical: 8,
  },
  tiktokVideoCard: {
    width: 180,
    height: 240,
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tiktokThumbnail: {
    width: "100%",
    height: 150,
    backgroundColor: "#f0f0f0",
  },
  tiktokVideoOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(238, 29, 82, 0.9)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tiktokVideoInfo: {
    padding: 10,
  },
  tiktokVideoDesc: {
    fontSize: 12,
    marginBottom: 8,
    color: "#333",
  },
  tiktokButtonContainer: {
    backgroundColor: "#EE1D52",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: "center",
  },
  tiktokLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    height: 200,
  },
  tiktokLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EE1D52",
    marginLeft: 4,
    opacity: 0.6,
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  spinningIcon: {
    transform: [{ rotate: "45deg" }],
  },
});
