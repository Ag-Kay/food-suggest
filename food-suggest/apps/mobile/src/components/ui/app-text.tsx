import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ColorToken, TypographyVariant } from '@/theme/tokens';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
}

const HEADING_VARIANTS: ReadonlySet<TypographyVariant> = new Set([
  'display',
  'largeTitle',
  'title1',
  'title2',
  'title3',
]);

/**
 * How far each style may grow with the phone's text size setting. Body text scales fully up to
 * the largest accessibility sizes; the big display titles are already large, so they stop
 * earlier and don't push the screen's content out of view.
 */
const MAX_SCALE: Partial<Record<TypographyVariant, number>> = {
  display: 1.4,
  largeTitle: 1.5,
  title1: 1.6,
};
const DEFAULT_MAX_SCALE = 2.5;

/** Themed text. Title variants are exposed to screen readers as headers. */
export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  const { colors, typography } = useTheme();
  return (
    <Text
      maxFontSizeMultiplier={MAX_SCALE[variant] ?? DEFAULT_MAX_SCALE}
      accessibilityRole={HEADING_VARIANTS.has(variant) ? 'header' : undefined}
      style={[typography[variant], { color: colors[color] }, style]}
      {...rest}
    />
  );
}
