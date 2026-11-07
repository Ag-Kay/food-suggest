import { View } from 'react-native';

import { Allergen } from '@food-suggest/shared';

import { AppText, Card } from '@/components/ui';
import { useStepFlow } from '@/features/onboarding/flow';
import { OptionRow } from '@/features/onboarding/option-row';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';
import { ALLERGEN_LABELS } from '@/lib/labels';
import { useProfile } from '@/stores/profile';

/** Stable empty list: returning a new [] from a selector makes Zustand re-render forever. */
const NO_ALLERGENS: Allergen[] = [];

export default function AllergiesStep() {
  const { space } = useTheme();
  const allergens = useProfile((s) => s.profile.allergens ?? NO_ALLERGENS);
  const update = useProfile((s) => s.update);
  const flow = useStepFlow('allergies');

  const toggle = (a: Allergen) =>
    update({ allergens: allergens.includes(a) ? allergens.filter((x) => x !== a) : [...allergens, a] });

  return (
    <StepLayout
      step={flow.step}
      totalSteps={flow.totalSteps}
      title="Any food allergies or intolerances?"
      why="Meals containing these are removed from your suggestions. This is optional and stays on your phone."
      primaryLabel={allergens.length ? 'Continue' : 'I have none'}
      onPrimary={flow.goNext}>
      <Card>
        <AppText variant="footnote" color="textSecondary">
          Recipes vary between cooks and sellers, so always check ingredients if you have an allergy. Meals
          with ingredients we can&apos;t check (such as stock cubes) are left out for anyone with an allergy.
        </AppText>
      </Card>
      <View style={{ gap: space.sm }}>
        {Allergen.options.map((a) => (
          <OptionRow
            key={a}
            kind="checkbox"
            label={ALLERGEN_LABELS[a]}
            selected={allergens.includes(a)}
            onPress={() => toggle(a)}
          />
        ))}
      </View>
    </StepLayout>
  );
}
