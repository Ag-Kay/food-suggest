import { useQueries } from '@tanstack/react-query';
import { View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { mealDetailQuery } from '@/features/meals/queries';
import { useTheme } from '@/hooks/use-theme';
import { usePreferences } from '@/stores/preferences';

import { sumDayNutrition } from '../nutrition';

function Stat({ label, value }: { label: string; value: string }) {
  const { space } = useTheme();
  return (
    <View style={{ flexGrow: 1, flexBasis: '22%', gap: space.xxs }} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="headline">{value}</AppText>
    </View>
  );
}

/** Estimated nutrition for one person eating one portion of each planned meal. */
export function DayNutrition({ slugs }: { slugs: string[] }) {
  const { space } = useTheme();
  const showCalories = usePreferences((s) => s.showCalories);
  const unique = [...new Set(slugs)];
  const results = useQueries({ queries: unique.map((slug) => ({ ...mealDetailQuery(slug), staleTime: 10 * 60_000 })) });

  if (!slugs.length) return null;
  const loading = results.some((r) => r.isPending);
  const details = new Map(unique.map((slug, i) => [slug, results[i]?.data]));
  const day = sumDayNutrition(slugs, details);
  const g = (n: number) => `${Math.round(n)} g`;

  return (
    <Card style={{ gap: space.md }}>
      <View style={{ gap: space.xxs }}>
        <AppText variant="headline">This day&apos;s nutrition</AppText>
        <AppText variant="footnote" color="textSecondary">
          Estimated for one person having one portion of each meal.
        </AppText>
      </View>
      {loading ? (
        <AppText color="textSecondary">Adding it up…</AppText>
      ) : day.counted === 0 ? (
        <AppText color="textSecondary">No nutrition data for these meals yet.</AppText>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md, columnGap: space.sm }}>
          {showCalories ? <Stat label="Energy" value={`${Math.round(day.energyKcal)} kcal`} /> : null}
          <Stat label="Protein" value={g(day.proteinG)} />
          <Stat label="Carbs" value={g(day.carbsG)} />
          <Stat label="Fat" value={g(day.fatG)} />
          <Stat label="Fibre" value={day.fibreG === null ? '—' : g(day.fibreG)} />
        </View>
      )}
      {!loading && day.missing > 0 && day.counted > 0 ? (
        <AppText variant="footnote" color="textSecondary">
          {day.missing} meal{day.missing === 1 ? '' : 's'} not included (no nutrition data yet).
        </AppText>
      ) : null}
    </Card>
  );
}
