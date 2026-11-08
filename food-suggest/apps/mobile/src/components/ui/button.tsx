import { ActivityIndicator, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

import { AppText } from './app-text';
import { Icon, type LucideIcon } from './icon';
import { PressableScale } from './pressable-scale';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: LucideIcon;
  /** Compact pill for inline actions (e.g. on the meal page). */
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
}

/** Pill button. Primary = saffron fill; secondary = quiet surface; ghost = text only. */
export function Button({ label, variant = 'primary', loading = false, icon, size = 'md', disabled, style, ...rest }: ButtonProps) {
  const { colors, radius, space } = useTheme();
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.surfaceMuted
        : variant === 'danger'
          ? colors.dangerMuted
          : 'transparent';
  const foreground =
    variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.link : colors.text;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          minHeight: size === 'sm' ? minTouchTarget : 52,
          backgroundColor: background,
          borderRadius: radius.pill,
          paddingHorizontal: size === 'sm' ? space.lg : space.xl,
          opacity: isDisabled ? 0.45 : 1,
        },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={[styles.row, { gap: space.sm }]}>
          {icon ? <Icon icon={icon} size={size === 'sm' ? 'sm' : 'md'} tint={foreground} /> : null}
          <AppText variant={size === 'sm' ? 'subhead' : 'headline'} style={{ color: foreground, fontWeight: '600' }}>
            {label}
          </AppText>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
