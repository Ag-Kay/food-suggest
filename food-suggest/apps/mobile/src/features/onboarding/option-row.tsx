import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

export interface OptionRowProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** radio for single choice, checkbox for multiple. */
  kind?: 'radio' | 'checkbox';
}

/** Large, accessible choice row with a visible selected state. */
export function OptionRow({ label, description, selected, onPress, kind = 'radio' }: OptionRowProps) {
  const { colors, radius, space } = useTheme();
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        minHeight: minTouchTarget + 8,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderRadius: radius.lg,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primaryMuted : colors.surface,
        opacity: pressed ? 0.85 : 1,
      })}>
      <View style={{ flex: 1, gap: space.xxs }}>
        <AppText variant="headline">{label}</AppText>
        {description ? (
          <AppText variant="footnote" color="textSecondary">
            {description}
          </AppText>
        ) : null}
      </View>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: kind === 'radio' ? 12 : 6,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {selected ? (
          <AppText variant="caption" style={{ color: colors.onPrimary, fontWeight: '800' }}>
            ✓
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
