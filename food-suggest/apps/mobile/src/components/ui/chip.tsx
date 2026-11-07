import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

import { AppText } from './app-text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Selectable filter chip. Exposed to screen readers as a toggle. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  const { colors, radius, space } = useTheme();
  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: radius.pill,
          paddingHorizontal: space.md,
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <AppText variant="subhead" style={{ color: selected ? colors.onPrimary : colors.text, fontWeight: '600' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: minTouchTarget - 8, justifyContent: 'center', borderWidth: 1 },
});
