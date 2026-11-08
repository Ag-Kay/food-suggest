import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { AppText } from './app-text';
import { Button } from './button';
import { Icon, type LucideIcon } from './icon';

export interface EmptyStateProps {
  title: string;
  message: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly placeholder for screens or lists with nothing to show yet. */
export function EmptyState({ title, message, icon, actionLabel, onAction }: EmptyStateProps) {
  const { colors, space } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xxxl, paddingHorizontal: space.lg }}>
      {icon ? (
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: space.sm,
          }}>
          <Icon icon={icon} size="xl" color="link" />
        </View>
      ) : null}
      <AppText variant="title2" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText color="textSecondary" style={{ textAlign: 'center', maxWidth: 300 }}>
        {message}
      </AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} style={{ marginTop: space.md }} /> : null}
    </View>
  );
}
