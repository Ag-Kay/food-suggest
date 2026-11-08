import { Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useTheme } from '@/hooks/use-theme';
import { isAuthConfigured, supabase } from '@/lib/supabase';
import { minTouchTarget } from '@/theme/tokens';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignInEmail() {
  const router = useRouter();
  const { colors, space, radius, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = EMAIL_PATTERN.test(email.trim());

  if (!isAuthConfigured) {
    return (
      <StepLayout
        title="Sign-in isn't set up yet"
        why="This version of the app isn't connected to an account service. You can keep using Food Suggest without an account."
        primaryLabel="Back"
        onPrimary={() => router.back()}
      >
        <View />
      </StepLayout>
    );
  }

  const send = async () => {
    if (!valid || !supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() });
    setBusy(false);
    if (err) {
      // Development only: Supabase's own message (e.g. SMTP failures). Never shown to users.
      if (__DEV__) console.warn('[sign-in] signInWithOtp failed', err.status, err.message);
      setError(
        err.status === 429
          ? 'Please wait a minute before asking for another code.'
          : "We couldn't send the code. Please try again.",
      );
      return;
    }
    router.push({ pathname: '/sign-in/code', params: { email: email.trim().toLowerCase() } });
  };

  return (
    <StepLayout
      icon={Mail}
      title="Sign in or create an account"
      why="We'll email you a 6-digit code. No password."
      primaryLabel={busy ? 'Sending…' : 'Email me a code'}
      primaryDisabled={!valid || busy}
      onPrimary={send}
    >
      <Card tone="muted" style={{ gap: space.sm }}>
        <AppText variant="subhead" color="textSecondary">
          Email address
        </AppText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={send}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          inputMode="email"
          returnKeyType="send"
          placeholder="you@example.com"
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel="Email address"
          style={[
            typography.body,
            {
              color: colors.text,
              minHeight: minTouchTarget + 4,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
              paddingHorizontal: space.md,
            },
          ]}
        />
        {error ? (
          <AppText color="danger" accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : null}
      </Card>
      <AppText variant="footnote" color="textSecondary">
        With an account you can save meals and keep your preferences on all your devices. You can
        delete your account at any time in Profile.
      </AppText>
    </StepLayout>
  );
}
