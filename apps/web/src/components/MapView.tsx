'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { Restaurant, ApiService } from '@/services/api';
import { Loader2, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, glassStyles } from '@/lib/glass-utils';

interface MapViewProps {
  restaurants: Restaurant[];
  userLocation: { lat: number; lng: number } | null;
  searchRadius: number;
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
}

// Enhanced map styles for glassmorphism aesthetic
const mapStyles = [
  // Hide default POI markers and labels
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  // Subtle, low-contrast roads
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      { lightness: 20 },
      { saturation: -50 },
    ],
  },
  // Softer labels
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748B' }],
  },
  // Muted water
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      { color: '#E0F2FE' },
      { lightness: 17 },
    ],
  },
  // Subtle landscape
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [
      { color: '#F8FAFC' },
      { lightness: 20 },
    ],
  },
];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const libraries: ("places")[] = ['places'];

export default function MapView({
  restaurants,
  userLocation,
  searchRadius,
  selectedRestaurant,
  onRestaurantSelect,
}: MapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [infoWindowRestaurant, setInfoWindowRestaurant] = useState<Restaurant | null>(null);

  const center = userLocation || { lat: 43.6532, lng: -79.3832 }; // Default to Toronto

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
  });

  useEffect(() => {
    if (map && userLocation) {
      map.panTo(userLocation);
    }
  }, [map, userLocation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Enhanced SVG marker icons with pulsing animation
  const userLocationIcon = 'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <!-- Outer pulse ring -->
        <circle cx="16" cy="16" r="14" fill="#0EA5E9" opacity="0.2">
          <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite"/>
        </circle>
        <!-- Middle ring -->
        <circle cx="16" cy="16" r="12" fill="#0EA5E9" opacity="0.4"/>
        <!-- Core -->
        <circle cx="16" cy="16" r="8" fill="#0EA5E9" stroke="#ffffff" stroke-width="3"/>
        <!-- Center dot -->
        <circle cx="16" cy="16" r="3" fill="#ffffff"/>
      </svg>
    `);

  const getRestaurantIcon = (isSelected: boolean) => {
    if (isSelected) {
      return 'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
            <!-- Outer glow -->
            <circle cx="24" cy="24" r="22" fill="#0EA5E9" opacity="0.15">
              <animate attributeName="r" values="22;26;22" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.15;0;0.15" dur="1.5s" repeatCount="indefinite"/>
            </circle>
            <!-- Shadow -->
            <ellipse cx="24" cy="26" rx="18" ry="16" fill="#000000" opacity="0.1"/>
            <!-- Main circle -->
            <circle cx="24" cy="24" r="18" fill="#0EA5E9" stroke="#ffffff" stroke-width="3"/>
            <!-- Inner ring -->
            <circle cx="24" cy="24" r="12" fill="#ffffff" opacity="0.3"/>
            <!-- Center dot -->
            <circle cx="24" cy="24" r="6" fill="#ffffff"/>
            <!-- Highlight -->
            <circle cx="20" cy="20" r="3" fill="#ffffff" opacity="0.6"/>
          </svg>
        `);
    }
    return 'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
          <!-- Shadow -->
          <ellipse cx="18" cy="20" rx="14" ry="12" fill="#000000" opacity="0.08"/>
          <!-- Main circle -->
          <circle cx="18" cy="18" r="14" fill="#64748B" stroke="#ffffff" stroke-width="2.5"/>
          <!-- Inner accent -->
          <circle cx="18" cy="18" r="8" fill="#ffffff" opacity="0.3"/>
          <!-- Center dot -->
          <circle cx="18" cy="18" r="5" fill="#ffffff"/>
          <!-- Subtle highlight -->
          <circle cx="15" cy="15" r="2" fill="#ffffff" opacity="0.5"/>
        </svg>
      `);
  };

  if (!apiKey) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'w-full h-full flex items-center justify-center',
          glassStyles.panel
        )}
      >
        <div className="text-center p-8">
          <p className="text-primary-700 font-semibold mb-2">Google Maps API key not configured</p>
          <p className="text-sm text-primary-500">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment</p>
        </div>
      </motion.div>
    );
  }

  if (loadError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'w-full h-full flex items-center justify-center',
          glassStyles.panel
        )}
      >
        <div className="text-center p-8">
          <p className="text-red-600 font-semibold mb-2">Error loading Google Maps</p>
          <p className="text-sm text-primary-500">{loadError.message}</p>
        </div>
      </motion.div>
    );
  }

  if (!isLoaded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'w-full h-full flex items-center justify-center',
          glassStyles.panel
        )}
      >
        <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
      </motion.div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: mapStyles,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        clickableIcons: false, // Prevent default POI clicks
        gestureHandling: 'greedy', // Smoother touch experience
      }}
    >
      {/* User Location Marker - Enhanced with animation */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            url: userLocationIcon,
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16),
          }}
          zIndex={1000}
        />
      )}

      {/* Search Radius Circle - Glass effect with pulsing animation */}
      {userLocation && (
        <Circle
          center={userLocation}
          radius={searchRadius}
          options={{
            fillColor: '#0EA5E9',
            fillOpacity: 0.08,
            strokeColor: '#0EA5E9',
            strokeOpacity: 0.4,
            strokeWeight: 2.5,
          }}
        />
      )}

      {/* Restaurant Markers - Enhanced with animated icons */}
      {restaurants.map((restaurant) => {
        const position = restaurant.location
          ? {
              lat: restaurant.location.latitude,
              lng: restaurant.location.longitude,
            }
          : null;

        if (!position || (position.lat === 0 && position.lng === 0)) return null;

        const isSelected = selectedRestaurant?.id === restaurant.id;

        return (
          <Marker
            key={restaurant.id || restaurant.place_id}
            position={position}
            onClick={() => {
              onRestaurantSelect(restaurant);
              setInfoWindowRestaurant(restaurant);
            }}
            icon={{
              url: getRestaurantIcon(isSelected),
              scaledSize: new window.google.maps.Size(isSelected ? 48 : 36, isSelected ? 48 : 36),
              anchor: new window.google.maps.Point(isSelected ? 24 : 18, isSelected ? 24 : 18),
            }}
            zIndex={isSelected ? 100 : 1}
            animation={isSelected ? window.google.maps.Animation.BOUNCE : undefined}
          />
        );
      })}

      {/* Info Window - Enhanced with glass styling */}
      {infoWindowRestaurant && infoWindowRestaurant.location && (
        <InfoWindow
          position={{
            lat: infoWindowRestaurant.location.latitude,
            lng: infoWindowRestaurant.location.longitude,
          }}
          onCloseClick={() => setInfoWindowRestaurant(null)}
          options={{
            pixelOffset: new window.google.maps.Size(0, -10),
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'p-3 max-w-xs rounded-lg',
              'bg-white/95 backdrop-blur-md',
              'border border-white/20 shadow-lg'
            )}
          >
            <h3 className="font-semibold text-primary-900 text-base">
              {infoWindowRestaurant.displayName?.text || infoWindowRestaurant.name}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-primary-700">
                  {infoWindowRestaurant.rating?.toFixed(1) || 'N/A'}
                </span>
              </div>
              <span className="text-primary-300">•</span>
              <span className="font-medium text-primary-600">
                {Array(infoWindowRestaurant.priceLevel || 1).fill('$').join('')}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onRestaurantSelect(infoWindowRestaurant)}
              className={cn(
                'mt-3 w-full px-3 py-1.5 rounded-lg text-sm font-medium',
                'bg-gradient-to-r from-accent-500 to-accent-600',
                'text-white shadow-md hover:shadow-lg',
                'transition-all duration-200'
              )}
            >
              View Details →
            </motion.button>
          </motion.div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
