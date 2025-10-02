import React from 'react';
import { StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import MapSelectionScreen from '../src/screens/MapSelectionScreen';

export default function MapPage() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen 
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom',
        }} 
      />
      <MapSelectionScreen />
    </>
  );
}