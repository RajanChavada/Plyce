import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Modal,
  Dimensions,
  SafeAreaView,
  PanResponder,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ApiService, { MenuItem, MenuHighlightsResponse, MenuPhoto, MenuPhotosResponse } from '../../services/ApiService';
import { styles } from './styles';

interface MenuPreviewProps {
  placeId: string;
  restaurantName: string;
}

export const MenuPreview: React.FC<MenuPreviewProps> = ({ placeId, restaurantName }) => {
  const [menuData, setMenuData] = useState<MenuHighlightsResponse | null>(null);
  const [menuPhotos, setMenuPhotos] = useState<MenuPhotosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // PanResponder for swipe-to-dismiss
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        // Close modal if swiped down more than 100 pixels
        if (gestureState.dy > 100) {
          closePhotoModal();
        }
      },
    })
  ).current;

  useEffect(() => {
    fetchMenuData();
  }, [placeId]);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to get structured menu highlights from SerpApi
      const highlights = await ApiService.getMenuHighlights(placeId);
      setMenuData(highlights);
      
      // If no structured menu data, fallback to photo-based menu
      if (highlights.status === 'no_data' || highlights.status === 'api_key_missing' || highlights.menu_highlights.length === 0) {
        console.log('🔄 No structured menu data, fetching menu photos...');
        const photos = await ApiService.getRestaurantMenuPhotos(placeId);
        setMenuPhotos(photos);
      }
      
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceRange: number[]) => {
    if (!priceRange || priceRange.length === 0) return null;
    
    if (priceRange.length === 1) {
      return `$${priceRange[0]}`;
    }
    
    if (priceRange[0] === priceRange[1]) {
      return `$${priceRange[0]}`;
    }
    
    return `$${priceRange[0]} - $${priceRange[1]}`;
  };

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.link) {
      Linking.openURL(item.link);
    }
  };

  const handlePhotoPress = (index: number) => {
    setSelectedPhotoIndex(index);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedPhotoIndex(null);
  };

  const handleViewFullMenu = () => {
    // Open Google Maps to the menu tab
    const googleMapsUrl = menuPhotos?.google_maps_url || 
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantName)}&query_place_id=${placeId}`;
    Linking.openURL(googleMapsUrl);
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const priceText = formatPrice(item.price_range);
    const thumbnail = item.thumbnails && item.thumbnails.length > 0 ? item.thumbnails[0] : null;

    return (
      <TouchableOpacity
        style={styles.menuItemCard}
        onPress={() => handleMenuItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemImageContainer}>
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={styles.menuItemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.menuItemImage, styles.placeholderImage]}>
              <Ionicons name="restaurant" size={40} color="#ccc" />
            </View>
          )}
          {priceText && (
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{priceText}</Text>
            </View>
          )}
        </View>

        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          {(item.reviews > 0 || item.photos > 0) && (
            <View style={styles.menuItemStats}>
              {item.reviews > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.statText}>{item.reviews}</Text>
                </View>
              )}
              {item.photos > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="image" size={12} color="#666" />
                  <Text style={styles.statText}>{item.photos}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMenuPhoto = ({ item, index }: { item: MenuPhoto; index: number }) => {
    return (
      <TouchableOpacity
        style={styles.menuPhotoCard}
        onPress={() => handlePhotoPress(index)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.url }}
          style={styles.menuPhotoImage}
          resizeMode="cover"
        />
        <View style={styles.zoomIconContainer}>
          <Ionicons name="expand" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#666" />
      <Text style={styles.loadingText}>Loading menu...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error-outline" size={24} color="#666" />
      <Text style={styles.errorText}>Unable to load menu</Text>
    </View>
  );

  const renderNoData = () => (
    <TouchableOpacity
      style={styles.noDataContainer}
      onPress={handleViewFullMenu}
      activeOpacity={0.7}
    >
      <MaterialIcons name="restaurant-menu" size={24} color="#666" />
      <Text style={styles.noDataText}>No menu preview available</Text>
      <Text style={styles.viewOnMapsText}>View on Google Maps</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return renderLoading();
  }

  if (error) {
    return renderError();
  }

  // Check if we have structured menu highlights
  const hasMenuHighlights = menuData && 
    menuData.status === 'success' && 
    menuData.menu_highlights.length > 0;

  // Check if we have menu photos as fallback
  const hasMenuPhotos = menuPhotos && 
    menuPhotos.status === 'success' && 
    menuPhotos.menu_photos.length > 0;

  // If neither structured data nor photos, show no data message
  if (!hasMenuHighlights && !hasMenuPhotos) {
    return renderNoData();
  }

  return (
    <View style={styles.container}>
      {/* Show structured menu highlights if available */}
      {hasMenuHighlights && (
        <>
          <FlatList
            data={menuData!.menu_highlights}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `menu-highlight-${index}`}
            contentContainerStyle={styles.listContainer}
            renderItem={renderMenuItem}
          />
          <TouchableOpacity
            style={styles.viewFullMenuButton}
            onPress={handleViewFullMenu}
            activeOpacity={0.7}
          >
            <Text style={styles.viewFullMenuText}>View Full Menu</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        </>
      )}
      
      {/* Show menu photos if structured data not available */}
      {!hasMenuHighlights && hasMenuPhotos && (
        <>
          <View style={styles.menuPhotosHeader}>
            <Text style={styles.menuPhotosTitle}>Restaurant Photos</Text>
            <Text style={styles.photosHintText}>Menu photos are often included - tap any photo to view full size</Text>
          </View>
          <FlatList
            data={menuPhotos!.menu_photos}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `menu-photo-${index}`}
            contentContainerStyle={styles.listContainer}
            renderItem={renderMenuPhoto}
          />
          <TouchableOpacity
            style={styles.viewFullMenuButton}
            onPress={handleViewFullMenu}
            activeOpacity={0.7}
          >
            <Text style={styles.viewFullMenuText}>View on Google Maps</Text>
            <Ionicons name="open-outline" size={16} color="#007AFF" />
          </TouchableOpacity>
        </>
      )}
      
      {/* Photo Modal for full-screen viewing */}
      {selectedPhotoIndex !== null && menuPhotos && (
        <Modal
          visible={showPhotoModal}
          transparent={true}
          animationType="slide"
          onRequestClose={closePhotoModal}
        >
          <SafeAreaView style={styles.photoModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>
                  Menu Photo {selectedPhotoIndex + 1} of {menuPhotos.menu_photos.length}
                </Text>
                <Text style={styles.modalSubtitle}>Swipe down to close</Text>
              </View>
              <TouchableOpacity onPress={closePhotoModal} style={styles.closeButton}>
                <Ionicons name="close-circle" size={36} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent} {...panResponder.panHandlers}>
              <Image
                source={{ uri: menuPhotos.menu_photos[selectedPhotoIndex].url }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
};
