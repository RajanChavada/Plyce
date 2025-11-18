
import { Stack } from 'expo-router';
import { LocationProvider } from '../src/contexts/LocationContext';
import ApiService from '../src/services/ApiService';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';

export default function RootLayout() {

  useEffect(() => {
    ApiService.initCache();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <LocationProvider>
        <Stack 
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FFFFFF' },
          }}
        >
          {/* Tab navigation is the main entry point */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Other screens accessible from tabs */}
          <Stack.Screen name="map-selection" options={{ headerShown: false }} />
          <Stack.Screen name="map-view-unified" options={{ headerShown: false }} />
          <Stack.Screen name="map-view" options={{ headerShown: false }} />
          <Stack.Screen name="restaurant/[id]/index" options={{ headerShown: false }} />
          <Stack.Screen name="restaurant/[id]/reviews" options={{ headerShown: false }} />
        </Stack>
      </LocationProvider>
    </>
  );
}

