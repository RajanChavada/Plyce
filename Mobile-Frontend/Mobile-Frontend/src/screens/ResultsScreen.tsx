import React, { useContext, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LocationContext } from '../contexts/LocationContext';
import RestaurantCard from '../components/RestaurantCard';
import { FilterPanel } from '../components/FilterPanel';
import ApiService, { Restaurant } from '../services/ApiService';
import { FilterOptions } from '../types';
import { Colors } from '../styles';
import styles from '../styles/screens/HomeScreen'; // Reuse HomeScreen styles for now

/**
 * ResultsScreen - Full restaurant results list with advanced filtering
 * This is the main results view showing all restaurants like Gusto 101, La Carnita, etc.
 */
const ResultsScreen = () => {
  const router = useRouter();
  const { location } = useContext(LocationContext);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});

  // Fetch restaurants when location or filters change
  useEffect(() => {
    fetchRestaurants();
  }, [location, activeFilters]);

  // Filter restaurants by search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = restaurants.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.formattedAddress.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    } else {
      setFilteredRestaurants(restaurants);
    }
  }, [searchQuery, restaurants]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const data = await ApiService.searchRestaurantsWithFilters(
        {
          latitude: location?.latitude || 43.6532,
          longitude: location?.longitude || -79.3832,
          radius: location?.radius || 5000, // 5km default for Results view
        },
        activeFilters
      );
      setRestaurants(data);
      setFilteredRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Results</Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
          {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'}
        </Text>
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
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      <View style={styles.filtersSection}>
        <TouchableOpacity
          style={styles.filtersButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={18} color={Colors.white} />
          <Text style={styles.filtersButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Restaurant List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item, index) => item.place_id || `restaurant-${index}`}
          renderItem={({ item }) => <RestaurantCard restaurant={item} />}
          contentContainerStyle={styles.restaurantList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color="#DDD" />
              <Text style={styles.emptyText}>
                No restaurants found
              </Text>
              <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 8 }}>
                Try adjusting your filters or search
              </Text>
            </View>
          }
        />
      )}

      {/* Filter Panel */}
      <FilterPanel
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(filters) => {
          setActiveFilters(filters);
          setShowFilters(false);
        }}
        initialFilters={activeFilters}
      />
    </SafeAreaView>
  );
};

export default ResultsScreen;
