import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import LocationService, { LocationData } from '../services/LocationService';

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionStatus: string | null;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType>({
  location: null,
  loading: true,
  error: null,
  permissionStatus: null,
  refreshLocation: async () => {},
});

export const useLocation = () => useContext(LocationContext);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider = ({ children }: LocationProviderProps) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  useEffect(() => {
    getInitialLocation();
  }, []);

  const getInitialLocation = async () => {
    try {
      const hasPermission = await LocationService.requestPermission();
      setPermissionStatus(hasPermission ? 'granted' : 'denied');
      
      if (hasPermission) {
        const currentLocation = await LocationService.getCurrentLocation();
        setLocation(currentLocation);
      } else {
        setError('Location permission denied');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = async () => {
    try {
      setLoading(true);
      const hasPermission = await LocationService.requestPermission();
      setPermissionStatus(hasPermission ? 'granted' : 'denied');
      
      if (hasPermission) {
        const currentLocation = await LocationService.getCurrentLocation();
        setLocation(currentLocation);
        setError(null);
      } else {
        setError('Location permission denied');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        permissionStatus,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};