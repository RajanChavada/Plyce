'use client';

import React, { useState } from 'react';
import { X, Coffee, Leaf, UtensilsCrossed, TreeDeciduous, Dog, Truck, Accessibility } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { cn, glassStyles, hoverStates, motionPresets } from '@/lib/glass-utils';

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

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
        </Dialog.Overlay>

        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-[95vw] max-w-2xl max-h-[90vh]',
            'flex flex-col rounded-2xl overflow-hidden',
            glassStyles.strong,
            'border border-white/20'
          )}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <Dialog.Title className="text-2xl font-bold text-primary-900">
                Filter Restaurants
              </Dialog.Title>
              <Dialog.Close asChild>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={cn(
                    'p-2 rounded-full',
                    'bg-white/50 hover:bg-white/80',
                    'transition-colors duration-200'
                  )}
                >
                  <X size={24} className="text-primary-700" />
                </motion.button>
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Cuisine Section */}
              <motion.div {...motionPresets.fadeIn}>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">Cuisine</h3>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((cuisine, index) => (
                    <motion.button
                      key={cuisine}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setSelectedCuisine(selectedCuisine === cuisine ? undefined : cuisine)
                      }
                      className={cn(
                        'px-4 py-2 rounded-full border-2 transition-all duration-200',
                        selectedCuisine === cuisine
                          ? 'bg-gradient-to-r from-accent-500 to-accent-600 border-accent-400 text-white shadow-lg shadow-accent-500/30'
                          : 'bg-white/50 border-white/30 text-primary-700 hover:border-accent-400 hover:bg-white/70'
                      )}
                    >
                      {cuisine}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Dietary Preferences Section */}
              <motion.div {...motionPresets.fadeIn} transition={{ delay: 0.1 }}>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">Dietary Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((dietary, index) => (
                    <motion.button
                      key={dietary}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + index * 0.03 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setSelectedDietary(selectedDietary === dietary ? undefined : dietary)
                      }
                      className={cn(
                        'px-4 py-2 rounded-full border-2 transition-all duration-200',
                        selectedDietary === dietary
                          ? 'bg-gradient-to-r from-accent-500 to-accent-600 border-accent-400 text-white shadow-lg shadow-accent-500/30'
                          : 'bg-white/50 border-white/30 text-primary-700 hover:border-accent-400 hover:bg-white/70'
                      )}
                    >
                      {dietary}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Venue Type Section */}
              <motion.div {...motionPresets.fadeIn} transition={{ delay: 0.2 }}>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">Venue Type</h3>
                <p className="text-sm text-primary-600 mb-3">
                  Filter by specialty coffee shops, matcha cafés, or cafés (excludes major chains)
                </p>
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setSelectedVenueType(selectedVenueType === 'coffee' ? undefined : 'coffee')
                    }
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200',
                      selectedVenueType === 'coffee'
                        ? 'bg-gradient-to-r from-accent-500 to-accent-600 border-accent-400 text-white shadow-lg shadow-accent-500/30'
                        : 'bg-white/50 border-white/30 text-primary-700 hover:border-accent-400 hover:bg-white/70'
                    )}
                  >
                    <Coffee size={16} />
                    <span>Coffee</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setSelectedVenueType(selectedVenueType === 'matcha' ? undefined : 'matcha')
                    }
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200',
                      selectedVenueType === 'matcha'
                        ? 'bg-gradient-to-r from-accent-500 to-accent-600 border-accent-400 text-white shadow-lg shadow-accent-500/30'
                        : 'bg-white/50 border-white/30 text-primary-700 hover:border-accent-400 hover:bg-white/70'
                    )}
                  >
                    <Leaf size={16} />
                    <span>Matcha</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setSelectedVenueType(selectedVenueType === 'cafe' ? undefined : 'cafe')
                    }
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200',
                      selectedVenueType === 'cafe'
                        ? 'bg-gradient-to-r from-accent-500 to-accent-600 border-accent-400 text-white shadow-lg shadow-accent-500/30'
                        : 'bg-white/50 border-white/30 text-primary-700 hover:border-accent-400 hover:bg-white/70'
                    )}
                  >
                    <UtensilsCrossed size={16} />
                    <span>Café</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Price Range Section */}
              <motion.div {...motionPresets.fadeIn} transition={{ delay: 0.3 }}>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">Price Range</h3>
                <div className="flex gap-3">
                  {priceOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setSelectedPrice(selectedPrice === option.value ? undefined : option.value)
                      }
                      className={cn(
                        'flex-1 px-4 py-3 rounded-lg border-2 font-semibold transition-all duration-200',
                        selectedPrice === option.value
                          ? 'bg-gradient-to-r from-accent-500 to-accent-600 border-accent-400 text-white shadow-lg shadow-accent-500/30'
                          : 'bg-white/50 border-white/30 text-primary-700 hover:border-accent-400 hover:bg-white/70'
                      )}
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Service & Accessibility Section */}
              <motion.div {...motionPresets.fadeIn} transition={{ delay: 0.4 }}>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">Service & Accessibility</h3>
                <div className="space-y-3">
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg cursor-pointer',
                      'bg-white/30 hover:bg-white/50 transition-all duration-200',
                      hoverStates.lift
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <TreeDeciduous size={20} className="text-accent-600" />
                      <span className="text-primary-900 font-medium">Outdoor Seating</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={outdoorSeating}
                      onChange={(e) => setOutdoorSeating(e.target.checked)}
                      className="w-5 h-5 text-accent-500 rounded focus:ring-2 focus:ring-accent-500 cursor-pointer"
                    />
                  </motion.label>

                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg cursor-pointer',
                      'bg-white/30 hover:bg-white/50 transition-all duration-200',
                      hoverStates.lift
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Dog size={20} className="text-accent-600" />
                      <span className="text-primary-900 font-medium">Pet Friendly</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={petFriendly}
                      onChange={(e) => setPetFriendly(e.target.checked)}
                      className="w-5 h-5 text-accent-500 rounded focus:ring-2 focus:ring-accent-500 cursor-pointer"
                    />
                  </motion.label>

                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg cursor-pointer',
                      'bg-white/30 hover:bg-white/50 transition-all duration-200',
                      hoverStates.lift
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Accessibility size={20} className="text-accent-600" />
                      <span className="text-primary-900 font-medium">Wheelchair Accessible</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={wheelchairAccessible}
                      onChange={(e) => setWheelchairAccessible(e.target.checked)}
                      className="w-5 h-5 text-accent-500 rounded focus:ring-2 focus:ring-accent-500 cursor-pointer"
                    />
                  </motion.label>

                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg cursor-pointer',
                      'bg-white/30 hover:bg-white/50 transition-all duration-200',
                      hoverStates.lift
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Truck size={20} className="text-accent-600" />
                      <span className="text-primary-900 font-medium">Delivery Available</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={deliveryAvailable}
                      onChange={(e) => setDeliveryAvailable(e.target.checked)}
                      className="w-5 h-5 text-accent-500 rounded focus:ring-2 focus:ring-accent-500 cursor-pointer"
                    />
                  </motion.label>
                </div>
              </motion.div>
            </div>

            {/* Footer Actions */}
            <div className={cn(
              'flex gap-3 p-6 border-t border-white/10',
              'bg-white/20'
            )}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClearAll}
                disabled={!hasActiveFilters}
                className={cn(
                  'flex-1 px-6 py-3 rounded-lg font-semibold',
                  'border-2 border-white/30 text-primary-700',
                  'hover:bg-white/50 transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Clear All
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApply}
                className={cn(
                  'flex-1 px-6 py-3 rounded-lg font-semibold',
                  'bg-gradient-to-r from-accent-500 to-accent-600',
                  'text-white shadow-lg shadow-accent-500/30',
                  'hover:from-accent-600 hover:to-accent-700',
                  'transition-all duration-200'
                )}
              >
                Apply Filters
              </motion.button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
