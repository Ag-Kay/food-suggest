import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Ellipsis, Plus, ShoppingBasket } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { AppText, EmptyState, Icon, IconButton, Screen } from '@/components/ui';
import { groupByCategory } from '@/features/shopping/group';
import { useTheme } from '@/hooks/use-theme';
import { categoryIcon } from '@/lib/icons';
import { MAX_ITEM_TEXT, useShoppingLists, type ShoppingItem } from '@/stores/shopping-lists';
import { minTouchTarget } from '@/theme/tokens';

function ItemRow({ listId, item }: { listId: string; item: ShoppingItem }) {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const toggle = () => useShoppingLists.getState().toggleItem(listId, item.id);
  const edit = () => router.push({ pathname: '/lists/edit', params: { listId, itemId: item.id } });

  return (
    <Animated.View layout={LinearTransition.duration(200)}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
        accessibilityLabel={`${item.name}${item.amountText ? `, ${item.amountText}` : ''}${item.optional ? ', optional' : ''}`}
        accessibilityHint="Double-tap to tick. Use the actions menu to edit."
        accessibilityActions={[{ name: 'longpress', label: 'Edit item' }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === 'longpress' && edit()}
        onPress={toggle}
        onLongPress={edit}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: minTouchTarget + 8, paddingVertical: space.sm, opacity: pressed ? 0.6 : 1 })}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: radius.pill,
            borderWidth: 2,
            borderColor: item.checked ? colors.success : colors.textSecondary,
            backgroundColor: item.checked ? colors.success : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {item.checked ? <Icon icon={Check} size={15} tint={colors.surface} strokeWidth={3} /> : null}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText color={item.checked ? 'textSecondary' : 'text'} style={{ textDecorationLine: item.checked ? 'line-through' : 'none' }}>
            {item.name}
          </AppText>
          {item.optional ? (
            <AppText variant="caption" color="textSecondary">
              Optional
            </AppText>
          ) : null}
        </View>
        {item.amountText ? (
          <AppText variant="subhead" color="textSecondary" style={{ fontWeight: '600' }}>
            {item.amountText}
          </AppText>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/** One input row: type a name, press return or +. Amounts can be added by editing. */
function AddItem({ listId }: { listId: string }) {
  const { colors, radius, space, typography } = useTheme();
  const [name, setName] = useState('');
  const add = () => {
    if (!name.trim()) return;
    useShoppingLists.getState().addItem(listId, { name });
    setName('');
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingLeft: space.lg, paddingRight: space.xs }}>
      <TextInput
        value={name}
        onChangeText={setName}
        onSubmitEditing={add}
        submitBehavior="submit"
        placeholder="Add an item"
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel="New item name"
        maxLength={MAX_ITEM_TEXT}
        returnKeyType="done"
        style={[typography.body, { flex: 1, color: colors.text, minHeight: minTouchTarget + 6 }]}
      />
      <IconButton icon={Plus} label="Add item" tone="filled" disabled={!name.trim()} onPress={add} style={{ opacity: name.trim() ? 1 : 0.4 }} />
    </View>
  );
}

export default function ShoppingListScreen() {
  const router = useRouter();
  const { colors, radius, space } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const list = useShoppingLists((s) => s.lists.find((l) => l.id === id));

  if (!list) {
    return (
      <Screen edges={['left', 'right']}>
        <Stack.Screen options={{ title: '' }} />
        <EmptyState icon={ShoppingBasket} title="List not found" message="It may have been deleted." actionLabel="Back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const done = list.items.filter((i) => i.checked).length;
  const total = list.items.length;
  // Unticked first within each aisle, so what's left to buy stays on top.
  const sections = groupByCategory(list.items).map((s) => ({ ...s, items: [...s.items].sort((a, b) => Number(a.checked) - Number(b.checked)) }));

  return (
    <Screen edges={['left', 'right']} gap={space.xl}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton icon={Ellipsis} label="List options" tone="plain" color="link" onPress={() => router.push({ pathname: '/lists/actions', params: { id: list.id } })} />
          ),
        }}
      />
      <View style={{ gap: space.sm }}>
        <AppText variant="largeTitle">{list.name}</AppText>
        <AppText color="textSecondary">{total ? `${done} of ${total} bought` : 'No items yet'}</AppText>
        {total ? (
          <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, marginTop: space.xs }}>
            <View style={{ width: `${(done / total) * 100}%`, height: 6, borderRadius: radius.pill, backgroundColor: done === total ? colors.success : colors.primary }} />
          </View>
        ) : null}
      </View>

      <AddItem listId={list.id} />

      {sections.map((section) => (
        <View key={section.category} style={{ gap: space.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }} accessibilityRole="header">
            <Icon icon={categoryIcon(section.category)} size="sm" color="link" />
            <AppText variant="footnote" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}>
              {section.category}
            </AppText>
          </View>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: space.lg }}>
            {section.items.map((item, idx) => (
              <View key={item.id} style={idx ? { borderTopWidth: 0.5, borderTopColor: colors.border } : undefined}>
                <ItemRow listId={list.id} item={item} />
              </View>
            ))}
          </View>
        </View>
      ))}

      {total ? (
        <AppText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
          Tap to tick · hold to edit · amounts are rounded up
        </AppText>
      ) : null}
    </Screen>
  );
}
