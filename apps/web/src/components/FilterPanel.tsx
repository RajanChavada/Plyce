'use client';

import React, { useState } from 'react';
import { X, Coffee, Leaf, UtensilsCrossed, TreeDeciduous, Dog, Truck, Accessibility } from 'lucide-react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

export interface FilterOptions {
  cuisine?: string;
  dietary?: string;
  price_level?: number;
  outdoor_seating?: boolean;
  pet_friendly?: boolean;
  wheelchair_accessible?: boolean;
  delivery_available?: boolean;
  venue_type?: 'coffee' | 'matcha' | 'cafe';
}

const cuisineOptions = [
  'Italian',
  'Indian',
  'Chinese',
  'Japanese',
  'Mexican',
  'Thai',
  'French',
  'Mediterranean',
  'American',
  'Korean',
  'Vietnamese',
  'Greek',
];

const dietaryOptions = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Halal',
  'Kosher',
  'Dairy-Free',
];

const priceOptions = [
  { label: '$', value: 1 },
  { label: '$$', value: 2 },
  { label: '$$$', value: 3 },
  { label: '$$$$', value: 4 },
];

export default function FilterPanel({
  isOpen,
  onClose,
  onApply,
  initialFilters = {},
}: FilterPanelProps) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center bg-black bg-opacity-50">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Filter Restaurants</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cuisine Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cuisine</h3>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() =>
                    setSelectedCuisine(selectedCuisine === cuisine ? undefined : cuisine)
                  }
                  className={`px-4 py-2 rounded-full border-2 transition-all ${
                    selectedCuisine === cuisine
                      ? 'bg-cyan-500 border-cyan-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-cyan-500'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Preferences Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Dietary Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((dietary) => (
                <button
                  key={dietary}
                  onClick={() =>
                    setSelectedDietary(selectedDietary === dietary ? undefined : dietary)
                  }
                  className={`px-4 py-2 rounded-full border-2 transition-all ${
                    selectedDietary === dietary
                      ? 'bg-cyan-500 border-cyan-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-cyan-500'
                  }`}
                >
                  {dietary}
                </button>
              ))}
            </div>
          </div>

          {/* Venue Type Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Venue Type</h3>
            <p className="text-sm text-gray-600 mb-3">
              Filter by specialty coffee shops, matcha cafés, or cafés (excludes major chains)
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setSelectedVenueType(selectedVenueType === 'coffee' ? undefined : 'coffee')
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                  selectedVenueType === 'coffee'
                    ? 'bg-cyan-500 border-cyan-500 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-cyan-500'
                }`}
              >
                <Coffee size={16} />
                <span>Coffee</span>
              </button>

              <button
                onClick={() =>
                  setSelectedVenueType(selectedVenueType === 'matcha' ? undefined : 'matcha')
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                  selectedVenueType === 'matcha'
                    ? 'bg-cyan-500 border-cyan-500 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-cyan-500'
                }`}
              >
                <Leaf size={16} />
                <span>Matcha</span>
              </button>

              <button
                onClick={() =>
                  setSelectedVenueType(selectedVenueType === 'cafe' ? undefined : 'cafe')
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                  selectedVenueType === 'cafe'
                    ? 'bg-cyan-500 border-cyan-500 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-cyan-500'
                }`}
              >
                <UtensilsCrossed size={16} />
                <span>Café</span>
              </button>
            </div>
          </div>

          {/* Price Range Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Price Range</h3>
            <div className="flex gap-3">
              {priceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setSelectedPrice(selectedPrice === option.value ? undefined : option.value)
                  }
                  className={`flex-1 px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                    selectedPrice === option.value
                      ? 'bg-cyan-500 border-cyan-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-cyan-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service & Accessibility Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Service & Accessibility</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <TreeDeciduous size={20} className="text-gray-600" />
                  <span className="text-gray-900">Outdoor Seating</span>
                </div>
                <input
                  type="checkbox"
                  checked={outdoorSeating}
                  onChange={(e) => setOutdoorSeating(e.target.checked)}
                  className="w-5 h-5 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Dog size={20} className="text-gray-600" />
                  <span className="text-gray-900">Pet Friendly</span>
                </div>
                <input
                  type="checkbox"
                  checked={petFriendly}
                  onChange={(e) => setPetFriendly(e.target.checked)}
                  className="w-5 h-5 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Accessibility size={20} className="text-gray-600" />
                  <span className="text-gray-900">Wheelchair Accessible</span>
                </div>
                <input
                  type="checkbox"
                  checked={wheelchairAccessible}
                  onChange={(e) => setWheelchairAccessible(e.target.checked)}
                  className="w-5 h-5 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Truck size={20} className="text-gray-600" />
                  <span className="text-gray-900">Delivery Available</span>
                </div>
                <input
                  type="checkbox"
                  checked={deliveryAvailable}
                  onChange={(e) => setDeliveryAvailable(e.target.checked)}
                  className="w-5 h-5 text-cyan-500 rounded focus:ring-2 focus:ring-cyan-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClearAll}
            disabled={!hasActiveFilters}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
