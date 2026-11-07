import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DietType, MealSlot } from '@food-suggest/shared';

import { AppText, Chip, EmptyState, ErrorState, SearchField, Skeleton } from '@/components/ui';
import { MealCard } from '@/features/meals/components/meal-card';
import { useCuisines, useMealList, type MealFilters } from '@/features/meals/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { SLOT_LABELS } from '@/lib/labels';

const SLOTS: MealSlot[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const DIETS: { value: DietType; label: string }[] = [
  { value: 'VEGAN', label: 'Vegan' },
  { value: 'VEGETARIAN', label: 'Vegetarian' },
  { value: 'PESCATARIAN', label: 'Pescatarian' },
];
const TIMES = [30, 60];

function ChipRow({ children, label }: { children: React.ReactNode; label: string }) {
  const { space } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={label}
      contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg }}>
      {children}
    </ScrollView>
  );
}

export default function DiscoverScreen() {
  const { colors, space } = useTheme();
  const [search, setSearch] = useState('');
  const [slot, setSlot] = useState<MealSlot>();
  const [diet, setDiet] = useState<DietType>();
  const [cuisine, setCuisine] = useState<string>();
  const [maxMinutes, setMaxMinutes] = useState<number>();
  const q = useDebouncedValue(search.trim());

  const filters = useMemo<MealFilters>(
    () => ({ q: q || undefined, slot, diet, cuisine, maxMinutes }),
    [q, slot, diet, cuisine, maxMinutes],
  );
  const meals = useMealList(filters);
  const cuisines = useCuisines();
  const hasFilters = !!(q || slot || diet || cuisine || maxMinutes);

  const clearAll = () => {
    setSearch('');
    setSlot(undefined);
    setDiet(undefined);
    setCuisine(undefined);
    setMaxMinutes(undefined);
  };

  const toggle = <T,>(current: T | undefined, value: T, set: (v: T | undefined) => void) =>
    set(current === value ? undefined : value);

  const header = (
    <View style={{ gap: space.md, paddingBottom: space.md }}>
      <ChipRow label="Meal type">
        {SLOTS.map((s) => (
          <Chip key={s} label={SLOT_LABELS[s]} selected={slot === s} onPress={() => toggle(slot, s, setSlot)} />
        ))}
      </ChipRow>
      <ChipRow label="Diet and time">
        {DIETS.map((d) => (
          <Chip key={d.value} label={d.label} selected={diet === d.value} onPress={() => toggle(diet, d.value, setDiet)} />
        ))}
        {TIMES.map((t) => (
          <Chip
            key={t}
            label={`Under ${t} min`}
            selected={maxMinutes === t}
            onPress={() => toggle(maxMinutes, t, setMaxMinutes)}
          />
        ))}
      </ChipRow>
      {cuisines.data?.items.length ? (
        <ChipRow label="Cuisine">
          {cuisines.data.items.map((c) => (
            <Chip
              key={c.slug}
              label={c.name}
              selected={cuisine === c.slug}
              onPress={() => toggle(cuisine, c.slug, setCuisine)}
            />
          ))}
        </ChipRow>
      ) : null}
      {meals.data ? (
        <AppText
          variant="footnote"
          color="textSecondary"
          accessibilityLiveRegion="polite"
          style={{ paddingHorizontal: space.lg }}>
          {meals.data.total === 1 ? '1 meal' : `${meals.data.total} meals`}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md, gap: space.md }}>
        <AppText variant="largeTitle">Discover</AppText>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search meals, e.g. waakye" />
      </View>

      <FlatList
        data={meals.data?.items ?? []}
        keyExtractor={(m) => m.slug}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: space.lg }}>
            <MealCard meal={item} />
          </View>
        )}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: space.xxl }}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        style={{ opacity: meals.isPlaceholderData ? 0.6 : 1 }}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={meals.isRefetching && !meals.isPlaceholderData} onRefresh={() => void meals.refetch()} />
        }
        ListEmptyComponent={
          meals.isPending ? (
            <View style={{ gap: space.md, paddingHorizontal: space.lg }} accessibilityLabel="Loading meals">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} style={{ height: 110 }} />
              ))}
            </View>
          ) : meals.isError ? (
            <ErrorState message={meals.error.message} onRetry={() => meals.refetch()} />
          ) : (
            <EmptyState
              title="No meals found"
              message={hasFilters ? 'Try a different search or fewer filters.' : 'Meals will appear here soon.'}
              actionLabel={hasFilters ? 'Clear filters' : undefined}
              onAction={hasFilters ? clearAll : undefined}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
