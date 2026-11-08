import { View } from 'react-native';

import { AppText, Icon, type LucideIcon } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

/** Icon + short title + one line: used on intro and consent screens instead of cards and bullets. */
export function IconPoint({
  icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
}) {
  const { colors, radius, space } = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', gap: space.md, alignItems: body ? 'flex-start' : 'center' }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon icon={icon} color="link" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="headline">{title}</AppText>
        {body ? <AppText color="textSecondary">{body}</AppText> : null}
      </View>
    </View>
  );
}
