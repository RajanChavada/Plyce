import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Layout } from '../index';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Spacing.medium,
    padding: Spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: Layout.borderRadius.small,
    overflow: 'hidden',
    marginRight: Spacing.medium,
    backgroundColor: Colors.veryLightGray,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  chainBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  chainBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(240, 240, 240, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...Typography.h4,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cuisineType: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.small,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.veryLightGray,
    paddingHorizontal: Spacing.small,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.full,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingLeft: Spacing.small,
  }
});

export default styles;