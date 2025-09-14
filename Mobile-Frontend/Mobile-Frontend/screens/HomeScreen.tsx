import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLocation } from "../contexts/LocationContext";
import ApiService, { Restaurant } from "../services/ApiService";
import RestaurantCard from "../components/RestaurantCard";

const CUISINE_FILTERS = [
  "All",
  "Italian",
  "Japanese",
  "Chinese",
  "Indian",
  "Mexican",
  "Thai",
  "Pizza",
];

const DIETARY_FILTERS = ["Vegetarian", "Vegan", "Halal", "Gluten-Free"];

const PRICE_FILTERS = ["$", "$$", "$$$", "$$$$"];

const HomeScreen = () => {
  const router = useRouter();
  const {
    location,
    loading: locationLoading,
    error: locationError,
    refreshLocation,
  } = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [usingCache, setUsingCache] = useState<boolean>(false);

  // Filter states
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [selectedDietary, setSelectedDietary] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize the cache when the app loads
  useEffect(() => {
    const initializeApp = async () => {
      await ApiService.initCache();
      checkCacheAndLoadData();
    };

    initializeApp();
  }, []);

  // Check cache and load data when location changes
  useEffect(() => {
    if (location) {
      checkCacheAndLoadData();
    }
  }, [location]);

  // Apply filters when restaurants or filter criteria change
  useEffect(() => {
    applyFilters();
  }, [restaurants, selectedCuisine, selectedDietary, selectedPrice]);

  // Add this somewhere in your HomeScreen's useEffect initialization
  useEffect(() => {
    const refreshData = async () => {
      // Clear the cache and fetch fresh data
      await ApiService.clearCache();
      if (location) {
        fetchRestaurants(true); // true = force refresh
      }
    };

    refreshData();
  }, []); // Run once on component mount

  const checkCacheAndLoadData = async () => {
    if (!location) return;

    const hasCachedData = await ApiService.hasCachedData();
    setUsingCache(hasCachedData);

    // If we have cached data, use it, otherwise force a refresh
    fetchRestaurants(!hasCachedData);
  };

  const fetchRestaurants = async (forceRefresh = false) => {
    if (!location) return;

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching restaurants. Force refresh?", forceRefresh);
      const data = await ApiService.getNearbyRestaurants(
        location,
        5000,
        !forceRefresh
      );

      setRestaurants(data);

      // Update cache status after fetching
      const isUsingCache = !forceRefresh && (await ApiService.hasCachedData());
      setUsingCache(isUsingCache);
      console.log("Using cache?", isUsingCache);
    } catch (err) {
      setError("Failed to load restaurants. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...restaurants];

    // Apply cuisine filter
    if (selectedCuisine !== "All") {
      filtered = filtered.filter((restaurant) => {
        if (!restaurant.types) return false;

        // Convert cuisine name to API format (e.g., "Italian" -> "italian_restaurant")
        const cuisineType = selectedCuisine.toLowerCase() + "_restaurant";
        const cuisineTypeSimple = selectedCuisine.toLowerCase();

        return restaurant.types.some(
          (type) =>
            type.includes(cuisineType) ||
            type.includes(cuisineTypeSimple) ||
            restaurant.displayName?.text
              .toLowerCase()
              .includes(selectedCuisine.toLowerCase())
        );
      });
    }

    // Apply dietary filter
    if (selectedDietary) {
      filtered = filtered.filter((restaurant) => {
        // Check types for dietary preferences
        if (
          restaurant.types &&
          restaurant.types.some((type) =>
            type.toLowerCase().includes(selectedDietary.toLowerCase())
          )
        ) {
          return true;
        }

        // Check name and address for dietary keywords
        const dietaryLower = selectedDietary.toLowerCase();
        return (
          restaurant.displayName?.text.toLowerCase().includes(dietaryLower) ||
          (restaurant.formattedAddress &&
            restaurant.formattedAddress.toLowerCase().includes(dietaryLower))
        );
      });
    }

    // Apply price filter
    if (selectedPrice) {
      const priceLevel = {
        $: "PRICE_LEVEL_INEXPENSIVE",
        $$: "PRICE_LEVEL_MODERATE",
        $$$: "PRICE_LEVEL_EXPENSIVE",
        $$$$: "PRICE_LEVEL_VERY_EXPENSIVE",
      }[selectedPrice];

      filtered = filtered.filter(
        (restaurant) => restaurant.priceLevel === priceLevel
      );
    }

    setFilteredRestaurants(filtered);
  };

  const clearCacheAndRefresh = async () => {
    try {
      console.log("Clearing cache and refreshing");
      await ApiService.clearCache();
      setUsingCache(false);
      fetchRestaurants(true); // Force refresh after clearing cache
    } catch (err) {
      setError("Failed to clear cache");
      console.error(err);
    }
  };

  const useCachedData = async () => {
    try {
      console.log("Attempting to use cached data");
      const hasCachedData = await ApiService.hasCachedData();

      if (hasCachedData) {
        console.log("Cache available, using it");
        fetchRestaurants(false); // Use cache
      } else {
        console.log("No cache available, fetching fresh data");
        setError("No cached data available. Fetching fresh data.");
        fetchRestaurants(true);
      }
    } catch (err) {
      setError("Failed to check cache");
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    setRefreshing(false);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (locationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (locationError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{locationError}</Text>
          <TouchableOpacity style={styles.button} onPress={refreshLocation}>
            <Text style={styles.buttonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.nameText}>Sarah!</Text>
        </View>
        <TouchableOpacity>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>S</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#999" />
        <Text style={styles.searchText}>Start Typing to Set Location</Text>
        <Ionicons name="close" size={20} color="#999" />
      </TouchableOpacity>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>Local Spots (5km)</Text>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterToggle} onPress={toggleFilters}>
          <Ionicons name="funnel-outline" size={18} color="#000" />
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCuisine !== "All" && styles.filterChipActive,
            ]}
            onPress={() =>
              setSelectedCuisine(selectedCuisine === "All" ? "All" : "All")
            }
          >
            <Text style={styles.filterChipText}>Cuisine</Text>
            <Ionicons name="chevron-down" size={16} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedDietary !== null && styles.filterChipActive,
            ]}
            onPress={() =>
              setSelectedDietary(selectedDietary ? null : "Vegetarian")
            }
          >
            <Text style={styles.filterChipText}>Dietary</Text>
            <Ionicons name="chevron-down" size={16} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedPrice !== null && styles.filterChipActive,
            ]}
            onPress={() => setSelectedPrice(selectedPrice ? null : "$")}
          >
            <Text style={styles.filterChipText}>$$$</Text>
            <Ionicons name="chevron-down" size={16} color="#000" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Expanded Filters (when showFilters is true) */}
      {showFilters && (
        <View style={styles.expandedFilters}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Cuisine</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                {CUISINE_FILTERS.map((cuisine) => (
                  <TouchableOpacity
                    key={cuisine}
                    style={[
                      styles.filterOption,
                      selectedCuisine === cuisine &&
                        styles.filterOptionSelected,
                    ]}
                    onPress={() => setSelectedCuisine(cuisine)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedCuisine === cuisine &&
                          styles.filterOptionTextSelected,
                      ]}
                    >
                      {cuisine}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Dietary</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                {DIETARY_FILTERS.map((dietary) => (
                  <TouchableOpacity
                    key={dietary}
                    style={[
                      styles.filterOption,
                      selectedDietary === dietary &&
                        styles.filterOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedDietary(
                        selectedDietary === dietary ? null : dietary
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedDietary === dietary &&
                          styles.filterOptionTextSelected,
                      ]}
                    >
                      {dietary}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Price</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                {PRICE_FILTERS.map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={[
                      styles.filterOption,
                      selectedPrice === price && styles.filterOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedPrice(selectedPrice === price ? null : price)
                    }
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedPrice === price &&
                          styles.filterOptionTextSelected,
                      ]}
                    >
                      {price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Restaurant List */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Finding restaurants...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => fetchRestaurants()}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item, index) => `restaurant-${index}`}
          renderItem={({ item }) => {
            // Make sure place_id is properly set
            if (!item.place_id && item.id) {
              item.place_id = item.id;
            }

            // If still no place_id, log and skip
            if (!item.place_id) {
              console.warn("Restaurant missing place_id:", item.displayName?.text);
              return null;
            }

            return (
              <TouchableOpacity
                onPress={() => {
                  console.log('Navigating to restaurant details:', item.place_id);
                  router.push(`/restaurant/${item.place_id}`);
                }}
              >
                <RestaurantCard
                  restaurant={item}
                  userLocation={location || undefined}
                />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#000"]}
              tintColor="#000"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No restaurants found nearby.</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => fetchRestaurants(true)}
              >
                <Text style={styles.buttonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Navigation bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Ionicons name="list" size={24} color="#000" />
          <Text style={styles.navItemText}>Local Results</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search" size={24} color="#999" />
          <Text style={[styles.navItemText, { color: "#999" }]}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="compass-outline" size={24} color="#999" />
          <Text style={[styles.navItemText, { color: "#999" }]}>Discovery</Text>
        </TouchableOpacity>
      </View>

      {/* Cache indicator (for development) */}
      {usingCache && __DEV__ && (
        <View style={styles.cacheIndicator}>
          <Text style={styles.cacheText}>Using Cached Data</Text>
        </View>
      )}

      {/* Add this refresh button */}
      {__DEV__ && (
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={clearCacheAndRefresh}
        >
          <Text style={styles.debugButtonText}>Force Refresh</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTextContainer: {
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "500",
  },
  nameText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: "bold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  searchText: {
    flex: 1,
    marginLeft: 8,
    color: "#999",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginRight: 12,
  },
  filterText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  filterScroll: {
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#000",
  },
  filterChipText: {
    fontSize: 13,
    marginRight: 4,
  },
  expandedFilters: {
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ebebeb",
  },
  filterSection: {
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: "row",
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  filterOptionSelected: {
    backgroundColor: "#000",
  },
  filterOptionText: {
    fontSize: 13,
    color: "#000",
  },
  filterOptionTextSelected: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra space for bottom nav
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
  },
  errorText: {
    color: "#c53030",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
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
  navBar: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ebebeb",
    paddingTop: 8,
    paddingBottom: 24, // Extra padding for bottom safe area
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: "#000",
  },
  navItemText: {
    fontSize: 12,
    marginTop: 2,
  },
  cacheIndicator: {
    position: "absolute",
    top: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cacheText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  debugButton: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  debugButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default HomeScreen;
