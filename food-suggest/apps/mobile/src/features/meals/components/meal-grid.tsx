import type { ReactElement } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import type { MealCard } from '@food-suggest/shared';

import { Skeleton } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

import { MealGridCard } from './meal-card';

export interface MealGridProps {
  meals: MealCard[];
  loading: boolean;
  header?: ReactElement;
  empty?: ReactElement;
  refreshing?: boolean;
  onRefresh?: () => void;
  dimmed?: boolean;
}

/** Two-column photo grid with generous spacing; skeletons while loading. */
export function MealGrid({ meals, loading, header, empty, refreshing, onRefresh, dimmed }: MealGridProps) {
  const { layout, space } = useTheme();
  return (
    <FlatList
      data={meals}
      keyExtractor={(m) => m.slug}
      numColumns={2}
      renderItem={({ item }) => <MealGridCard meal={item} />}
      columnWrapperStyle={{ gap: space.lg, paddingHorizontal: layout.gutter }}
      ItemSeparatorComponent={() => <View style={{ height: space.xl }} />}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: space.xxxl }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      style={{ opacity: dimmed ? 0.6 : 1 }}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
      ListEmptyComponent={
        loading ? (
          <View accessibilityLabel="Loading meals" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, paddingHorizontal: layout.gutter }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} style={{ width: '46%', flexGrow: 1, aspectRatio: 0.75 }} />
            ))}
          </View>
        ) : (
          empty
        )
      }
    />
  );
}
