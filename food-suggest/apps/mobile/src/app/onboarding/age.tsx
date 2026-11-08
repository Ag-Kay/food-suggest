import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { useStepFlow } from '@/features/onboarding/flow';
import { validateBirthYear } from '@/features/onboarding/validation';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';
import { useProfile } from '@/stores/profile';

export default function AgeStep() {
  const { colors, space, radius, typography } = useTheme();
  const saved = useProfile((s) => s.profile.birthYear);
  const update = useProfile((s) => s.update);
  const resetProfile = useProfile((s) => s.reset);
  const flow = useStepFlow('age');
  const [text, setText] = useState(saved ? String(saved) : '');
  const [touched, setTouched] = useState(false);
  const result = validateBirthYear(text);

  if (result.tooYoung) {
    return (
      <StepLayout
        title="Food Suggest is for people aged 16 and over"
        why="Personalised suggestions aren't available for younger users yet. You can still browse meals and recipes."
        primaryLabel="Back to browsing"
        onPrimary={() => {
          // Personalisation is 16+ only: discard any answers already saved on this device.
          resetProfile();
          flow.exit();
        }}
      >
        <View />
      </StepLayout>
    );
  }

  return (
    <StepLayout
      step={flow.step}
      totalSteps={flow.totalSteps}
      title="What year were you born?"
      why="We only ask for the year, not your birthday, so we can keep suggestions suitable for your age. Food Suggest is for people aged 16 and over."
      primaryDisabled={!result.year}
      onPrimary={() => {
        setTouched(true);
        if (!result.year) return;
        update({ birthYear: result.year });
        flow.goNext();
      }}
    >
      <Card style={{ gap: space.sm }}>
        <AppText variant="subhead" color="textSecondary" nativeID="birth-year-label">
          Birth year
        </AppText>
        <TextInput
          value={text}
          onChangeText={(t) => setText(t.replace(/\D/g, '').slice(0, 4))}
          onBlur={() => setTouched(true)}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder="e.g. 1995"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Birth year"
          accessibilityLabelledBy="birth-year-label"
          maxLength={4}
          style={[
            typography.title2,
            {
              color: colors.text,
              minHeight: minTouchTarget + 8,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceMuted,
              paddingHorizontal: space.md,
            },
          ]}
        />
        {touched && result.error && text.length > 0 ? (
          <AppText color="danger" accessibilityLiveRegion="polite">
            {result.error}
          </AppText>
        ) : null}
      </Card>
    </StepLayout>
  );
}
