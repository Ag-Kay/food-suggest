import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { completeSignIn } from '@/features/account/after-sign-in';
import { giveHealthConsent } from '@/features/account/api';
import { OptionRow } from '@/features/onboarding/option-row';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';

const WHAT_WE_STORE = [
  'Your birth year, goal and diet',
  'Allergies and foods you avoid',
  'Cuisines and cooking preferences',
  'Meals you save',
];

/** Explicit consent before any health-related data is stored on our servers. */
export default function ConsentScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = (message: string | null) => router.replace({ pathname: '/sign-in/done', params: { message: message ?? '' } });

  const agree = async () => {
    setBusy(true);
    setError(null);
    try {
      await giveHealthConsent(true);
      const result = await completeSignIn();
      finish(result.next === 'done' ? result.message : null);
    } catch {
      setError("We couldn't save your choice. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepLayout
      title="Keep your preferences in your account?"
      why="To sync across devices, we need to store some information that can relate to your health. We only use it to suggest meals."
      primaryLabel={busy ? 'Saving…' : 'Agree and continue'}
      primaryDisabled={!agreed || busy}
      onPrimary={agree}
      secondaryLabel="Not now"
      onSecondary={() => finish('Your preferences stay on this phone only. You can turn on syncing later in Profile.')}>
      <Card style={{ gap: space.sm }}>
        <AppText variant="headline">What we&apos;d store</AppText>
        {WHAT_WE_STORE.map((item) => (
          <AppText key={item}>• {item}</AppText>
        ))}
        <AppText variant="footnote" color="textSecondary">
          We never sell your data or use it for advertising. You can withdraw consent or delete your account at any
          time in Profile, and we will delete this information.
        </AppText>
      </Card>
      <View>
        <OptionRow
          kind="checkbox"
          label="I agree to Food Suggest storing this information"
          selected={agreed}
          onPress={() => setAgreed((v) => !v)}
        />
      </View>
      {error ? <AppText color="danger">{error}</AppText> : null}
    </StepLayout>
  );
}
