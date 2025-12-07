'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Filter, Menu, MapPin, X } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLocationChange: (lat: number, lng: number) => void;
  onFilterClick: () => void;
  onToggleSidebar: () => void;
}

export default function Header({
  searchQuery,
  onSearchChange,
  onLocationChange,
  onFilterClick,
  onToggleSidebar,
}: HeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof google !== 'undefined') {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      const mapDiv = document.createElement('div');
      placesService.current = new google.maps.places.PlacesService(mapDiv);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    onSearchChange(value);

    if (value.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          types: ['geocode', 'establishment'],
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions);
          } else {
            setPredictions([]);
          }
        }
      );
    } else {
      setPredictions([]);
    }
  };

  const handlePredictionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    onSearchChange(prediction.description);
    setPredictions([]);
    setIsSearchFocused(false);

    if (placesService.current) {
      placesService.current.getDetails(
        { placeId: prediction.place_id, fields: ['geometry'] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            onLocationChange(
              place.geometry.location.lat(),
              place.geometry.location.lng()
            );
          }
        }
      );
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 z-50 relative">
      {/* Logo & Menu Toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-gray-100 rounded-lg transition-smooth md:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900 hidden sm:block">Plyce</span>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl relative">
        <div className={`flex items-center bg-gray-100 rounded-lg px-3 py-2 transition-all ${
          isSearchFocused ? 'ring-2 ring-accent-500 bg-white' : ''
        }`}>
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search location or restaurant..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="flex-1 bg-transparent border-none outline-none px-3 text-gray-700 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                setPredictions([]);
              }}
              className="p-1 hover:bg-gray-200 rounded-full transition-smooth"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {predictions.length > 0 && isSearchFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-strong border border-gray-200 overflow-hidden z-50">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                onClick={() => handlePredictionSelect(prediction)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-smooth flex items-center gap-3 border-b border-gray-100 last:border-0"
              >
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 truncate">{prediction.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Button */}
      <button
        onClick={onFilterClick}
        className="btn btn-secondary flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">Filters</span>
      </button>
    </header>
  );
}
