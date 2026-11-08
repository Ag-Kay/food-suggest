import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { StepLayout } from '@/features/onboarding/step-layout';

export default function SignInDone() {
  const router = useRouter();
  const { message } = useLocalSearchParams<{ message?: string }>();
  return (
    <StepLayout
      title="You're signed in"
      why={message || 'You can now save meals and use your preferences on any device.'}
      primaryLabel="Done"
      onPrimary={() => router.dismissTo('/')}>
      <View />
    </StepLayout>
  );
}
