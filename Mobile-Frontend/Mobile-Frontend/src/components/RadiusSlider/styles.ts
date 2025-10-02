import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../styles';

export default StyleSheet.create({
  container: {
    width: '100%',
    padding: Spacing.medium,
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.medium,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.medium,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: Spacing.small,
  },
  minText: {
    fontSize: 14,
    color: '#6B7280',
    width: 30,
  },
  maxText: {
    fontSize: 14,
    color: '#6B7280',
    width: 30,
    textAlign: 'right',
  },
  markersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
    height: 20,
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 20,
  },
  marker: {
    height: 8,
    width: 2,
    backgroundColor: '#6B7280',
    marginBottom: 2,
  },
  activeMarker: {
    backgroundColor: '#000',
    height: 12,
    width: 3,
  },
  markerText: {
    fontSize: 10,
    color: '#6B7280',
  },
  activeMarkerText: {
    color: '#000',
    fontWeight: 'bold',
  }
});