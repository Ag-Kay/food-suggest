import { View } from 'react-native';

import { useStepFlow } from '@/features/onboarding/flow';
import { OptionRow } from '@/features/onboarding/option-row';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';
import { GOAL_OPTIONS } from '@/lib/labels';
import { useProfile } from '@/stores/profile';

export default function GoalStep() {
  const { space } = useTheme();
  const goal = useProfile((s) => s.profile.goal);
  const update = useProfile((s) => s.update);
  const flow = useStepFlow('goal');

  return (
    <StepLayout
      step={flow.step}
      totalSteps={flow.totalSteps}
      title="What's your main goal?"
      why="We use this to rank meals, for example by protein or fibre. You can change it any time."
      onPrimary={flow.goNext}
      secondaryLabel={goal ? 'Clear my choice' : 'Skip'}
      onSecondary={() => {
        update({ goal: undefined });
        flow.goNext();
      }}>
      <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
        {GOAL_OPTIONS.map((g) => (
          <OptionRow
            key={g.value}
            label={g.label}
            description={g.description}
            selected={goal === g.value}
            onPress={() => update({ goal: g.value })}
          />
        ))}
      </View>
    </StepLayout>
  );
}
