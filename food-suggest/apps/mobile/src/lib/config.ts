import Constants from 'expo-constants';

const API_PORT = 4000;

/**
 * Base URL of the Food Suggest API.
 *
 * 1. EXPO_PUBLIC_API_URL (set in apps/mobile/.env.local, or per EAS build profile).
 * 2. Development fallback: the computer running the Expo dev server, port 4000.
 *    This lets Expo Go on a phone reach the API on the same Wi-Fi without setup.
 */
export function getApiBaseUrl(): string {
  // Must be a static `process.env.EXPO_PUBLIC_*` reference so Expo inlines it.
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  if (__DEV__) {
    const host = hostFromHostUri(Constants.expoConfig?.hostUri);
    if (host) return `http://${host}:${API_PORT}`;
    return `http://localhost:${API_PORT}`;
  }

  throw new Error('EXPO_PUBLIC_API_URL must be set for production builds');
}

/** "192.168.1.20:8081" → "192.168.1.20"; handles bracketed IPv6. */
export function hostFromHostUri(hostUri: string | undefined | null): string | null {
  if (!hostUri) return null;
  const withoutScheme = hostUri.replace(/^[a-z]+:\/\//i, '');
  if (withoutScheme.startsWith('[')) {
    const end = withoutScheme.indexOf(']');
    return end > 0 ? withoutScheme.slice(0, end + 1) : null;
  }
  const host = withoutScheme.split(/[:/]/)[0];
  return host || null;
}
