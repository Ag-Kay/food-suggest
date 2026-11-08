import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, ShoppingBasket } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { MealSlot } from '@food-suggest/shared';

import { AppText, Button, Icon, IconButton, PressableScale, Screen } from '@/components/ui';
import { useMealImages } from '@/features/meals/use-meal-images';
import { DayNutrition } from '@/features/plan/components/day-nutrition';
import { PlanEntryRow } from '@/features/plan/components/plan-entry-row';
import { WeekStrip } from '@/features/plan/components/week-strip';
import { addDays, dayLabel, isDateKey, rangeLabel, startOfWeek, todayKey, weekDays, type DateKey } from '@/features/plan/dates';
import { useMakeShoppingList } from '@/features/shopping/use-make-list';
import { useTheme } from '@/hooks/use-theme';
import { SLOT_ICONS } from '@/lib/icons';
import { SLOT_LABELS } from '@/lib/labels';
import { entriesBetween, useMealPlan } from '@/stores/meal-plan';
import { minTouchTarget } from '@/theme/tokens';

function SlotSection({ slot, day, children, empty }: { slot: MealSlot; day: DateKey; children: React.ReactNode; empty: boolean }) {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const add = () => router.push({ pathname: '/plan/pick-meal', params: { date: day, slot } });
  const label = SLOT_LABELS[slot];

  if (empty) {
    // An empty slot is one quiet row, not a box.
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Add ${label.toLowerCase()} for ${dayLabel(day)}`}
        onPress={add}
        pressedScale={0.98}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: minTouchTarget + 16, paddingHorizontal: space.md, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border }}>
        <Icon icon={SLOT_ICONS[slot]} color="textSecondary" />
        <AppText color="textSecondary" style={{ flex: 1 }}>
          {label}
        </AppText>
        <Icon icon={Plus} color="link" />
      </PressableScale>
    );
  }

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Icon icon={SLOT_ICONS[slot]} size="sm" color="link" />
        <AppText variant="subhead" color="textSecondary" style={{ flex: 1, fontWeight: '600' }}>
          {label}
        </AppText>
        <IconButton icon={Plus} label={`Add another ${label.toLowerCase()}`} tone="plain" color="link" onPress={add} />
      </View>
      {children}
    </View>
  );
}

export default function PlanScreen() {
  const { space } = useTheme();
  const params = useLocalSearchParams<{ date?: string }>();
  const today = todayKey();
  const [selected, setSelected] = useState<DateKey>(isDateKey(params.date) ? params.date : today);
  const entries = useMealPlan((s) => s.entries);
  const images = useMealImages();
  const makeList = useMakeShoppingList();

  // "Open meal plan" from another screen jumps to that day (state adjusted during render).
  const [seenParam, setSeenParam] = useState(params.date);
  if (params.date !== seenParam) {
    setSeenParam(params.date);
    if (isDateKey(params.date)) setSelected(params.date);
  }

  const weekStart = startOfWeek(selected);
  const days = weekDays(weekStart);
  const weekEnd = days[6]!;
  const counts: Record<DateKey, number> = {};
  for (const e of entries) counts[e.date] = (counts[e.date] ?? 0) + 1;

  const dayEntries = entriesBetween(entries, selected, selected);
  // Past days are already shopped for: a list for this week starts today.
  const shopStart = weekStart < today && today <= weekEnd ? today : weekStart;
  const toShop = weekEnd < today ? [] : entriesBetween(entries, shopStart, weekEnd);

  return (
    <Screen
      gap={space.xl}
      footer={
        <Button
          label={toShop.length ? `Shopping list · ${toShop.length} meal${toShop.length === 1 ? '' : 's'}` : 'Shopping list'}
          icon={ShoppingBasket}
          disabled={!toShop.length}
          loading={makeList.isPending}
          accessibilityHint={`Adds up the ingredients for meals planned from ${dayLabel(shopStart, today)} to ${dayLabel(weekEnd, today)}`}
          onPress={() => makeList.mutate({ start: shopStart, end: weekEnd })}
        />
      }>
      <View style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="display">Meal plan</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon={ChevronLeft} label="Previous week" onPress={() => setSelected(addDays(selected, -7))} />
          <AppText variant="headline">{rangeLabel(weekStart, weekEnd)}</AppText>
          <IconButton icon={ChevronRight} label="Next week" onPress={() => setSelected(addDays(selected, 7))} />
        </View>
        <WeekStrip days={days} selected={selected} today={today} counts={counts} onSelect={setSelected} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="title1">{dayLabel(selected, today)}</AppText>
        {selected !== today ? (
          <Pressable accessibilityRole="button" onPress={() => setSelected(today)} hitSlop={8} style={{ minHeight: minTouchTarget, justifyContent: 'center' }}>
            <AppText variant="subhead" color="link" style={{ fontWeight: '600' }}>
              Today
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={{ gap: space.md }}>
        {MealSlot.options.map((slot) => {
          const inSlot = dayEntries.filter((e) => e.slot === slot);
          return (
            <SlotSection key={slot} slot={slot} day={selected} empty={!inSlot.length}>
              {inSlot.map((entry) => (
                <PlanEntryRow key={entry.id} entry={entry} imageUrl={images.get(entry.slug)} />
              ))}
            </SlotSection>
          );
        })}
      </View>

      <DayNutrition slugs={dayEntries.map((e) => e.slug)} />
    </Screen>
  );
}
