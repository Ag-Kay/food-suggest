import { Switch, View } from 'react-native';

import type { NutritionSummary } from '@food-suggest/shared';

import { AppText, Card } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { usePreferences } from '@/stores/preferences';

function Stat({ label, value }: { label: string; value: string }) {
  const { space } = useTheme();
  return (
    <View style={{ flexGrow: 1, flexBasis: '30%', gap: space.xxs }}>
      <AppText variant="title3">{value}</AppText>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
    </View>
  );
}

const fmt = (v: number | null, unit: string) => (v == null ? 'Unknown' : `${Math.round(v * 10) / 10} ${unit}`);

/** Per-serving nutrition. Calories are opt-in; every figure is labelled an estimate. */
export function NutritionPanel({ nutrition, servings }: { nutrition: NutritionSummary | null; servings: number }) {
  const { space, colors } = useTheme();
  const showCalories = usePreferences((s) => s.showCalories);
  const setShowCalories = usePreferences((s) => s.setShowCalories);

  if (!nutrition) {
    return (
      <Card>
        <AppText color="textSecondary">Nutrition information isn&apos;t available for this recipe yet.</AppText>
      </Card>
    );
  }

  return (
    <Card style={{ gap: space.lg }}>
      <View style={{ gap: space.xxs }}>
        <AppText variant="headline">Per serving</AppText>
        <AppText variant="footnote" color="textSecondary">
          Estimated from the ingredients, for 1 of {servings} servings. Amounts vary with how it&apos;s cooked.
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg }}>
        {showCalories ? <Stat label="Calories" value={`${nutrition.energyKcal} kcal`} /> : null}
        <Stat label="Protein" value={fmt(nutrition.proteinG, 'g')} />
        <Stat label="Carbs" value={fmt(nutrition.carbsG, 'g')} />
        <Stat label="Fat" value={fmt(nutrition.fatG, 'g')} />
        <Stat label="Fibre" value={fmt(nutrition.fibreG, 'g')} />
        <Stat label="Salt (sodium)" value={fmt(nutrition.sodiumMg, 'mg')} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: space.md,
        }}>
        <AppText variant="subhead" style={{ flex: 1 }}>
          Show calories
        </AppText>
        <Switch
          value={showCalories}
          onValueChange={setShowCalories}
          accessibilityLabel="Show calories"
          trackColor={{ true: colors.primary }}
        />
      </View>
    </Card>
  );
}
