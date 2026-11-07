import { useRouter, type Href } from 'expo-router';
import { Alert, Platform, Pressable, Switch, View } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components/ui';
import type { StepName } from '@/features/onboarding/flow';
import { useIngredients } from '@/features/recommendations/queries';
import { useTheme } from '@/hooks/use-theme';
import { ALLERGEN_LABELS, DIET_TYPE_LABELS, GOAL_LABELS, SKILL_OPTIONS, TIME_OPTIONS } from '@/lib/labels';
import { usePreferences } from '@/stores/preferences';
import { useProfile } from '@/stores/profile';
import { useRecentMeals } from '@/stores/recent-meals';
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

function confirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear', style: 'destructive', onPress: onConfirm },
  ]);
}

export default function ProfileScreen() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const profile = useProfile((s) => s.profile);
  const complete = useProfile((s) => s.onboardingComplete);
  const resetProfile = useProfile((s) => s.reset);
  const clearRecent = useRecentMeals((s) => s.clear);
  const showCalories = usePreferences((s) => s.showCalories);
  const setShowCalories = usePreferences((s) => s.setShowCalories);
  const ingredients = useIngredients();

  const ingredientName = (slug: string) => ingredients.data?.items.find((i) => i.slug === slug)?.name ?? slug;
  const none = 'Not set';
  const time = TIME_OPTIONS.find((t) => t.value === profile.maxCookMinutes)?.label ?? none;

  return (
    <Screen>
      <AppText variant="largeTitle">Profile</AppText>

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
          Without an account, your answers and recently viewed meals are stored only on this phone. They are sent
          to Food Suggest only to pick your suggestions, and are not saved on our servers.
        </AppText>
        <Button
          label="Clear my data from this phone"
          variant="secondary"
          onPress={() =>
            confirm('Clear your data?', 'This removes your answers and recently viewed meals from this phone.', () => {
              resetProfile();
              clearRecent();
              setShowCalories(false);
            })
          }
        />
      </Card>

      <AppText variant="footnote" color="textSecondary">
        Food Suggest gives general food and nutrition information. It isn&apos;t medical advice.
      </AppText>
    </Screen>
  );
}
