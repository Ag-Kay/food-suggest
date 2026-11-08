import { Info, ListChecks, Smartphone, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { IconPoint } from '@/features/onboarding/icon-point';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';

const POINTS = [
  {
    icon: ListChecks,
    title: 'A few quick questions',
    body: 'Goal, diet, allergies and cooking. Skip anything.',
  },
  { icon: Smartphone, title: 'Stays on your phone', body: 'Used only to pick meals. Never sold.' },
  {
    icon: Info,
    title: 'Ideas, not medical advice',
    body: 'Talk to a professional about health conditions.',
  },
];

export default function OnboardingWelcome() {
  const router = useRouter();
  const { space } = useTheme();
  return (
    <StepLayout
      icon={Sparkles}
      title="Make Food Suggest yours"
      why="Answer a few questions and we'll suggest meals that fit."
      primaryLabel="Get started"
      onPrimary={() => router.push('/onboarding/age')}
      secondaryLabel="Not now"
      onSecondary={() => router.back()}
    >
      <View style={{ gap: space.lg }}>
        {POINTS.map((p) => (
          <IconPoint key={p.title} icon={p.icon} title={p.title} body={p.body} />
        ))}
      </View>
    </StepLayout>
  );
}
