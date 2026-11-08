import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export default function SignInLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        title: '',
        headerShadowVisible: false,
        headerTransparent: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.link,
        headerBackButtonDisplayMode: 'minimal',
      }}
    />
  );
}
