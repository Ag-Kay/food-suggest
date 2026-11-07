import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import type { MealVariantDetail } from '@food-suggest/shared';

import { AppText, Badge, Card, Chip, ErrorState, Skeleton } from '@/components/ui';
import { AllergenNotice } from '@/features/meals/components/allergen-notice';
import { MealImage } from '@/features/meals/components/meal-image';
import { NutritionPanel } from '@/features/meals/components/nutrition-panel';
import { useMeal } from '@/features/meals/queries';
import { useTheme } from '@/hooks/use-theme';
import { formatIngredientAmount, formatMinutes } from '@/lib/format';
import { DIET_LABELS, DIFFICULTY_LABELS, SLOT_LABELS } from '@/lib/labels';
import { useRecentMeals } from '@/stores/recent-meals';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <AppText variant="title3">{title}</AppText>
      {children}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const { space } = useTheme();
  return (
    <View style={{ flex: 1, gap: space.xxs }} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="headline">{value}</AppText>
    </View>
  );
}

function Ingredients({ variant }: { variant: MealVariantDetail }) {
  const { space, colors } = useTheme();
  return (
    <Card style={{ paddingVertical: space.xs }}>
      {variant.ingredients.map((i, idx) => (
        <View
          key={`${i.slug}-${idx}`}
          accessible
          style={{
            flexDirection: 'row',
            gap: space.md,
            paddingVertical: space.sm,
            borderTopWidth: idx ? 1 : 0,
            borderTopColor: colors.border,
          }}>
          <AppText variant="subhead" color="textSecondary" style={{ width: 84 }}>
            {formatIngredientAmount(i.quantity, i.unit)}
          </AppText>
          <View style={{ flex: 1, gap: space.xxs }}>
            <AppText variant="subhead">
              {i.name}
              {i.optional ? ' (optional)' : ''}
            </AppText>
            {i.note ? (
              <AppText variant="footnote" color="textSecondary">
                {i.note}
              </AppText>
            ) : null}
          </View>
        </View>
      ))}
    </Card>
  );
}

function Steps({ steps }: { steps: string[] }) {
  const { space, colors, radius } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      {steps.map((step, idx) => (
        <View key={idx} style={{ flexDirection: 'row', gap: space.md }} accessible accessibilityLabel={`Step ${idx + 1}. ${step}`}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: radius.pill,
              backgroundColor: colors.primaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <AppText variant="footnote" color="primary" style={{ fontWeight: '700' }}>
              {idx + 1}
            </AppText>
          </View>
          <AppText style={{ flex: 1 }}>{step}</AppText>
        </View>
      ))}
    </View>
  );
}

function AboutRecipe({ variant }: { variant: MealVariantDetail }) {
  const { space } = useTheme();
  const approximations = variant.nutritionSources.filter((s) => s.match !== 'EXACT');
  const sources = [...new Set(variant.nutritionSources.map((s) => s.source))];
  return (
    <Card style={{ gap: space.sm }}>
      <AppText variant="headline">About this recipe</AppText>
      {!variant.recipeReviewed ? (
        <AppText color="textSecondary">
          This is a draft recipe with typical home-cooking amounts. It hasn&apos;t been reviewed by a cook or
          nutritionist yet.
        </AppText>
      ) : null}
      <AppText color="textSecondary">
        Nutrition is calculated from the ingredient amounts using data from: {sources.join('; ')}.
      </AppText>
      {approximations.map((s) => (
        <AppText key={s.ingredient} variant="footnote" color="textSecondary">
          {s.ingredient} ({s.match === 'PROXY' ? 'approximation' : 'close match'}): {s.matchNote}
        </AppText>
      ))}
      <AppText variant="footnote" color="textSecondary">
        Food Suggest gives general nutrition information, not medical advice.
      </AppText>
    </Card>
  );
}

export default function MealDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { space } = useTheme();
  const meal = useMeal(slug);
  const addRecent = useRecentMeals((s) => s.add);
  const [variantId, setVariantId] = useState<string>();

  const data = meal.data;
  useEffect(() => {
    if (data) addRecent({ slug: data.slug, name: data.name, cuisine: data.cuisine.name });
  }, [data, addRecent]);

  const variant = data?.variants.find((v) => v.id === variantId) ?? data?.variants[0];

  return (
    <>
      <Stack.Screen options={{ title: data?.name ?? '' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: space.lg, gap: space.xl, paddingBottom: space.xxxl }}>
        {meal.isPending ? (
          <View style={{ gap: space.lg }} accessibilityLabel="Loading meal">
            <Skeleton style={{ height: 200 }} />
            <Skeleton style={{ height: 28, width: '70%' }} />
            <Skeleton style={{ height: 80 }} />
            <Skeleton style={{ height: 160 }} />
          </View>
        ) : meal.isError ? (
          <ErrorState message={meal.error.message} onRetry={() => meal.refetch()} />
        ) : data && variant ? (
          <>
            <MealImage slug={data.slug} name={data.name} style={{ height: 200 }} />

            <View style={{ gap: space.sm }}>
              <AppText variant="title1">{data.name}</AppText>
              {data.localNames.length ? (
                <AppText variant="subhead" color="textSecondary">
                  Also called {data.localNames.join(', ')}
                </AppText>
              ) : null}
              <AppText>{data.description}</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
                <Badge label={data.cuisine.name} />
                {data.slots.map((s) => (
                  <Badge key={s} label={SLOT_LABELS[s]} />
                ))}
                {variant.diet !== 'OMNIVORE' ? <Badge label={DIET_LABELS[variant.diet]} tone="primary" /> : null}
              </View>
            </View>

            {data.variants.length > 1 ? (
              <View style={{ gap: space.sm }}>
                <AppText variant="subhead" color="textSecondary">
                  Choose a version
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                  {data.variants.map((v) => (
                    <Chip key={v.id} label={v.name} selected={v.id === variant.id} onPress={() => setVariantId(v.id)} />
                  ))}
                </View>
              </View>
            ) : null}

            <Card style={{ flexDirection: 'row', gap: space.md }}>
              <Fact label="Total time" value={formatMinutes(variant.prepMinutes + variant.cookMinutes)} />
              <Fact label="Serves" value={String(variant.servings)} />
              <Fact label="Difficulty" value={DIFFICULTY_LABELS[variant.difficulty]} />
            </Card>

            <AllergenNotice
              allergens={variant.allergens}
              optionalAllergens={variant.optionalAllergens}
              complete={variant.allergenInfoComplete}
            />

            <NutritionPanel nutrition={variant.nutrition} servings={variant.servings} />

            <Section title="Ingredients">
              {variant.notes ? <AppText color="textSecondary">{variant.notes}</AppText> : null}
              <Ingredients variant={variant} />
            </Section>

            <Section title="Method">
              <Steps steps={variant.steps} />
            </Section>

            <AboutRecipe variant={variant} />
          </>
        ) : null}
      </ScrollView>
    </>
  );
}
