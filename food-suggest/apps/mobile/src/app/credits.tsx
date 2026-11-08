import { useQueries } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react-native';
import { Linking, Pressable, View } from 'react-native';

import { AppText, Icon, Screen, Skeleton } from '@/components/ui';
import { MealImage } from '@/features/meals/components/meal-image';
import { mealDetailQuery, useMealList } from '@/features/meals/queries';
import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget } from '@/theme/tokens';

/** Every meal photo with its photographer, source and licence (required by CC BY / CC BY-SA). */
export default function CreditsScreen() {
  const { colors, radius, space } = useTheme();
  const list = useMealList({ limit: 50 });
  const slugs = (list.data?.items ?? []).filter((m) => m.imageUrl).map((m) => m.slug);
  const details = useQueries({ queries: slugs.map((slug) => ({ ...mealDetailQuery(slug), staleTime: 60 * 60_000 })) });

  return (
    <Screen edges={['left', 'right']} gap={space.md}>
      <AppText color="textSecondary">
        Food photos are used under their licences. Tap a credit to see the original.
      </AppText>
      {list.isPending ? (
        <Skeleton style={{ height: 300 }} />
      ) : (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: space.lg }}>
          {details.map((q, i) => {
            const meal = q.data;
            if (!meal?.image) return null;
            const image = meal.image;
            return (
              <Pressable
                key={meal.slug}
                accessibilityRole="link"
                accessibilityLabel={`${meal.name}. Photo by ${image.credit}, ${image.license}. Opens the source page.`}
                disabled={!image.sourceUrl}
                onPress={() => image.sourceUrl && void Linking.openURL(image.sourceUrl)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  minHeight: minTouchTarget + 20,
                  paddingVertical: space.sm,
                  borderTopWidth: i ? 0.5 : 0,
                  borderTopColor: colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <MealImage slug={meal.slug} uri={meal.imageUrl} style={{ width: 48, height: 48, borderRadius: radius.sm }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="subhead" style={{ fontWeight: '600' }} numberOfLines={1}>
                    {meal.name}
                  </AppText>
                  <AppText variant="footnote" color="textSecondary" numberOfLines={2}>
                    {image.credit} · {image.license}
                  </AppText>
                </View>
                {image.sourceUrl ? <Icon icon={ExternalLink} size="sm" color="textSecondary" /> : null}
              </Pressable>
            );
          })}
        </View>
      )}
      <AppText variant="footnote" color="textSecondary">
        Icons: Lucide (ISC licence). Display font: Fraunces (SIL Open Font Licence).
      </AppText>
    </Screen>
  );
}
