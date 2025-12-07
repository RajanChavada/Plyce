'use client';

import Image from 'next/image';
import { Restaurant, ApiService } from '@/services/api';
import { Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, glassStyles, hoverStates } from '@/lib/glass-utils';

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
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          'flex gap-2 p-2 rounded-lg cursor-pointer w-full overflow-hidden',
          glassStyles.subtle,
          hoverStates.lift,
          hoverStates.glow,
          'transition-all duration-200',
          isSelected && 'ring-2 ring-accent-500 shadow-lg shadow-accent-500/20'
        )}
      >
        <div
          className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-primary-100"
        >
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <h3 className="text-sm font-semibold text-primary-900 truncate">{name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-medium text-primary-700">
                {restaurant.rating?.toFixed(1) || 'N/A'}
              </span>
            </div>
            <span className="text-primary-300 text-xs">•</span>
            <span className="text-xs text-primary-600 font-medium">
              {priceLevel > 0 ? Array(priceLevel).fill('$').join('') : '$'}
            </span>
          </div>
          <p className="text-xs text-primary-500 mt-0.5 truncate">
            {restaurant.formattedAddress}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'overflow-hidden cursor-pointer p-4 rounded-xl',
        glassStyles.subtle,
        hoverStates.lift,
        hoverStates.glow,
        'transition-all duration-200',
        isSelected && 'ring-2 ring-accent-500 shadow-lg shadow-accent-500/20'
      )}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-primary-100"
      >
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-300"
          unoptimized
        />
      </motion.div>
      <h3 className="font-semibold text-lg text-primary-900">{name}</h3>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-medium text-primary-700">
            {restaurant.rating?.toFixed(1) || 'N/A'}
          </span>
          <span className="text-sm text-primary-400">
            ({restaurant.userRatingsTotal || 0})
          </span>
        </div>
        <span className="text-primary-300">•</span>
        <span className="text-sm font-medium text-primary-600">
          {priceLevel > 0 ? Array(priceLevel).fill('$').join('') : '$'}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-2 text-sm text-primary-500">
        <MapPin className="w-4 h-4" />
        <span className="truncate">{restaurant.formattedAddress}</span>
      </div>
    </motion.div>
  );
}
