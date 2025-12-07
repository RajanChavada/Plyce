'use client';

import Image from 'next/image';
import { Restaurant, ApiService } from '@/services/api';
import { Star, MapPin } from 'lucide-react';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

export default function RestaurantCard({
  restaurant,
  isSelected,
  onClick,
  compact = false,
}: RestaurantCardProps) {
  const name = restaurant.displayName?.text || restaurant.name || 'Unknown Restaurant';
  const imageUrl = ApiService.getPhotoUrl(restaurant);
  const priceLevel = restaurant.priceLevel || 0;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`card card-hover flex gap-3 ${
          isSelected ? 'ring-2 ring-accent-500' : ''
        }`}
      >
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-gray-700">{restaurant.rating?.toFixed(1) || 'N/A'}</span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">
              {priceLevel > 0 ? Array(priceLevel).fill('$').join('') : '$'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {restaurant.formattedAddress}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`card card-hover overflow-hidden ${
        isSelected ? 'ring-2 ring-accent-500' : ''
      }`}
    >
      <div className="relative w-full h-48 rounded-t-xl overflow-hidden -mx-4 -mt-4 mb-4 bg-gray-100">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <h3 className="font-semibold text-lg text-gray-900">{name}</h3>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium text-gray-700">
            {restaurant.rating?.toFixed(1) || 'N/A'}
          </span>
          <span className="text-sm text-gray-400">
            ({restaurant.userRatingsTotal || 0})
          </span>
        </div>
        <span className="text-gray-300">•</span>
        <span className="text-sm text-gray-600">
          {priceLevel > 0 ? Array(priceLevel).fill('$').join('') : '$'}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
        <MapPin className="w-4 h-4" />
        <span className="truncate">{restaurant.formattedAddress}</span>
      </div>
    </div>
  );
}
