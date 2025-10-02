import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000000',
  },
  clearButton: {
    padding: 5,
  },
  // Keep these for compatibility with GooglePlacesAutocomplete
  autocompleteContainer: {
    flex: 0,
    width: '100%',
  },
  listView: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 5,
  },
  row: {
    padding: 13,
  },
  iconContainer: {
    marginRight: 10,
  },
});