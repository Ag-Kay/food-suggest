import { AppText, EmptyState, Screen } from '@/components/ui';

export default function PlanScreen() {
  return (
    <Screen>
      <AppText variant="largeTitle">Meal plan</AppText>
      <EmptyState title="No meals planned yet" message="Plan your breakfasts, lunches and dinners for the week." />
    </Screen>
  );
}
