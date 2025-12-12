'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, Star, MapPin, ExternalLink, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';

import { Restaurant, Review, TikTokVideo, MenuPhoto, ApiService } from '@/services/api';
import { cn, glassStyles, hoverStates, motionPresets } from '@/lib/glass-utils';

interface RestaurantModalProps {
  restaurant: Restaurant;
  onClose: () => void;
}

export default function RestaurantModal({ restaurant, onClose }: RestaurantModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'tiktok' | 'menu'>('overview');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tiktokVideos, setTiktokVideos] = useState<TikTokVideo[]>([]);
  const [menuPhotos, setMenuPhotos] = useState<MenuPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTiktokLoading, setIsTiktokLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const name = restaurant.displayName?.text || restaurant.name || 'Restaurant';
  const imageUrl = ApiService.getPhotoUrl(restaurant);
  const placeId = restaurant.place_id || restaurant.id || '';

  // Load reviews and menu photos immediately (fast)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!placeId || placeId.startsWith('fallback-')) {
        setIsLoading(false);
        setIsTiktokLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Load reviews and photos first (fast)
        const [reviewsData, menuData] = await Promise.all([
          ApiService.getRestaurantReviews(placeId),
          ApiService.getMenuPhotos(placeId),
        ]);

        setReviews(reviewsData);
        setMenuPhotos(menuData.photos);
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [placeId]);

  // Load TikToks separately (slow, can take 5-10s)
  useEffect(() => {
    const fetchTikToks = async () => {
      if (!placeId || placeId.startsWith('fallback-')) {
        setIsTiktokLoading(false);
        return;
      }

      setIsTiktokLoading(true);
      try {
        const tiktokData = await ApiService.getTikTokVideos(placeId);
        setTiktokVideos(tiktokData.videos);
      } catch (error) {
        console.error('Error fetching TikTok videos:', error);
      } finally {
        setIsTiktokLoading(false);
      }
    };

    fetchTikToks();
  }, [placeId]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
    { id: 'tiktok', label: isTiktokLoading ? 'TikTok (...)' : `TikTok (${tiktokVideos.length})` },
    { id: 'menu', label: `Photos (${menuPhotos.length})` },
  ];

  // Lightbox navigation
  const nextPhoto = useCallback(() => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev === null || prev === menuPhotos.length - 1 ? 0 : prev + 1));
  }, [selectedPhotoIndex, menuPhotos.length]);

  const prevPhoto = useCallback(() => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) => (prev === null || prev === 0 ? menuPhotos.length - 1 : prev - 1));
  }, [selectedPhotoIndex, menuPhotos.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex !== null) {
        if (e.key === 'ArrowRight') nextPhoto();
        if (e.key === 'ArrowLeft') prevPhoto();
        if (e.key === 'Escape') setSelectedPhotoIndex(null);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, nextPhoto, prevPhoto, onClose]);

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
        </Dialog.Overlay>

        <Dialog.Content
          className={cn(
            'fixed z-50',
            // Mobile: Full screen
            'inset-0 w-full h-full rounded-none',
            // Desktop: Centered modal
            'md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
            'md:w-full md:max-w-4xl md:h-auto md:max-h-[90vh] md:rounded-2xl',
            // Shared styles
            'bg-white/90 backdrop-blur-xl shadow-glass border border-white/20',
            'flex flex-col overflow-hidden',
            'focus:outline-none'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Dialog.Description className="sr-only">
            Details for {restaurant.name}
          </Dialog.Description>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col w-full h-full md:h-auto overflow-hidden"
          >
            {/* Header Image */}
            <div className="relative h-64 rounded-t-2xl overflow-hidden">
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <Dialog.Close asChild>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={cn(
                    'absolute top-4 right-4 p-2 rounded-full',
                    'bg-white/90 hover:bg-white backdrop-blur-sm',
                    'shadow-lg transition-colors duration-200'
                  )}
                >
                  <X className="w-5 h-5 text-primary-700" />
                </motion.button>
              </Dialog.Close>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute bottom-4 left-4 right-4"
              >
                <Dialog.Title className="text-2xl font-bold text-white drop-shadow-lg">
                  {name}
                </Dialog.Title>
                <div className="flex items-center gap-3 mt-2 text-white/95 drop-shadow">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">{restaurant.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <span>•</span>
                  <span className="font-medium">{Array(restaurant.priceLevel || 1).fill('$').join('')}</span>
                  <span>•</span>
                  <span className="truncate text-sm">{restaurant.formattedAddress}</span>
                </div>
              </motion.div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/20 bg-white/4 backdrop-blur-md">
              <div className="flex gap-1 px-4">
                {tabs.map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.05 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                      'relative',
                      activeTab === tab.id
                        ? 'border-accent-500 text-accent-700'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-accent-500/10 rounded-t-lg -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Content with Native Scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      {...motionPresets.fadeIn}
                      className="flex items-center justify-center py-12"
                    >
                      <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === 'overview' && (
                        <div className="space-y-4">
                          <motion.div
                            {...motionPresets.fadeIn}
                            className="flex items-center gap-2 text-primary-950 font-medium"
                          >
                            <MapPin className="w-5 h-5 text-accent-600" />
                            <span>{restaurant.formattedAddress}</span>
                          </motion.div>
                          {restaurant.types && (
                            <motion.div
                              {...motionPresets.fadeIn}
                              transition={{ delay: 0.1 }}
                              className="flex flex-wrap gap-2"
                            >
                              {restaurant.types.slice(0, 5).map((type, index) => (
                                <motion.span
                                  key={type}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 + index * 0.05 }}
                                  className={cn(
                                    'px-3 py-1 rounded-full text-sm font-medium',
                                    'px-3 py-1 rounded-full text-sm font-medium',
                                    'bg-primary-100 text-primary-900',
                                    'border border-primary-200'
                                  )}
                                >
                                  {type.replace(/_/g, ' ')}
                                </motion.span>
                              ))}
                            </motion.div>
                          )}
                          <motion.a
                            {...motionPresets.fadeIn}
                            transition={{ delay: 0.2 }}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            href={`https://www.google.com/maps/place/?q=place_id:${placeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                              'bg-gradient-to-r from-accent-500 to-accent-600',
                              'text-white font-medium shadow-lg shadow-accent-500/30',
                              'hover:shadow-xl transition-all duration-200'
                            )}
                          >
                            Open in Google Maps
                            <ExternalLink className="w-4 h-4" />
                          </motion.a>
                        </div>
                      )}

                      {activeTab === 'reviews' && (
                        <div className="space-y-4">
                          {reviews.length === 0 ? (
                            <p className="text-primary-500 text-center py-8">No reviews available</p>
                          ) : (
                            reviews.map((review, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={cn(
                                  'border-b border-gray-200 pb-4 last:border-0',
                                  'p-4 rounded-lg',
                                  'bg-gray-50/90 hover:bg-gray-100 transition-colors shadow-sm'
                                )}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-black">
                                    {review.displayName?.text || 'Anonymous'}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-medium text-primary-700">{review.rating}</span>
                                  </div>
                                </div>
                                <p className="text-primary-900 text-sm leading-relaxed font-medium">{review.text?.text}</p>
                              </motion.div>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === 'tiktok' && (
                        <div>
                          {isTiktokLoading ? (
                            <motion.div
                              {...motionPresets.fadeIn}
                              className="flex flex-col items-center justify-center py-12 space-y-4"
                            >
                              <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
                              <div className="text-center">
                                <p className="text-primary-800 font-semibold">Fetching TikTok videos...</p>
                                <p className="text-sm text-primary-600 mt-1">This may take a few seconds</p>
                              </div>
                            </motion.div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {tiktokVideos.length === 0 ? (
                                <p className="col-span-full text-primary-500 text-center py-8">
                                  No TikTok videos available
                                </p>
                              ) : (
                                tiktokVideos.map((video, index) => (
                                  <motion.a
                                    key={video.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.05, y: -4 }}
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      'relative aspect-[9/16] rounded-lg overflow-hidden group',
                                      'bg-primary-100 shadow-md hover:shadow-xl',
                                      'transition-shadow duration-200'
                                    )}
                                  >
                                    <Image
                                      src={video.thumbnail}
                                      alt={video.description}
                                      fill
                                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                                      unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                      <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </motion.a>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'menu' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {menuPhotos.length === 0 ? (
                            <p className="col-span-full text-primary-500 text-center py-8">
                              No photos available
                            </p>
                          ) : (
                            menuPhotos.map((photo, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ scale: 1.05, rotate: 1 }}
                                onClick={() => setSelectedPhotoIndex(index)}
                                className={cn(
                                  'relative aspect-square rounded-lg overflow-hidden',
                                  'bg-primary-100 shadow-md hover:shadow-xl',
                                  'cursor-pointer transition-shadow duration-200'
                                )}
                              >
                                <Image
                                  src={photo.url}
                                  alt={`Photo ${index + 1}`}
                                  fill
                                  className="object-cover hover:scale-110 transition-transform duration-300"
                                  unoptimized
                                />
                              </motion.div>
                            ))
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>

        {/* Lightbox Overlay */}
        <AnimatePresence>
          {selectedPhotoIndex !== null && (
            <Dialog.Portal>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center"
                onClick={() => setSelectedPhotoIndex(null)}
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[70]"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Navigation Buttons */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                  className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[70]"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                  className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[70]"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 font-medium z-[70]">
                  {selectedPhotoIndex + 1} / {menuPhotos.length}
                </div>

                {/* Main Image */}
                <motion.div
                  key={selectedPhotoIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="relative w-full h-full max-w-5xl max-h-[85vh] mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={menuPhotos[selectedPhotoIndex].url}
                    alt={`Photo ${selectedPhotoIndex + 1}`}
                    fill
                    className="object-contain"
                    unoptimized
                    priority
                  />
                </motion.div>
              </motion.div>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
