import { View } from 'react-native';

import { AppText, PressableScale } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

import { dayLabel, dayOfMonth, shortWeekday, type DateKey } from '../dates';

export interface WeekStripProps {
  days: DateKey[];
  selected: DateKey;
  today: DateKey;
  /** Number of planned meals per day. */
  counts: Record<DateKey, number>;
  onSelect: (day: DateKey) => void;
}

/** Seven day pills; a dot marks days that have meals planned, a ring marks today. */
export function WeekStrip({ days, selected, today, counts, onSelect }: WeekStripProps) {
  const { colors, radius, space } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: space.xs }} accessibilityRole="tablist">
      {days.map((d) => {
        const isSelected = d === selected;
        const count = counts[d] ?? 0;
        const fg = isSelected ? colors.onPrimary : colors.text;
        return (
          <PressableScale
            key={d}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${dayLabel(d, today)}, ${count ? `${count} meal${count === 1 ? '' : 's'} planned` : 'nothing planned'}`}
            onPress={() => onSelect(d)}
            pressedScale={0.94}
            style={{
              flex: 1,
              minHeight: minTouchTarget + 28,
              alignItems: 'center',
              justifyContent: 'center',
              gap: space.xs,
              borderRadius: radius.pill,
              backgroundColor: isSelected ? colors.primary : colors.surface,
              borderWidth: d === today && !isSelected ? 1.5 : 0,
              borderColor: colors.primary,
            }}>
            <AppText variant="caption" style={{ color: isSelected ? colors.onPrimary : colors.textSecondary }}>
              {shortWeekday(d)}
            </AppText>
            <AppText variant="headline" style={{ color: fg }}>
              {dayOfMonth(d)}
            </AppText>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: count ? (isSelected ? colors.onPrimary : colors.primary) : 'transparent' }} />
          </PressableScale>
        );
      })}
    </View>
  );
}
