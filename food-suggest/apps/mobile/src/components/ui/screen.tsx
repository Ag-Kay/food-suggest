import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

export interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
}

/** Standard screen frame: themed background, safe areas and page padding. */
export function Screen({ children, scroll = true }: ScreenProps) {
  const { colors, space } = useTheme();
  const content = { padding: space.lg, gap: space.lg };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={content} contentInsetAdjustmentBehavior="automatic">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
