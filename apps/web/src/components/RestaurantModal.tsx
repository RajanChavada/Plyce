'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Star, MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { Restaurant, Review, TikTokVideo, MenuPhoto, ApiService } from '@/services/api';

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

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-64">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-smooth"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white">{name}</h2>
            <div className="flex items-center gap-3 mt-2 text-white/90">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span>{restaurant.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <span>•</span>
              <span>{Array(restaurant.priceLevel || 1).fill('$').join('')}</span>
              <span>•</span>
              <span className="truncate">{restaurant.formattedAddress}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-smooth ${
                  activeTab === tab.id
                    ? 'border-accent-500 text-accent-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span>{restaurant.formattedAddress}</span>
                  </div>
                  {restaurant.types && (
                    <div className="flex flex-wrap gap-2">
                      {restaurant.types.slice(0, 5).map((type) => (
                        <span
                          key={type}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                        >
                          {type.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps/place/?q=place_id:${placeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-700 font-medium"
                  >
                    Open in Google Maps
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No reviews available</p>
                  ) : (
                    reviews.map((review, index) => (
                      <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {review.displayName?.text || 'Anonymous'}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm text-gray-600">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{review.text?.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'tiktok' && (
                <div>
                  {isTiktokLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                      <div className="text-center">
                        <p className="text-gray-700 font-medium">Fetching TikTok videos...</p>
                        <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {tiktokVideos.length === 0 ? (
                        <p className="col-span-full text-gray-500 text-center py-8">
                          No TikTok videos available
                        </p>
                      ) : (
                        tiktokVideos.map((video) => (
                          <a
                            key={video.id}
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-[9/16] rounded-lg overflow-hidden group bg-gray-100"
                          >
                            <Image
                              src={video.thumbnail}
                              alt={video.description}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </a>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'menu' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {menuPhotos.length === 0 ? (
                    <p className="col-span-full text-gray-500 text-center py-8">
                      No photos available
                    </p>
                  ) : (
                    menuPhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                          unoptimized
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
