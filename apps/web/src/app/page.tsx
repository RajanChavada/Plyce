'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import RestaurantCard from '@/components/RestaurantCard';
import RestaurantModal from '@/components/RestaurantModal';
import FilterPanel, { FilterOptions } from '@/components/FilterPanel';
import { LocationSearch } from '@/components/LocationSearch';
import { ApiService, Restaurant } from '@/services/api';
import { MapPin, List, Loader2, SlidersHorizontal, Coffee, DollarSign, Utensils, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, glassStyles } from '@/lib/glass-utils';

// Dynamic import for Google Maps (client-side only)
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
    </div>
  ),
});



export default function HomePage() {
  // State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState(2000); // 2km default

  // Filters - using new FilterOptions interface
  const [filters, setFilters] = useState<FilterOptions>({});

  // Get user location
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Toronto
          setUserLocation({ lat: 43.6532, lng: -79.3832 });
        }
      );
    } else {
      // Default to Toronto
      setUserLocation({ lat: 43.6532, lng: -79.3832 });
    }
  }, []);

  // Handle location selection from LocationSearch
  const handleLocationSelected = useCallback((location: { latitude: number; longitude: number; address: string }) => {
    setUserLocation({ lat: location.latitude, lng: location.longitude });
    setLocationAddress(location.address);
  }, []);

  // Fetch restaurants
  const fetchRestaurants = useCallback(async () => {
    if (!userLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build keyword from filters
      let keyword = '';
      if (filters.venue_type) {
        keyword = filters.venue_type;
      } else if (filters.cuisine) {
        keyword = filters.cuisine;
      } else if (filters.dietary) {
        keyword = filters.dietary;
      }

      const data = await ApiService.getNearbyRestaurants(
        userLocation.lat,
        userLocation.lng,
        searchRadius,
        keyword || undefined
      );

      // Apply client-side filters
      let filtered = data;

      if (filters.price_level) {
        filtered = filtered.filter(r => r.priceLevel === filters.price_level);
      }

      // Note: Service attributes (outdoor_seating, pet_friendly, etc.) would need
      // backend support for accurate filtering. For now, we'll fetch all and display.

      setRestaurants(filtered);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to load restaurants. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, searchRadius, filters]);

  // Fetch on location/radius change
  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Handle restaurant selection
  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  // Handle filters apply
  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-50 flex flex-row">
      {/* Sidebar (Flex Item) */}
      <Sidebar
        isOpen={isSidebarOpen}
        restaurants={restaurants}
        isLoading={isLoading}
        selectedRestaurant={selectedRestaurant}
        onRestaurantSelect={handleRestaurantSelect}
        searchRadius={searchRadius}
        onRadiusChange={setSearchRadius}
      />

      {/* Main Content Area (Map) */}
      <div className={cn(
        "flex-1 h-full p-4 relative",
        // Mobile: Show map only if sidebar is CLOSED (List View is hidden)
        // Desktop: Always show map (Sidebar pushes it)
        !isSidebarOpen ? "block" : "hidden md:block"
      )}>
        {/* Map Card Container */}
        <div className="w-full h-full rounded-3xl overflow-hidden border-4 border-white/50 shadow-2xl relative bg-white">
          {/* Map View */}
          <div className="absolute inset-0 z-0">
            <MapView
              restaurants={restaurants}
              userLocation={userLocation}
              searchRadius={searchRadius}
              selectedRestaurant={selectedRestaurant}
              onRestaurantSelect={handleRestaurantSelect}
            />
          </div>

          {/* Top Overlay: Search & Filters (Inside Map Card) */}
          <div className="absolute top-0 left-0 right-0 z-30 p-4 pointer-events-none">
            <div className="max-w-3xl mx-auto w-full pointer-events-auto space-y-3">
              {/* Search Bar Row */}
              <div className="flex items-center gap-2 md:gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={cn(
                    "p-2 md:p-3 rounded-xl text-primary-700 hover:bg-white/40 transition-all hidden md:block", // Hide desktop toggle on mobile
                    glassStyles.gradient
                  )}
                >
                  <motion.div
                    animate={{ rotate: isSidebarOpen ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <List size={20} />
                  </motion.div>
                </motion.button>
                <div className={cn("flex-1 rounded-2xl", glassStyles.gradient)}>
                  <LocationSearch
                    onLocationSelected={handleLocationSelected}
                    placeholder="Search for a location..."
                    className="w-full"
                  />
                </div>

                {/* Filter Button (Icon) */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsFilterOpen(true)}
                  className={cn(
                    "p-2 md:p-3 rounded-xl text-primary-700 hover:bg-white/40 transition-all",
                    glassStyles.gradient,
                    "bg-white/50" // Slightly more opaque for visibility
                  )}
                >
                  <SlidersHorizontal size={20} />
                </motion.button>
              </div>

              {/* Quick Filters Row */}
              <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide justify-start md:justify-center">
                {/* Quick Filter: Price */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className={cn(
                    "flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-primary-700 hover:bg-white/40 transition-all shrink-0",
                    glassStyles.gradient
                  )}
                >
                  <DollarSign size={14} />
                  <span className="font-medium text-xs md:text-sm">Price</span>
                </button>

                {/* Quick Filter: Cuisine */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className={cn(
                    "flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-primary-700 hover:bg-white/40 transition-all shrink-0",
                    glassStyles.gradient
                  )}
                >
                  <Utensils size={14} />
                  <span className="font-medium text-xs md:text-sm">Cuisine</span>
                </button>

                {/* Quick Filter: Coffee */}
                <button
                  onClick={() => {
                    setFilters({ ...filters, venue_type: 'cafe' });
                  }}
                  className={cn(
                    "flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-primary-700 hover:bg-white/40 transition-all shrink-0",
                    glassStyles.gradient
                  )}
                >
                  <Coffee size={14} />
                  <span className="font-medium text-xs md:text-sm">Coffee</span>
                </button>

                {/* Quick Filter: Vibe */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className={cn(
                    "flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-primary-700 hover:bg-white/40 transition-all shrink-0",
                    glassStyles.gradient
                  )}
                >
                  <Music size={14} />
                  <span className="font-medium text-xs md:text-sm">Vibe</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
              {error}
            </div>
          )}

          {/* Restaurant Detail Modal */}
          {selectedRestaurant && (
            <RestaurantModal
              restaurant={selectedRestaurant}
              onClose={() => setSelectedRestaurant(null)}
            />
          )}

          {/* Filter Panel */}
          <FilterPanel
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            initialFilters={filters}
            onApply={handleApplyFilters}
          />
        </div>
      </div>

      {/* Mobile Toggle Button (Floating) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-900 text-white rounded-full shadow-xl hover:bg-primary-800 transition-all"
        >
          {isSidebarOpen ? (
            <>
              <MapPin size={18} />
              <span className="font-medium">Map View</span>
            </>
          ) : (
            <>
              <List size={18} />
              <span className="font-medium">List View</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
