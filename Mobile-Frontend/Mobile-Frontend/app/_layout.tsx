
import { Stack } from 'expo-router';
import { LocationProvider } from '../contexts/LocationContext';
import ApiService from '../services/ApiService';
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
        />
      </LocationProvider>
    </>
  );
}

