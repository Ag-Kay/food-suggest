import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export interface CardProps extends ViewProps {
  /** `muted` sits quietly on the page (no shadow); default is a raised surface. */
  tone?: 'raised' | 'muted';
}

/** Borderless rounded surface for grouped content. */
export function Card({ style, tone = 'raised', ...rest }: CardProps) {
  const { colors, radius, space, elevation } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tone === 'muted' ? colors.surfaceMuted : colors.surface,
          borderRadius: radius.lg,
          padding: space.lg,
        },
        tone === 'raised' ? elevation : null,
        style,
      ]}
      {...rest}
    />
  );
}
