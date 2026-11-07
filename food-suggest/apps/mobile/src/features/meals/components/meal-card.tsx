import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { MealCard as MealCardData } from '@food-suggest/shared';

import { AppText, Badge } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes } from '@/lib/format';
import { DIET_LABELS } from '@/lib/labels';
import { usePreferences } from '@/stores/preferences';

import { MealImage } from './meal-image';

export function macroLine(
  meal: Pick<MealCardData, 'nutrition'>,
  showCalories: boolean,
): string | null {
  const n = meal.nutrition;
  if (!n) return null;
  const parts = [
    `${Math.round(n.proteinG)} g protein`,
    `${Math.round(n.carbsG)} g carbs`,
    `${Math.round(n.fatG)} g fat`,
  ];
  if (showCalories) parts.unshift(`${n.energyKcal} kcal`);
  return parts.join(' · ');
}

function useOpenMeal() {
  const router = useRouter();
  return (slug: string) => router.push({ pathname: '/meal/[slug]', params: { slug } });
}

/** Full-width meal row used in Discover results. */
export function MealCard({ meal }: { meal: MealCardData }) {
  const { colors, radius, space } = useTheme();
  const showCalories = usePreferences((s) => s.showCalories);
  const macros = macroLine(meal, showCalories);
  const meta = `${meal.cuisine.name} · ${formatMinutes(meal.totalMinutes)}`;
  const openMeal = useOpenMeal();

  return (
    <Pressable
      onPress={() => openMeal(meal.slug)}
      accessibilityRole="button"
      accessibilityLabel={`${meal.name}. ${meta}. ${DIET_LABELS[meal.diet]}.${macros ? ` Per serving: ${macros}.` : ''}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: space.md,
        padding: space.md,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.lg,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <MealImage slug={meal.slug} name={meal.name} style={{ width: 84, height: 84 }} />
      <View style={{ flex: 1, gap: space.xs }}>
        <AppText variant="headline" numberOfLines={2}>
          {meal.name}
        </AppText>
        <AppText variant="footnote" color="textSecondary">
          {meta}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
          {meal.diet !== 'OMNIVORE' ? (
            <Badge label={DIET_LABELS[meal.diet]} tone="primary" />
          ) : null}
          {!meal.allergenInfoComplete ? <Badge label="Check allergens" tone="warning" /> : null}
        </View>
        {macros ? (
          <AppText variant="footnote" color="textSecondary">
            {macros}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Compact tile for horizontal carousels on Home. */
export function MealTile({
  slug,
  name,
  subtitle,
}: {
  slug: string;
  name: string;
  subtitle: string;
}) {
  const { space } = useTheme();
  const openMeal = useOpenMeal();
  return (
    <Pressable
      onPress={() => openMeal(slug)}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${subtitle}`}
      style={({ pressed }) => ({ width: 160, gap: space.xs, opacity: pressed ? 0.85 : 1 })}
    >
      <MealImage slug={slug} name={name} style={{ width: 160, height: 110 }} />
      <AppText variant="subhead" style={{ fontWeight: '600' }} numberOfLines={2}>
        {name}
      </AppText>
      <AppText variant="caption" color="textSecondary" numberOfLines={1}>
        {subtitle}
      </AppText>
    </Pressable>
  );
}
