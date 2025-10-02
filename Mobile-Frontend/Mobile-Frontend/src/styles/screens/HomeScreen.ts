import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Layout } from '../index';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    ...Typography.h2,
    fontWeight: 'bold',
    color: Colors.text,
  },
  profileButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray, // Changed from primary to gray
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeSection: {
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.medium,
  },
  welcomeText: {
    ...Typography.h1,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  userName: {
    ...Typography.h1,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.large,
    marginBottom: Spacing.large,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: Layout.borderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.small,
    ...Typography.body,
    color: Colors.text,
  },
  localSpotsHeader: {
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.medium,
  },
  localSpotsTitle: {
    ...Typography.h3,
    fontWeight: '600',
    color: Colors.text,
  },
  filtersSection: {
    paddingHorizontal: Spacing.large,
    marginBottom: Spacing.medium,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.small,
  },
  filtersButtonText: {
    ...Typography.body,
    marginLeft: Spacing.xs,
    color: Colors.text,
    fontWeight: '500',
  },
  filterPillsContainer: {
    flexDirection: 'row',
    marginTop: Spacing.small,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: Layout.borderRadius.full,
    marginRight: Spacing.small,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillText: {
    ...Typography.body,
    fontSize: 14,
    marginRight: Spacing.xs,
    color: Colors.text,
  },
  restaurantList: {
    paddingHorizontal: Spacing.large,
    paddingBottom: Spacing.large,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.base,
  },
  button: {
    backgroundColor: Colors.black, // Changed from primary to black
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.medium,
    borderRadius: Layout.borderRadius.medium,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  // Modal styles with improved animations
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalAnimatedContainer: {
    backgroundColor: 'transparent',
    borderTopLeftRadius: Layout.borderRadius.large,
    borderTopRightRadius: Layout.borderRadius.large,
    overflow: 'hidden',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Layout.borderRadius.large,
    borderTopRightRadius: Layout.borderRadius.large,
    paddingBottom: 30, // Extra padding for bottom safe area
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h4,
    fontWeight: '600',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalOptionSelected: {
    backgroundColor: Colors.veryLightGray,
  },
  modalOptionText: {
    ...Typography.body,
  },
  modalOptionTextSelected: {
    fontWeight: '600',
    color: Colors.black, // Changed from primary to black
  },
  locationInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.large,
    marginBottom: Spacing.medium,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  locationButtonText: {
    ...Typography.body,
    marginLeft: Spacing.small,
    fontWeight: '500',
  },
  radiusText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.small,
    marginRight: Spacing.small,
  },
});

export default styles;