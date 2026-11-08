import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

export interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  /** Space between top-level sections (default: generous section gap). */
  gap?: number;
  /** Safe-area edges; screens under a native header usually drop 'top'. */
  edges?: Edge[];
  /** Pinned content below the scroll area (e.g. a primary action). */
  footer?: ReactNode;
}

/** Standard screen frame: themed background, safe areas, page gutter and section spacing. */
export function Screen({ children, scroll = true, gap, edges = ['top', 'left', 'right'], footer }: ScreenProps) {
  const { colors, layout, space } = useTheme();
  const content = { paddingHorizontal: layout.gutter, paddingTop: space.lg, paddingBottom: space.xxxl, gap: gap ?? layout.section };

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, content]}>{children}</View>
      )}
      {footer ? (
        <View style={{ paddingHorizontal: layout.gutter, paddingTop: space.md, paddingBottom: space.md, backgroundColor: colors.background }}>
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
