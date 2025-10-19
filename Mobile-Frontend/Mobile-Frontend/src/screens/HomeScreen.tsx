import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LocationContext } from "../contexts/LocationContext";
import ApiService from "../services/ApiService";
import RestaurantCard from "../components/RestaurantCard";
import { FilterPanel } from "../components/FilterPanel";
import { Colors, Typography, Spacing } from "../styles";
import styles from "../styles/screens/HomeScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FilterOptions } from "../types";

const cuisineOptions = ["All", "Italian", "Indian", "Chinese", "Japanese", "Mexican", "Thai"];
const dietaryOptions = ["All", "Vegetarian", "Vegan", "Gluten-Free", "Halal"];
const priceOptions = ["All", "$", "$$", "$$$", "$$$$"];

const HomeScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { location, loading: locationLoading, error: locationError, refreshLocation } = useContext(LocationContext);
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Advanced filter states
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  const [filterPanelVisible, setFilterPanelVisible] = useState(false);
  
  // Legacy filter states (for backward compatibility with old UI)
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [selectedDietary, setSelectedDietary] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  
  // Animation
  const [modalAnimation] = useState(new Animated.Value(0));

  // Check if location is custom (has an address that's not "Current Location")
  const isCustomLocation = location?.address && location.address !== 'Current Location';

  // Check if there are any active filters
  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  const fetchRestaurants = async (forceRefresh = false, filters?: FilterOptions) => {
    if (!location) return;

    try {
      setLoading(true);
      
      console.log(`🔍 Fetching restaurants with filters:`, filters);
      
      // ALWAYS bypass cache when filtering
      const bypassCache = forceRefresh || (filters && Object.keys(filters).length > 0);
      
      if (bypassCache && filters && Object.keys(filters).length > 0) {
        console.log(`🔄 Fetching filtered results`);
      } else if (bypassCache) {
        console.log('🔄 Force refreshing restaurants...');
      }
      
      let fetchedRestaurants;
      
      // Use new search endpoint if filters are provided
      if (filters && Object.keys(filters).length > 0) {
        fetchedRestaurants = await ApiService.searchRestaurantsWithFilters(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: location.radius,
          },
          filters
        );
      } else {
        // Use regular endpoint without filters
        fetchedRestaurants = await ApiService.getNearbyRestaurants(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: location.radius,
          },
          !bypassCache
        );
      }
      
      setRestaurants(fetchedRestaurants);
      setFilteredRestaurants(fetchedRestaurants);
      
      console.log(`✅ Loaded ${fetchedRestaurants.length} restaurants`);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      Alert.alert("Error", "Failed to load restaurants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle filter application from FilterPanel
  const handleApplyFilters = (filters: FilterOptions) => {
    console.log('🔍 Applying filters:', filters);
    setActiveFilters(filters);
    fetchRestaurants(true, filters);
  };

  // Handle opening the advanced filter panel
  const handleOpenFilterPanel = () => {
    setFilterPanelVisible(true);
  };

  // Handle clearing all filters
  const handleClearAllFilters = () => {
    console.log('🧹 Clearing all filters');
    setActiveFilters({});
    fetchRestaurants(true, {});
  };

  // Initial fetch when location changes
  useEffect(() => {
    if (location) {
      fetchRestaurants();
    }
  }, [location]);

  // Check for refresh parameter when component mounts or params change
  useEffect(() => {
    const checkAndRefresh = async () => {
      if (params.refresh) {
        console.log('🔄 Refresh parameter detected, checking flags...');
        
        const shouldRefresh = await AsyncStorage.getItem('shouldRefreshHome');
        
        if (shouldRefresh === 'true') {
          console.log('🔄 Auto-refreshing restaurants after map selection...');
          
          // Clear the flag
          await AsyncStorage.removeItem('shouldRefreshHome');
          
          // Fetch restaurants with cache bypass
          await fetchRestaurants(true);
        }
      }
    };

    checkAndRefresh();
  }, [params.refresh]);

  // Apply client-side search query filtering
  useEffect(() => {
    if (!restaurants || restaurants.length === 0) {
      setFilteredRestaurants([]);
      return;
    }
    
    let filtered = [...restaurants];

    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(restaurant => 
        restaurant.displayName?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRestaurants(filtered);
  }, [searchQuery, restaurants]);

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    // Clear active filters and fetch fresh data
    setActiveFilters({});
    await fetchRestaurants(true);
    setRefreshing(false);
  };

  // Get a summary of active filters for display
  const getActiveFiltersSummary = (): string => {
    const filterCount = Object.keys(activeFilters).length;
    if (filterCount === 0) return "Filters";
    if (filterCount === 1) return "1 Filter";
    return `${filterCount} Filters`;
  };

  if (locationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
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
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.logo}>Plyce</Text>
        
        <TouchableOpacity style={styles.profileButton}>
          <View style={[styles.profileCircle, { backgroundColor: Colors.gray }]}>
            <Ionicons name="person" size={20} color={Colors.white} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome Back</Text>
        <Text style={styles.userName}>Sarah!</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Location Info and Map Button */}
      <View style={styles.locationInfoContainer}>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={() => router.push('/map-selection' as any)}
        >
          <Ionicons name="location" size={16} color="#000" />
          <Text style={styles.locationButtonText}>
            {isCustomLocation && location?.address 
              ? location.address.split(',')[0] 
              : 'Current Location'}
          </Text>
          <Text style={styles.radiusText}>
            {`(${location?.radius ? (location.radius / 1000) : 2}km)`}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Local Spots Header */}
      <View style={styles.localSpotsHeader}>
        <Text style={styles.localSpotsTitle}>
          Local Spots ({location?.radius ? (location.radius / 1000) : 2}km)
        </Text>
      </View>

      {/* Filter Section */}
      <View style={styles.filtersSection}>
        <TouchableOpacity 
          style={[
            styles.filtersButton, 
            hasActiveFilters && styles.filtersButtonActive
          ]}
          onPress={handleOpenFilterPanel}
        >
          <Ionicons 
            name="filter" 
            size={18} 
            color={Colors.white} 
          />
          <Text style={styles.filtersButtonText}>
            {getActiveFiltersSummary()}
          </Text>
          {hasActiveFilters && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {Object.keys(activeFilters).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Display active filters */}
        {hasActiveFilters && (
          <View style={styles.filterPillsContainer}>
            {activeFilters.cuisine && (
              <View style={styles.filterPill}>
                <Text style={styles.filterPillText}>
                  {activeFilters.cuisine}
                </Text>
              </View>
            )}
            {activeFilters.dietary && (
              <View style={styles.filterPill}>
                <Text style={styles.filterPillText}>
                  {activeFilters.dietary}
                </Text>
              </View>
            )}
            {activeFilters.price_level && (
              <View style={styles.filterPill}>
                <Text style={styles.filterPillText}>
                  {"$".repeat(activeFilters.price_level)}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.clearAllPill}
              onPress={handleClearAllFilters}
            >
              <Text style={styles.clearAllPillText}>Clear All</Text>
              <Ionicons name="close-circle" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Restaurant List */}
      {loading && restaurants.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding restaurants...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
keyExtractor={(item, index) => item.place_id || item.id || `restaurant-${index}`}
          renderItem={({ item }) => <RestaurantCard restaurant={item} />}
          contentContainerStyle={styles.restaurantList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No restaurants found</Text>
            </View>
          }
        />
      )}

      {/* Advanced Filter Panel */}
      <FilterPanel
        visible={filterPanelVisible}
        onClose={() => setFilterPanelVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;