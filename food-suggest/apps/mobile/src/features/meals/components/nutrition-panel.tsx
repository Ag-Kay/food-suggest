import { Switch, View } from 'react-native';

import type { NutritionSummary } from '@food-suggest/shared';

import { AppText } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { usePreferences } from '@/stores/preferences';

function Tile({ label, value, unit }: { label: string; value: string; unit: string }) {
  const { colors, radius, space } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value} ${unit}`}
      style={{ flexGrow: 1, flexBasis: '30%', minWidth: 88, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.sm, gap: 2 }}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="title2">
        {value}
        <AppText variant="caption" color="textSecondary">
          {` ${unit}`}
        </AppText>
      </AppText>
    </View>
  );
}

const num = (v: number | null) => (v == null ? '—' : String(Math.round(v * 10) / 10));

/** Per-serving nutrition as tiles. Calories are opt-in; every figure is an estimate. */
export function NutritionPanel({ nutrition, servings }: { nutrition: NutritionSummary | null; servings: number }) {
  const { space, colors } = useTheme();
  const showCalories = usePreferences((s) => s.showCalories);
  const setShowCalories = usePreferences((s) => s.setShowCalories);

  if (!nutrition) {
    return <AppText color="textSecondary">Nutrition isn&apos;t available for this recipe yet.</AppText>;
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {showCalories ? <Tile label="Energy" value={String(nutrition.energyKcal)} unit="kcal" /> : null}
        <Tile label="Protein" value={num(nutrition.proteinG)} unit="g" />
        <Tile label="Carbs" value={num(nutrition.carbsG)} unit="g" />
        <Tile label="Fat" value={num(nutrition.fatG)} unit="g" />
        <Tile label="Fibre" value={num(nutrition.fibreG)} unit="g" />
        {nutrition.sodiumMg != null ? <Tile label="Sodium" value={num(nutrition.sodiumMg)} unit="mg" /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md }}>
        <AppText variant="footnote" color="textSecondary" style={{ flex: 1 }}>
          Estimated per serving (1 of {servings})
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <AppText variant="footnote" color="textSecondary">
            Calories
          </AppText>
          <Switch
            value={showCalories}
            onValueChange={setShowCalories}
            accessibilityLabel="Show calories"
            trackColor={{ true: colors.primary }}
          />
        </View>
      </View>
    </View>
  );
}
