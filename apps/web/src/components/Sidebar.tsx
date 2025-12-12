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
        width: isOpen ? '100%' : 0, // Allow full width, controlled by CSS max-width/width classes
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ maxWidth: isOpen ? '100%' : 0 }}
      className={cn(
        'flex flex-col h-full overflow-hidden border-r border-white/20',
        glassStyles.gradient,
        'rounded-r-3xl', // Optional: round the right edge
        'w-full md:w-[400px]' // Responsive width
      )}
    >
      <div className="flex flex-col h-full p-4 w-full md:w-[400px]">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-2xl p-4 mb-4 flex flex-col gap-3 bg-white/40 border border-white/20 shadow-sm"
          )}
        >
          {/* Radius Selector */}
          <div>
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
          </div>

          {/* Results Count */}
          <div className="pt-3 border-t border-white/10">
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
          </div>
        </motion.div>

        {/* Restaurant List with Radix ScrollArea */}
        <ScrollArea.Root className="flex-1 overflow-hidden bg-transparent">
          <ScrollArea.Viewport className="w-full h-full [&>div]:!block [&>div]:!min-w-0 bg-transparent">
            <div className="w-full max-w-full box-border pb-4 px-6">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    {...motionPresets.fadeIn}
                    className={cn(glassStyles.strong, "flex items-center justify-center py-12 rounded-2xl")}
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
                  </motion.div>
                ) : restaurants.length === 0 ? (
                  <motion.div
                    key="empty"
                    {...motionPresets.fadeIn}
                    className={cn(glassStyles.strong, "text-center py-12 text-primary-500 rounded-2xl")}
                  >
                    No restaurants found
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    {...motionPresets.staggerContainer}
                    className="space-y-3"
                  >
                    {restaurants.map((restaurant, index) => (
                      <motion.div
                        key={restaurant.id || restaurant.place_id}
                        {...motionPresets.staggerItem}
                        custom={index}
                        className="w-full"
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
            className="flex select-none touch-none bg-transparent transition-colors duration-150 ease-out data-[orientation=vertical]:w-2 m-1 rounded-full hover:bg-black/5"
            orientation="vertical"
          >
            <ScrollArea.Thumb className="flex-1 bg-black/20 hover:bg-black/40 transition-colors rounded-full relative" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>
    </motion.aside>
  );
}
