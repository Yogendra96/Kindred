import { Linking, Platform } from 'react-native';

export function openAppLink(url: string) {
  Linking.openURL(url).catch(err => {
    // Handle error
    console.warn('Failed to open URL:', err);
  });
}

export function getDeepLinkPrefix() {
  if (Platform.OS === 'android') {
    return 'kindred://';
  } else if (Platform.OS === 'ios') {
    return 'kindred://';
  }
  return '';
}

// Example: Handle incoming deep links (to be used in a useEffect or event listener)
export function subscribeToDeepLinks(callback: (url: string) => void) {
  const handler = ({ url }: { url: string }) => callback(url);
  const subscription = Linking.addEventListener('url', handler);
  return () => subscription.remove();
}
