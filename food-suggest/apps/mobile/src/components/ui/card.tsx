import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Surface container used for grouped content. */
export function Card({ style, ...rest }: ViewProps) {
  const { colors, radius, space } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: space.lg,
        },
        style,
      ]}
      {...rest}
    />
  );
}
