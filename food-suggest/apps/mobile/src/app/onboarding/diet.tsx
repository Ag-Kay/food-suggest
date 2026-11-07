import { View } from 'react-native';

import { useStepFlow } from '@/features/onboarding/flow';
import { OptionRow } from '@/features/onboarding/option-row';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';
import { DIET_OPTIONS } from '@/lib/labels';
import { useProfile } from '@/stores/profile';

export default function DietStep() {
  const { space } = useTheme();
  const diet = useProfile((s) => s.profile.dietType);
  const update = useProfile((s) => s.update);
  const flow = useStepFlow('diet');

  return (
    <StepLayout
      step={flow.step}
      totalSteps={flow.totalSteps}
      title="How do you eat?"
      why="We'll only suggest meals that match. If you also avoid particular foods, you can add them shortly."
      onPrimary={flow.goNext}
      secondaryLabel="Skip"
      onSecondary={flow.goNext}>
      <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
        {DIET_OPTIONS.map((d) => (
          <OptionRow
            key={d.value}
            label={d.label}
            description={d.description}
            selected={diet === d.value}
            onPress={() => update({ dietType: d.value })}
          />
        ))}
      </View>
    </StepLayout>
  );
}
