import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import styles from './styles';

interface RadiusSliderProps {
  value: number; // in meters
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const RadiusSlider: React.FC<RadiusSliderProps> = ({ 
  value, 
  onValueChange,
  min = 5000,
  max = 25000,
  step = 5000
}) => {
  const displayValue = value / 1000; // Convert to km for display
  
  return (
    <View style={styles.container}>
      <Text style={styles.valueText}>Search Radius: {displayValue} km</Text>
      
      <View style={styles.sliderRow}>
        <Text style={styles.minText}>5km</Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={value}
          onValueChange={onValueChange}
          minimumTrackTintColor="#000"
          maximumTrackTintColor="#D0D0D0"
          thumbTintColor="#000"
        />
        <Text style={styles.maxText}>25km</Text>
      </View>
      
      <View style={styles.markersContainer}>
        {[5, 10, 15, 20, 25].map((km) => (
          <View key={km} style={[
            styles.markerContainer,
            // Adjust position based on index
            { 
              left: `${(((km-5)/20) * 100)}%`,
              marginLeft: -1,
            }
          ]}>
            <View style={[
              styles.marker, 
              km * 1000 === value ? styles.activeMarker : null
            ]} />
            <Text style={[
              styles.markerText,
              km * 1000 === value ? styles.activeMarkerText : null
            ]}>
              {km}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default RadiusSlider;