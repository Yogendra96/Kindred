import { Linking, Platform } from 'react-native';

export function openAppLink(url: string) {
  Linking.openURL(url).catch(error => {
    // Handle error
    console.warn('Failed to open URL:', error);
  });
}

export function getDeepLinkPrefix() {
  // Both platforms use the same scheme for consistency
  return Platform.OS === 'android' || Platform.OS === 'ios' ? 'kindred://' : '';
}

// Example: Handle incoming deep links (to be used in a useEffect or event listener)
export function subscribeToDeepLinks(callback: (url: string) => void) {
  const handler = ({ url }: { url: string }) => callback(url);
  const subscription = Linking.addEventListener('url', handler);
  return () => subscription.remove();
}
