import { useEffect, useState } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';

import { CloudOff, WifiOff } from 'lucide-react-native';

import { useIsOnline } from '@/lib/network';

import { useTheme } from '@/hooks/use-theme';

import { AppText } from './app-text';
import { Button } from './button';
import { Icon } from './icon';

/** Pulsing grey block used to sketch content while it loads. */
export function Skeleton({ style }: { style?: ViewStyle }) {
  const { colors, radius } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[{ backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, opacity }, style]}
    />
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { space } = useTheme();
  return (
    <View accessibilityRole="alert" style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xxl }}>
      <Icon icon={CloudOff} size="xl" color="textSecondary" />
      <AppText variant="title3" style={{ textAlign: 'center' }}>
        Something went wrong
      </AppText>
      <AppText color="textSecondary" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} style={{ marginTop: space.sm }} /> : null}
    </View>
  );
}

/** Shown instead of a skeleton when there's nothing saved to show and the phone is offline. */
export function OfflineState({ message = "Connect to the internet to see this. Meals you've opened before still work offline." }: { message?: string }) {
  const { space } = useTheme();
  return (
    <View accessibilityRole="alert" style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xxl }}>
      <Icon icon={WifiOff} size="xl" color="textSecondary" />
      <AppText variant="title3" style={{ textAlign: 'center' }}>
        You&apos;re offline
      </AppText>
      <AppText color="textSecondary" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
    </View>
  );
}

/** Slim notice while offline; renders nothing when online. */
export function OfflineBanner({ message = "You're offline. Showing meals saved on this phone." }: { message?: string }) {
  const online = useIsOnline();
  const { colors, radius, space } = useTheme();
  if (online) return null;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm }}>
      <Icon icon={WifiOff} size="sm" color="textSecondary" />
      <AppText variant="footnote" color="textSecondary" style={{ flex: 1 }}>
        {message}
      </AppText>
    </View>
  );
}

/** A query that has no data yet and is waiting for the connection to come back. */
export const isWaitingForNetwork = (q: { isPending: boolean; fetchStatus: string }) => q.isPending && q.fetchStatus === 'paused';
