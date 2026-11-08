import { useRouter } from 'expo-router';
import { Clock, Globe, Leaf } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DietType } from '@food-suggest/shared';

import { AppText, Button, Chip, Icon, type LucideIcon } from '@/components/ui';
import { useDiscoverFilters } from '@/features/meals/discover-filters';
import { useCuisines, useMealList } from '@/features/meals/queries';
import { useTheme } from '@/hooks/use-theme';
import { DIET_TYPE_LABELS } from '@/lib/labels';

const DIETS: DietType[] = ['VEGAN', 'VEGETARIAN', 'PESCATARIAN'];
const TIMES = [30, 45, 60];

function Group({ icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  const { space } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Icon icon={icon} size="md" color="textSecondary" />
        <AppText variant="headline">{title}</AppText>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>{children}</View>
    </View>
  );
}

/** Filter sheet for Discover: diet, time and cuisine. Changes apply live. */
export default function DiscoverFilters() {
  const router = useRouter();
  const { colors, layout, space } = useTheme();
  const f = useDiscoverFilters();
  const cuisines = useCuisines();
  // Same query as the Discover list (minus the search text) for the live count.
  const preview = useMealList({ slot: f.slot, diet: f.diet, cuisine: f.cuisine, maxMinutes: f.maxMinutes });
  const count = preview.data?.total;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: layout.gutter, gap: space.xl }}>
        <Group icon={Leaf} title="Diet">
          {DIETS.map((d) => (
            <Chip key={d} label={DIET_TYPE_LABELS[d]} selected={f.diet === d} onPress={() => f.set({ diet: f.diet === d ? undefined : d })} />
          ))}
        </Group>
        <Group icon={Clock} title="Ready in">
          {TIMES.map((t) => (
            <Chip key={t} label={`Under ${t} min`} selected={f.maxMinutes === t} onPress={() => f.set({ maxMinutes: f.maxMinutes === t ? undefined : t })} />
          ))}
        </Group>
        {cuisines.data?.items.length ? (
          <Group icon={Globe} title="Cuisine">
            {cuisines.data.items.map((c) => (
              <Chip key={c.slug} label={c.name} selected={f.cuisine === c.slug} onPress={() => f.set({ cuisine: f.cuisine === c.slug ? undefined : c.slug })} />
            ))}
          </Group>
        ) : null}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: space.sm, paddingHorizontal: layout.gutter, paddingTop: space.md, paddingBottom: space.md }}>
        <Button label="Reset" variant="secondary" onPress={f.resetSheet} style={{ flex: 1 }} />
        <Button
          label={count === undefined ? 'Show meals' : count === 1 ? 'Show 1 meal' : `Show ${count} meals`}
          onPress={() => router.back()}
          style={{ flex: 2 }}
        />
      </View>
    </SafeAreaView>
  );
}
