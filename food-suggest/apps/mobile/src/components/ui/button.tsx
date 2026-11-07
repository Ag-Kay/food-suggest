import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

import { AppText } from './app-text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors, radius, space } = useTheme();
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.primaryMuted : 'transparent';
  const foreground = variant === 'primary' ? colors.onPrimary : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        {
          backgroundColor: background,
          borderRadius: radius.md,
          paddingHorizontal: space.xl,
          opacity: isDisabled ? 0.5 : state.pressed ? 0.85 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <AppText variant="headline" style={{ color: foreground }}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Math.max(minTouchTarget, 48),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
