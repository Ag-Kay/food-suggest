import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MealSlot, type MealCard } from '@food-suggest/shared';

import { AppText, EmptyState, ErrorState, SearchField, Skeleton } from '@/components/ui';
import { macroLine } from '@/features/meals/components/meal-card';
import { useMealList } from '@/features/meals/queries';
import { dayLabel, isDateKey } from '@/features/plan/dates';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes } from '@/lib/format';
import { SLOT_LABELS } from '@/lib/labels';
import { useMealPlan } from '@/stores/meal-plan';
import { usePreferences } from '@/stores/preferences';
import { minTouchTarget } from '@/theme/tokens';

/** Choose a meal for a day and meal of the day, or to replace a planned meal. */
export default function PickMeal() {
  const router = useRouter();
  const { colors, space } = useTheme();
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
        contentContainerStyle={{ padding: space.lg, gap: space.sm }}
        ListHeaderComponent={
          <View style={{ gap: space.md, marginBottom: space.sm }}>
            <AppText color="textSecondary">{dayLabel(date)}</AppText>
            <SearchField value={query} onChangeText={setQuery} placeholder="Search meals" />
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: allMeals }}
              onPress={() => setAllMeals((v) => !v)}
              style={{ minHeight: minTouchTarget, justifyContent: 'center' }}>
              <AppText color="primary" variant="subhead">
                {allMeals ? `Show only ${SLOT_LABELS[slot].toLowerCase()} meals` : 'Show all meals'}
              </AppText>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          list.isPending ? (
            <View style={{ gap: space.sm }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} style={{ height: 64 }} />
              ))}
            </View>
          ) : list.isError ? (
            <ErrorState message={list.error.message} onRetry={() => list.refetch()} />
          ) : (
            <EmptyState title="No meals found" message="Try another search, or show all meals." />
          )
        }
        renderItem={({ item }) => {
          const macros = macroLine(item, showCalories);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.cuisine.name}, ${formatMinutes(item.totalMinutes)}`}
              accessibilityHint={params.replace ? 'Replaces the planned meal' : 'Adds it to your plan'}
              onPress={() => choose(item)}
              style={({ pressed }) => ({
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: space.md,
                gap: space.xxs,
                opacity: pressed ? 0.7 : 1,
              })}>
              <AppText variant="headline">{item.name}</AppText>
              <AppText variant="footnote" color="textSecondary">
                {item.cuisine.name} · {formatMinutes(item.totalMinutes)}
                {macros ? ` · ${macros}` : ''}
              </AppText>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
