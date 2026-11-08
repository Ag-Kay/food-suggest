import { useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import {
  Ban,
  Cake,
  ChefHat,
  CloudUpload,
  Eraser,
  Flame,
  Heart,
  Images,
  Leaf,
  LogOut,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
  UserRound,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Switch, View } from 'react-native';

import { AppText, Button, Icon, ListGroup, ListRow, Screen } from '@/components/ui';
import { deleteAccount, giveHealthConsent, useMe } from '@/features/account/api';
import { clearLocalData, signOut } from '@/features/account/sign-out';
import type { StepName } from '@/features/onboarding/flow';
import { useIngredients } from '@/features/recommendations/queries';
import { syncNow, useSyncStatus } from '@/features/sync/engine';
import { useTheme } from '@/hooks/use-theme';
import { ALLERGEN_LABELS, DIET_TYPE_LABELS, GOAL_LABELS, SKILL_OPTIONS, TIME_OPTIONS } from '@/lib/labels';
import { isAuthConfigured } from '@/lib/supabase';
import { useAuth } from '@/stores/auth';
import { usePreferences } from '@/stores/preferences';
import { useProfile } from '@/stores/profile';
import { minTouchTarget } from '@/theme/tokens';

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

function SyncStatusLine() {
  const { space } = useTheme();
  const { lastSyncedAt, error } = useSyncStatus();
  const text = error
    ? error
    : lastSyncedAt
      ? `Plan and lists synced at ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Syncing your plan and lists…';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
      <AppText variant="footnote" color={error ? 'danger' : 'textSecondary'} style={{ flexShrink: 1 }}>
        {text}
      </AppText>
      {error ? (
        <Pressable accessibilityRole="button" onPress={() => void syncNow()} style={{ minHeight: minTouchTarget, justifyContent: 'center' }}>
          <AppText variant="footnote" color="link" style={{ fontWeight: '600' }}>
            Try again
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Top card: who is signed in (or an invitation to sign in). */
function IdentityCard() {
  const router = useRouter();
  const { colors, radius, space, elevation } = useTheme();
  const session = useAuth((s) => s.session);
  if (!isAuthConfigured) return null;

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg }, elevation]}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Icon icon={UserRound} size="lg" color="link" />
      </View>
      {session ? (
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="headline" numberOfLines={1}>
            {session.user.email}
          </AppText>
          <SyncStatusLine />
        </View>
      ) : (
        <View style={{ flex: 1, gap: space.sm }}>
          <View style={{ gap: 2 }}>
            <AppText variant="headline">Use Food Suggest on any phone</AppText>
            <AppText variant="footnote" color="textSecondary">
              Save meals and sync your plan. Email only, no password.
            </AppText>
          </View>
          <Button label="Sign in" size="sm" onPress={() => router.push('/sign-in')} style={{ alignSelf: 'flex-start' }} />
        </View>
      )}
    </View>
  );
}

function AccountGroup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAuth((s) => s.session);
  const me = useMe();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!isAuthConfigured || !session) return null;

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
  const spinner = (label: string) => (busy === label ? <ActivityIndicator /> : undefined);

  return (
    <>
      <ListGroup title="Account" footer={error ?? undefined}>
        <ListRow icon={Heart} label="Saved meals" onPress={() => router.push('/favorites')} />
        {syncing ? (
          <ListRow
            icon={CloudUpload}
            label="Preferences sync"
            value="On"
            accessory={spinner('consent')}
            onPress={() =>
              confirm('Stop syncing preferences?', 'We will delete your preferences and allergies from your account. They stay on this phone.', 'Stop syncing', () =>
                void run('consent', async () => {
                  await giveHealthConsent(false);
                  await me.refetch();
                }),
              )
            }
          />
        ) : (
          <ListRow icon={CloudUpload} label="Preferences sync" value="Off" onPress={() => router.push('/sign-in/consent')} />
        )}
        <ListRow
          icon={LogOut}
          label="Sign out"
          accessory={spinner('signout')}
          onPress={() =>
            confirm('Sign out?', 'Your data will be removed from this phone. Your synced plan and lists stay in your account.', 'Sign out', () =>
              void run('signout', () => signOut(queryClient)),
            )
          }
        />
      </ListGroup>
      <ListGroup>
        <ListRow
          icon={Trash2}
          label="Delete account"
          danger
          accessory={spinner('delete')}
          onPress={() =>
            confirm('Delete your account?', 'This permanently deletes your account, saved meals, plan, lists and preferences. This cannot be undone.', 'Delete', () =>
              void run('delete', async () => {
                await deleteAccount();
                await signOut(queryClient);
                router.dismissTo('/');
              }),
            )
          }
        />
      </ListGroup>
    </>
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
  const time = TIME_OPTIONS.find((t) => t.value === profile.maxCookMinutes)?.label;
  const edit = (step: StepName) => () => router.push(`/onboarding/${step}?edit=1` as Href);

  return (
    <Screen gap={space.xl}>
      <AppText variant="display">Profile</AppText>

      <IdentityCard />

      {complete ? (
        <ListGroup title="Your preferences">
          <ListRow icon={Cake} label="Birth year" value={profile.birthYear ? String(profile.birthYear) : none} onPress={edit('age')} />
          <ListRow icon={Target} label="Goal" value={profile.goal ? GOAL_LABELS[profile.goal] : none} onPress={edit('goal')} />
          <ListRow icon={Leaf} label="Diet" value={profile.dietType ? DIET_TYPE_LABELS[profile.dietType] : none} onPress={edit('diet')} />
          <ListRow
            icon={TriangleAlert}
            label="Allergies"
            value={profile.allergens?.length ? profile.allergens.map((a) => ALLERGEN_LABELS[a]).join(', ') : 'None'}
            onPress={edit('allergies')}
          />
          <ListRow
            icon={Ban}
            label="Foods to avoid"
            value={profile.avoidIngredients?.length ? profile.avoidIngredients.map(ingredientName).join(', ') : 'None'}
            onPress={edit('foods')}
          />
          <ListRow
            icon={ChefHat}
            label="Cooking"
            value={[time, SKILL_OPTIONS.find((s) => s.value === profile.cookingSkill)?.label].filter(Boolean).join(' · ') || none}
            onPress={edit('cooking')}
          />
        </ListGroup>
      ) : (
        <ListGroup>
          <ListRow icon={Sparkles} iconColor="link" label="Personalise your picks" detail="Goal, diet and allergies · about a minute" onPress={() => router.push('/onboarding')} />
        </ListGroup>
      )}

      <ListGroup title="Display">
        <ListRow
          icon={Flame}
          label="Show calories"
          accessory={
            <Switch
              value={showCalories}
              onValueChange={setShowCalories}
              accessibilityLabel="Show calories"
              trackColor={{ true: colors.primary }}
            />
          }
        />
      </ListGroup>

      <AccountGroup />

      <ListGroup title="Privacy & data">
        <ListRow icon={ShieldCheck} label="How your data is used" onPress={() => router.push('/privacy')} />
        <ListRow
          icon={Eraser}
          label="Clear data on this phone"
          onPress={() =>
            confirm('Clear your data?', 'This removes your answers, recently viewed meals, meal plan and shopping lists from this phone.', 'Clear', () =>
              clearLocalData(queryClient),
            )
          }
        />
      </ListGroup>

      <ListGroup title="About" footer="Food Suggest gives general food and nutrition information, not medical advice. Nutrition values are estimates.">
        <ListRow icon={Images} label="Photo credits" onPress={() => router.push('/credits')} />
      </ListGroup>
    </Screen>
  );
}
