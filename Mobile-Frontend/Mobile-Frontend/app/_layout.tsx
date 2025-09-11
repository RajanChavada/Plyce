import React from 'react';
import { Stack } from 'expo-router';
import { LocationProvider } from '../contexts/LocationContext';

export default function RootLayout() {
  return (
    <LocationProvider>
      <Stack 
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </LocationProvider>
  );
}