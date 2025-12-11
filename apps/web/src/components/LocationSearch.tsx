'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, glassStyles, hoverStates, motionPresets } from '@/lib/glass-utils';

interface LocationSearchProps {
  onLocationSelected: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelected,
  placeholder = 'Search for a location',
  className = '',
}) => {
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Search for place predictions using Google Places API via backend proxy
   */
  const searchPlaces = async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.post(`${API_URL}/places/autocomplete`, {
        input,
        language: 'en',
      });

      if (response.data.status === 'OK') {
        setPredictions(response.data.predictions || []);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error('Error fetching place predictions:', error);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handle text input change with debouncing
   */
  const handleTextChange = useCallback((text: string) => {
    setSearchText(text);

    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for search (debouncing)
    searchTimeout.current = setTimeout(() => {
      searchPlaces(text);
    }, 400);
  }, []);

  /**
   * Get place details and extract coordinates
   */
  const selectPlace = async (placeId: string, description: string) => {
    try {
      setIsSearching(true);
      setShowPredictions(false);

      const response = await axios.post(`${API_URL}/places/details`, {
        place_id: placeId,
      });

      if (response.data.status === 'OK' && response.data.result) {
        const { geometry, formatted_address } = response.data.result;

        if (geometry && geometry.location) {
          const latitude = geometry.location.lat;
          const longitude = geometry.location.lng;
          const address = formatted_address || description;

          console.log('📍 Location selected:', { latitude, longitude, address });

          // Update search text with selected address
          setSearchText(address);
          setPredictions([]);

          // Pass the real location data to parent component
          onLocationSelected({
            latitude,
            longitude,
            address,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      alert('Failed to get location details. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Use browser's geolocation to get current location
   */
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode to get address
          const response = await axios.post(`${API_URL}/places/reverse-geocode`, {
            latitude,
            longitude,
          });

          const address = response.data.formatted_address || 'Current Location';
          setSearchText(address);

          onLocationSelected({
            latitude,
            longitude,
            address,
          });
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          // Still use the location even if reverse geocoding fails
          onLocationSelected({
            latitude,
            longitude,
            address: 'Current Location',
          });
          setSearchText('Current Location');
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please check your browser permissions.');
        setIsLoadingLocation(false);
      }
    );
  };

  /**
   * Clear search input
   */
  const clearSearch = () => {
    setSearchText('');
    setPredictions([]);
    setShowPredictions(false);
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Search Input Container - Glass Effect */}
        <div className={cn(
          'relative flex items-center rounded-2xl',
          'bg-white/95 backdrop-blur-xl border border-white/40 shadow-glass ring-1 ring-white/40',
          'transition-all duration-300 hover:bg-white',
          showPredictions && 'ring-2 ring-accent-400/50 bg-white'
        )}>
          <MapPin className="absolute left-3 text-primary-500" size={20} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => handleTextChange(e.target.value)}
            onFocus={() => {
              if (predictions.length > 0) setShowPredictions(true);
            }}
            placeholder={placeholder}
            className={cn(
              'w-full pl-10 pr-24 py-3 bg-transparent',
              'text-primary-900 placeholder:text-primary-400',
              'focus:outline-none transition-all duration-200'
            )}
          />

          {/* Clear Button */}
          <AnimatePresence>
            {searchText && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearSearch}
                className={cn(
                  'absolute right-14 p-1.5 rounded-full',
                  'bg-white/50 hover:bg-white/80',
                  'transition-colors duration-200',
                  hoverStates.lift
                )}
                type="button"
              >
                <X size={16} className="text-primary-600" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Current Location Button */}
          <motion.button
            onClick={useCurrentLocation}
            disabled={isLoadingLocation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'absolute right-2 p-2 rounded-lg',
              'bg-gradient-to-br from-accent-500 to-accent-600',
              'text-white shadow-lg shadow-accent-500/30',
              'hover:from-accent-600 hover:to-accent-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
            type="button"
            title="Use current location"
          >
            {isLoadingLocation ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Navigation size={20} />
            )}
          </motion.button>
        </div>

        {/* Loading Indicator */}
        <AnimatePresence>
          {isSearching && searchText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-16 top-1/2 -translate-y-1/2"
            >
              <div className="animate-spin h-4 w-4 border-2 border-primary-300 border-t-accent-500 rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Predictions Dropdown - Glass Effect with Animations */}
        <AnimatePresence>
          {showPredictions && predictions.length > 0 && (
            <motion.div
              {...motionPresets.slideUp}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'absolute z-50 w-full mt-3 rounded-xl',
                'bg-white/95 backdrop-blur-xl border border-white/20 shadow-glass',
                'max-h-80 overflow-hidden'
              )}
            >
              <div className="overflow-y-auto max-h-80 custom-scrollbar">
                {predictions.map((prediction, index) => (
                  <motion.button
                    key={prediction.place_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => selectPlace(prediction.place_id, prediction.description)}
                    className={cn(
                      'w-full text-left px-4 py-3',
                      'border-b border-white/10 last:border-b-0',
                      'hover:bg-gray-100 active:bg-gray-200',
                      'transition-colors duration-200',
                    )}
                    type="button"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-accent-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-primary-900 truncate">
                          {prediction.structured_formatting.main_text}
                        </div>
                        <div className="text-sm text-primary-600 truncate">
                          {prediction.structured_formatting.secondary_text}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div >
    </div >
  );
};
