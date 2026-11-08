import { useRouter } from 'expo-router';
import { ChevronRight, Plus, ShoppingBasket } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText, Button, EmptyState, Icon, IconButton, PressableScale, Screen } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { useShoppingLists } from '@/stores/shopping-lists';

const updated = (ms: number) => {
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
};

export default function ListsScreen() {
  const router = useRouter();
  const { colors, radius, space, elevation } = useTheme();
  const lists = useShoppingLists((s) => s.lists);

  const newList = () => {
    const list = useShoppingLists.getState().create({ name: 'Shopping list' });
    router.push({ pathname: '/lists/[id]', params: { id: list.id } });
  };

  return (
    <Screen gap={space.xl}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="display">Lists</AppText>
        {lists.length ? <IconButton icon={Plus} label="New list" tone="filled" onPress={newList} /> : null}
      </View>

      {lists.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="No shopping lists yet"
          message="Plan your meals, then make a list grouped by aisle."
          actionLabel="Go to meal plan"
          onAction={() => router.navigate('/plan')}
        />
      ) : (
        <View style={{ gap: space.md }}>
          {lists.map((list) => {
            const done = list.items.filter((i) => i.checked).length;
            const total = list.items.length;
            const summary = total ? `${done} of ${total} bought` : 'Empty';
            const complete = total > 0 && done === total;
            return (
              <PressableScale
                key={list.id}
                accessibilityRole="button"
                accessibilityLabel={`${list.name}. ${summary}. Updated ${updated(list.updatedAt).toLowerCase()}`}
                onPress={() => router.push({ pathname: '/lists/[id]', params: { id: list.id } })}
                pressedScale={0.98}
                style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.lg, gap: space.md }, elevation]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.md,
                      backgroundColor: complete ? colors.successMuted : colors.primaryMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon icon={ShoppingBasket} color={complete ? 'success' : 'link'} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="headline" numberOfLines={1}>
                      {list.name}
                    </AppText>
                    <AppText variant="footnote" color="textSecondary">
                      {summary} · {updated(list.updatedAt)}
                    </AppText>
                  </View>
                  <Icon icon={ChevronRight} color="textSecondary" />
                </View>
                {total ? (
                  <View style={{ height: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted }}>
                    <View style={{ width: `${(done / total) * 100}%`, height: 4, borderRadius: radius.pill, backgroundColor: complete ? colors.success : colors.primary }} />
                  </View>
                ) : null}
              </PressableScale>
            );
          })}
        </View>
      )}
      {lists.length === 0 ? <Button label="Start an empty list" variant="ghost" onPress={newList} /> : null}
    </Screen>
  );
}
