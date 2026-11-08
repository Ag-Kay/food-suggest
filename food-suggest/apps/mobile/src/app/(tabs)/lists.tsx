import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Button, EmptyState, Screen } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { useShoppingLists } from '@/stores/shopping-lists';

const updated = (ms: number) => {
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  return days <= 0 ? 'Updated today' : days === 1 ? 'Updated yesterday' : `Updated ${days} days ago`;
};

export default function ListsScreen() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const lists = useShoppingLists((s) => s.lists);

  const newList = () => {
    const list = useShoppingLists.getState().create({ name: 'Shopping list' });
    router.push({ pathname: '/lists/[id]', params: { id: list.id } });
  };

  return (
    <Screen>
      <AppText variant="largeTitle">Shopping lists</AppText>
      {lists.length === 0 ? (
        <EmptyState
          title="No shopping lists yet"
          message="Plan your meals, then tap “Make shopping list”. We add up the ingredients and group them by aisle."
          actionLabel="Go to meal plan"
          onAction={() => router.navigate('/plan')}
        />
      ) : (
        <View style={{ gap: space.sm }}>
          {lists.map((list) => {
            const done = list.items.filter((i) => i.checked).length;
            const summary = list.items.length ? `${done} of ${list.items.length} bought` : 'Empty';
            return (
              <Pressable
                key={list.id}
                accessibilityRole="button"
                accessibilityLabel={`${list.name}. ${summary}. ${updated(list.updatedAt)}`}
                onPress={() => router.push({ pathname: '/lists/[id]', params: { id: list.id } })}
                style={({ pressed }) => ({
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: radius.lg,
                  padding: space.lg,
                  gap: space.xs,
                  opacity: pressed ? 0.75 : 1,
                })}>
                <AppText variant="headline">{list.name}</AppText>
                <AppText variant="footnote" color="textSecondary">
                  {summary} · {updated(list.updatedAt)}
                </AppText>
                {list.items.length ? (
                  <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, marginTop: space.xs }}>
                    <View
                      style={{
                        width: `${(done / list.items.length) * 100}%`,
                        height: 6,
                        borderRadius: radius.pill,
                        backgroundColor: colors.primary,
                      }}
                    />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
      <Button label="New empty list" variant="secondary" onPress={newList} />
    </Screen>
  );
}
