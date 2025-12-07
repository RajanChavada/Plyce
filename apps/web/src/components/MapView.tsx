'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { Restaurant, ApiService } from '@/services/api';
import { Loader2 } from 'lucide-react';

interface MapViewProps {
  restaurants: Restaurant[];
  userLocation: { lat: number; lng: number } | null;
  searchRadius: number;
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant) => void;
}

const mapStyles = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
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

  // Create marker icon URLs (SVG data URIs that don't need google object)
  const userLocationIcon = 'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#0EA5E9" stroke="#ffffff" stroke-width="3"/>
      </svg>
    `);

  const getRestaurantIcon = (isSelected: boolean) => {
    if (isSelected) {
      return 'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="#0EA5E9" stroke="#ffffff" stroke-width="3"/>
            <circle cx="20" cy="20" r="6" fill="#ffffff"/>
          </svg>
        `);
    }
    return 'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="#64748B" stroke="#ffffff" stroke-width="2"/>
          <circle cx="16" cy="16" r="5" fill="#ffffff"/>
        </svg>
      `);
  };

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-2">Google Maps API key not configured</p>
          <p className="text-sm text-gray-400">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-red-600 mb-2">Error loading Google Maps</p>
          <p className="text-sm text-gray-400">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
      </div>
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
      }}
    >
      {/* User Location Marker */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            url: userLocationIcon,
            scaledSize: new window.google.maps.Size(24, 24),
            anchor: new window.google.maps.Point(12, 12),
          }}
          zIndex={1000}
        />
      )}

      {/* Search Radius Circle */}
      {userLocation && (
        <Circle
          center={userLocation}
          radius={searchRadius}
          options={{
            fillColor: '#0EA5E9',
            fillOpacity: 0.1,
            strokeColor: '#0EA5E9',
            strokeOpacity: 0.3,
            strokeWeight: 2,
          }}
        />
      )}

      {/* Restaurant Markers */}
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
              scaledSize: new window.google.maps.Size(isSelected ? 40 : 32, isSelected ? 40 : 32),
              anchor: new window.google.maps.Point(isSelected ? 20 : 16, isSelected ? 20 : 16),
            }}
            zIndex={isSelected ? 100 : 1}
          />
        );
      })}

      {/* Info Window */}
      {infoWindowRestaurant && infoWindowRestaurant.location && (
        <InfoWindow
          position={{
            lat: infoWindowRestaurant.location.latitude,
            lng: infoWindowRestaurant.location.longitude,
          }}
          onCloseClick={() => setInfoWindowRestaurant(null)}
        >
          <div className="p-2 max-w-xs">
            <h3 className="font-semibold text-gray-900">
              {infoWindowRestaurant.displayName?.text || infoWindowRestaurant.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <span>⭐ {infoWindowRestaurant.rating?.toFixed(1) || 'N/A'}</span>
              <span>•</span>
              <span>
                {Array(infoWindowRestaurant.priceLevel || 1).fill('$').join('')}
              </span>
            </div>
            <button
              onClick={() => onRestaurantSelect(infoWindowRestaurant)}
              className="mt-2 text-sm text-accent-600 hover:text-accent-700 font-medium"
            >
              View Details →
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
