import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  radius: number;
  address?: string;
}

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  setCustomLocation: (location: LocationData) => void;
  refreshLocation: () => Promise<void>;
}

// Make sure to export the context
export const LocationContext = createContext<LocationContextType>({
  location: null,
  loading: true,
  error: null,
  setCustomLocation: () => {},
  refreshLocation: async () => {},
});

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        radius: 2000, // Changed from 5000 to 2000 (2km default)
        address: 'Current Location'
      });
    } catch (err) {
      setError('Failed to get location');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setCustomLocation = (newLocation: LocationData) => {
    setLocation(newLocation);
  };

  const refreshLocation = async () => {
    await getCurrentLocation();
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const value: LocationContextType = {
    location,
    loading,
    error,
    setCustomLocation,
    refreshLocation
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