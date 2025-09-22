import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Layout } from '../index';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.base,
  },
  button: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.base,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  addReviewButton: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  addReviewText: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text,
  },
  restaurantCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderRadius: Layout.borderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.white,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 250,
    backgroundColor: Colors.veryLightGray,
  },
  restaurantImage: {
    width: "100%",
    height: "100%",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantDetails: {
    padding: Spacing.base,
  },
  restaurantName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  cuisineType: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  section: {
    padding: Spacing.base,
    borderTopWidth: 8,
    borderTopColor: Colors.sectionBackground,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.base,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  reviewerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 4,
  },
  reviewText: {
    fontSize: Typography.fontSize.base,
    lineHeight: 20,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  reviewRating: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  photoScroll: {
    flexDirection: "row",
    marginTop: Spacing.sm,
  },
  photoContainer: {
    marginRight: Spacing.sm,
    borderRadius: Layout.borderRadius.base,
    overflow: "hidden",
  },
  reviewPhoto: {
    width: 100,
    height: 100,
    borderRadius: Layout.borderRadius.base,
  },
  seeMoreButton: {
    marginTop: Spacing.sm,
    alignSelf: "center",
    padding: Spacing.sm,
  },
  seeMoreText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    textDecorationLine: "underline",
  },
  noReviewsText: {
    textAlign: "center",
    padding: Spacing.lg,
    color: Colors.textLight,
    fontStyle: "italic",
  },
  placeholderText: {
    textAlign: "center",
    padding: Spacing.lg,
    color: Colors.textLight,
    fontStyle: "italic",
  },
  tiktokList: {
    paddingVertical: Spacing.md,
  },
  tiktokCard: {
    width: 200,
    height: 150,
    marginRight: Spacing.md,
    borderRadius: Layout.borderRadius.base,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    justifyContent: "space-between",
    ...Layout.shadow.sm,
  },
  tiktokIconContainer: {
    alignItems: "flex-start",
  },
  tiktokTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginVertical: Spacing.sm,
  },
  tiktokButton: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
  },
  tiktokButtonText: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.sm,
  },
  noResultsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.sectionBackground,
    borderRadius: Layout.borderRadius.base,
    paddingVertical: Spacing.base,
  },
  noResultsText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  tiktokScroll: {
    paddingVertical: Spacing.sm,
  },
  tiktokVideoCard: {
    width: 180,
    height: 240,
    marginRight: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.white,
    ...Layout.shadow.base,
  },
  tiktokThumbnail: {
    width: "100%",
    height: 150,
    backgroundColor: Colors.veryLightGray,
  },
  tiktokVideoOverlay: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(238, 29, 82, 0.9)",
    borderRadius: Layout.borderRadius.xl,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tiktokVideoInfo: {
    padding: 10,
  },
  tiktokVideoDesc: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  tiktokButtonContainer: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Layout.borderRadius.lg,
    alignItems: "center",
  },
  tiktokLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    height: 200,
  },
  tiktokLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 4,
    opacity: 0.6,
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  spinningIcon: {
    transform: [{ rotate: "45deg" }],
  },
  tagContainer: {
    backgroundColor: Colors.veryLightGray,
    paddingHorizontal: Spacing.small,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.full,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tagText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});

// Export both default and named export for compatibility
export const restaurantDetailsStyles = styles;
export default styles;