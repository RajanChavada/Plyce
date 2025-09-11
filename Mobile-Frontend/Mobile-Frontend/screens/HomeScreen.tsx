import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Button, 
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { useLocation } from '../contexts/LocationContext';
import ApiService, { Restaurant } from '../services/ApiService';
import RestaurantCard from '../components/RestaurantCard';

const HomeScreen = () => {
  const { location, loading: locationLoading, error: locationError, refreshLocation } = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (location) {
      fetchRestaurants();
    }
  }, [location]);

  const fetchRestaurants = async () => {
    if (!location) return;

    try {
      setLoading(true);
      setError(null);
      const data = await ApiService.getNearbyRestaurants(location);
      setRestaurants(data);
    } catch (err) {
      setError('Failed to load restaurants. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    setRefreshing(false);
  };

  if (locationLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </SafeAreaView>
    );
  }

  if (locationError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{locationError}</Text>
        <Button 
          title="Enable Location" 
          onPress={refreshLocation} 
          color="#f4511e"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plyce</Text>
        <Text style={styles.subtitle}>Restaurants near you</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#f4511e" />
          <Text style={styles.loadingText}>Finding restaurants...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            title="Try Again" 
            onPress={fetchRestaurants} 
            color="#f4511e"
          />
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item, index) => `restaurant-${index}`}
          renderItem={({ item }) => <RestaurantCard restaurant={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#f4511e"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No restaurants found nearby.
              </Text>
              <Button 
                title="Refresh" 
                onPress={fetchRestaurants} 
                color="#f4511e"
              />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    backgroundColor: '#f4511e',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  errorText: {
    color: '#c53030',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
});

export default HomeScreen;