import { Redirect } from 'expo-router';

// Redirect to Map tab as default (Tab 2)
export default function Index() {
  return <Redirect href="/(tabs)/map" />;
}
