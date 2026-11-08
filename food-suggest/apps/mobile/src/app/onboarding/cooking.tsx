import { View } from 'react-native';

import { AppText } from '@/components/ui';
import { useStepFlow } from '@/features/onboarding/flow';
import { OptionRow } from '@/features/onboarding/option-row';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';
import { SKILL_OPTIONS, TIME_OPTIONS } from '@/lib/labels';
import { useProfile } from '@/stores/profile';

export default function CookingStep() {
  const { space } = useTheme();
  const profile = useProfile((s) => s.profile);
  const update = useProfile((s) => s.update);
  const flow = useStepFlow('cooking');

  return (
    <StepLayout
      step={flow.step}
      totalSteps={flow.totalSteps}
      title="How do you like to cook?"
      why="So we can suggest meals that fit your time and experience."
      primaryLabel={flow.editing ? 'Save' : 'Finish'}
      onPrimary={flow.goNext}
    >
      <View
        style={{ gap: space.sm }}
        accessibilityRole="radiogroup"
        accessibilityLabel="Cooking time"
      >
        <AppText variant="headline">Time for cooking</AppText>
        {TIME_OPTIONS.map((t) => (
          <OptionRow
            key={t.label}
            label={t.label}
            selected={profile.maxCookMinutes === t.value}
            onPress={() => update({ maxCookMinutes: t.value })}
          />
        ))}
      </View>
      <View
        style={{ gap: space.sm }}
        accessibilityRole="radiogroup"
        accessibilityLabel="Cooking experience"
      >
        <AppText variant="headline">Cooking experience</AppText>
        {SKILL_OPTIONS.map((s) => (
          <OptionRow
            key={s.value}
            label={s.label}
            description={s.description}
            selected={profile.cookingSkill === s.value}
            onPress={() => update({ cookingSkill: s.value })}
          />
        ))}
      </View>
    </StepLayout>
  );
}
