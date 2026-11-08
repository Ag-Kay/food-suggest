import { useLocalSearchParams, useRouter } from 'expo-router';
import { SearchX, SlidersHorizontal, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MealSlot } from '@food-suggest/shared';

import { AppText, Chip, EmptyState, ErrorState, Icon, IconButton, PressableScale, SearchField } from '@/components/ui';
import { MealGrid } from '@/features/meals/components/meal-grid';
import { sheetFilterCount, useDiscoverFilters } from '@/features/meals/discover-filters';
import { useCuisines, useMealList, type MealFilters } from '@/features/meals/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { SLOT_ICONS } from '@/lib/icons';
import { DIET_TYPE_LABELS, SLOT_LABELS } from '@/lib/labels';

/** Removable pill for an active sheet filter. */
function ActiveFilter({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { colors, radius, space } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Remove filter: ${label}`}
      onPress={onRemove}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, backgroundColor: colors.primaryMuted, borderRadius: radius.pill, paddingLeft: space.md, paddingRight: space.sm, minHeight: 34 }}>
      <AppText variant="footnote" color="link" style={{ fontWeight: '600' }}>
        {label}
      </AppText>
      <Icon icon={X} size={14} color="link" />
    </PressableScale>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slot?: string; focus?: string }>();
  const { colors, layout, radius, space } = useTheme();
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim());
  const f = useDiscoverFilters();
  const cuisines = useCuisines();

  // Shortcuts from Home ("Breakfast", search bar) arrive as params; apply them once each.
  const [seenSlotParam, setSeenSlotParam] = useState<string | undefined>(undefined);
  if (params.slot !== seenSlotParam) {
    setSeenSlotParam(params.slot);
    const slot = MealSlot.safeParse(params.slot);
    if (slot.success) f.set({ slot: slot.data });
  }

  const filters = useMemo<MealFilters>(
    () => ({ q: q || undefined, slot: f.slot, diet: f.diet, cuisine: f.cuisine, maxMinutes: f.maxMinutes }),
    [q, f.slot, f.diet, f.cuisine, f.maxMinutes],
  );
  const meals = useMealList(filters);
  const sheetCount = sheetFilterCount(f);
  const hasFilters = !!(q || f.slot || sheetCount);
  const cuisineName = cuisines.data?.items.find((c) => c.slug === f.cuisine)?.name;

  const header = (
    <View style={{ gap: space.lg, paddingBottom: space.xl }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Meal type" contentContainerStyle={{ gap: space.sm, paddingHorizontal: layout.gutter }}>
        {MealSlot.options.map((s) => (
          <Chip key={s} label={SLOT_LABELS[s]} icon={SLOT_ICONS[s]} selected={f.slot === s} onPress={() => f.set({ slot: f.slot === s ? undefined : s })} />
        ))}
      </ScrollView>
      {sheetCount ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingHorizontal: layout.gutter }}>
          {f.diet ? <ActiveFilter label={DIET_TYPE_LABELS[f.diet]} onRemove={() => f.set({ diet: undefined })} /> : null}
          {f.maxMinutes ? <ActiveFilter label={`Under ${f.maxMinutes} min`} onRemove={() => f.set({ maxMinutes: undefined })} /> : null}
          {f.cuisine ? <ActiveFilter label={cuisineName ?? f.cuisine} onRemove={() => f.set({ cuisine: undefined })} /> : null}
        </View>
      ) : null}
      {meals.data ? (
        <AppText variant="footnote" color="textSecondary" accessibilityLiveRegion="polite" style={{ paddingHorizontal: layout.gutter }}>
          {meals.data.total === 1 ? '1 meal' : `${meals.data.total} meals`}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: layout.gutter, paddingTop: space.lg, paddingBottom: space.lg, gap: space.lg }}>
        <AppText variant="display">Discover</AppText>
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Search meals, e.g. waakye"
          autoFocus={params.focus === '1'}
          trailing={
            <View>
              <IconButton
                icon={SlidersHorizontal}
                label={sheetCount ? `Filters, ${sheetCount} on` : 'Filters'}
                tone={sheetCount ? 'filled' : 'plain'}
                onPress={() => router.push('/discover-filters')}
              />
              {sheetCount ? (
                <View
                  pointerEvents="none"
                  style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: radius.pill, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' }}>
                  <AppText variant="caption" style={{ color: colors.background, fontSize: 11 }}>
                    {sheetCount}
                  </AppText>
                </View>
              ) : null}
            </View>
          }
        />
      </View>

      <MealGrid
        meals={meals.data?.items ?? []}
        loading={meals.isPending}
        dimmed={meals.isPlaceholderData}
        header={header}
        refreshing={meals.isRefetching && !meals.isPlaceholderData}
        onRefresh={() => void meals.refetch()}
        empty={
          meals.isError ? (
            <ErrorState message={meals.error.message} onRetry={() => meals.refetch()} />
          ) : (
            <EmptyState
              icon={SearchX}
              title="No meals found"
              message={hasFilters ? 'Try another search or fewer filters.' : 'Meals will appear here soon.'}
              actionLabel={hasFilters ? 'Clear filters' : undefined}
              onAction={
                hasFilters
                  ? () => {
                      setSearch('');
                      f.resetAll();
                    }
                  : undefined
              }
            />
          )
        }
      />
    </SafeAreaView>
  );
}
