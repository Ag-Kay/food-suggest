import { ChevronRight } from 'lucide-react-native';
import { Children, isValidElement, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ColorToken } from '@/theme/tokens';
import { minTouchTarget } from '@/theme/tokens';

import { AppText } from './app-text';
import { Icon, type LucideIcon } from './icon';

export interface ListRowProps {
  icon?: LucideIcon;
  iconColor?: ColorToken;
  label: string;
  /** Short value on the right, e.g. "Vegetarian". */
  value?: string;
  /** Second line under the label. */
  detail?: string;
  onPress?: () => void;
  /** Replaces the chevron, e.g. a Switch. */
  accessory?: ReactNode;
  danger?: boolean;
  accessibilityHint?: string;
}

/** One row of a grouped list (settings style): icon, label, value, chevron. */
export function ListRow({ icon, iconColor, label, value, detail, onPress, accessory, danger, accessibilityHint }: ListRowProps) {
  const { colors, radius, space } = useTheme();
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: minTouchTarget + 8, paddingVertical: space.sm }}>
      {icon ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: danger ? colors.dangerMuted : colors.surfaceMuted,
          }}>
          <Icon icon={icon} size="sm" color={danger ? 'danger' : (iconColor ?? 'text')} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="body" color={danger ? 'danger' : 'text'}>
          {label}
        </AppText>
        {detail ? (
          <AppText variant="footnote" color="textSecondary" numberOfLines={2}>
            {detail}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="subhead" color="textSecondary" numberOfLines={1} style={{ maxWidth: '45%', textAlign: 'right' }}>
          {value}
        </AppText>
      ) : null}
      {accessory ?? (onPress ? <Icon icon={ChevronRight} size="md" color="textSecondary" /> : null)}
    </View>
  );

  if (!onPress) return <View accessible={!accessory}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[label, value, detail].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {content}
    </Pressable>
  );
}

/** Rounded group of rows with hairline separators and an optional heading. */
export function ListGroup({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  const { colors, radius, space, elevation } = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={{ gap: space.sm }}>
      {title ? (
        <AppText variant="footnote" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: space.xs }}>
          {title}
        </AppText>
      ) : null}
      <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: space.lg }, elevation]}>
        {rows.map((row, i) => (
          <View key={row.key ?? i} style={i ? { borderTopWidth: 0.5, borderTopColor: colors.border } : undefined}>
            {row}
          </View>
        ))}
      </View>
      {footer ? (
        <AppText variant="footnote" color="textSecondary" style={{ paddingHorizontal: space.xs }}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}
