import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import LocationService, { LocationData } from '../services/LocationService';

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
}

// Make sure to export the context
export const LocationContext = createContext<LocationContextType>({
  location: null,
  loading: false,
  error: null,
  requestLocation: async () => {},
});

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const hasPermission = await LocationService.requestPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }
      
      const locationData = await LocationService.getCurrentLocation();
      setLocation(locationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const value: LocationContextType = {
    location,
    loading,
    error,
    requestLocation,
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