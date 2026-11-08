import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

import { AppText } from './app-text';
import { Icon, type LucideIcon } from './icon';
import { PressableScale } from './pressable-scale';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
}

/** Selectable pill. Exposed to screen readers as a toggle. */
export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  const { colors, radius, space } = useTheme();
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <PressableScale
      accessibilityRole="togglebutton"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      pressedScale={0.95}
      style={[
        styles.base,
        { borderRadius: radius.pill, paddingHorizontal: space.lg, backgroundColor: selected ? colors.primary : colors.surfaceMuted },
      ]}>
      <View style={[styles.row, { gap: space.xs }]}>
        {icon ? <Icon icon={icon} size="sm" tint={fg} /> : null}
        <AppText variant="subhead" style={{ color: fg, fontWeight: '600' }}>
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: minTouchTarget - 6, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
