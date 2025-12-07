'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import axios from 'axios';

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
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        {/* Search Input */}
        <div className="relative flex items-center">
          <MapPin className="absolute left-3 text-gray-400" size={20} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => handleTextChange(e.target.value)}
            onFocus={() => {
              if (predictions.length > 0) setShowPredictions(true);
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />

          {/* Clear Button */}
          {searchText && (
            <button
              onClick={clearSearch}
              className="absolute right-14 p-1 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <X size={18} className="text-gray-400" />
            </button>
          )}

          {/* Current Location Button */}
          <button
            onClick={useCurrentLocation}
            disabled={isLoadingLocation}
            className="absolute right-2 p-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            title="Use current location"
          >
            {isLoadingLocation ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Navigation size={20} />
            )}
          </button>
        </div>

        {/* Loading Indicator */}
        {isSearching && searchText && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-cyan-500 rounded-full" />
          </div>
        )}

        {/* Predictions Dropdown */}
        {showPredictions && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                onClick={() => selectPlace(prediction.place_id, prediction.description)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                type="button"
              >
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
