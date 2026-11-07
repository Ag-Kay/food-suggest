import { AppText, EmptyState, Screen } from '@/components/ui';

export default function ListsScreen() {
  return (
    <Screen>
      <AppText variant="largeTitle">Shopping lists</AppText>
      <EmptyState title="No shopping lists yet" message="Turn your meal plan into a shopping list grouped by aisle." />
    </Screen>
  );
}
