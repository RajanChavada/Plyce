import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";
import { FilterOptions } from "../../types";

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

const cuisineOptions = [
  "Italian",
  "Indian",
  "Chinese",
  "Japanese",
  "Mexican",
  "Thai",
  "French",
  "Mediterranean",
  "American",
  "Korean",
  "Vietnamese",
  "Greek",
];

const dietaryOptions = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Halal",
  "Kosher",
  "Dairy-Free",
];

const priceOptions = [
  { label: "$", value: 1 },
  { label: "$$", value: 2 },
  { label: "$$$", value: 3 },
  { label: "$$$$", value: 4 },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}) => {
  const [selectedCuisine, setSelectedCuisine] = useState<string | undefined>(
    initialFilters.cuisine
  );
  const [selectedDietary, setSelectedDietary] = useState<string | undefined>(
    initialFilters.dietary
  );
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>(
    initialFilters.price_level
  );
  const [selectedVenueType, setSelectedVenueType] = useState<string | undefined>(
    initialFilters.venue_type
  );
  const [outdoorSeating, setOutdoorSeating] = useState<boolean>(
    initialFilters.outdoor_seating || false
  );
  const [petFriendly, setPetFriendly] = useState<boolean>(
    initialFilters.pet_friendly || false
  );
  const [wheelchairAccessible, setWheelchairAccessible] = useState<boolean>(
    initialFilters.wheelchair_accessible || false
  );
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean>(
    initialFilters.delivery_available || false
  );

  const handleApply = () => {
    const filters: FilterOptions = {};
    
    if (selectedCuisine) filters.cuisine = selectedCuisine;
    if (selectedDietary) filters.dietary = selectedDietary;
    if (selectedPrice) filters.price_level = selectedPrice;
    if (selectedVenueType) filters.venue_type = selectedVenueType as 'coffee' | 'matcha' | 'cafe';
    if (outdoorSeating) filters.outdoor_seating = true;
    if (petFriendly) filters.pet_friendly = true;
    if (wheelchairAccessible) filters.wheelchair_accessible = true;
    if (deliveryAvailable) filters.delivery_available = true;

    onApply(filters);
    onClose();
  };

  const handleClearAll = () => {
    setSelectedCuisine(undefined);
    setSelectedDietary(undefined);
    setSelectedPrice(undefined);
    setSelectedVenueType(undefined);
    setOutdoorSeating(false);
    setPetFriendly(false);
    setWheelchairAccessible(false);
    setDeliveryAvailable(false);
  };

  const hasActiveFilters = 
    selectedCuisine || 
    selectedDietary || 
    selectedPrice || 
    selectedVenueType ||
    outdoorSeating || 
    petFriendly || 
    wheelchairAccessible || 
    deliveryAvailable;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter Restaurants</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Cuisine Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cuisine</Text>
              <View style={styles.chipContainer}>
                {cuisineOptions.map((cuisine) => (
                  <TouchableOpacity
                    key={cuisine}
                    style={[
                      styles.chip,
                      selectedCuisine === cuisine && styles.chipSelected,
                    ]}
                    onPress={() =>
                      setSelectedCuisine(
                        selectedCuisine === cuisine ? undefined : cuisine
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedCuisine === cuisine && styles.chipTextSelected,
                      ]}
                    >
                      {cuisine}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Dietary Preferences Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dietary Preferences</Text>
              <View style={styles.chipContainer}>
                {dietaryOptions.map((dietary) => (
                  <TouchableOpacity
                    key={dietary}
                    style={[
                      styles.chip,
                      selectedDietary === dietary && styles.chipSelected,
                    ]}
                    onPress={() =>
                      setSelectedDietary(
                        selectedDietary === dietary ? undefined : dietary
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedDietary === dietary && styles.chipTextSelected,
                      ]}
                    >
                      {dietary}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Venue Type Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Venue Type</Text>
              <Text style={styles.sectionDescription}>
                Filter by specialty coffee shops, matcha cafés, or cafés (excludes major chains)
              </Text>
              <View style={styles.chipContainer}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    styles.chipWithIcon,
                    selectedVenueType === 'coffee' && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setSelectedVenueType(
                      selectedVenueType === 'coffee' ? undefined : 'coffee'
                    )
                  }
                >
                  <Ionicons 
                    name="cafe-outline" 
                    size={16} 
                    color={selectedVenueType === 'coffee' ? '#fff' : '#666'} 
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      selectedVenueType === 'coffee' && styles.chipTextSelected,
                    ]}
                  >
                    Coffee
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chip,
                    styles.chipWithIcon,
                    selectedVenueType === 'matcha' && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setSelectedVenueType(
                      selectedVenueType === 'matcha' ? undefined : 'matcha'
                    )
                  }
                >
                  <Ionicons 
                    name="leaf-outline" 
                    size={16} 
                    color={selectedVenueType === 'matcha' ? '#fff' : '#666'} 
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      selectedVenueType === 'matcha' && styles.chipTextSelected,
                    ]}
                  >
                    Matcha
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.chip,
                    styles.chipWithIcon,
                    selectedVenueType === 'cafe' && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setSelectedVenueType(
                      selectedVenueType === 'cafe' ? undefined : 'cafe'
                    )
                  }
                >
                  <Ionicons 
                    name="restaurant-outline" 
                    size={16} 
                    color={selectedVenueType === 'cafe' ? '#fff' : '#666'} 
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      selectedVenueType === 'cafe' && styles.chipTextSelected,
                    ]}
                  >
                    Café
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Price Range Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Range</Text>
              <View style={styles.priceContainer}>
                {priceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.priceButton,
                      selectedPrice === option.value && styles.priceButtonSelected,
                    ]}
                    onPress={() =>
                      setSelectedPrice(
                        selectedPrice === option.value ? undefined : option.value
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.priceText,
                        selectedPrice === option.value && styles.priceTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Service Attributes Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service & Accessibility</Text>
              
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Ionicons name="cafe-outline" size={20} color="#666" />
                  <Text style={styles.switchText}>Outdoor Seating</Text>
                </View>
                <Switch
                  value={outdoorSeating}
                  onValueChange={setOutdoorSeating}
                  trackColor={{ false: "#ddd", true: "#4CAF50" }}
                  thumbColor={outdoorSeating ? "#fff" : "#f4f3f4"}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Ionicons name="paw-outline" size={20} color="#666" />
                  <Text style={styles.switchText}>Pet Friendly</Text>
                </View>
                <Switch
                  value={petFriendly}
                  onValueChange={setPetFriendly}
                  trackColor={{ false: "#ddd", true: "#4CAF50" }}
                  thumbColor={petFriendly ? "#fff" : "#f4f3f4"}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Ionicons name="accessibility-outline" size={20} color="#666" />
                  <Text style={styles.switchText}>Wheelchair Accessible</Text>
                </View>
                <Switch
                  value={wheelchairAccessible}
                  onValueChange={setWheelchairAccessible}
                  trackColor={{ false: "#ddd", true: "#4CAF50" }}
                  thumbColor={wheelchairAccessible ? "#fff" : "#f4f3f4"}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Ionicons name="bicycle-outline" size={20} color="#666" />
                  <Text style={styles.switchText}>Delivery Available</Text>
                </View>
                <Switch
                  value={deliveryAvailable}
                  onValueChange={setDeliveryAvailable}
                  trackColor={{ false: "#ddd", true: "#4CAF50" }}
                  thumbColor={deliveryAvailable ? "#fff" : "#f4f3f4"}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearAll}
              disabled={!hasActiveFilters}
            >
              <Text
                style={[
                  styles.clearButtonText,
                  !hasActiveFilters && styles.clearButtonTextDisabled,
                ]}
              >
                Clear All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>
                Apply Filters
                {hasActiveFilters && " ✓"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
