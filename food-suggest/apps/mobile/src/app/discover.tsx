import { AppText, EmptyState, Screen } from '@/components/ui';

export default function DiscoverScreen() {
  return (
    <Screen>
      <AppText variant="largeTitle">Discover</AppText>
      <EmptyState title="Find something to eat" message="Search and browse meals by cuisine, diet and meal type." />
    </Screen>
  );
}
