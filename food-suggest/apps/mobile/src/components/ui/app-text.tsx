import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ColorToken, TypographyVariant } from '@/theme/tokens';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
}

const HEADING_VARIANTS: ReadonlySet<TypographyVariant> = new Set([
  'largeTitle',
  'title1',
  'title2',
  'title3',
]);

/** Themed text. Title variants are exposed to screen readers as headers. */
export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  const { colors, typography } = useTheme();
  return (
    <Text
      accessibilityRole={HEADING_VARIANTS.has(variant) ? 'header' : undefined}
      style={[typography[variant], { color: colors[color] }, style]}
      {...rest}
    />
  );
}
