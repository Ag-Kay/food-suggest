import { Clock, Sparkles, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Recommendation } from '@food-suggest/shared';

import { AppText, Icon, PressableScale } from '@/components/ui';
import { FavoriteButton } from '@/features/meals/components/favorite-button';
import { useOpenMeal } from '@/features/meals/components/meal-card';
import { MealImage } from '@/features/meals/components/meal-image';
import { useTheme } from '@/hooks/use-theme';
import { formatMinutes } from '@/lib/format';

/**
 * Large photo card for "Picked for you": the meal name over the photo, its time,
 * the single strongest reason it was picked, and any caution in full.
 */
export function RecommendationCard({ item, width }: { item: Recommendation; width: number }) {
  const { colors, radius, space } = useTheme();
  const openMeal = useOpenMeal();
  const { meal, reasons, cautions } = item;
  const reason = reasons[0];

  return (
    // The heart is a sibling of the card button (not inside it) so screen readers can reach both.
    <View style={{ width }}>
      <PressableScale
        onPress={() => openMeal(meal.slug)}
        accessibilityRole="button"
        accessibilityLabel={`${meal.name}. ${formatMinutes(meal.totalMinutes)}.${reasons.length ? ` Why: ${reasons.join(' ')}` : ''}${cautions.length ? ` Note: ${cautions.join(' ')}` : ''}`}
        style={{ width }}
      >
        <View style={{ width, height: width * 1.15, borderRadius: radius.xl, overflow: 'hidden' }}>
          <MealImage
            slug={meal.slug}
            uri={meal.imageUrl}
            scrim
            style={[StyleSheet.absoluteFill, { borderRadius: 0 }]}
          />
          <View
            style={{
              position: 'absolute',
              left: space.lg,
              right: space.lg,
              bottom: space.lg,
              gap: space.sm,
            }}
          >
            <AppText variant="title1" style={{ color: colors.onImage }} numberOfLines={3}>
              {meal.name}
            </AppText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                flexWrap: 'wrap',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.xs,
                  backgroundColor: colors.imageButton,
                  borderRadius: radius.pill,
                  paddingHorizontal: space.sm + 2,
                  paddingVertical: space.xs,
                }}
              >
                <Icon icon={Clock} size={14} tint={colors.onImage} />
                <AppText variant="caption" style={{ color: colors.onImage }}>
                  {formatMinutes(meal.totalMinutes)}
                </AppText>
              </View>
            </View>
            {reason ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                <Icon icon={Sparkles} size={14} tint={colors.primary} />
                <AppText
                  variant="footnote"
                  style={{ color: colors.onImage, flex: 1 }}
                  numberOfLines={2}
                >
                  {reason}
                </AppText>
              </View>
            ) : null}
            {/* Cautions are safety notes (e.g. an optional extra with your allergen): always visible. */}
            {cautions.map((c) => (
              <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                <Icon icon={TriangleAlert} size={14} tint={colors.warning} />
                <AppText
                  variant="footnote"
                  style={{ color: colors.onImage, flex: 1, fontWeight: '600' }}
                  numberOfLines={3}
                >
                  {c}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </PressableScale>
      <View style={{ position: 'absolute', top: space.md, right: space.md }}>
        <FavoriteButton slug={meal.slug} name={meal.name} />
      </View>
    </View>
  );
}
