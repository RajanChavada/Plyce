'use client';

import { Restaurant, ApiService } from '@/services/api';
import RestaurantCard from './RestaurantCard';
import { Loader2 } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  restaurants: Restaurant[];
  isLoading: boolean;
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  searchRadius: number;
  onRadiusChange: (radius: number) => void;
}

const radiusOptions = [
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 15000, label: '15 km' },
];

export default function Sidebar({
  isOpen,
  restaurants,
  isLoading,
  selectedRestaurant,
  onRestaurantSelect,
  searchRadius,
  onRadiusChange,
}: SidebarProps) {
  return (
    <aside
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isOpen ? 'w-80' : 'w-0'
      } overflow-hidden`}
    >
      {/* Radius Selector */}
      <div className="p-4 border-b border-gray-200">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Search Radius
        </label>
        <div className="flex gap-2">
          {radiusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onRadiusChange(option.value)}
              className={`flex-1 py-2 text-sm rounded-lg transition-smooth ${
                searchRadius === option.value
                  ? 'bg-accent-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm text-gray-600">
          {isLoading ? 'Loading...' : `${restaurants.length} restaurants found`}
        </span>
      </div>

      {/* Restaurant List */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No restaurants found
          </div>
        ) : (
          restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id || restaurant.place_id}
              restaurant={restaurant}
              isSelected={selectedRestaurant?.id === restaurant.id}
              onClick={() => onRestaurantSelect(restaurant)}
              compact
            />
          ))
        )}
      </div>
    </aside>
  );
}
