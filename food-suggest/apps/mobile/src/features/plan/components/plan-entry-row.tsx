import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { MAX_PLAN_SERVINGS } from '@food-suggest/shared';

import { AppText, Stepper } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { useMealPlan, type PlanEntry } from '@/stores/meal-plan';
import { minTouchTarget } from '@/theme/tokens';

const servingsText = (n: number) => `${n} serving${n === 1 ? '' : 's'}`;

function TextAction({ label, onPress, hint, danger }: { label: string; onPress: () => void; hint: string; danger?: boolean }) {
  const { colors, space } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={hint}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({ minHeight: minTouchTarget, justifyContent: 'center', paddingHorizontal: space.xs, opacity: pressed ? 0.6 : 1 })}>
      <AppText variant="subhead" style={{ color: danger ? colors.danger : colors.primary, fontWeight: '600' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** One planned meal: open it, change servings, replace or remove. */
export function PlanEntryRow({ entry }: { entry: PlanEntry }) {
  const router = useRouter();
  const { colors, space } = useTheme();
  const { setServings, remove } = useMealPlan.getState();

  return (
    <View style={{ gap: space.xs, paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Pressable
        accessibilityRole="link"
        accessibilityHint="Opens the recipe"
        onPress={() => router.push({ pathname: '/meal/[slug]', params: { slug: entry.slug } })}
        style={({ pressed }) => ({ minHeight: minTouchTarget - 8, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
        <AppText variant="headline">{entry.name}</AppText>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm }}>
        <Stepper
          value={entry.servings}
          min={1}
          max={MAX_PLAN_SERVINGS}
          onChange={(n) => setServings(entry.id, n)}
          label={`Servings of ${entry.name}`}
          format={servingsText}
        />
        <View style={{ flexDirection: 'row' }}>
          <TextAction
            label="Replace"
            hint={`Choose another meal instead of ${entry.name}`}
            onPress={() => router.push({ pathname: '/plan/pick-meal', params: { date: entry.date, slot: entry.slot, replace: entry.id } })}
          />
          <TextAction label="Remove" danger hint={`Removes ${entry.name} from this day`} onPress={() => remove(entry.id)} />
        </View>
      </View>
    </View>
  );
}
