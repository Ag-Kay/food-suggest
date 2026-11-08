import { Pressable, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

import { AppText } from './app-text';

export interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** Pill-shaped segmented control (tabs within a screen). */
export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  const { colors, radius, space } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, padding: space.xs }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              minHeight: minTouchTarget - 4,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.pill,
              backgroundColor: selected ? colors.surface : 'transparent',
            }}>
            <AppText variant="subhead" color={selected ? 'text' : 'textSecondary'} style={{ fontWeight: '600' }}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
