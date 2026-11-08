import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { AppText, Button, Card, ErrorState, Screen, Skeleton } from '@/components/ui';
import { MealTile } from '@/features/meals/components/meal-card';
import { useMealList } from '@/features/meals/queries';
import { TodayPlanCard } from '@/features/plan/components/today-plan-card';
import { useRecommendations } from '@/features/recommendations/queries';
import { RecommendationCard } from '@/features/recommendations/recommendation-card';
import { GOAL_LABELS } from '@/lib/labels';
import { useProfile } from '@/stores/profile';
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

function PickedForYou() {
  const { space } = useTheme();
  const router = useRouter();
  const complete = useProfile((s) => s.onboardingComplete);
  const goal = useProfile((s) => s.profile.goal);
  const picks = useRecommendations({ limit: 5 });

  if (!complete) {
    return (
      <Card style={{ gap: space.sm }}>
        <AppText variant="headline">Get suggestions that fit you</AppText>
        <AppText color="textSecondary">
          Answer a few optional questions about your goal, diet and allergies. Your answers stay on this phone.
        </AppText>
        <Button label="Personalise" onPress={() => router.push('/onboarding')} style={{ marginTop: space.xs }} />
      </Card>
    );
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: space.xxs }}>
        <AppText variant="title3">Picked for you</AppText>
        {goal ? (
          <AppText variant="footnote" color="textSecondary">
            Goal: {GOAL_LABELS[goal]}
          </AppText>
        ) : null}
      </View>
      {picks.data?.notes.map((n) => (
        <AppText key={n} variant="footnote" color="textSecondary">
          {n}
        </AppText>
      ))}
      {picks.isPending ? (
        <>
          <Skeleton style={{ height: 150 }} />
          <Skeleton style={{ height: 150 }} />
        </>
      ) : picks.isError ? (
        <ErrorState message={picks.error.message} onRetry={() => picks.refetch()} />
      ) : picks.data.items.length === 0 ? (
        <Card style={{ gap: space.sm }}>
          <AppText variant="headline">No meals match all your choices yet</AppText>
          <AppText color="textSecondary">
            We&apos;re adding more meals. You can also relax a preference, such as cooking time, in Profile.
          </AppText>
        </Card>
      ) : (
        picks.data.items.map((item) => <RecommendationCard key={item.meal.slug} item={item} />)
      )}
    </View>
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

      <PickedForYou />

      <TodayPlanCard />

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
