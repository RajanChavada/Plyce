import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import LocationService, { LocationData } from '../services/LocationService';

interface ExtendedLocationData extends LocationData {
  radius?: number;
  address?: string;
}

interface LocationContextType {
  location: ExtendedLocationData | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  setCustomLocation: (location: ExtendedLocationData) => void;
  isCustomLocation: boolean;
  resetToCurrentLocation: () => Promise<void>;
}

// Make sure to export the context
export const LocationContext = createContext<LocationContextType>({
  location: null,
  loading: false,
  error: null,
  requestLocation: async () => {},
  setCustomLocation: () => {},
  isCustomLocation: false,
  resetToCurrentLocation: async () => {},
});

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<ExtendedLocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomLocation, setIsCustomLocation] = useState(false);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const hasPermission = await LocationService.requestPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }
      
      const locationData = await LocationService.getCurrentLocation();
      setLocation({
        ...locationData,
        radius: 5000 // Default 5km radius
      });
      setIsCustomLocation(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const setCustomLocation = (customLocation: ExtendedLocationData) => {
    setLocation(customLocation);
    setIsCustomLocation(true);
  };

  const resetToCurrentLocation = async () => {
    await requestLocation();
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const value: LocationContextType = {
    location,
    loading,
    error,
    requestLocation,
    setCustomLocation,
    isCustomLocation,
    resetToCurrentLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

// Export a custom hook for using the context
export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};