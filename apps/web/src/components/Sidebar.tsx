'use client';

import { Restaurant, ApiService } from '@/services/api';
import RestaurantCard from './RestaurantCard';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { cn, glassStyles, motionPresets } from '@/lib/glass-utils';

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
    <motion.aside
      initial={false}
      animate={{
        width: isOpen ? 'min(280px, 25vw)' : 0,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ maxWidth: isOpen ? 'min(280px, 25vw)' : 0 }}
      className={cn(
        glassStyles.panel,
        'border-r border-white/20 flex flex-col overflow-hidden h-full',
        'min-w-0 shrink-0'
      )}
    >
      {/* Radius Selector */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-2 sm:p-4 border-b border-white/10"
      >
        <label className="text-xs sm:text-sm font-semibold text-primary-800 mb-2 block">
          Search Radius
        </label>
        <div className="flex gap-1 sm:gap-2">
          {radiusOptions.map((option, index) => (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onRadiusChange(option.value)}
              className={cn(
                'flex-1 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition-all duration-200',
                searchRadius === option.value
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30'
                  : 'bg-white/50 text-primary-700 hover:bg-white/70'
              )}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-2 sm:px-4 py-2 sm:py-3 bg-white/20 border-b border-white/10"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={isLoading ? 'loading' : restaurants.length}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-xs sm:text-sm font-medium text-primary-700"
          >
            {isLoading ? 'Loading...' : `${restaurants.length} restaurants found`}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* Restaurant List with Radix ScrollArea */}
      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport className="w-full h-full [&>div]:!block [&>div]:!min-w-0">
          <div className="p-2 w-full max-w-full box-border">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  {...motionPresets.fadeIn}
                  className="flex items-center justify-center py-12"
                >
                  <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
                </motion.div>
              ) : restaurants.length === 0 ? (
                <motion.div
                  key="empty"
                  {...motionPresets.fadeIn}
                  className="text-center py-12 text-primary-500"
                >
                  No restaurants found
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  {...motionPresets.staggerContainer}
                  className="space-y-2"
                >
                  {restaurants.map((restaurant, index) => (
                    <motion.div
                      key={restaurant.id || restaurant.place_id}
                      {...motionPresets.staggerItem}
                      custom={index}
                      className="w-full overflow-hidden"
                    >
                      <RestaurantCard
                        restaurant={restaurant}
                        isSelected={selectedRestaurant?.id === restaurant.id}
                        onClick={() => onRestaurantSelect(restaurant)}
                        compact
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea.Viewport>
        
        <ScrollArea.Scrollbar
          className="flex select-none touch-none bg-primary-900/30 transition-all duration-150 ease-out hover:bg-primary-900/50 data-[orientation=vertical]:w-3 border-l border-white/20"
          orientation="vertical"
          forceMount
        >
          <ScrollArea.Thumb className="flex-1 bg-accent-500 hover:bg-accent-400 transition-colors relative before:absolute before:inset-0 before:rounded-full before:bg-white/20" />
        </ScrollArea.Scrollbar>
        
        <ScrollArea.Corner className="bg-white/5" />
      </ScrollArea.Root>
    </motion.aside>
  );
}
