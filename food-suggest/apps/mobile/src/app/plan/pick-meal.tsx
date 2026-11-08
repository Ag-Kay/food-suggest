import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Plus, Repeat, SearchX } from 'lucide-react-native';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MealSlot, type MealCard } from '@food-suggest/shared';

import { AppText, Chip, EmptyState, ErrorState, Icon, PressableScale, SearchField, Skeleton } from '@/components/ui';
import { MealImage } from '@/features/meals/components/meal-image';
import { macroLine } from '@/features/meals/components/meal-card';
import { useMealList } from '@/features/meals/queries';
import { dayLabel, isDateKey } from '@/features/plan/dates';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes } from '@/lib/format';
import { SLOT_ICONS } from '@/lib/icons';
import { SLOT_LABELS } from '@/lib/labels';
import { useMealPlan } from '@/stores/meal-plan';
import { usePreferences } from '@/stores/preferences';

/** Choose a meal for a day and meal of the day, or to replace a planned meal. */
export default function PickMeal() {
  const router = useRouter();
  const { colors, layout, radius, space } = useTheme();
  const params = useLocalSearchParams<{ date: string; slot: string; replace?: string }>();
  const slot = MealSlot.safeParse(params.slot).data;
  const date = isDateKey(params.date) ? params.date : null;
  const [query, setQuery] = useState('');
  const q = useDebouncedValue(query.trim(), 300);
  const [allMeals, setAllMeals] = useState(false);
  const showCalories = usePreferences((s) => s.showCalories);
  const { add, replace, lastServings } = useMealPlan.getState();

  const list = useMealList({ slot: allMeals ? undefined : slot, q: q || undefined });

  if (!slot || !date) {
    return <EmptyState title="Something went wrong" message="Go back to your plan and try again." />;
  }

  const choose = (meal: MealCard) => {
    if (params.replace) replace(params.replace, { slug: meal.slug, name: meal.name });
    else add({ date, slot, slug: meal.slug, name: meal.name, servings: lastServings });
    router.back();
  };

  const title = `${params.replace ? 'Replace' : 'Add'} ${SLOT_LABELS[slot].toLowerCase()}`;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title }} />
      <FlatList
        data={list.data?.items ?? []}
        keyExtractor={(m) => m.slug}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: layout.gutter, gap: space.sm }}
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: space.sm }}>
            <AppText color="textSecondary">{dayLabel(date)}</AppText>
            <SearchField value={query} onChangeText={setQuery} placeholder="Search meals" />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Chip label={`${SLOT_LABELS[slot]} meals`} icon={SLOT_ICONS[slot]} selected={!allMeals} onPress={() => setAllMeals(false)} />
              <Chip label="All meals" selected={allMeals} onPress={() => setAllMeals(true)} />
            </View>
          </View>
        }
        ListEmptyComponent={
          list.isPending ? (
            <View style={{ gap: space.sm }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} style={{ height: 80 }} />
              ))}
            </View>
          ) : list.isError ? (
            <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
          ) : (
            <EmptyState icon={SearchX} title="No meals found" message="Try another search, or show all meals." />
          )
        }
        renderItem={({ item }) => {
          const macros = macroLine(item, showCalories);
          return (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.cuisine.name}, ${formatMinutes(item.totalMinutes)}`}
              accessibilityHint={params.replace ? 'Replaces the planned meal' : 'Adds it to your plan'}
              onPress={() => choose(item)}
              pressedScale={0.98}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.sm }}>
              <MealImage slug={item.slug} uri={item.imageUrl} style={{ width: 64, height: 64, borderRadius: radius.md }} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="headline" numberOfLines={2}>
                  {item.name}
                </AppText>
                <AppText variant="footnote" color="textSecondary" numberOfLines={1}>
                  {formatMinutes(item.totalMinutes)}
                  {macros ? ` · ${macros}` : ''}
                </AppText>
              </View>
              <Icon icon={params.replace ? Repeat : Plus} color="link" />
            </PressableScale>
          );
        }}
      />
    </SafeAreaView>
  );
}
