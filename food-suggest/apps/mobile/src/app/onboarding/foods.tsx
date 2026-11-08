import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText, Chip, SearchField, Skeleton } from '@/components/ui';
import { useCuisines } from '@/features/meals/queries';
import { useStepFlow } from '@/features/onboarding/flow';
import { StepLayout } from '@/features/onboarding/step-layout';
import { useIngredients } from '@/features/recommendations/queries';
import { useTheme } from '@/hooks/use-theme';
import { useProfile } from '@/stores/profile';

const NONE: string[] = [];

const toggleIn = (list: string[], value: string) =>
  list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

export default function FoodsStep() {
  const { space } = useTheme();
  const profile = useProfile((s) => s.profile);
  const update = useProfile((s) => s.update);
  const flow = useStepFlow('foods');
  const cuisines = useCuisines();
  const ingredients = useIngredients();
  const [search, setSearch] = useState('');

  const avoid = profile.avoidIngredients ?? NONE;
  const chosenCuisines = profile.cuisines ?? NONE;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = ingredients.data?.items ?? [];
    const matches = q
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) || i.aliases.some((a) => a.toLowerCase().includes(q)),
        )
      : items;
    // Selected items first so they stay visible.
    return [...matches].sort(
      (a, b) => Number(avoid.includes(b.slug)) - Number(avoid.includes(a.slug)),
    );
  }, [ingredients.data, search, avoid]);

  return (
    <StepLayout
      step={flow.step}
      totalSteps={flow.totalSteps}
      title="Your food preferences"
      why="Pick cuisines you enjoy, and any foods you never want in your suggestions."
      onPrimary={flow.goNext}
      secondaryLabel="Skip"
      onSecondary={flow.goNext}
    >
      <View style={{ gap: space.sm }}>
        <AppText variant="headline">Cuisines you enjoy</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {cuisines.isPending ? <Skeleton style={{ height: 36, width: 200 }} /> : null}
          {cuisines.data?.items.map((c) => (
            <Chip
              key={c.slug}
              label={c.name}
              selected={chosenCuisines.includes(c.slug)}
              onPress={() => update({ cuisines: toggleIn(chosenCuisines, c.slug) })}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <AppText variant="headline">Foods to avoid</AppText>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Search foods, e.g. goat"
        />
        {ingredients.isError ? (
          <AppText color="danger">{ingredients.error.message}</AppText>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {ingredients.isPending ? <Skeleton style={{ height: 36, width: 240 }} /> : null}
            {filtered.slice(0, 40).map((i) => (
              <Chip
                key={i.slug}
                label={i.name}
                selected={avoid.includes(i.slug)}
                onPress={() => update({ avoidIngredients: toggleIn(avoid, i.slug) })}
              />
            ))}
          </View>
        )}
      </View>
    </StepLayout>
  );
}
