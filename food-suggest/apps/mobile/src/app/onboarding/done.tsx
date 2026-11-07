import { View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { useStepFlow } from '@/features/onboarding/flow';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';
import { useProfile } from '@/stores/profile';

export default function OnboardingDone() {
  const { space } = useTheme();
  const complete = useProfile((s) => s.completeOnboarding);
  const flow = useStepFlow('cooking');
  return (
    <StepLayout
      title="You're all set"
      why="Your suggestions are ready on the Home tab. You can change your answers in Profile at any time."
      primaryLabel="See my suggestions"
      onPrimary={() => {
        complete();
        flow.exit();
      }}>
      <View style={{ gap: space.md }}>
        <Card>
          <AppText color="textSecondary">
            Every suggestion explains why it was picked. Nutrition values are estimates from the ingredients.
          </AppText>
        </Card>
      </View>
    </StepLayout>
  );
}
