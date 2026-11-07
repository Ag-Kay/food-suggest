import { useEffect, useState } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { AppText } from './app-text';
import { Button } from './button';

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
      style={[{ backgroundColor: colors.surfaceMuted, borderRadius: radius.md, opacity }, style]}
    />
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { space } = useTheme();
  return (
    <View accessibilityRole="alert" style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xxl }}>
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
