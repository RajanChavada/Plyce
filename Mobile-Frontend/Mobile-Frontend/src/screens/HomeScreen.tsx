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
import { Colors, Typography, Spacing } from "../styles";
import styles from "../styles/screens/HomeScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  // Filter states
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [selectedDietary, setSelectedDietary] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  
  // Animation
  const [modalAnimation] = useState(new Animated.Value(0));

  // Track if filters have changed to trigger API call
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Check if location is custom (has an address that's not "Current Location")
  const isCustomLocation = location?.address && location.address !== 'Current Location';

  const fetchRestaurants = async (forceRefresh = false, filters?: {
    cuisine?: string;
    dietary?: string;
    price?: string;
  }) => {
    if (!location) return;

    try {
      setLoading(true);
      
      // Build keyword from filters
      let keyword = "";
      if (filters?.cuisine && filters.cuisine !== "All") {
        keyword += filters.cuisine + " ";
      }
      if (filters?.dietary && filters.dietary !== "All") {
        keyword += filters.dietary + " ";
      }
      keyword = keyword.trim();
      
      console.log(`🔍 Fetching restaurants with filters:`, { keyword, price: filters?.price });
      
      // ALWAYS bypass cache when filtering
      const bypassCache = forceRefresh || !!keyword;
      
      if (bypassCache && keyword) {
        console.log(`🔄 Fetching filtered results for: ${keyword}`);
      } else if (bypassCache) {
        console.log('🔄 Force refreshing restaurants...');
      }
      
      // Call API
      const restaurants = await ApiService.getNearbyRestaurants(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          radius: location.radius,
        }, 
        !bypassCache, // useCache = opposite of bypass
        keyword || undefined
      );
      
      setRestaurants(restaurants);
      
      // Apply price filter client-side since it's a number comparison
      let filtered = restaurants;
      if (filters?.price && filters.price !== "All") {
        const priceLevel = filters.price.length;
        filtered = filtered.filter(restaurant => 
          Number(restaurant.priceLevel) === priceLevel
        );
        console.log(`💰 Filtered by price level ${priceLevel}: ${filtered.length} results`);
      }
      
      setFilteredRestaurants(filtered);
      console.log(`✅ Loaded ${restaurants.length} restaurants, filtered to ${filtered.length}`);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      Alert.alert("Error", "Failed to load restaurants. Please try again.");
    } finally {
      setLoading(false);
    }
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

  // Watch for filter changes and refetch
  useEffect(() => {
    if (filtersApplied) {
      console.log('🔍 Filters changed, refetching restaurants...');
      fetchRestaurants(true, {
        cuisine: selectedCuisine,
        dietary: selectedDietary,
        price: selectedPrice
      });
      setFiltersApplied(false);
    }
  }, [filtersApplied]);

  useEffect(() => {
    applyFilters();
  }, [selectedCuisine, selectedDietary, selectedPrice, searchQuery, restaurants]);

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

  const applyFilters = () => {
    // This is now just for client-side price filtering
    // Cuisine and dietary are handled by backend keyword search
    if (!restaurants || restaurants.length === 0) return;
    
    let filtered = [...restaurants];

    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(restaurant => 
        restaurant.displayName?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price filter (client-side)
    if (selectedPrice !== "All") {
      const priceLevel = selectedPrice.length;
      filtered = filtered.filter(restaurant => 
        Number(restaurant.priceLevel) === priceLevel
      );
    }

    setFilteredRestaurants(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    await fetchRestaurants(true); // Force refresh
    setRefreshing(false);
  };

  const openFilterModal = (type: string) => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const renderFilterOptions = () => {
    let options: string[] = [];
    let currentValue = "";
    let setValue: ((value: string) => void) | null = null;

    if (modalType === "cuisine") {
      options = cuisineOptions;
      currentValue = selectedCuisine;
      setValue = (value) => {
        setSelectedCuisine(value);
        setFiltersApplied(true); // Trigger API refetch
      };
    } else if (modalType === "dietary") {
      options = dietaryOptions;
      currentValue = selectedDietary;
      setValue = (value) => {
        setSelectedDietary(value);
        setFiltersApplied(true); // Trigger API refetch
      };
    } else if (modalType === "price") {
      options = priceOptions;
      currentValue = selectedPrice;
      setValue = (value) => {
        setSelectedPrice(value);
        // Price filter is client-side, just reapply
        setTimeout(() => applyFilters(), 100);
      };
    }

    return (
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {modalType === "cuisine" && "Select Cuisine"}
            {modalType === "dietary" && "Dietary Options"}
            {modalType === "price" && "Price Range"}
          </Text>
          <TouchableOpacity onPress={closeModal}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.modalOption,
              currentValue === option && styles.modalOptionSelected,
            ]}
            onPress={() => {
              if (setValue) setValue(option);
              closeModal();
            }}
          >
            <Text
              style={[
                styles.modalOptionText,
                currentValue === option && styles.modalOptionTextSelected,
              ]}
            >
              {option}
            </Text>
            {currentValue === option && (
              <Ionicons name="checkmark" size={20} color={Colors.black} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
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

      {/* Filter Pills */}
      <View style={styles.filtersSection}>
        <TouchableOpacity style={styles.filtersButton}>
          <Ionicons name="filter" size={16} color={Colors.text} />
          <Text style={styles.filtersButtonText}>Filters</Text>
        </TouchableOpacity>

        <View style={styles.filterPillsContainer}>
          <TouchableOpacity 
            style={[styles.filterPill, selectedCuisine !== "All" && { backgroundColor: Colors.black, borderColor: Colors.black }]} 
            onPress={() => openFilterModal("cuisine")}
          >
            <Text 
              style={[styles.filterPillText, selectedCuisine !== "All" && { color: Colors.white }]}
            >
              {selectedCuisine === "All" ? "Cuisine" : selectedCuisine}
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={16} 
              color={selectedCuisine !== "All" ? Colors.white : Colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterPill, selectedDietary !== "All" && { backgroundColor: Colors.black, borderColor: Colors.black }]} 
            onPress={() => openFilterModal("dietary")}
          >
            <Text 
              style={[styles.filterPillText, selectedDietary !== "All" && { color: Colors.white }]}
            >
              {selectedDietary === "All" ? "Dietary" : selectedDietary}
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={16} 
              color={selectedDietary !== "All" ? Colors.white : Colors.textSecondary} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterPill, selectedPrice !== "All" && { backgroundColor: Colors.black, borderColor: Colors.black }]} 
            onPress={() => openFilterModal("price")}
          >
            <Text 
              style={[styles.filterPillText, selectedPrice !== "All" && { color: Colors.white }]}
            >
              {selectedPrice === "All" ? "$$$" : selectedPrice}
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={16} 
              color={selectedPrice !== "All" ? Colors.white : Colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
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

      {/* Filter Modal */}
      {modalVisible && (
        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="none"
          onRequestClose={closeModal}
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalOverlay}>
              <Animated.View
                style={[
                  styles.modalAnimatedContainer,
                  {
                    transform: [
                      {
                        translateY: modalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [300, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableWithoutFeedback>
                  {renderFilterOptions()}
                </TouchableWithoutFeedback>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;