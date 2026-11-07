import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { AppText } from './app-text';
import { Button } from './button';

export interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly placeholder for screens or lists with nothing to show yet. */
export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  const { space } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xxxl }}>
      <AppText variant="title3" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText color="textSecondary" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} style={{ marginTop: space.md }} />
      ) : null}
    </View>
  );
}
