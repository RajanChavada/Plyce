import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
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

  // Check if location is custom (has an address that's not "Current Location")
  const isCustomLocation = location?.address && location.address !== 'Current Location';

  const fetchRestaurants = async (forceRefresh = false) => {
    if (!location) return;

    try {
      setLoading(true);
      
      // Check if we should bypass cache
      let bypassCache = forceRefresh;
      if (!bypassCache) {
        bypassCache = await AsyncStorage.getItem('bypassRestaurantCache') === 'true';
      }
      
      // If bypassing, clear the flag for future requests
      if (bypassCache) {
        await AsyncStorage.removeItem('bypassRestaurantCache');
        console.log('🔄 Bypassing cache and fetching fresh restaurants...');
      }
      
      // Call API with bypass flag
      const restaurants = await ApiService.getNearbyRestaurants(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          radius: location.radius,
        }, 
        !bypassCache // invert the flag - if bypassCache is true, useCache should be false
      );
      
      setRestaurants(restaurants);
      setFilteredRestaurants(restaurants);
      console.log(`✅ Loaded ${restaurants.length} restaurants`);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check for refresh flag when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const checkRefreshFlag = async () => {
        try {
          const shouldRefresh = await AsyncStorage.getItem('shouldRefreshHome');
          
          if (shouldRefresh === 'true') {
            console.log('🔄 Home screen focused - auto-refreshing restaurants...');
            
            // Clear the flag
            await AsyncStorage.removeItem('shouldRefreshHome');
            
            // Fetch restaurants with cache bypass
            await fetchRestaurants(true);
          }
        } catch (error) {
          console.error('Error checking refresh flag:', error);
        }
      };

      checkRefreshFlag();
    }, [location])
  );

  useEffect(() => {
    if (location) {
      fetchRestaurants();
    }
  }, [location]);

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
    let filtered = [...restaurants];

    if (searchQuery) {
      filtered = filtered.filter(restaurant => 
        restaurant.displayName?.text?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCuisine !== "All") {
      filtered = filtered.filter(restaurant => 
        restaurant.types?.some(type => 
          type.toLowerCase().includes(selectedCuisine.toLowerCase())
        )
      );
    }

    if (selectedDietary !== "All") {
      filtered = filtered.filter(restaurant => 
        restaurant.types?.some(type => 
          type.toLowerCase().includes(selectedDietary.toLowerCase())
        )
      );
    }

    if (selectedPrice !== "All") {
      const priceLevel = selectedPrice.length;
      filtered = filtered.filter(restaurant => 
        restaurant.priceLevel === priceLevel
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
      setValue = setSelectedCuisine;
    } else if (modalType === "dietary") {
      options = dietaryOptions;
      currentValue = selectedDietary;
      setValue = setSelectedDietary;
    } else if (modalType === "price") {
      options = priceOptions;
      currentValue = selectedPrice;
      setValue = setSelectedPrice;
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
          keyExtractor={(item) => item.place_id}
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