import { useQueries } from '@tanstack/react-query';
import { View } from 'react-native';

import { AppText } from '@/components/ui';
import { mealDetailQuery } from '@/features/meals/queries';
import { useTheme } from '@/hooks/use-theme';
import { usePreferences } from '@/stores/preferences';

import { sumDayNutrition } from '../nutrition';

function Stat({ label, value }: { label: string; value: string }) {
  const { space } = useTheme();
  return (
    <View style={{ flex: 1, gap: 2, alignItems: 'center' }} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="title2">{value}</AppText>
      <AppText variant="caption" color="textSecondary" style={{ marginTop: space.xxs }}>
        {label}
      </AppText>
    </View>
  );
}

/** Day total for one person having one portion of each planned meal (estimated). */
export function DayNutrition({ slugs }: { slugs: string[] }) {
  const { colors, radius, space } = useTheme();
  const showCalories = usePreferences((s) => s.showCalories);
  const unique = [...new Set(slugs)];
  const results = useQueries({ queries: unique.map((slug) => ({ ...mealDetailQuery(slug), staleTime: 10 * 60_000 })) });

  if (!slugs.length) return null;
  const loading = results.some((r) => r.isPending);
  const details = new Map(unique.map((slug, i) => [slug, results[i]?.data]));
  const day = sumDayNutrition(slugs, details);
  const g = (n: number) => `${Math.round(n)}g`;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <AppText variant="headline">Day total</AppText>
        <AppText variant="caption" color="textSecondary">
          One person · estimated
        </AppText>
      </View>
      {loading ? (
        <AppText color="textSecondary">Adding it up…</AppText>
      ) : day.counted === 0 ? (
        <AppText color="textSecondary">No nutrition data for these meals yet.</AppText>
      ) : (
        <View style={{ flexDirection: 'row' }}>
          {showCalories ? <Stat label="kcal" value={String(Math.round(day.energyKcal))} /> : null}
          <Stat label="Protein" value={g(day.proteinG)} />
          <Stat label="Carbs" value={g(day.carbsG)} />
          <Stat label="Fat" value={g(day.fatG)} />
          <Stat label="Fibre" value={day.fibreG === null ? '—' : g(day.fibreG)} />
        </View>
      )}
      {!loading && day.missing > 0 && day.counted > 0 ? (
        <AppText variant="caption" color="textSecondary">
          {day.missing} meal{day.missing === 1 ? '' : 's'} without nutrition data not included.
        </AppText>
      ) : null}
    </View>
  );
}
