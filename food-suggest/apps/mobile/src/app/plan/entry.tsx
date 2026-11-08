import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, Repeat, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_PLAN_SERVINGS } from '@food-suggest/shared';

import { AppText, Button, Stepper } from '@/components/ui';
import { MealImage } from '@/features/meals/components/meal-image';
import { useMealImages } from '@/features/meals/use-meal-images';
import { servingsText } from '@/features/plan/components/plan-entry-row';
import { dayLabel } from '@/features/plan/dates';
import { useTheme } from '@/hooks/use-theme';
import { SLOT_LABELS } from '@/lib/labels';
import { useMealPlan } from '@/stores/meal-plan';

/** Sheet for one planned meal: servings, open the recipe, replace, remove. */
export default function PlanEntrySheet() {
  const router = useRouter();
  const { colors, layout, radius, space } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useMealPlan((s) => s.entries.find((e) => e.id === id));
  const images = useMealImages();
  const { setServings, remove } = useMealPlan.getState();

  if (!entry) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background, padding: layout.gutter, gap: space.lg }}>
        <AppText color="textSecondary">This meal is no longer in your plan.</AppText>
        <Button label="Close" variant="secondary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background, padding: layout.gutter, gap: space.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <MealImage slug={entry.slug} uri={images.get(entry.slug)} style={{ width: 72, height: 72, borderRadius: radius.md }} />
        <View style={{ flex: 1, gap: space.xxs }}>
          <AppText variant="title2" numberOfLines={2}>
            {entry.name}
          </AppText>
          <AppText variant="footnote" color="textSecondary">
            {dayLabel(entry.date)} · {SLOT_LABELS[entry.slot]}
          </AppText>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md }}>
        <View style={{ gap: 2 }}>
          <AppText variant="headline">Servings</AppText>
          <AppText variant="caption" color="textSecondary">
            Sets shopping amounts
          </AppText>
        </View>
        <Stepper value={entry.servings} min={1} max={MAX_PLAN_SERVINGS} onChange={(n) => setServings(entry.id, n)} label={`Servings of ${entry.name}`} format={servingsText} />
      </View>

      <View style={{ gap: space.sm }}>
        <Button
          label="View recipe"
          icon={BookOpen}
          variant="secondary"
          onPress={() => {
            router.back();
            router.push({ pathname: '/meal/[slug]', params: { slug: entry.slug } });
          }}
        />
        <Button
          label="Replace"
          icon={Repeat}
          variant="secondary"
          onPress={() => {
            router.back();
            router.push({ pathname: '/plan/pick-meal', params: { date: entry.date, slot: entry.slot, replace: entry.id } });
          }}
        />
        <Button
          label="Remove from plan"
          icon={Trash2}
          variant="danger"
          onPress={() => {
            router.back();
            remove(entry.id);
          }}
        />
      </View>
    </SafeAreaView>
  );
}
