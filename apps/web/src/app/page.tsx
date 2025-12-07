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
import { MapPin, List, Grid, Loader2 } from 'lucide-react';

// Dynamic import for Google Maps (client-side only)
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
    </div>
  ),
});

type ViewMode = 'map' | 'list' | 'grid';

export default function HomePage() {
  // State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with Location Search */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <LocationSearch
                onLocationSelected={handleLocationSelected}
                placeholder="Search for a location..."
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
            >
              Filters
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          restaurants={restaurants}
          isLoading={isLoading}
          selectedRestaurant={selectedRestaurant}
          onRestaurantSelect={handleRestaurantSelect}
          searchRadius={searchRadius}
          onRadiusChange={setSearchRadius}
        />

        {/* Map/List View */}
        <main className="flex-1 relative">
          {/* View Toggle (Desktop) */}
          <div className="absolute top-4 right-4 z-10 hidden md:flex bg-white rounded-lg shadow-medium p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-smooth ${
                viewMode === 'map' ? 'bg-accent-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Map View"
            >
              <MapPin className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-smooth ${
                viewMode === 'list' ? 'bg-accent-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-smooth ${
                viewMode === 'grid' ? 'bg-accent-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Grid View"
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>

          {/* Content based on view mode */}
          {viewMode === 'map' ? (
            <MapView
              restaurants={restaurants}
              userLocation={userLocation}
              searchRadius={searchRadius}
              selectedRestaurant={selectedRestaurant}
              onRestaurantSelect={handleRestaurantSelect}
            />
          ) : (
            <div className={`h-full overflow-auto p-4 ${
              viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'
            }`}>
              {isLoading ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
                </div>
              ) : restaurants.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No restaurants found in this area
                </div>
              ) : (
                restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id || restaurant.place_id}
                    restaurant={restaurant}
                    isSelected={selectedRestaurant?.id === restaurant.id}
                    onClick={() => handleRestaurantSelect(restaurant)}
                  />
                ))
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
              {error}
            </div>
          )}
        </main>
      </div>

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
  );
}
