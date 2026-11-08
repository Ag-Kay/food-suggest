import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText, Icon, PressableScale, type LucideIcon } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

export interface OptionRowProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** radio for single choice, checkbox for multiple. */
  kind?: 'radio' | 'checkbox';
  icon?: LucideIcon;
}

/** Large, accessible choice row with a visible selected state. */
export function OptionRow({
  label,
  description,
  selected,
  onPress,
  kind = 'radio',
  icon,
}: OptionRowProps) {
  const { colors, radius, space } = useTheme();
  return (
    <PressableScale
      accessibilityRole={kind}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      onPress={onPress}
      pressedScale={0.98}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        minHeight: minTouchTarget + 12,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : 'transparent',
        backgroundColor: selected ? colors.primaryMuted : colors.surface,
      }}
    >
      {icon ? <Icon icon={icon} size="lg" color={selected ? 'link' : 'textSecondary'} /> : null}
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
          borderColor: selected ? colors.primary : colors.textSecondary,
          backgroundColor: selected ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? <Icon icon={Check} size={14} tint={colors.onPrimary} strokeWidth={3} /> : null}
      </View>
    </PressableScale>
  );
}
