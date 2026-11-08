import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ColorToken } from '@/theme/tokens';
import { minTouchTarget } from '@/theme/tokens';

import { Icon, type LucideIcon } from './icon';
import { PressableScale } from './pressable-scale';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: LucideIcon;
  /** Required: icon-only controls need a spoken name. */
  label: string;
  /** `onImage` = frosted circle for use on photos; `filled` = saffron; `plain` = no background. */
  tone?: 'surface' | 'onImage' | 'filled' | 'plain';
  color?: ColorToken;
  /** Fill the glyph (e.g. a saved heart). */
  active?: boolean;
  activeColor?: string;
  style?: StyleProp<ViewStyle>;
}

/** Round, icon-only button with a 44 pt touch target. */
export function IconButton({ icon, label, tone = 'surface', color, active, activeColor, style, ...rest }: IconButtonProps) {
  const { colors, radius } = useTheme();
  const bg =
    tone === 'onImage' ? colors.imageButton : tone === 'filled' ? colors.primary : tone === 'surface' ? colors.surfaceMuted : 'transparent';
  const fg = active && activeColor ? activeColor : tone === 'onImage' ? colors.onImage : tone === 'filled' ? colors.onPrimary : colors[color ?? 'text'];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      pressedScale={0.9}
      style={[
        { width: minTouchTarget, height: minTouchTarget, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: bg },
        style,
      ]}
      {...rest}>
      <Icon icon={icon} size="md" tint={fg} />
    </PressableScale>
  );
}
