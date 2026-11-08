import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

import { AppText } from './app-text';
import { Icon } from './icon';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Display-font section title with an optional "See all" link. */
export function SectionHeader({ title, actionLabel = 'See all', onAction }: SectionHeaderProps) {
  const { space } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
      <AppText variant="title2" style={{ flexShrink: 1 }}>
        {title}
      </AppText>
      {onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel}: ${title}`}
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => ({ minHeight: minTouchTarget, flexDirection: 'row', alignItems: 'center', gap: 2, opacity: pressed ? 0.6 : 1 })}>
          <AppText variant="subhead" color="textSecondary">
            {actionLabel}
          </AppText>
          <Icon icon={ChevronRight} size="sm" color="textSecondary" />
        </Pressable>
      ) : null}
    </View>
  );
}
