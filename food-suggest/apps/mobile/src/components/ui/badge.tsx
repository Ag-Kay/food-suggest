import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ColorToken } from '@/theme/tokens';

import { AppText } from './app-text';

export interface BadgeProps {
  label: string;
  tone?: 'neutral' | 'primary' | 'warning' | 'danger';
}

const TONES: Record<NonNullable<BadgeProps['tone']>, { bg: ColorToken; fg: ColorToken }> = {
  neutral: { bg: 'surfaceMuted', fg: 'textSecondary' },
  primary: { bg: 'primaryMuted', fg: 'primary' },
  warning: { bg: 'surfaceMuted', fg: 'warning' },
  danger: { bg: 'surfaceMuted', fg: 'danger' },
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { colors, radius, space } = useTheme();
  const t = TONES[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: colors[t.bg],
        borderRadius: radius.sm,
        paddingHorizontal: space.sm,
        paddingVertical: space.xxs,
      }}>
      <AppText variant="caption" color={t.fg}>
        {label}
      </AppText>
    </View>
  );
}
