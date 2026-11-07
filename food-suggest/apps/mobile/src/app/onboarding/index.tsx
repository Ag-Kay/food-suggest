import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';

const POINTS = [
  { title: 'A few quick questions', body: 'Your goal, diet, allergies and how you like to cook. Skip anything you like.' },
  { title: 'Stays on your phone', body: 'Your answers are saved on this device only. We use them to pick meals and never sell them.' },
  { title: 'Food ideas, not medical advice', body: "Suggestions are general guidance. If you have a health condition, talk to a professional." },
];

export default function OnboardingWelcome() {
  const router = useRouter();
  const { space } = useTheme();
  return (
    <StepLayout
      title="Make Food Suggest yours"
      why="Tell us a little about yourself and we'll suggest meals that fit."
      primaryLabel="Get started"
      onPrimary={() => router.push('/onboarding/age')}
      secondaryLabel="Not now"
      onSecondary={() => router.back()}>
      <View style={{ gap: space.md }}>
        {POINTS.map((p) => (
          <Card key={p.title} style={{ gap: space.xs }}>
            <AppText variant="headline">{p.title}</AppText>
            <AppText color="textSecondary">{p.body}</AppText>
          </Card>
        ))}
      </View>
    </StepLayout>
  );
}
