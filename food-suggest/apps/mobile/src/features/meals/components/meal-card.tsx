import { useRouter } from 'expo-router';
import { Clock, Leaf, TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import type { MealCard as MealCardData } from '@food-suggest/shared';

import { AppText, Icon, PressableScale } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes } from '@/lib/format';
import { DIET_LABELS } from '@/lib/labels';

import { MealImage } from './meal-image';

export function macroLine(meal: Pick<MealCardData, 'nutrition'>, showCalories: boolean): string | null {
  const n = meal.nutrition;
  if (!n) return null;
  const parts = [`${Math.round(n.proteinG)} g protein`, `${Math.round(n.carbsG)} g carbs`, `${Math.round(n.fatG)} g fat`];
  if (showCalories) parts.unshift(`${n.energyKcal} kcal`);
  return parts.join(' · ');
}

export function useOpenMeal() {
  const router = useRouter();
  return (slug: string) => router.push({ pathname: '/meal/[slug]', params: { slug } });
}

/** Small icon + text pair used for time and diet under photos. */
export function MetaItem({ icon, label, color = 'textSecondary' }: { icon: typeof Clock; label: string; color?: 'textSecondary' | 'success' | 'warning' }) {
  const { space } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      <Icon icon={icon} size={14} color={color} />
      <AppText variant="caption" color={color}>
        {label}
      </AppText>
    </View>
  );
}

/** Photo tile for horizontal carousels (Home). */
export function MealTile({ slug, name, subtitle, imageUrl, width = 168 }: { slug: string; name: string; subtitle?: string; imageUrl?: string | null; width?: number }) {
  const { space } = useTheme();
  const openMeal = useOpenMeal();
  return (
    <PressableScale
      onPress={() => openMeal(slug)}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${name}. ${subtitle}` : name}
      style={{ width, gap: space.sm }}>
      <MealImage slug={slug} uri={imageUrl} style={{ width, height: width * 1.05 }} />
      <View style={{ gap: 2, paddingHorizontal: space.xxs }}>
        <AppText variant="subhead" style={{ fontWeight: '600' }} numberOfLines={2}>
          {name}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </PressableScale>
  );
}

/** Two-column grid card (Discover): photo, name, time and diet. */
export function MealGridCard({ meal }: { meal: MealCardData }) {
  const { space } = useTheme();
  const openMeal = useOpenMeal();
  const plantBased = meal.diet === 'VEGAN' || meal.diet === 'VEGETARIAN';
  return (
    <PressableScale
      onPress={() => openMeal(meal.slug)}
      accessibilityRole="button"
      accessibilityLabel={[
        meal.name,
        meal.cuisine.name,
        formatMinutes(meal.totalMinutes),
        DIET_LABELS[meal.diet],
        meal.allergenInfoComplete ? null : 'Check allergens',
      ]
        .filter(Boolean)
        .join('. ')}
      style={{ flex: 1, gap: space.sm }}>
      <MealImage slug={meal.slug} uri={meal.imageUrl} style={{ aspectRatio: 0.9, width: '100%' }} />
      <View style={{ gap: space.xs, paddingHorizontal: space.xxs }}>
        <AppText variant="subhead" style={{ fontWeight: '600' }} numberOfLines={2}>
          {meal.name}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md, rowGap: space.xxs }}>
          <MetaItem icon={Clock} label={formatMinutes(meal.totalMinutes)} />
          {plantBased ? <MetaItem icon={Leaf} label={DIET_LABELS[meal.diet]} color="success" /> : null}
          {!meal.allergenInfoComplete ? <MetaItem icon={TriangleAlert} label="Check allergens" color="warning" /> : null}
        </View>
      </View>
    </PressableScale>
  );
}
