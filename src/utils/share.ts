import { Platform, Share } from 'react-native';

export async function shareContent({
  title,
  message,
  url,
}: {
  title?: string;
  message: string;
  url?: string;
}) {
  return await Share.share(
    Platform.select({
      ios: { title, message: message + (url ? `\n${url}` : ''), url },
      android: { title, message: message + (url ? `\n${url}` : ''), url },
      default: { title, message: message + (url ? `\n${url}` : ''), url },
    }) || { message },
  );
}
