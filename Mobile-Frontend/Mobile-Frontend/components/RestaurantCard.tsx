import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Restaurant } from '../services/ApiService';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress?: () => void;
}

const RestaurantCard = ({ restaurant, onPress }: RestaurantCardProps) => {
  const formatPriceLevel = (priceLevel: string | undefined) => {
    if (!priceLevel) return '';
    
    switch (priceLevel) {
      case 'PRICE_LEVEL_INEXPENSIVE': return '$';
      case 'PRICE_LEVEL_MODERATE': return '$$';
      case 'PRICE_LEVEL_EXPENSIVE': return '$$$';
      case 'PRICE_LEVEL_VERY_EXPENSIVE': return '$$$$';
      default: return '';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Text style={styles.name}>
        {restaurant.displayName?.text || 'Unknown Restaurant'}
      </Text>
      <Text style={styles.address}>
        {restaurant.formattedAddress || 'No address available'}
      </Text>
      
      <View style={styles.detailsRow}>
        {restaurant.rating && (
          <Text style={styles.rating}>⭐ {restaurant.rating.toFixed(1)}</Text>
        )}
        
        {restaurant.priceLevel && (
          <Text style={styles.price}>
            {formatPriceLevel(restaurant.priceLevel)}
          </Text>
        )}
      </View>
      
      {restaurant.types && restaurant.types.length > 0 && (
        <Text style={styles.types}>
          {restaurant.types
            .filter(type => !type.includes('_') && !['point_of_interest', 'establishment', 'food', 'store'].includes(type))
            .join(' • ')}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: '#FF8C00',
    fontWeight: '500',
  },
  price: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: '500',
  },
  types: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  }
});

export default RestaurantCard;