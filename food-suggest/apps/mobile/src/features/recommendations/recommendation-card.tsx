import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { Recommendation } from '@food-suggest/shared';

import { AppText } from '@/components/ui';
import { MealImage } from '@/features/meals/components/meal-image';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes } from '@/lib/format';

/** A recommended meal with the reasons it was picked and anything to watch. */
export function RecommendationCard({ item }: { item: Recommendation }) {
  const { colors, radius, space } = useTheme();
  const router = useRouter();
  const { meal, reasons, cautions } = item;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/meal/[slug]', params: { slug: meal.slug } })}
      accessibilityRole="button"
      accessibilityLabel={`${meal.name}. Why: ${reasons.join(' ')}${cautions.length ? ` Note: ${cautions.join(' ')}` : ''}`}
      style={({ pressed }) => ({
        gap: space.md,
        padding: space.md,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.lg,
        opacity: pressed ? 0.85 : 1,
      })}>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <MealImage slug={meal.slug} name={meal.name} style={{ width: 64, height: 64 }} />
        <View style={{ flex: 1, gap: space.xxs }}>
          <AppText variant="headline">{meal.name}</AppText>
          <AppText variant="footnote" color="textSecondary">
            {meal.cuisine.name} · {formatMinutes(meal.totalMinutes)}
          </AppText>
        </View>
      </View>
      {reasons.length ? (
        <View style={{ gap: space.xs }}>
          {reasons.map((r) => (
            <View key={r} style={{ flexDirection: 'row', gap: space.sm }}>
              <AppText variant="subhead" color="primary">
                ✓
              </AppText>
              <AppText variant="subhead" style={{ flex: 1 }}>
                {r}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
      {cautions.map((c) => (
        <AppText key={c} variant="footnote" color="warning">
          {c}
        </AppText>
      ))}
    </Pressable>
  );
}
