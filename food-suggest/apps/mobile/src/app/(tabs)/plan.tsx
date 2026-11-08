import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { MealSlot } from '@food-suggest/shared';

import { AppText, Button, Card, Screen } from '@/components/ui';
import { DayNutrition } from '@/features/plan/components/day-nutrition';
import { PlanEntryRow } from '@/features/plan/components/plan-entry-row';
import { WeekStrip } from '@/features/plan/components/week-strip';
import { addDays, dayLabel, isDateKey, rangeLabel, startOfWeek, todayKey, weekDays, type DateKey } from '@/features/plan/dates';
import { useMakeShoppingList } from '@/features/shopping/use-make-list';
import { useTheme } from '@/hooks/use-theme';
import { SLOT_LABELS } from '@/lib/labels';
import { entriesBetween, useMealPlan } from '@/stores/meal-plan';
import { minTouchTarget } from '@/theme/tokens';

const SLOTS = MealSlot.options;

function WeekNav({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  const { space } = useTheme();
  const arrow = (text: string, a11y: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({ minWidth: minTouchTarget, minHeight: minTouchTarget, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <AppText variant="title2" color="primary">
        {text}
      </AppText>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
      {arrow('‹', 'Previous week', onPrev)}
      <AppText variant="headline" accessibilityRole="header">
        {label}
      </AppText>
      {arrow('›', 'Next week', onNext)}
    </View>
  );
}

export default function PlanScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const params = useLocalSearchParams<{ date?: string }>();
  const today = todayKey();
  const [selected, setSelected] = useState<DateKey>(isDateKey(params.date) ? params.date : today);
  const entries = useMealPlan((s) => s.entries);
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
    <Screen>
      <AppText variant="largeTitle">Meal plan</AppText>

      <View style={{ gap: space.sm }}>
        <WeekNav
          label={rangeLabel(weekStart, weekEnd)}
          onPrev={() => setSelected(addDays(selected, -7))}
          onNext={() => setSelected(addDays(selected, 7))}
        />
        <WeekStrip days={days} selected={selected} today={today} counts={counts} onSelect={setSelected} />
        {selected !== today ? (
          <Pressable accessibilityRole="button" onPress={() => setSelected(today)} style={{ alignSelf: 'center', minHeight: minTouchTarget, justifyContent: 'center' }}>
            <AppText variant="subhead" color="primary">
              Back to today
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <AppText variant="title2">{dayLabel(selected, today)}</AppText>

      {SLOTS.map((slot) => {
        const inSlot = dayEntries.filter((e) => e.slot === slot);
        return (
          <Card key={slot} style={{ gap: space.xs }}>
            <AppText variant="headline">{SLOT_LABELS[slot]}</AppText>
            {inSlot.map((entry) => (
              <PlanEntryRow key={entry.id} entry={entry} />
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add ${SLOT_LABELS[slot].toLowerCase()} for ${dayLabel(selected, today)}`}
              onPress={() => router.push({ pathname: '/plan/pick-meal', params: { date: selected, slot } })}
              style={({ pressed }) => ({ minHeight: minTouchTarget, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
              <AppText variant="subhead" color="primary" style={{ fontWeight: '600' }}>
                {inSlot.length ? '+ Add another' : `+ Add ${SLOT_LABELS[slot].toLowerCase()}`}
              </AppText>
            </Pressable>
          </Card>
        );
      })}

      <DayNutrition slugs={dayEntries.map((e) => e.slug)} />

      <Card style={{ gap: space.md }}>
        <View style={{ gap: space.xxs }}>
          <AppText variant="headline">Shopping for this week</AppText>
          <AppText color="textSecondary">
            {toShop.length
              ? `${toShop.length} planned meal${toShop.length === 1 ? '' : 's'} from ${dayLabel(shopStart, today)} to ${dayLabel(weekEnd, today)}. We add up the ingredients and group them by aisle.`
              : 'Plan some meals for this week, then turn them into a shopping list.'}
          </AppText>
        </View>
        <Button
          label="Make shopping list"
          disabled={!toShop.length}
          loading={makeList.isPending}
          onPress={() => makeList.mutate({ start: shopStart, end: weekEnd })}
        />
      </Card>
    </Screen>
  );
}
