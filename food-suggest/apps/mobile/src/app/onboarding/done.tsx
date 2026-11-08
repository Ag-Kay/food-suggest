import { CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { useStepFlow } from '@/features/onboarding/flow';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useProfile } from '@/stores/profile';

export default function OnboardingDone() {
  const complete = useProfile((s) => s.completeOnboarding);
  const flow = useStepFlow('cooking');
  return (
    <StepLayout
      icon={CircleCheck}
      title="You're all set"
      why="Your picks are on Home. Change your answers any time in Profile."
      primaryLabel="See my suggestions"
      onPrimary={() => {
        complete();
        flow.exit();
      }}
    >
      <View />
    </StepLayout>
  );
}
