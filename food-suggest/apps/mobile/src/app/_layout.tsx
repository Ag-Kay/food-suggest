import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { useFonts } from 'expo-font';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { startNetworkListener } from '@/lib/network';
import { createQueryClient } from '@/lib/query-client';
import { persistQueryCache, restoreQueryCache } from '@/lib/query-persist';
import { startAuthListener } from '@/stores/auth';
import { useProfileSync } from '@/features/account/use-profile-sync';
import { useAccountSync } from '@/features/sync/use-account-sync';

startAuthListener();
startNetworkListener();

export default function RootLayout() {
  const { scheme, colors } = useTheme();
  const [queryClient] = useState(createQueryClient);
  // Meals seen before stay readable offline: restore them before the first screen renders.
  const [cacheReady, setCacheReady] = useState(false);
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    void restoreQueryCache(queryClient).finally(() => {
      if (cancelled) return;
      stop = persistQueryCache(queryClient);
      setCacheReady(true);
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [queryClient]);
  // Fraunces is bundled with the app, so this resolves almost instantly; a load error
  // falls back to the system font rather than blocking the app.
  const [fontsLoaded, fontError] = useFonts({ Fraunces_600SemiBold, Fraunces_700Bold });
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  if ((!fontsLoaded && !fontError) || !cacheReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileSync />
      <ThemeProvider
        value={{
          ...base,
          colors: {
            ...base.colors,
            primary: colors.link,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
          },
        }}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerTintColor: colors.link, headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="meal/[slug]" options={{ title: '' }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="favorites" options={{ title: 'Saved meals' }} />
          <Stack.Screen name="privacy" options={{ title: 'Your data' }} />
          <Stack.Screen name="credits" options={{ title: 'Photo credits' }} />
          <Stack.Screen name="privacy-policy" options={{ title: 'Privacy policy', presentation: 'modal' }} />
          <Stack.Screen
            name="discover-filters"
            options={{ title: 'Filters', presentation: 'formSheet', sheetAllowedDetents: [0.6, 0.9], sheetGrabberVisible: true }}
          />
          <Stack.Screen name="plan/schedule" options={{ title: 'Add to plan', presentation: 'modal' }} />
          <Stack.Screen name="plan/pick-meal" options={{ title: 'Choose a meal', presentation: 'modal' }} />
          <Stack.Screen
            name="plan/entry"
            options={{ title: '', presentation: 'formSheet', sheetAllowedDetents: [0.55, 0.85], sheetGrabberVisible: true }}
          />
          <Stack.Screen name="lists/[id]" options={{ title: '' }} />
          <Stack.Screen name="lists/edit" options={{ title: '', presentation: 'formSheet', sheetAllowedDetents: [0.6, 0.9], sheetGrabberVisible: true }} />
          <Stack.Screen
            name="lists/actions"
            options={{ title: '', presentation: 'formSheet', sheetAllowedDetents: [0.45, 0.7], sheetGrabberVisible: true }}
          />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ProfileSync() {
  useProfileSync();
  useAccountSync();
  return null;
}
