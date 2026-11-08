import { useRouter } from 'expo-router';
import { CalendarPlus, ChevronRight, Search, Sparkles, type LucideIcon } from 'lucide-react-native';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import type { MealSlot } from '@food-suggest/shared';

import { AppText, ErrorState, Icon, PressableScale, Screen, SectionHeader, Skeleton } from '@/components/ui';
import { MealTile } from '@/features/meals/components/meal-card';
import { MealImage } from '@/features/meals/components/meal-image';
import { useMealList } from '@/features/meals/queries';
import { useMealImages } from '@/features/meals/use-meal-images';
import { todayKey } from '@/features/plan/dates';
import { useRecommendations } from '@/features/recommendations/queries';
import { RecommendationCard } from '@/features/recommendations/recommendation-card';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes } from '@/lib/format';
import { SLOT_ICONS } from '@/lib/icons';
import { SLOT_LABELS } from '@/lib/labels';
import { entriesBetween, useMealPlan } from '@/stores/meal-plan';
import { useProfile } from '@/stores/profile';
import { useRecentMeals } from '@/stores/recent-meals';
import { minTouchTarget } from '@/theme/tokens';

function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Horizontal, edge-to-edge carousel inside the page gutter. */
function Carousel({ children, gap }: { children: React.ReactNode; gap?: number }) {
  const { layout, space } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      style={{ marginHorizontal: -layout.gutter }}
      contentContainerStyle={{ gap: gap ?? space.md, paddingHorizontal: layout.gutter }}>
      {children}
    </ScrollView>
  );
}

/** Tappable search bar that opens Discover. */
function SearchShortcut() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  return (
    <PressableScale
      accessibilityRole="search"
      accessibilityLabel="Search meals"
      onPress={() => router.navigate({ pathname: '/discover', params: { focus: '1' } })}
      pressedScale={0.98}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.pill,
        paddingHorizontal: space.lg,
        minHeight: minTouchTarget + 6,
      }}>
      <Icon icon={Search} color="textSecondary" />
      <AppText color="textSecondary">Search meals, e.g. waakye</AppText>
    </PressableScale>
  );
}

function SlotShortcuts() {
  const router = useRouter();
  const { colors, space } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {(Object.keys(SLOT_ICONS) as MealSlot[]).map((slot) => (
        <PressableScale
          key={slot}
          accessibilityRole="button"
          accessibilityLabel={`${SLOT_LABELS[slot]} meals`}
          onPress={() => router.navigate({ pathname: '/discover', params: { slot } })}
          pressedScale={0.94}
          style={{ alignItems: 'center', gap: space.sm, width: 76 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={SLOT_ICONS[slot]} size="lg" color="link" />
          </View>
          <AppText variant="footnote" color="textSecondary">
            {SLOT_LABELS[slot]}
          </AppText>
        </PressableScale>
      ))}
    </View>
  );
}

/** One-line prompt row: icon, title, short detail, chevron. */
function PromptRow({ icon, title, detail, onPress }: { icon: LucideIcon; title: string; detail: string; onPress: () => void }) {
  const { colors, radius, space, elevation } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      onPress={onPress}
      pressedScale={0.98}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md }, elevation]}>
      <View style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Icon icon={icon} size="lg" color="link" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="headline">{title}</AppText>
        <AppText variant="footnote" color="textSecondary">
          {detail}
        </AppText>
      </View>
      <Icon icon={ChevronRight} color="textSecondary" />
    </PressableScale>
  );
}

function PickedForYou() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { layout, space } = useTheme();
  const complete = useProfile((s) => s.onboardingComplete);
  const picks = useRecommendations({ limit: 6 });
  const cardWidth = Math.min(320, width - layout.gutter * 2 - 40);

  if (!complete) {
    return (
      <PromptRow
        icon={Sparkles}
        title="Personalise your picks"
        detail="About a minute · stays on this phone"
        onPress={() => router.push('/onboarding')}
      />
    );
  }

  return (
    <View style={{ gap: space.md }}>
      <SectionHeader title="Picked for you" actionLabel="Edit" onAction={() => router.navigate('/profile')} />
      {picks.data?.notes.map((n) => (
        <AppText key={n} variant="footnote" color="textSecondary">
          {n}
        </AppText>
      ))}
      {picks.isPending ? (
        <Carousel>
          {[0, 1].map((i) => (
            <Skeleton key={i} style={{ width: cardWidth, height: cardWidth * 1.15 }} />
          ))}
        </Carousel>
      ) : picks.isError ? (
        <ErrorState message={picks.error.message} onRetry={() => picks.refetch()} />
      ) : picks.data.items.length === 0 ? (
        <AppText color="textSecondary">No meals match all your choices yet. Try relaxing one in Profile.</AppText>
      ) : (
        <Carousel>
          {picks.data.items.map((item) => (
            <RecommendationCard key={item.meal.slug} item={item} width={cardWidth} />
          ))}
        </Carousel>
      )}
    </View>
  );
}

function TodaysPlan() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const all = useMealPlan((s) => s.entries);
  const images = useMealImages();
  const today = todayKey();
  const entries = entriesBetween(all, today, today);

  if (!entries.length) {
    return <PromptRow icon={CalendarPlus} title="Plan today's meals" detail="Get a shopping list in one tap" onPress={() => router.navigate('/plan')} />;
  }
  return (
    <View style={{ gap: space.md }}>
      <SectionHeader title="Today's plan" actionLabel="Open" onAction={() => router.navigate('/plan')} />
      <Carousel>
        {entries.map((e) => (
          <PressableScale
            key={e.id}
            accessibilityRole="button"
            accessibilityLabel={`${SLOT_LABELS[e.slot]}: ${e.name}`}
            onPress={() => router.push({ pathname: '/meal/[slug]', params: { slug: e.slug } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.sm, paddingRight: space.lg, maxWidth: 280 }}>
            <MealImage slug={e.slug} uri={images.get(e.slug)} style={{ width: 56, height: 56, borderRadius: radius.md }} />
            <View style={{ flexShrink: 1, gap: 2 }}>
              <AppText variant="caption" color="link">
                {SLOT_LABELS[e.slot]}
              </AppText>
              <AppText variant="subhead" style={{ fontWeight: '600' }} numberOfLines={2}>
                {e.name}
              </AppText>
            </View>
          </PressableScale>
        ))}
      </Carousel>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { space } = useTheme();
  const popular = useMealList({ limit: 10 });
  const recent = useRecentMeals((s) => s.items);
  const images = useMealImages();

  return (
    <Screen>
      <View style={{ gap: space.lg }}>
        <View style={{ gap: space.xs }}>
          <AppText variant="subhead" color="textSecondary">
            {greeting()}
          </AppText>
          <AppText variant="display">What would you like to eat?</AppText>
        </View>
        <SearchShortcut />
      </View>

      <SlotShortcuts />

      <PickedForYou />

      <TodaysPlan />

      <View style={{ gap: space.md }}>
        <SectionHeader title="Popular" onAction={() => router.navigate('/discover')} />
        {popular.isError ? (
          <ErrorState message={popular.error.message} onRetry={() => popular.refetch()} />
        ) : (
          <Carousel>
            {popular.isPending
              ? [0, 1, 2].map((i) => <Skeleton key={i} style={{ width: 168, height: 220 }} />)
              : popular.data?.items.map((m) => (
                  <MealTile key={m.slug} slug={m.slug} name={m.name} imageUrl={m.imageUrl} subtitle={`${m.cuisine.name} · ${formatMinutes(m.totalMinutes)}`} />
                ))}
          </Carousel>
        )}
      </View>

      {recent.length ? (
        <View style={{ gap: space.md }}>
          <SectionHeader title="Recently viewed" />
          <Carousel>
            {recent.map((m) => (
              <MealTile key={m.slug} slug={m.slug} name={m.name} imageUrl={images.get(m.slug)} subtitle={m.cuisine} width={136} />
            ))}
          </Carousel>
        </View>
      ) : null}
    </Screen>
  );
}
