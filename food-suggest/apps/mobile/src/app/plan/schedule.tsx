import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { CalendarCheck } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { MAX_PLAN_SERVINGS, MealSlot } from '@food-suggest/shared';

import { AppText, Card, Chip, Stepper } from '@/components/ui';
import { addDays, dayLabel, todayKey } from '@/features/plan/dates';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';
import { SLOT_ICONS } from '@/lib/icons';
import { SLOT_LABELS } from '@/lib/labels';
import { useMealPlan } from '@/stores/meal-plan';

const SLOTS = MealSlot.options;
const DAYS_AHEAD = 14;

const servingsText = (n: number) => `${n} serving${n === 1 ? '' : 's'}`;

/** "Add to plan" from a meal page: choose the day, the meal of the day and servings. */
export default function ScheduleMeal() {
  const router = useRouter();
  const { space } = useTheme();
  const params = useLocalSearchParams<{ slug: string; name: string; slots?: string }>();
  const mealSlots = (params.slots ?? '').split(',').filter((s): s is MealSlot => MealSlot.safeParse(s).success);
  const add = useMealPlan((s) => s.add);
  const lastServings = useMealPlan((s) => s.lastServings);

  const today = todayKey();
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState<MealSlot>(mealSlots[0] ?? 'DINNER');
  const [servings, setServings] = useState(lastServings);
  const [added, setAdded] = useState(false);

  if (!params.slug || !params.name) {
    return (
      <StepLayout title="Meal not found" primaryLabel="Close" onPrimary={() => router.back()}>
        <View />
      </StepLayout>
    );
  }

  if (added) {
    return (
      <StepLayout
        icon={CalendarCheck}
        title="Added to your plan"
        why={`${params.name} · ${dayLabel(date, today)}, ${SLOT_LABELS[slot].toLowerCase()} · ${servingsText(servings)}`}
        primaryLabel="Done"
        onPrimary={() => router.back()}
        secondaryLabel="Open meal plan"
        onSecondary={() => {
          router.back();
          router.navigate({ pathname: '/plan', params: { date } });
        }}>
        <Stack.Screen options={{ title: 'Add to plan' }} />
        <View />
      </StepLayout>
    );
  }

  return (
    <StepLayout
      title={params.name}
      why="Pick a day and meal. Servings set the shopping amounts."
      primaryLabel="Add to plan"
      onPrimary={() => {
        add({ date, slot, slug: params.slug, name: params.name, servings });
        setAdded(true);
      }}
      secondaryLabel="Cancel"
      onSecondary={() => router.back()}>
      <Stack.Screen options={{ title: 'Add to plan' }} />
      <View style={{ gap: space.sm }}>
        <AppText variant="headline">Day</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {days.map((d) => (
            <Chip key={d} label={dayLabel(d, today)} selected={d === date} onPress={() => setDate(d)} />
          ))}
        </ScrollView>
      </View>
      <View style={{ gap: space.sm }}>
        <AppText variant="headline">Meal</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {SLOTS.map((s) => (
            <Chip key={s} label={SLOT_LABELS[s]} icon={SLOT_ICONS[s]} selected={s === slot} onPress={() => setSlot(s)} />
          ))}
        </View>
        {mealSlots.length && !mealSlots.includes(slot) ? (
          <AppText variant="footnote" color="textSecondary">
            Usually eaten for {mealSlots.map((s) => SLOT_LABELS[s].toLowerCase()).join(' or ')}, but it&apos;s your plan.
          </AppText>
        ) : null}
      </View>
      <Card tone="muted" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
        <AppText variant="headline">Servings</AppText>
        <Stepper value={servings} min={1} max={MAX_PLAN_SERVINGS} onChange={setServings} label="Servings" format={servingsText} />
      </Card>
    </StepLayout>
  );
}

