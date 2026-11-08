import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarPlus, ChefHat, ChevronDown, ChevronLeft, Clock, ExternalLink, Info, Leaf, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MealDetail, MealVariantDetail } from '@food-suggest/shared';

import { AppText, Badge, Button, Chip, ErrorState, Icon, IconButton, isWaitingForNetwork, OfflineState, Segmented, Skeleton, type LucideIcon } from '@/components/ui';
import { AllergenNotice } from '@/features/meals/components/allergen-notice';
import { FavoriteButton } from '@/features/meals/components/favorite-button';
import { MealImage } from '@/features/meals/components/meal-image';
import { NutritionPanel } from '@/features/meals/components/nutrition-panel';
import { useMeal } from '@/features/meals/queries';
import { useTheme } from '@/hooks/use-theme';
import { formatIngredientAmount, formatMinutes } from '@/lib/format';
import { DIET_LABELS, DIFFICULTY_LABELS, SLOT_LABELS } from '@/lib/labels';
import { useRecentMeals } from '@/stores/recent-meals';
import { minTouchTarget } from '@/theme/tokens';

function Stat({ icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  const { colors, radius, space } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
      <Icon icon={icon} size="md" color="link" />
      <View style={{ gap: 2 }}>
        <AppText variant="caption" color="textSecondary">
          {label}
        </AppText>
        <AppText variant="headline" numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

function Ingredients({ variant }: { variant: MealVariantDetail }) {
  const { space, colors } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      {variant.notes ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Icon icon={Info} size="sm" color="textSecondary" />
          <AppText variant="footnote" color="textSecondary" style={{ flex: 1 }}>
            {variant.notes}
          </AppText>
        </View>
      ) : null}
      <View>
        {variant.ingredients.map((i, idx) => (
          <View
            key={`${i.slug}-${idx}`}
            accessible
            accessibilityLabel={`${formatIngredientAmount(i.quantity, i.unit)} ${i.name}${i.optional ? ', optional' : ''}${i.note ? `. ${i.note}` : ''}`}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.md, borderTopWidth: idx ? 0.5 : 0, borderTopColor: colors.border }}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText>{i.name}</AppText>
              {i.note || i.optional ? (
                <AppText variant="footnote" color="textSecondary">
                  {[i.optional ? 'Optional' : null, i.note].filter(Boolean).join(' · ')}
                </AppText>
              ) : null}
            </View>
            <AppText variant="subhead" color="textSecondary" style={{ fontWeight: '600' }}>
              {formatIngredientAmount(i.quantity, i.unit)}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function Steps({ steps }: { steps: string[] }) {
  const { space, colors, radius } = useTheme();
  return (
    <View style={{ gap: space.lg }}>
      {steps.map((step, idx) => (
        <View key={idx} style={{ flexDirection: 'row', gap: space.md }} accessible accessibilityLabel={`Step ${idx + 1}. ${step}`}>
          <View style={{ width: 30, height: 30, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="footnote" maxFontSizeMultiplier={1.3} style={{ color: colors.onPrimary, fontWeight: '700' }}>
              {idx + 1}
            </AppText>
          </View>
          <AppText style={{ flex: 1, paddingTop: 3 }}>{step}</AppText>
        </View>
      ))}
    </View>
  );
}

/** Collapsed by default: recipe status, nutrition sources and the photo credit. */
function AboutRecipe({ meal, variant }: { meal: MealDetail; variant: MealVariantDetail }) {
  const { colors, radius, space } = useTheme();
  const [open, setOpen] = useState(false);
  const approximations = variant.nutritionSources.filter((s) => s.match !== 'EXACT');
  const sources = [...new Set(variant.nutritionSources.map((s) => s.source))];

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: space.lg }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: minTouchTarget + 12 }}>
        <Icon icon={Info} size="md" color="textSecondary" />
        <AppText variant="headline" style={{ flex: 1 }}>
          About this recipe
        </AppText>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon icon={ChevronDown} color="textSecondary" />
        </View>
      </Pressable>
      {open ? (
        <View style={{ gap: space.sm, paddingBottom: space.lg }}>
          {!variant.recipeReviewed ? (
            <AppText variant="footnote" color="textSecondary">
              Draft recipe with typical home amounts, not yet reviewed by a cook or nutritionist.
            </AppText>
          ) : null}
          <AppText variant="footnote" color="textSecondary">
            Nutrition is estimated from the ingredients using {sources.join('; ')}.
          </AppText>
          {approximations.map((s) => (
            <AppText key={s.ingredient} variant="footnote" color="textSecondary">
              {s.ingredient} ({s.match === 'PROXY' ? 'approximation' : 'close match'}): {s.matchNote}
            </AppText>
          ))}
          {meal.image ? <PhotoCredit image={meal.image} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function PhotoCredit({ image }: { image: NonNullable<MealDetail['image']> }) {
  const { space } = useTheme();
  const text = `Photo: ${image.credit} · ${image.license}`;
  if (!image.sourceUrl) {
    return (
      <AppText variant="footnote" color="textSecondary">
        {text}
      </AppText>
    );
  }
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityHint="Opens the photo's source page"
      onPress={() => void Linking.openURL(image.sourceUrl!)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: minTouchTarget }}>
      <AppText variant="footnote" color="link" style={{ flexShrink: 1 }}>
        {text}
      </AppText>
      <Icon icon={ExternalLink} size={14} color="link" />
    </Pressable>
  );
}

export default function MealDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { colors, layout, radius, space } = useTheme();
  const meal = useMeal(slug);
  const addRecent = useRecentMeals((s) => s.add);
  const [variantId, setVariantId] = useState<string>();
  const [tab, setTab] = useState<'ingredients' | 'method'>('ingredients');
  // Past the photo, the floating buttons get a solid bar so they don't sit on the content.
  const [pastHero, setPastHero] = useState(false);

  const data = meal.data;
  useEffect(() => {
    if (data) addRecent({ slug: data.slug, name: data.name, cuisine: data.cuisine.name });
  }, [data, addRecent]);

  const variant = data?.variants.find((v) => v.id === variantId) ?? data?.variants[0];
  const heroHeight = Math.round(Math.min(460, height * 0.52));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false, title: data?.name ?? '' }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: space.xxxl + insets.bottom }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(e) => {
          const past = e.nativeEvent.contentOffset.y > heroHeight - insets.top - 72;
          if (past !== pastHero) setPastHero(past);
        }}>
        {isWaitingForNetwork(meal) ? (
          <View style={{ paddingTop: insets.top + 64, paddingHorizontal: layout.gutter }}>
            <OfflineState message="This meal isn't saved on your phone yet. It will load when you're back online." />
          </View>
        ) : meal.isPending ? (
          <View accessibilityLabel="Loading meal">
            <Skeleton style={{ height: heroHeight, borderRadius: 0 }} />
            <View style={{ padding: layout.gutter, gap: space.lg }}>
              <Skeleton style={{ height: 52 }} />
              <Skeleton style={{ height: 96 }} />
              <Skeleton style={{ height: 200 }} />
            </View>
          </View>
        ) : meal.isError ? (
          <View style={{ paddingTop: insets.top + 64, paddingHorizontal: layout.gutter }}>
            <ErrorState message={meal.error.message} onRetry={() => meal.refetch()} />
          </View>
        ) : data && variant ? (
          <>
            <View style={{ height: heroHeight }}>
              <MealImage slug={data.slug} uri={data.imageUrl} scrim priority="high" style={{ height: heroHeight, borderRadius: 0 }} />
              <View style={{ position: 'absolute', left: layout.gutter, right: layout.gutter, bottom: space.xl, gap: space.sm }}>
                <View style={{ flexDirection: 'row', gap: space.xs, flexWrap: 'wrap' }}>
                  {[data.cuisine.name, ...data.slots.map((s) => SLOT_LABELS[s])].map((t) => (
                    <View key={t} style={{ backgroundColor: colors.imageButton, borderRadius: radius.pill, paddingHorizontal: space.sm + 2, paddingVertical: space.xs }}>
                      <AppText variant="caption" style={{ color: colors.onImage }}>
                        {t}
                      </AppText>
                    </View>
                  ))}
                </View>
                <AppText variant="display" style={{ color: colors.onImage }} accessibilityRole="header">
                  {data.name}
                </AppText>
              </View>
            </View>

            <View style={{ paddingHorizontal: layout.gutter, paddingTop: space.xl, gap: layout.section }}>
              <View style={{ gap: space.lg }}>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Button
                    label="Add to plan"
                    icon={CalendarPlus}
                    style={{ flex: 1 }}
                    onPress={() => router.push({ pathname: '/plan/schedule', params: { slug: data.slug, name: data.name, slots: data.slots.join(',') } })}
                  />
                </View>
                <AppText color="textSecondary">{data.description}</AppText>
                {data.localNames.length ? (
                  <AppText variant="footnote" color="textSecondary">
                    Also called {data.localNames.join(', ')}
                  </AppText>
                ) : null}
                {variant.diet !== 'OMNIVORE' ? <Badge label={DIET_LABELS[variant.diet]} tone="success" icon={Leaf} /> : null}
              </View>

              {data.variants.length > 1 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                  {data.variants.map((v) => (
                    <Chip key={v.id} label={v.name} selected={v.id === variant.id} onPress={() => setVariantId(v.id)} />
                  ))}
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Stat icon={Clock} label="Total" value={formatMinutes(variant.prepMinutes + variant.cookMinutes)} />
                <Stat icon={Users} label="Serves" value={String(variant.servings)} />
                <Stat icon={ChefHat} label="Level" value={DIFFICULTY_LABELS[variant.difficulty]} />
              </View>

              <AllergenNotice allergens={variant.allergens} optionalAllergens={variant.optionalAllergens} complete={variant.allergenInfoComplete} />

              <View style={{ gap: space.md }}>
                <AppText variant="title2">Nutrition</AppText>
                <NutritionPanel nutrition={variant.nutrition} servings={variant.servings} />
              </View>

              <View style={{ gap: space.lg }}>
                <Segmented
                  label="Recipe"
                  value={tab}
                  onChange={setTab}
                  options={[
                    { value: 'ingredients', label: `Ingredients (${variant.ingredients.length})` },
                    { value: 'method', label: `Method (${variant.steps.length})` },
                  ]}
                />
                {tab === 'ingredients' ? <Ingredients variant={variant} /> : <Steps steps={variant.steps} />}
              </View>

              <AboutRecipe meal={data} variant={variant} />
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Floating controls over the photo; a solid bar with the name once scrolled past it. */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top + space.sm,
          paddingBottom: space.sm,
          paddingHorizontal: layout.gutter - 4,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          backgroundColor: pastHero ? colors.background : 'transparent',
          borderBottomWidth: pastHero ? 0.5 : 0,
          borderBottomColor: colors.border,
        }}>
        <IconButton icon={ChevronLeft} label="Back" tone={pastHero ? 'surface' : 'onImage'} onPress={back} />
        <AppText variant="headline" numberOfLines={1} style={{ flex: 1, textAlign: 'center', opacity: pastHero ? 1 : 0 }} aria-hidden>
          {data?.name ?? ''}
        </AppText>
        {data ? <FavoriteButton slug={data.slug} name={data.name} tone={pastHero ? 'surface' : 'onImage'} /> : <View style={{ width: minTouchTarget }} />}
      </View>
    </View>
  );
}
