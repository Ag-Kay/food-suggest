import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { AppText, Button, ErrorState, Screen, Skeleton } from '@/components/ui';
import { MealTile } from '@/features/meals/components/meal-card';
import { useMealList } from '@/features/meals/queries';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes } from '@/lib/format';
import { useRecentMeals } from '@/stores/recent-meals';

function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <AppText variant="title3">{title}</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -space.lg }}
        contentContainerStyle={{ gap: space.md, paddingHorizontal: space.lg }}>
        {children}
      </ScrollView>
    </View>
  );
}

function TileSkeletons() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} style={{ width: 160, height: 150 }} />
      ))}
    </>
  );
}

export default function HomeScreen() {
  const { space } = useTheme();
  const router = useRouter();
  const popular = useMealList({ limit: 10 });
  const breakfast = useMealList({ slot: 'BREAKFAST', limit: 10 });
  const recent = useRecentMeals((s) => s.items);

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <AppText variant="subhead" color="textSecondary">
          {greeting()}
        </AppText>
        <AppText variant="largeTitle">What would you like to eat?</AppText>
      </View>

      {popular.isError ? (
        <ErrorState message={popular.error.message} onRetry={() => popular.refetch()} />
      ) : (
        <Row title="Popular meals">
          {popular.isPending ? (
            <TileSkeletons />
          ) : (
            popular.data?.items.map((m) => (
              <MealTile
                key={m.slug}
                slug={m.slug}
                name={m.name}
                subtitle={`${m.cuisine.name} · ${formatMinutes(m.totalMinutes)}`}
              />
            ))
          )}
        </Row>
      )}

      {!breakfast.isError ? (
        <Row title="Breakfast ideas">
          {breakfast.isPending ? (
            <TileSkeletons />
          ) : (
            breakfast.data?.items.map((m) => (
              <MealTile key={m.slug} slug={m.slug} name={m.name} subtitle={formatMinutes(m.totalMinutes)} />
            ))
          )}
        </Row>
      ) : null}

      {recent.length ? (
        <Row title="Recently viewed">
          {recent.map((m) => (
            <MealTile key={m.slug} slug={m.slug} name={m.name} subtitle={m.cuisine} />
          ))}
        </Row>
      ) : null}

      <Button label="Browse all meals" variant="secondary" onPress={() => router.navigate('/discover')} />

      <AppText variant="footnote" color="textSecondary">
        Food Suggest offers general nutrition information, not medical advice. Nutrition values are estimates.
      </AppText>
    </Screen>
  );
}
