import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { View } from 'react-native';

import { EmptyState, ErrorState, isWaitingForNetwork, OfflineState } from '@/components/ui';
import { useFavorites } from '@/features/account/api';
import { MealGrid } from '@/features/meals/components/meal-grid';
import { useTheme } from '@/hooks/use-theme';

export default function FavoritesScreen() {
  const { colors, space } = useTheme();
  const router = useRouter();
  const favorites = useFavorites();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MealGrid
        meals={favorites.data?.items ?? []}
        loading={favorites.isPending && !isWaitingForNetwork(favorites)}
        header={<View style={{ height: space.lg }} />}
        refreshing={favorites.isRefetching}
        onRefresh={() => void favorites.refetch()}
        empty={
          isWaitingForNetwork(favorites) ? (
            <OfflineState message="Your saved meals will appear when you're back online." />
          ) : favorites.isError ? (
            <ErrorState message={favorites.error.message} onRetry={() => favorites.refetch()} />
          ) : (
            <EmptyState
              icon={Heart}
              title="No saved meals yet"
              message="Tap the heart on any meal to keep it here."
              actionLabel="Discover meals"
              onAction={() => router.navigate('/discover')}
            />
          )
        }
      />
    </View>
  );
}
