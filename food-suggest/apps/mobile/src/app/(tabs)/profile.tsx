import { useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, Switch, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components/ui';
import { deleteAccount, giveHealthConsent, useMe } from '@/features/account/api';
import { clearLocalData, signOut } from '@/features/account/sign-out';
import { isAuthConfigured } from '@/lib/supabase';
import { useAuth } from '@/stores/auth';
import type { StepName } from '@/features/onboarding/flow';
import { useIngredients } from '@/features/recommendations/queries';
import { useTheme } from '@/hooks/use-theme';
import { ALLERGEN_LABELS, DIET_TYPE_LABELS, GOAL_LABELS, SKILL_OPTIONS, TIME_OPTIONS } from '@/lib/labels';
import { usePreferences } from '@/stores/preferences';
import { useProfile } from '@/stores/profile';
import { minTouchTarget } from '@/theme/tokens';

function Row({ label, value, step }: { label: string; value: string; step: StepName }) {
  const { colors, space } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Edit`}
      onPress={() => router.push(`/onboarding/${step}?edit=1` as Href)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        minHeight: minTouchTarget + 8,
        paddingVertical: space.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        opacity: pressed ? 0.7 : 1,
      })}>
      <View style={{ flex: 1, gap: space.xxs }}>
        <AppText variant="footnote" color="textSecondary">
          {label}
        </AppText>
        <AppText>{value}</AppText>
      </View>
      <AppText variant="subhead" color="primary">
        Edit
      </AppText>
    </Pressable>
  );
}

function confirm(title: string, message: string, actionLabel: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: actionLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

function AccountCard() {
  const { space } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuth((s) => s.session);
  const me = useMe();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthConfigured) return null;

  if (!session) {
    return (
      <Card style={{ gap: space.sm }}>
        <AppText variant="headline">Save meals and sync your preferences</AppText>
        <AppText color="textSecondary">Create a free account with just your email. No password needed.</AppText>
        <Button label="Sign in or create account" onPress={() => router.push('/sign-in')} />
      </Card>
    );
  }

  const syncing = !!me.data?.consents.healthData.granted;
  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card style={{ gap: space.md }}>
      <View style={{ gap: space.xxs }}>
        <AppText variant="headline">Account</AppText>
        <AppText color="textSecondary">Signed in as {session.user.email}</AppText>
        <AppText variant="footnote" color="textSecondary">
          {syncing ? 'Your preferences are synced to your account.' : 'Your preferences stay on this phone only.'}
        </AppText>
      </View>
      <Button label="Saved meals" variant="secondary" onPress={() => router.push('/favorites')} />
      {syncing ? (
        <Button
          label="Stop syncing my preferences"
          variant="ghost"
          loading={busy === 'consent'}
          onPress={() =>
            confirm(
              'Stop syncing?',
              'We will delete your preferences and allergies from your account. They stay on this phone.',
              'Stop syncing',
              () =>
                void run('consent', async () => {
                  await giveHealthConsent(false);
                  await me.refetch();
                }),
            )
          }
        />
      ) : (
        <Button
          label="Sync my preferences"
          variant="ghost"
          onPress={() => router.push('/sign-in/consent')}
        />
      )}
      <Button
        label="Sign out"
        variant="ghost"
        loading={busy === 'signout'}
        onPress={() =>
          confirm('Sign out?', 'Your answers and recently viewed meals will be removed from this phone.', 'Sign out', () =>
            void run('signout', () => signOut(queryClient)),
          )
        }
      />
      <Button
        label="Delete my account"
        variant="ghost"
        loading={busy === 'delete'}
        onPress={() =>
          confirm(
            'Delete your account?',
            'This permanently deletes your account, saved meals and preferences. This cannot be undone.',
            'Delete',
            () =>
              void run('delete', async () => {
                await deleteAccount();
                await signOut(queryClient);
                router.dismissTo('/');
              }),
          )
        }
      />
      {error ? (
        <AppText color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </Card>
  );
}

export default function ProfileScreen() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const profile = useProfile((s) => s.profile);
  const complete = useProfile((s) => s.onboardingComplete);
  const queryClient = useQueryClient();
  const showCalories = usePreferences((s) => s.showCalories);
  const setShowCalories = usePreferences((s) => s.setShowCalories);
  const ingredients = useIngredients();

  const ingredientName = (slug: string) => ingredients.data?.items.find((i) => i.slug === slug)?.name ?? slug;
  const none = 'Not set';
  const time = TIME_OPTIONS.find((t) => t.value === profile.maxCookMinutes)?.label ?? none;

  return (
    <Screen>
      <AppText variant="largeTitle">Profile</AppText>

      <AccountCard />

      {!complete ? (
        <Card style={{ gap: space.sm }}>
          <AppText variant="headline">Personalise your suggestions</AppText>
          <AppText color="textSecondary">Tell us your goal, diet and allergies. It takes about a minute.</AppText>
          <Button label="Get started" onPress={() => router.push('/onboarding')} />
        </Card>
      ) : (
        <Card style={{ paddingVertical: space.xs }}>
          <Row label="Birth year" value={profile.birthYear ? String(profile.birthYear) : none} step="age" />
          <Row label="Goal" value={profile.goal ? GOAL_LABELS[profile.goal] : none} step="goal" />
          <Row label="Diet" value={profile.dietType ? DIET_TYPE_LABELS[profile.dietType] : none} step="diet" />
          <Row
            label="Allergies"
            value={profile.allergens?.length ? profile.allergens.map((a) => ALLERGEN_LABELS[a]).join(', ') : 'None'}
            step="allergies"
          />
          <Row
            label="Foods to avoid"
            value={profile.avoidIngredients?.length ? profile.avoidIngredients.map(ingredientName).join(', ') : 'None'}
            step="foods"
          />
          <Row
            label="Cooking"
            value={[time, SKILL_OPTIONS.find((s) => s.value === profile.cookingSkill)?.label].filter(Boolean).join(' · ')}
            step="cooking"
          />
        </Card>
      )}

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1, gap: space.xxs }}>
          <AppText variant="headline">Show calories</AppText>
          <AppText variant="footnote" color="textSecondary">
            Off by default. Turn on to see calories on meals and suggestions.
          </AppText>
        </View>
        <Switch
          value={showCalories}
          onValueChange={setShowCalories}
          accessibilityLabel="Show calories"
          trackColor={{ true: colors.primary }}
        />
      </Card>

      <Card style={{ gap: space.sm }}>
        <AppText variant="headline">Your data</AppText>
        <AppText color="textSecondary">
          Your answers, recently viewed meals, meal plan and shopping lists are stored on this phone. Without an
          account (or without syncing), your answers are sent to Food Suggest only to pick your suggestions, and
          planned meals only to build shopping lists. Neither is saved on our servers.
        </AppText>
        <Button
          label="Clear my data from this phone"
          variant="secondary"
          onPress={() =>
            confirm('Clear your data?', 'This removes your answers, recently viewed meals, meal plan and shopping lists from this phone.', 'Clear', () =>
              clearLocalData(queryClient),
            )
          }
        />
      </Card>

      <AppText variant="footnote" color="textSecondary">
        Food Suggest gives general food and nutrition information. It isn&apos;t medical advice.
      </AppText>
    </Screen>
  );
}
