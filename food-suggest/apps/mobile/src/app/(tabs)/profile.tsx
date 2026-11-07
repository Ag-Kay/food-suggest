import { AppText, EmptyState, Screen } from '@/components/ui';

export default function ProfileScreen() {
  return (
    <Screen>
      <AppText variant="largeTitle">Profile</AppText>
      <EmptyState title="Make it yours" message="Set your goals, diet and allergies so suggestions fit you." />
    </Screen>
  );
}
