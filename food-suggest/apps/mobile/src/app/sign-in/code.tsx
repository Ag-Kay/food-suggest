import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { TextInput } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { completeSignIn } from '@/features/account/after-sign-in';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { minTouchTarget } from '@/theme/tokens';

/** Must match Supabase: Authentication → Sign In / Providers → Email → Email OTP length. */
const CODE_LENGTH = 6;

export default function SignInCode() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { colors, space, radius, typography } = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const verify = async (token: string = code) => {
    if (!supabase || token.length !== CODE_LENGTH || !email || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (err) {
      if (__DEV__) console.warn('[sign-in] verifyOtp failed', err.status, err.message);
      setBusy(false);
      setError('That code is not right or has expired. Check the latest email, or send a new code.');
      return;
    }
    try {
      const result = await completeSignIn();
      if (result.next === 'consent') router.replace('/sign-in/consent');
      else router.replace({ pathname: '/sign-in/done', params: { message: result.message ?? '' } });
    } catch (e) {
      if (__DEV__) console.warn('[sign-in] completeSignIn failed', e);
      // Signed in, but the API couldn't be reached: the sync will retry later.
      router.replace({ pathname: '/sign-in/done', params: { message: "You're signed in. We'll sync your data when we can reach Food Suggest." } });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!supabase || !email) return;
    const { error: err } = await supabase.auth.signInWithOtp({ email });
    setResent(!err);
    if (err && __DEV__) console.warn('[sign-in] resend failed', err.status, err.message);
    if (err) setError(err.status === 429 ? 'Please wait a minute before asking for another code.' : "We couldn't send a new code.");
  };

  return (
    <StepLayout
      title="Enter your code"
      why={`We sent a 6-digit code to ${email}. It may take a minute to arrive; check your spam folder too.`}
      primaryLabel={busy ? 'Checking…' : 'Continue'}
      primaryDisabled={code.length !== CODE_LENGTH || busy}
      onPrimary={() => verify()}>
      <Card style={{ gap: space.sm }}>
        <TextInput
          value={code}
          onChangeText={(t) => {
            const next = t.replace(/\D/g, '').slice(0, CODE_LENGTH);
            setCode(next);
            // The number pad has no return key, and the button can sit under the keyboard:
            // check the code as soon as it is complete (also covers iOS code autofill).
            if (next.length === CODE_LENGTH) void verify(next);
          }}
          onSubmitEditing={() => verify()}
          keyboardType="number-pad"
          inputMode="numeric"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          autoFocus
          placeholder="123456"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="6-digit code"
          style={[
            typography.title1,
            {
              color: colors.text,
              letterSpacing: 8,
              textAlign: 'center',
              minHeight: minTouchTarget + 16,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceMuted,
            },
          ]}
        />
        {error ? (
          <AppText color="danger" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : null}
        {resent ? <AppText color="textSecondary">We sent a new code.</AppText> : null}
      </Card>
      <Button label="Send a new code" variant="ghost" onPress={resend} />
    </StepLayout>
  );
}
