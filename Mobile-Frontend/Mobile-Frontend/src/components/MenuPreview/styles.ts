import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  
  menuItemCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  menuItemImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  
  menuItemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  priceTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  
  priceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  menuItemInfo: {
    padding: 12,
  },
  
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  
  menuItemStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  statText: {
    fontSize: 11,
    color: '#666',
  },
  
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  
  noDataContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  
  noDataText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  viewOnMapsText: {
    marginTop: 4,
    fontSize: 12,
    color: '#0EA5E9',
  },
  
  viewFullMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  
  viewFullMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
    marginRight: 4,
  },
  
  menuPhotosHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  
  menuPhotosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  
  photosHintText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  
  // Menu Photo Styles
  menuPhotoCard: {
    width: 200,
    height: 280,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  menuPhotoImage: {
    width: '100%',
    height: '100%',
  },
  
  zoomIconContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  
  // Photo Modal Styles
  photoModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  
  modalHeaderContent: {
    flex: 1,
  },
  
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  modalSubtitle: {
    color: '#999',
    fontSize: 12,
  },
  
  closeButton: {
    padding: 4,
  },
  
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});
