// Re-export all style constants for easy importing
export { Colors } from './colors';
export { Typography } from './typography';
export { Spacing } from './spacing';
export { Layout } from './layout';

// Common style combinations
export const CommonStyles = {
  // Flex layouts
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' as const },
  flexColumn: { flexDirection: 'column' as const },

  // Alignment
  centerContent: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Text alignment
  textCenter: { textAlign: 'center' as const },
  textLeft: { textAlign: 'left' as const },
  textRight: { textAlign: 'right' as const },

  // Positioning
  absolute: { position: 'absolute' as const },
  relative: { position: 'relative' as const },

  // Common card style
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Common button style
  button: {
    backgroundColor: '#EE1D52',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Common input style
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
} as const;