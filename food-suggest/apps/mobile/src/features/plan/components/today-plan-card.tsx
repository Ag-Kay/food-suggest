import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { SLOT_LABELS } from '@/lib/labels';
import { entriesBetween, useMealPlan } from '@/stores/meal-plan';

import { addDays, todayKey } from '../dates';

/** Home: today's planned meals and quick access to the planner. */
export function TodayPlanCard() {
  const router = useRouter();
  const { space } = useTheme();
  const all = useMealPlan((s) => s.entries);
  const today = todayKey();
  const entries = entriesBetween(all, today, today);
  const upcoming = entriesBetween(all, addDays(today, 1), addDays(today, 6)).length;

  return (
    <Card style={{ gap: space.md }}>
      <AppText variant="headline">Today&apos;s plan</AppText>
      {entries.length ? (
        <View style={{ gap: space.xs }}>
          {entries.map((e) => (
            <AppText key={e.id}>
              <AppText color="textSecondary">{SLOT_LABELS[e.slot]}: </AppText>
              {e.name}
            </AppText>
          ))}
        </View>
      ) : (
        <AppText color="textSecondary">
          {upcoming
            ? `Nothing planned for today. ${upcoming} meal${upcoming === 1 ? '' : 's'} planned for the coming week.`
            : 'Plan your meals for the week and get a shopping list in one tap.'}
        </AppText>
      )}
      <Button
        label={entries.length || upcoming ? 'Open meal plan' : 'Start planning'}
        variant="secondary"
        onPress={() => router.navigate('/plan')}
      />
    </Card>
  );
}
