import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { createQueryClient } from '@/lib/query-client';
import { startAuthListener } from '@/stores/auth';
import { useProfileSync } from '@/features/account/use-profile-sync';

startAuthListener();

export default function RootLayout() {
  const { scheme, colors } = useTheme();
  const [queryClient] = useState(createQueryClient);
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileSync />
      <ThemeProvider
        value={{
          ...base,
          colors: {
            ...base.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
          },
        }}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerTintColor: colors.primary, headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="meal/[slug]" options={{ title: '' }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="favorites" options={{ title: 'Saved meals' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ProfileSync() {
  useProfileSync();
  return null;
}
