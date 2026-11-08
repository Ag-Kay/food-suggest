import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppText, Icon, PressableScale } from '@/components/ui';
import { MealImage } from '@/features/meals/components/meal-image';
import { useTheme } from '@/hooks/use-theme';
import type { PlanEntry } from '@/stores/meal-plan';

export const servingsText = (n: number) => `${n} serving${n === 1 ? '' : 's'}`;

/** One planned meal: photo, name and servings. Tap for servings, replace and remove. */
export function PlanEntryRow({ entry, imageUrl }: { entry: PlanEntry; imageUrl?: string | null }) {
  const router = useRouter();
  const { radius, space } = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} layout={LinearTransition.duration(220)}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${entry.name}, ${servingsText(entry.servings)}`}
        accessibilityHint="Change servings, replace or remove"
        onPress={() => router.push({ pathname: '/plan/entry', params: { id: entry.id } })}
        pressedScale={0.98}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs }}>
        <MealImage slug={entry.slug} uri={imageUrl} style={{ width: 60, height: 60, borderRadius: radius.md }} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="headline" numberOfLines={2}>
            {entry.name}
          </AppText>
          <AppText variant="footnote" color="textSecondary">
            {servingsText(entry.servings)}
          </AppText>
        </View>
        <Icon icon={ChevronRight} color="textSecondary" />
      </PressableScale>
    </Animated.View>
  );
}
