import { useRouter } from 'expo-router';
import { FlatList, View } from 'react-native';

import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useFavorites } from '@/features/account/api';
import { MealCard } from '@/features/meals/components/meal-card';
import { useTheme } from '@/hooks/use-theme';

export default function FavoritesScreen() {
  const { space, colors } = useTheme();
  const router = useRouter();
  const favorites = useFavorites();

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: space.lg, gap: space.md }}
      data={favorites.data?.items ?? []}
      keyExtractor={(m) => m.slug}
      renderItem={({ item }) => <MealCard meal={item} />}
      ListEmptyComponent={
        favorites.isPending ? (
          <View style={{ gap: space.md }}>
            <Skeleton style={{ height: 110 }} />
            <Skeleton style={{ height: 110 }} />
          </View>
        ) : favorites.isError ? (
          <ErrorState message={favorites.error.message} onRetry={() => favorites.refetch()} />
        ) : (
          <EmptyState
            title="No saved meals yet"
            message="Tap “Save meal” on any recipe to keep it here."
            actionLabel="Discover meals"
            onAction={() => router.navigate('/discover')}
          />
        )
      }
    />
  );
}
