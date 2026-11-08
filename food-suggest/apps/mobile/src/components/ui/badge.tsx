import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ColorToken } from '@/theme/tokens';

import { AppText } from './app-text';
import { Icon, type LucideIcon } from './icon';

export interface BadgeProps {
  label: string;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
  icon?: LucideIcon;
}

const TONES: Record<NonNullable<BadgeProps['tone']>, { bg: ColorToken; fg: ColorToken }> = {
  neutral: { bg: 'surfaceMuted', fg: 'textSecondary' },
  primary: { bg: 'primaryMuted', fg: 'link' },
  success: { bg: 'successMuted', fg: 'success' },
  warning: { bg: 'primaryMuted', fg: 'warning' },
  danger: { bg: 'dangerMuted', fg: 'danger' },
};

/** Small, non-interactive label. */
export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const { colors, radius, space } = useTheme();
  const t = TONES[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        backgroundColor: colors[t.bg],
        borderRadius: radius.pill,
        paddingHorizontal: space.sm + 2,
        paddingVertical: space.xs,
      }}>
      {icon ? <Icon icon={icon} size={13} color={t.fg} /> : null}
      <AppText variant="caption" color={t.fg}>
        {label}
      </AppText>
    </View>
  );
}
